from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.logging import get_logger

from app.models.schemas import (

    ChatResponse,

    SearchResponse,

    SummarizeResponse,

    TranslateResponse,

)

from app.services import ai_service

from app.utils.dependencies import AIRequired, RateLimited

from app.utils.file_handler import (

    get_download_url,

    get_expiry_time,

    get_file_size,

    save_upload,

    validate_pdf,

)

logger = get_logger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Features"])

@router.post("/summarize", response_model=SummarizeResponse, summary="Summarize a PDF document")

async def summarize(

    _rate: RateLimited,

    _ai: AIRequired,

    file: UploadFile = File(...),

    max_length: int = Form(default=500, ge=50, le=5000),

    min_length: int = Form(default=100, ge=20, le=1000),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        result = ai_service.summarize_document(file_path, max_length, min_length)

        return SummarizeResponse(

            summary=result["summary"],

            word_count=result["word_count"],

            page_count=result["page_count"],

            language=result["language"],

        )

    except Exception as e:

        logger.error("summarize_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/chat", response_model=ChatResponse, summary="Chat with a document")

async def chat(

    _rate: RateLimited,

    _ai: AIRequired,

    file: UploadFile = File(...),

    question: str = Form(..., max_length=2000),

    context_window: int = Form(default=5, ge=1, le=20),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        result = ai_service.chat_with_document(file_path, question, context_window)

        return ChatResponse(

            answer=result["answer"],

            sources=result["sources"],

            confidence=result["confidence"],

        )

    except Exception as e:

        logger.error("chat_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/translate", summary="Translate document content")

async def translate(

    _rate: RateLimited,

    _ai: AIRequired,

    file: UploadFile = File(...),

    source_language: str = Form(default="en"),

    target_language: str = Form(...),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        result = ai_service.translate_document(

            file_path, source_language, target_language,

        )

        if "error" in result:

            raise HTTPException(status_code=500, detail=result["error"])

        return {

            "success": True,

            "translated_text": result["translated_text"],

            "source_language": result["source_language"],

            "target_language": result["target_language"],

            "word_count": result["word_count"],

        }

    except HTTPException:

        raise

    except Exception as e:

        logger.error("translate_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.post("/search", response_model=SearchResponse, summary="Semantic search in PDF")

async def search(

    _rate: RateLimited,

    _ai: AIRequired,

    file: UploadFile = File(...),

    query: str = Form(..., max_length=500),

    top_k: int = Form(default=5, ge=1, le=20),

):

    try:

        file_id, file_path = await save_upload(file)

        if not validate_pdf(file_path):

            raise HTTPException(status_code=400, detail="Invalid PDF file.")

        result = ai_service.semantic_search(file_path, query, top_k)

        return SearchResponse(

            results=result["results"],

            total_matches=result["total_matches"],

        )

    except Exception as e:

        logger.error("search_error", error=str(e))

        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
