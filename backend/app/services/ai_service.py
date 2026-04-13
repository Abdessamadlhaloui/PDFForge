from __future__ import annotations

import io

from pathlib import Path

from typing import Any

import fitz

from app.core.config import settings

from app.core.logging import get_logger

logger = get_logger(__name__)

_models: dict[str, Any] = {}

def _get_groq_client():

    if "groq" not in _models:

        from groq import Groq

        api_key = settings.xai_api_key or settings.groq_api_key

        if not api_key:

            raise ValueError("Groq/XAI API key not configured. Set XAI_API_KEY in .env")

        _models["groq"] = Groq(api_key=api_key)

    return _models["groq"]

def _get_embedder():

    if "embedder" not in _models:

        logger.info("loading_embedder", model=settings.embedding_model)

        from sentence_transformers import SentenceTransformer

        _models["embedder"] = SentenceTransformer(

            settings.embedding_model,

            device=settings.ai_device,

        )

    return _models["embedder"]

def _get_faiss_index():

    if "faiss" not in _models:

        import faiss

        _models["faiss"] = faiss

    return _models["faiss"]

def _extract_text_from_pdf(file_path: Path) -> tuple[str, list[dict]]:

    doc = fitz.open(str(file_path))

    full_text_parts = []

    page_chunks = []

    for i, page in enumerate(doc, 1):

        text = page.get_text("text").strip()

        if text:

            full_text_parts.append(text)

            page_chunks.append({"page": i, "text": text})

    doc.close()

    return "\n\n".join(full_text_parts), page_chunks

def _chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end]

        chunks.append(chunk)

        start = end - overlap

    return chunks

def summarize_document(

    file_path: Path,

    max_length: int = 500,

    min_length: int = 100,

) -> dict:

    logger.info("summarize_start", max_length=max_length)

    full_text, page_chunks = _extract_text_from_pdf(file_path)

    if not full_text.strip():

        return {

            "summary": "No text content found in the document.",

            "word_count": 0,

            "page_count": len(page_chunks),

            "language": "unknown",

        }

    client = _get_groq_client()

    # Take first ~15,000 chars to fit in 8k context window easily

    content_to_summarize = full_text[:15000]

    try:

        response = client.chat.completions.create(

            model="llama3-8b-8192",

            messages=[

                {

                    "role": "system",

                    "content": f"You are an expert document summarizer. Summarize the provided document in approximately {max_length} words. Ensure the summary is comprehensive but concise. Match the language of the provided text."

                },

                {

                    "role": "user",

                    "content": f"Document Text:\n\n{content_to_summarize}"

                }

            ],

            temperature=0.3,

            max_tokens=max_length * 3,

        )

        combined = response.choices[0].message.content

    except Exception as e:

        logger.error("summarize_error", error=str(e))

        combined = f"Groq summarization failed: {str(e)}"

    result = {

        "summary": combined or "Could not generate summary for this document.",

        "word_count": len(full_text.split()),

        "page_count": len(page_chunks),

        "language": "auto",

    }

    logger.info("summarize_complete", summary_length=len(combined))

    return result

