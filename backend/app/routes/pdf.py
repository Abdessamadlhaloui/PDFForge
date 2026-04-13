from __future__ import annotations

from pathlib import Path

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from fastapi.responses import JSONResponse

from app.core.logging import get_logger

from app.models.schemas import (

    CompressRequest,

    CompressionQuality,

    DeletePagesRequest,

    ExtractPagesRequest,

    ExtractTextRequest,

    OCRRequest,

    PDFMetadata,

    ProcessingResult,

    ProtectRequest,

    RedactRequest,

    ReorderRequest,

    RotateRequest,

    SplitRequest,

    WatermarkPosition,

    WatermarkRequest,

)

from app.services import pdf_service

from app.utils.dependencies import RateLimited, validate_pdf_upload

from app.utils.file_handler import (

    generate_file_id,

    get_download_url,

    get_expiry_time,

    get_file_size,

    save_upload,

    validate_pdf,

)

logger = get_logger(__name__)

router = APIRouter(prefix="/pdf", tags=["PDF Operations"])

@router.post("/merge", response_model=ProcessingResult, summary="Merge multiple PDFs")

async def merge(

    _: RateLimited,

    files: list[UploadFile] = File(...),

):

    if len(files) < 2:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="At least 2 PDF files are required for merging.",

        )

    saved_paths: list[Path] = []

    total_original_size = 0

    try:

        for file in files:

            file_id, file_path = await save_upload(file)

            if not validate_pdf(file_path):

                raise HTTPException(

                    status_code=status.HTTP_400_BAD_REQUEST,

                    detail=f"File '{file.filename}' is not a valid PDF.",

                )

            saved_paths.append(file_path)

            total_original_size += get_file_size(file_path)

        output_id, output_path = pdf_service.merge_pdfs(saved_paths)

        return ProcessingResult(

            file_id=output_id,

            filename="merged.pdf",

            original_size=total_original_size,

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"page_count": sum(1 for _ in open(str(output_path), "rb").read()[:100])},

        )

    except ValueError as e:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except Exception as e:

        logger.error("merge_error", error=str(e))

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Merge failed: {str(e)}")

@router.post("/split", response_model=ProcessingResult, summary="Split PDF by page ranges")

