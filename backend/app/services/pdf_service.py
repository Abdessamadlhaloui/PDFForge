from __future__ import annotations

import io

import re

import subprocess

import zipfile

from pathlib import Path

import fitz

from pypdf import PdfReader, PdfWriter

from app.core.config import settings

from app.core.logging import get_logger

from app.models.schemas import (

    CompressionQuality,

    WatermarkPosition,

)

from app.utils.file_handler import (

    generate_file_id,

    get_file_path,

    get_file_size,

    save_bytes_sync,

)

logger = get_logger(__name__)

def merge_pdfs(file_paths: list[Path]) -> tuple[str, Path]:

    logger.info("merge_start", file_count=len(file_paths))

    output_id = generate_file_id()

    writer = PdfWriter()

    for path in file_paths:

        reader = PdfReader(str(path))

        for page in reader.pages:

            writer.add_page(page)

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info(

        "merge_complete",

        output_id=output_id,

        total_pages=len(writer.pages),

        output_size=get_file_size(output_path),

    )

    return output_id, output_path

def split_pdf(file_path: Path, ranges: list[str]) -> tuple[str, Path]:

    logger.info("split_start", ranges=ranges)

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    total_pages = len(doc)

    output_doc = fitz.open()

    for r in ranges:

        pages = _parse_page_range(r, total_pages)

        for page_num in pages:

            output_doc.insert_pdf(doc, from_page=page_num - 1, to_page=page_num - 1)

    output_path = get_file_path(output_id, ".pdf")

    output_doc.save(str(output_path), garbage=4, deflate=True)

    doc.close()

    output_doc.close()

    logger.info("split_complete", output_id=output_id)

    return output_id, output_path

def compress_pdf(file_path: Path, quality: CompressionQuality) -> tuple[str, Path]:

    logger.info("compress_start", quality=quality.value, input_size=get_file_size(file_path))

    output_id = generate_file_id()

    output_path = get_file_path(output_id, ".pdf")

    original_size = get_file_size(file_path)

    try:

        doc = fitz.open(str(file_path))

        doc.save(

            str(output_path),

            garbage=4,

            deflate=True,

            deflate_images=True,

            deflate_fonts=True

        )

        doc.close()

    except Exception as e:

        logger.error("compress_error", error=str(e))

        raise RuntimeError(f"Compression failed: {str(e)}")

    compressed_size = get_file_size(output_path)

    reduction = ((original_size - compressed_size) / original_size) * 100

    logger.info(

        "compress_complete",

        output_id=output_id,

        original_size=original_size,

        compressed_size=compressed_size,

        reduction_percent=round(reduction, 1),

    )

    return output_id, output_path

def rotate_pages(file_path: Path, pages: list[int], angle: int) -> tuple[str, Path]:

    logger.info("rotate_start", pages=pages, angle=angle)

    output_id = generate_file_id()

    reader = PdfReader(str(file_path))

    writer = PdfWriter()

    for i, page in enumerate(reader.pages, 1):

        if i in pages:

            page.rotate(angle)

        writer.add_page(page)

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info("rotate_complete", output_id=output_id)

    return output_id, output_path

def delete_pages(file_path: Path, pages_to_delete: list[int]) -> tuple[str, Path]:

    logger.info("delete_pages_start", pages=pages_to_delete)

    output_id = generate_file_id()

    reader = PdfReader(str(file_path))

    writer = PdfWriter()

    pages_set = set(pages_to_delete)

    kept = 0

    for i, page in enumerate(reader.pages, 1):

        if i not in pages_set:

            writer.add_page(page)

            kept += 1

    if kept == 0:

        raise ValueError("Cannot delete all pages from a PDF.")

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info("delete_pages_complete", output_id=output_id, pages_remaining=kept)

    return output_id, output_path

def reorder_pages(file_path: Path, page_order: list[int]) -> tuple[str, Path]:

    logger.info("reorder_start", new_order=page_order)

    output_id = generate_file_id()

    reader = PdfReader(str(file_path))

    writer = PdfWriter()

    total_pages = len(reader.pages)

    if sorted(page_order) != list(range(1, total_pages + 1)):

        raise ValueError(

            f"Page order must contain all pages from 1 to {total_pages} exactly once."

        )

    for page_num in page_order:

        writer.add_page(reader.pages[page_num - 1])

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info("reorder_complete", output_id=output_id)

    return output_id, output_path