def chat_with_document(

    file_path: Path,

    question: str,

    context_window: int = 5,

) -> dict:

    logger.info("chat_start", question_length=len(question))

    import numpy as np

    full_text, page_chunks = _extract_text_from_pdf(file_path)

    if not full_text.strip():

        return {

            "answer": "No text content found in the document.",

            "sources": [],

            "confidence": 0.0,

        }

    embedder = _get_embedder()

    faiss = _get_faiss_index()

    text_chunks = []

    chunk_pages = []

    for pc in page_chunks:

        sub_chunks = _chunk_text(pc["text"], chunk_size=500, overlap=100)

        for sc in sub_chunks:

            text_chunks.append(sc)

            chunk_pages.append(pc["page"])

    if not text_chunks:

        return {

            "answer": "No processable text found in the document.",

            "sources": [],

            "confidence": 0.0,

        }

    chunk_embeddings = embedder.encode(text_chunks, convert_to_numpy=True)

    dimension = chunk_embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    faiss.normalize_L2(chunk_embeddings)

    index.add(chunk_embeddings)

    query_embedding = embedder.encode([question], convert_to_numpy=True)

    faiss.normalize_L2(query_embedding)

    k = min(context_window, len(text_chunks))

    scores, indices = index.search(query_embedding, k)

    context_parts = []

    sources = []

    for i, (score, idx) in enumerate(zip(scores[0], indices[0])):

        if idx < len(text_chunks):

            context_parts.append(text_chunks[idx])

            sources.append({

                "page": chunk_pages[idx],

                "text": text_chunks[idx][:200] + "...",

                "relevance": float(score),

            })

    context = "\n\n".join(context_parts)

    confidence = float(np.mean(scores[0])) if len(scores[0]) > 0 else 0.0

    client = _get_groq_client()

    try:

        response = client.chat.completions.create(

            model="llama3-8b-8192",

            messages=[

                {

                    "role": "system",

                    "content": "You are a helpful AI document assistant. Answer the user's question based strictly on the provided Context. Do not hallucinate external information. If the answer is not in the context, say 'I cannot find the answer in the provided document.' Reply in the language the user asked the question."

                },

                {

                    "role": "user",

                    "content": f"Context:\n{context}\n\nQuestion: {question}"

                }

            ],

            temperature=0.0,

            max_tokens=800,

        )

        answer = response.choices[0].message.content

    except Exception as e:

        logger.error("chat_error", error=str(e))

        answer = f"Groq response failed: {str(e)}"

    result = {

        "answer": answer,

        "sources": sources,

        "confidence": min(confidence, 1.0),

    }

    logger.info("chat_complete", answer_length=len(answer), confidence=confidence)

    return result

def semantic_search(

    file_path: Path,

    query: str,

    top_k: int = 5,

) -> dict:

    logger.info("search_start", query=query, top_k=top_k)

    import numpy as np

    full_text, page_chunks = _extract_text_from_pdf(file_path)

    if not full_text.strip():

        return {"results": [], "total_matches": 0}

    embedder = _get_embedder()

    faiss = _get_faiss_index()

    text_chunks = []

    chunk_metadata = []

    for pc in page_chunks:

        sub_chunks = _chunk_text(pc["text"], chunk_size=300, overlap=50)

        for sc in sub_chunks:

            text_chunks.append(sc)

            chunk_metadata.append({"page": pc["page"]})

    if not text_chunks:

        return {"results": [], "total_matches": 0}

    chunk_embeddings = embedder.encode(text_chunks, convert_to_numpy=True)

    dimension = chunk_embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    faiss.normalize_L2(chunk_embeddings)

    index.add(chunk_embeddings)

    query_embedding = embedder.encode([query], convert_to_numpy=True)

    faiss.normalize_L2(query_embedding)

    k = min(top_k, len(text_chunks))

    scores, indices = index.search(query_embedding, k)

    results = []

    for score, idx in zip(scores[0], indices[0]):

        if idx < len(text_chunks):

            results.append({

                "page": chunk_metadata[idx]["page"],

                "text": text_chunks[idx],

                "score": float(score),

            })

    logger.info("search_complete", total_matches=len(results))

    return {"results": results, "total_matches": len(results)}

def translate_document(

    file_path: Path,

    source_language: str = "auto",

    target_language: str = "en",

) -> dict:

    logger.info("translate_start", source=source_language, target=target_language)

    full_text, page_chunks = _extract_text_from_pdf(file_path)

    if not full_text.strip():

        return {

            "error": "No text content found in the document.",

            "source_language": source_language,

            "target_language": target_language,

        }

    client = _get_groq_client()

    content_to_translate = full_text[:15000]

    try:

        response = client.chat.completions.create(

            model="llama3-8b-8192",

            messages=[

                {

                    "role": "system",

                    "content": f"You are a professional document translator. Translate the following text from {source_language} to {target_language}. Preserve the formatting and tone. Output ONLY the translated text, with no conversational filler."

                },

                {

                    "role": "user",

                    "content": content_to_translate

                }

            ],

            temperature=0.1,

            max_tokens=2000,

        )

        translated_text = response.choices[0].message.content

        return {

            "translated_text": translated_text,

            "source_language": source_language,

            "target_language": target_language,

            "word_count": len(translated_text.split()),

        }

    except Exception as e:

        logger.error("translation_error", error=str(e))

        return {

            "error": f"Translation failed: {str(e)}",

            "source_language": source_language,

            "target_language": target_language,

        }