async def split(

    _: RateLimited,

    file: UploadFile = File(...),

    ranges: str = Form(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        range_list = [r.strip() for r in ranges.split(",") if r.strip()]

        output_id, output_path = pdf_service.split_pdf(file_path, range_list)

        return ProcessingResult(

            file_id=output_id,

            filename="split_pages.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"ranges": range_list},

        )

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        logger.error("split_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

@router.post("/compress", response_model=ProcessingResult, summary="Compress PDF")

async def compress(

    _: RateLimited,

    file: UploadFile = File(...),

    quality: CompressionQuality = Form(default=CompressionQuality.EBOOK),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = pdf_service.compress_pdf(file_path, quality)

        original_size = get_file_size(file_path)

        compressed_size = get_file_size(output_path)

        reduction = ((original_size - compressed_size) / original_size) * 100

        return ProcessingResult(

            file_id=output_id,

            filename="compressed.pdf",

            original_size=original_size,

            processed_size=compressed_size,

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"quality": quality.value, "reduction_percent": round(reduction, 1)},

        )

    except RuntimeError as e:

        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:

        logger.error("compress_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

@router.post("/rotate", response_model=ProcessingResult, summary="Rotate PDF pages")

async def rotate(

    _: RateLimited,

    file: UploadFile = File(...),

    pages: str = Form(...),

    angle: int = Form(default=90),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        page_list = [int(p.strip()) for p in pages.split(",")]

        if angle not in (90, 180, 270):

            raise HTTPException(status_code=400, detail="Angle must be 90, 180, or 270.")

        output_id, output_path = pdf_service.rotate_pages(file_path, page_list, angle)

        return ProcessingResult(

            file_id=output_id,

            filename="rotated.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"rotated_pages": page_list, "angle": angle},

        )

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        logger.error("rotate_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Rotation failed: {str(e)}")

@router.post("/delete-pages", response_model=ProcessingResult, summary="Delete pages from PDF")

async def delete_pages_endpoint(

    _: RateLimited,

    file: UploadFile = File(...),

    pages: str = Form(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        page_list = [int(p.strip()) for p in pages.split(",")]

        output_id, output_path = pdf_service.delete_pages(file_path, page_list)

        return ProcessingResult(

            file_id=output_id,

            filename="pages_deleted.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"deleted_pages": page_list},

        )

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        logger.error("delete_pages_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Delete pages failed: {str(e)}")

@router.post("/reorder", response_model=ProcessingResult, summary="Reorder PDF pages")

async def reorder(

    _: RateLimited,

    file: UploadFile = File(...),

    page_order: str = Form(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        order = [int(p.strip()) for p in page_order.split(",")]

        output_id, output_path = pdf_service.reorder_pages(file_path, order)

        return ProcessingResult(

            file_id=output_id,

            filename="reordered.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"new_order": order},

        )

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        logger.error("reorder_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Reorder failed: {str(e)}")

@router.post("/extract-pages", response_model=ProcessingResult, summary="Extract page range from PDF")

async def extract_pages_endpoint(

    _: RateLimited,

    file: UploadFile = File(...),

    start_page: int = Form(..., ge=1),

    end_page: int = Form(..., ge=1),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = pdf_service.extract_pages(file_path, start_page, end_page)

        return ProcessingResult(

            file_id=output_id,

            filename=f"pages_{start_page}_to_{end_page}.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"start_page": start_page, "end_page": end_page},

        )

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        logger.error("extract_pages_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Extract failed: {str(e)}")

@router.post("/add-watermark", response_model=ProcessingResult, summary="Add watermark to PDF")

async def watermark(

    _: RateLimited,

    file: UploadFile = File(...),

    text: str = Form(...),

    position: WatermarkPosition = Form(default=WatermarkPosition.DIAGONAL),

    opacity: float = Form(default=0.3, ge=0.05, le=1.0),

    font_size: int = Form(default=48, ge=8, le=200),

    color: str = Form(default="#808080"),

    rotation: float = Form(default=45.0),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = pdf_service.add_watermark(

            file_path, text, position, opacity, font_size, color, rotation,

        )

        return ProcessingResult(

            file_id=output_id,

            filename="watermarked.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"watermark_text": text, "position": position.value},

        )

    except Exception as e:

        logger.error("watermark_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Watermark failed: {str(e)}")

@router.post("/protect", response_model=ProcessingResult, summary="Password-protect PDF")

async def protect(

    _: RateLimited,

    file: UploadFile = File(...),

    user_password: str = Form(...),

    owner_password: str = Form(default=None),

    allow_printing: bool = Form(default=True),

    allow_copying: bool = Form(default=False),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = pdf_service.protect_pdf(

            file_path, user_password, owner_password, allow_printing, allow_copying,

        )

        return ProcessingResult(

            file_id=output_id,

            filename="protected.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"encrypted": True, "allow_printing": allow_printing},

        )

    except Exception as e:

        logger.error("protect_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Protection failed: {str(e)}")

@router.post("/unlock", response_model=ProcessingResult, summary="Unlock password-protected PDF")

async def unlock(

    _: RateLimited,

    file: UploadFile = File(...),

    password: str = Form(...),

):

    try:

        file_id, file_path = await save_upload(file)

        output_id, output_path = pdf_service.unlock_pdf(file_path, password)

        return ProcessingResult(

            file_id=output_id,

            filename="unlocked.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

        )

    except ValueError as e:

        raise HTTPException(status_code=401, detail=str(e))

    except Exception as e:

        logger.error("unlock_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Unlock failed: {str(e)}")

@router.post("/redact", response_model=ProcessingResult, summary="Redact sensitive content from PDF")

async def redact(

    _: RateLimited,

    file: UploadFile = File(...),

    search_terms: str = Form(...),

    redact_color: str = Form(default="#000000"),

    use_regex: bool = Form(default=False),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        terms = [t.strip() for t in search_terms.split(",") if t.strip()]

        output_id, output_path, redaction_count = pdf_service.redact_text(

            file_path, terms, redact_color, use_regex,

        )

        return ProcessingResult(

            file_id=output_id,

            filename="redacted.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"redactions_applied": redaction_count},

        )

    except Exception as e:

        logger.error("redact_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Redaction failed: {str(e)}")

@router.post("/ocr", response_model=ProcessingResult, summary="OCR scanned PDF")

async def ocr(

    _: RateLimited,

    file: UploadFile = File(...),

    languages: str = Form(default="eng"),

    dpi: int = Form(default=300, ge=72, le=600),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        lang_list = [l.strip() for l in languages.split(",")]

        output_id, output_path = pdf_service.ocr_pdf(file_path, lang_list, dpi)

        return ProcessingResult(

            file_id=output_id,

            filename="ocr_processed.pdf",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"languages": lang_list, "dpi": dpi},

        )

    except Exception as e:

        logger.error("ocr_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

@router.post("/extract-text", summary="Extract text from PDF")

async def extract_text_endpoint(

    _: RateLimited,

    file: UploadFile = File(...),

    pages: str = Form(default=None),

    layout: bool = Form(default=False),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        page_list = None

        if pages:

            page_list = [int(p.strip()) for p in pages.split(",")]

        text = pdf_service.extract_text(file_path, page_list, layout)

        return {

            "success": True,

            "text": text,

            "character_count": len(text),

            "word_count": len(text.split()),

        }

    except Exception as e:

        logger.error("extract_text_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

@router.post("/extract-images", response_model=ProcessingResult, summary="Extract images from PDF")

async def extract_images_endpoint(

    _: RateLimited,

    file: UploadFile = File(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path, image_count = pdf_service.extract_images(file_path)

        return ProcessingResult(

            file_id=output_id,

            filename="extracted_images.zip",

            original_size=get_file_size(file_path),

            processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id),

            expires_at=get_expiry_time(),

            metadata={"image_count": image_count},

        )

    except Exception as e:

        logger.error("extract_images_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Image extraction failed: {str(e)}")

@router.post("/metadata", response_model=PDFMetadata, summary="Get PDF metadata")

async def metadata(

    _: RateLimited,

    file: UploadFile = File(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        meta = pdf_service.get_pdf_metadata(file_path)

        return PDFMetadata(**meta)

    except Exception as e:

        logger.error("metadata_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Metadata extraction failed: {str(e)}")
