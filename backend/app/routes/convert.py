from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.logging import get_logger

from app.models.schemas import ConvertFormat, ProcessingResult

from app.services import convert_service

from app.utils.dependencies import RateLimited

from app.utils.file_handler import (

    get_download_url,

    get_expiry_time,

    get_file_size,

    save_upload,

    validate_pdf,

)

logger = get_logger(__name__)

router = APIRouter(prefix="/convert", tags=["Conversion"])

@router.post("/pdf-to-word", response_model=ProcessingResult, summary="Convert PDF to Word")

async def pdf_to_word(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = convert_service.pdf_to_word(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.docx",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"output_format": "docx"},

        )

    except RuntimeError as e:

        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:

        logger.error("pdf_to_word_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/pdf-to-excel", response_model=ProcessingResult, summary="Convert PDF to Excel")

async def pdf_to_excel(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = convert_service.pdf_to_excel(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.xlsx",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"output_format": "xlsx"},

        )

    except Exception as e:

        logger.error("pdf_to_excel_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/pdf-to-pptx", response_model=ProcessingResult, summary="Convert PDF to PowerPoint")

async def pdf_to_pptx(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        output_id, output_path = convert_service.pdf_to_pptx(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.pptx",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"output_format": "pptx"},

        )

    except Exception as e:

        logger.error("pdf_to_pptx_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/pdf-to-images", response_model=ProcessingResult, summary="Convert PDF pages to images")

async def pdf_to_images(

    _: RateLimited,

    file: UploadFile = File(...),

    format: str = Form(default="png"),

    dpi: int = Form(default=200, ge=72, le=600),

    quality: int = Form(default=85, ge=1, le=100),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        if format not in ("png", "jpg", "jpeg", "webp", "tiff"):

            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")

        output_id, output_path, page_count = convert_service.pdf_to_images(

            file_path, format, dpi, quality,

        )

        return ProcessingResult(

            file_id=output_id, filename="pdf_images.zip",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"output_format": format, "page_count": page_count, "dpi": dpi},

        )

    except Exception as e:

        logger.error("pdf_to_images_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/word-to-pdf", response_model=ProcessingResult, summary="Convert Word to PDF")

async def word_to_pdf(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        output_id, output_path = convert_service.word_to_pdf(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.pdf",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"source_format": "docx", "output_format": "pdf"},

        )

    except Exception as e:

        logger.error("word_to_pdf_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/excel-to-pdf", response_model=ProcessingResult, summary="Convert Excel to PDF")

async def excel_to_pdf(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        output_id, output_path = convert_service.excel_to_pdf(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.pdf",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"source_format": "xlsx", "output_format": "pdf"},

        )

    except Exception as e:

        logger.error("excel_to_pdf_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/pptx-to-pdf", response_model=ProcessingResult, summary="Convert PowerPoint to PDF")

async def pptx_to_pdf(_: RateLimited, file: UploadFile = File(...)):

    try:

        file_id, file_path = await save_upload(file)

        output_id, output_path = convert_service.pptx_to_pdf(file_path)

        return ProcessingResult(

            file_id=output_id, filename="converted.pdf",

            original_size=get_file_size(file_path), processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"source_format": "pptx", "output_format": "pdf"},

        )

    except Exception as e:

        logger.error("pptx_to_pdf_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/images-to-pdf", response_model=ProcessingResult, summary="Convert images to PDF")

async def images_to_pdf(_: RateLimited, files: list[UploadFile] = File(...)):

    try:

        if not files:

            raise HTTPException(status_code=400, detail="No image files provided.")

        saved_paths = []

        total_size = 0

        for file in files:

            file_id, file_path = await save_upload(file)

            saved_paths.append(file_path)

            total_size += get_file_size(file_path)

        output_id, output_path = convert_service.images_to_pdf(saved_paths)

        return ProcessingResult(

            file_id=output_id, filename="images_to_pdf.pdf",

            original_size=total_size, processed_size=get_file_size(output_path),

            download_url=get_download_url(output_id), expires_at=get_expiry_time(),

            metadata={"image_count": len(saved_paths)},

        )

    except Exception as e:

        logger.error("images_to_pdf_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
