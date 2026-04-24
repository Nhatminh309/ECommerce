import io
import uuid
from PyPDF2 import PdfReader
from app.database import settings
from app.ai.gemini_service import call_gemini

# In-memory document store: {doc_id: {filename, chunks, full_text}}
_store: dict[str, dict] = {}

FALLBACK = "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau."

ANSWER_SYSTEM = (
    "You are a helpful assistant that answers questions based on provided document excerpts. "
    "Always cite which part of the document your answer comes from. "
    "If the answer isn't in the excerpts, say so."
)


def _chunk_text(text: str, size: int = 1000, overlap: int = 100) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


def _keyword_search(chunks: list[tuple[str, str]], question: str, top_k: int = 3) -> list[tuple[str, str]]:
    words = set(question.lower().split())
    scored = []
    for doc_id, chunk in chunks:
        lower = chunk.lower()
        score = sum(1 for w in words if w in lower)
        scored.append((score, doc_id, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [(d, c) for _, d, c in scored[:top_k]]


def upload_document(filename: str, content_bytes: bytes) -> dict:
    try:
        reader = PdfReader(io.BytesIO(content_bytes))
        full_text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")
    chunks = _chunk_text(full_text)
    doc_id = str(uuid.uuid4())
    _store[doc_id] = {
        "filename": filename,
        "chunks": chunks,
        "full_text": full_text,
    }
    return {"doc_id": doc_id, "filename": filename, "num_chunks": len(chunks)}


def delete_document(doc_id: str) -> bool:
    """Delete a document by ID. Returns True if deleted, False if not found."""
    if doc_id in _store:
        del _store[doc_id]
        return True
    return False


def list_documents() -> list[dict]:
    return [
        {"doc_id": doc_id, "filename": info["filename"], "num_chunks": len(info["chunks"])}
        for doc_id, info in _store.items()
    ]


def ask_question(question: str, doc_id: str | None = None) -> dict:
    if not settings.gemini_api_key:
        return {"answer": "AI service not configured. Please set GEMINI_API_KEY.", "sources": []}

    if doc_id:
        if doc_id not in _store:
            return {"answer": "Document not found.", "sources": []}
        all_chunks = [(doc_id, c) for c in _store[doc_id]["chunks"]]
    else:
        all_chunks = []
        for d_id, info in _store.items():
            all_chunks.extend((d_id, c) for c in info["chunks"])

    if not all_chunks:
        return {"answer": "No documents available to search.", "sources": []}

    top_chunks = _keyword_search(all_chunks, question)

    excerpts_text = "\n\n".join(
        f"[EXCERPT {i + 1}]: {chunk}" for i, (_, chunk) in enumerate(top_chunks)
    )
    prompt = (
        f"{ANSWER_SYSTEM}\n\n"
        f"Based on these excerpts:\n{excerpts_text}\n\n"
        f"Question: {question}"
    )
    try:
        answer = call_gemini(prompt)
    except RuntimeError as exc:
        return {"answer": str(exc), "sources": []}

    sources = [{"chunk": chunk, "doc_id": d_id} for d_id, chunk in top_chunks]
    return {"answer": answer, "sources": sources}