def extract_pages(file_path: Path, start: int, end: int) -> tuple[str, Path]:

    logger.info("extract_start", start=start, end=end)

    output_id = generate_file_id()

    reader = PdfReader(str(file_path))

    total_pages = len(reader.pages)

    if start < 1 or end > total_pages or start > end:

        raise ValueError(f"Invalid page range: {start}-{end} (document has {total_pages} pages)")

    writer = PdfWriter()

    for i in range(start - 1, end):

        writer.add_page(reader.pages[i])

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info("extract_complete", output_id=output_id, pages_extracted=end - start + 1)

    return output_id, output_path

def add_watermark(

    file_path: Path,

    text: str,

    position: WatermarkPosition = WatermarkPosition.DIAGONAL,

    opacity: float = 0.3,

    font_size: int = 48,

    color: str = "#808080",

    rotation: float = 45.0,

) -> tuple[str, Path]:

    logger.info("watermark_start", text=text, position=position.value)

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    hex_color = color.lstrip("#")

    r, g, b = tuple(int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4))

    for page in doc:

        rect = page.rect

        if position == WatermarkPosition.CENTER:

            point = fitz.Point(rect.width / 2, rect.height / 2)

        elif position == WatermarkPosition.TOP_LEFT:

            point = fitz.Point(50, 50)

        elif position == WatermarkPosition.TOP_RIGHT:

            point = fitz.Point(rect.width - 50, 50)

        elif position == WatermarkPosition.BOTTOM_LEFT:

            point = fitz.Point(50, rect.height - 50)

        elif position == WatermarkPosition.BOTTOM_RIGHT:

            point = fitz.Point(rect.width - 50, rect.height - 50)

        else:

            point = fitz.Point(rect.width / 2, rect.height / 2)

        page.insert_text(

            point,

            text,

            fontsize=font_size,

            color=(r, g, b),

            rotate=0, # Fixed: Always use 0 as PyMuPDF throws error for non-90 angles on insert_text

            overlay=True,

            fill_opacity=opacity,

        )

    output_path = get_file_path(output_id, ".pdf")

    doc.save(str(output_path))

    doc.close()

    logger.info("watermark_complete", output_id=output_id)

    return output_id, output_path

def protect_pdf(

    file_path: Path,

    user_password: str,

    owner_password: str | None = None,

    allow_printing: bool = True,

    allow_copying: bool = False,

) -> tuple[str, Path]:

    logger.info("protect_start")

    output_id = generate_file_id()

    perm = fitz.PDF_PERM_ACCESSIBILITY

    if allow_printing:

        perm |= fitz.PDF_PERM_PRINT | fitz.PDF_PERM_PRINT_HQ

    if allow_copying:

        perm |= fitz.PDF_PERM_COPY

    doc = fitz.open(str(file_path))

    output_path = get_file_path(output_id, ".pdf")

    doc.save(

        str(output_path),

        encryption=fitz.PDF_ENCRYPT_AES_256,

        user_pw=user_password,

        owner_pw=owner_password or user_password,

        permissions=perm,

    )

    doc.close()

    logger.info("protect_complete", output_id=output_id)

    return output_id, output_path

def unlock_pdf(file_path: Path, password: str) -> tuple[str, Path]:

    logger.info("unlock_start")

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    if doc.is_encrypted:

        if not doc.authenticate(password):

            doc.close()

            raise ValueError("Incorrect password")

    output_path = get_file_path(output_id, ".pdf")

    doc.save(str(output_path))

    doc.close()

    logger.info("unlock_complete", output_id=output_id)

    return output_id, output_path

def redact_text(

    file_path: Path,

    search_terms: list[str],

    redact_color: str = "#000000",

    use_regex: bool = False,

) -> tuple[str, Path, int]:

    logger.info("redact_start", terms_count=len(search_terms))

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    hex_color = redact_color.lstrip("#")

    r, g, b = tuple(int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4))

    fill_color = (r, g, b)

    total_redactions = 0

    for page in doc:

        for term in search_terms:

            text_instances = page.search_for(term)

            for inst in text_instances:

                page.add_redact_annot(inst, fill=fill_color)

                total_redactions += 1

        page.apply_redactions()

    output_path = get_file_path(output_id, ".pdf")

    doc.save(str(output_path), garbage=4, deflate=True)

    doc.close()

    logger.info("redact_complete", output_id=output_id, redactions=total_redactions)

    return output_id, output_path, total_redactions

