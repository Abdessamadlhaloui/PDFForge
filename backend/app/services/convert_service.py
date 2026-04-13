from __future__ import annotations

import io

import subprocess

import shutil

import zipfile

from pathlib import Path

import fitz

from PIL import Image

from app.core.config import settings

from app.core.logging import get_logger

from app.utils.file_handler import (

    generate_file_id,

    get_file_path,

    get_file_size,

    get_temp_dir,

)

logger = get_logger(__name__)

def _run_libreoffice(

    input_path: Path,

    output_format: str,

    output_dir: Path | None = None,

) -> Path:

    if output_dir is None:

        output_dir = get_temp_dir()

    command = [

        settings.libreoffice_path,

        "--headless",

        "--norestore",

        "--convert-to", output_format,

        "--outdir", str(output_dir),

        str(input_path),

    ]

    logger.info(

        "libreoffice_start",

        input=input_path.name,

        output_format=output_format,

    )

    try:

        result = subprocess.run(

            command,

            capture_output=True,

            text=True,

            timeout=180,

            env={

                **__import__("os").environ,

                "HOME": str(get_temp_dir()),

            },

        )

        if result.returncode != 0:

            logger.error("libreoffice_error", stderr=result.stderr, stdout=result.stdout)

            raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")

    except subprocess.TimeoutExpired:

        raise RuntimeError("Conversion timed out (>180s). File may be too large.")

    except FileNotFoundError:

        raise RuntimeError(

            "LibreOffice not found. Install it or set LIBREOFFICE_PATH correctly."

        )

    expected_name = input_path.stem + "." + output_format.split(":")[-1]

    output_path = output_dir / expected_name

    if not output_path.exists():

        possible_files = list(output_dir.glob(f"{input_path.stem}.*"))

        output_files = [

            f for f in possible_files

            if f.suffix.lstrip(".") == output_format.split(":")[-1]

               and f != input_path

        ]

        if output_files:

            output_path = output_files[0]

        else:

            raise RuntimeError(f"Conversion output file not found: {expected_name}")

    logger.info("libreoffice_complete", output=output_path.name)

    return output_path

def pdf_to_word(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "docx", output_dir)

    final_path = get_file_path(output_id, ".docx")

    shutil.move(str(converted), str(final_path))

    logger.info("pdf_to_word_complete", output_id=output_id, size=get_file_size(final_path))

    return output_id, final_path

def pdf_to_excel(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "xlsx", output_dir)

    final_path = get_file_path(output_id, ".xlsx")

    shutil.move(str(converted), str(final_path))

    logger.info("pdf_to_excel_complete", output_id=output_id)

    return output_id, final_path

def pdf_to_pptx(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "pptx", output_dir)

    final_path = get_file_path(output_id, ".pptx")

    shutil.move(str(converted), str(final_path))

    logger.info("pdf_to_pptx_complete", output_id=output_id)

    return output_id, final_path

def pdf_to_images(

    file_path: Path,

    image_format: str = "png",

    dpi: int = 200,

    quality: int = 85,

) -> tuple[str, Path, int]:

    logger.info("pdf_to_images_start", format=image_format, dpi=dpi)

    output_id = generate_file_id()

    doc = fitz.open(str(file_path))

    page_count = len(doc)

    zip_path = get_file_path(output_id, ".zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:

        for i, page in enumerate(doc, 1):

            mat = fitz.Matrix(dpi / 72, dpi / 72)

            pix = page.get_pixmap(matrix=mat)

            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            img_buffer = io.BytesIO()

            pil_format = image_format.upper()

            if pil_format == "JPG":

                pil_format = "JPEG"

            save_kwargs = {}

            if pil_format in ("JPEG", "WEBP"):

                save_kwargs["quality"] = quality

            if pil_format == "PNG":

                save_kwargs["optimize"] = True

            img.save(img_buffer, format=pil_format, **save_kwargs)

            img_buffer.seek(0)

            filename = f"page_{i:04d}.{image_format}"

            zf.writestr(filename, img_buffer.read())

    doc.close()

    logger.info("pdf_to_images_complete", output_id=output_id, pages=page_count)

    return output_id, zip_path, page_count

def word_to_pdf(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "pdf", output_dir)

    final_path = get_file_path(output_id, ".pdf")

    shutil.move(str(converted), str(final_path))

    logger.info("word_to_pdf_complete", output_id=output_id)

    return output_id, final_path

def excel_to_pdf(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "pdf", output_dir)

    final_path = get_file_path(output_id, ".pdf")

    shutil.move(str(converted), str(final_path))

    logger.info("excel_to_pdf_complete", output_id=output_id)

    return output_id, final_path

def pptx_to_pdf(file_path: Path) -> tuple[str, Path]:

    output_id = generate_file_id()

    output_dir = get_temp_dir()

    converted = _run_libreoffice(file_path, "pdf", output_dir)

    final_path = get_file_path(output_id, ".pdf")

    shutil.move(str(converted), str(final_path))

    logger.info("pptx_to_pdf_complete", output_id=output_id)

    return output_id, final_path

def images_to_pdf(image_paths: list[Path]) -> tuple[str, Path]:

    logger.info("images_to_pdf_start", image_count=len(image_paths))

    output_id = generate_file_id()

    doc = fitz.open()

    for img_path in image_paths:

        img = Image.open(str(img_path))

        if img.mode not in ("RGB", "L"):

            img = img.convert("RGB")

        width, height = img.size

        page = doc.new_page(width=width * 72 / 96, height=height * 72 / 96)

        img_bytes = io.BytesIO()

        img.save(img_bytes, format="PNG")

        img_bytes.seek(0)

        rect = page.rect

        page.insert_image(rect, stream=img_bytes.read())

    output_path = get_file_path(output_id, ".pdf")

    doc.save(str(output_path))

    doc.close()

    logger.info("images_to_pdf_complete", output_id=output_id, pages=len(image_paths))

    return output_id, output_path