def extract_text(

    file_path: Path,

    pages: list[int] | None = None,

    layout: bool = False,

) -> str:

    logger.info("extract_text_start", pages=pages, layout=layout)

    doc = fitz.open(str(file_path))

    text_parts: list[str] = []

    page_indices = range(len(doc))

    if pages:

        page_indices = [p - 1 for p in pages if 0 <= p - 1 < len(doc)]

    for idx in page_indices:

        page = doc[idx]

        if layout:

            text = page.get_text("text", flags=fitz.TEXT_PRESERVE_WHITESPACE)

        else:

            text = page.get_text("text")

        text_parts.append(f"--- Page {idx + 1} ---\n{text}")

    doc.close()

    result = "\n\n".join(text_parts)

    logger.info("extract_text_complete", total_chars=len(result))

    return result

def extract_images(file_path: Path) -> tuple[str, Path, int]:

    logger.info("extract_images_start")

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    zip_path = get_file_path(output_id, ".zip")

    image_count = 0

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:

        for page_num, page in enumerate(doc, 1):

            image_list = page.get_images(full=True)

            for img_idx, img in enumerate(image_list, 1):

                xref = img[0]

                base_image = doc.extract_image(xref)

                image_bytes = base_image["image"]

                image_ext = base_image["ext"]

                filename = f"page{page_num}_img{img_idx}.{image_ext}"

                zf.writestr(filename, image_bytes)

                image_count += 1

    doc.close()

    logger.info("extract_images_complete", output_id=output_id, images=image_count)

    return output_id, zip_path, image_count

def get_pdf_metadata(file_path: Path) -> dict:

    doc = fitz.open(str(file_path))

    metadata = doc.metadata or {}

    result = {

        "filename": file_path.name,

        "page_count": len(doc),

        "file_size": get_file_size(file_path),

        "title": metadata.get("title"),

        "author": metadata.get("author"),

        "subject": metadata.get("subject"),

        "creator": metadata.get("creator"),

        "producer": metadata.get("producer"),

        "creation_date": metadata.get("creationDate"),

        "modification_date": metadata.get("modDate"),

        "is_encrypted": doc.is_encrypted,

        "has_text": bool(doc[0].get_text("text").strip()) if len(doc) > 0 else False,

    }

    doc.close()

    return result

def ocr_pdf(file_path: Path, languages: list[str] = None, dpi: int = 300) -> tuple[str, Path]:

    if languages is None:

        languages = ["eng"]

    logger.info("ocr_start", languages=languages, dpi=dpi)

    output_id = generate_file_id()

    import pytesseract

    from PIL import Image

    doc = fitz.open(str(file_path))

    writer = PdfWriter()

    lang_str = "+".join(languages)

    for page_num in range(len(doc)):

        page = doc[page_num]

        mat = fitz.Matrix(dpi / 72, dpi / 72)

        pix = page.get_pixmap(matrix=mat)

        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        pdf_bytes = pytesseract.image_to_pdf_or_hocr(

            img,

            lang=lang_str,

            extension="pdf",

            config="--psm 1",

        )

        ocr_reader = PdfReader(io.BytesIO(pdf_bytes))

        if len(ocr_reader.pages) > 0:

            writer.add_page(ocr_reader.pages[0])

    doc.close()

    output_path = get_file_path(output_id, ".pdf")

    with open(output_path, "wb") as f:

        writer.write(f)

    logger.info("ocr_complete", output_id=output_id)

    return output_id, output_path

def _parse_page_range(range_str: str, total_pages: int) -> list[int]:

    range_str = range_str.strip()

    range_str = range_str.replace("end", str(total_pages))

    if "-" in range_str:

        parts = range_str.split("-", 1)

        start = int(parts[0])

        end = int(parts[1])

        if start < 1 or end > total_pages or start > end:

            raise ValueError(f"Invalid page range: {range_str}")

        return list(range(start, end + 1))

    else:

        page = int(range_str)

        if page < 1 or page > total_pages:

            raise ValueError(f"Invalid page number: {page}")

        return [page]
