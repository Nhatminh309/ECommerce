from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import settings
from app.ai.gemini_service import call_gemini

SCHEMA_SYSTEM = (
    "You are a SQL expert for a PostgreSQL e-commerce database.\n"
    "Generate a safe SELECT-only SQL query based on the user's natural language request.\n"
    "Schema:\n"
    "- users(id, username, role, created_at, is_deleted)\n"
    "- products(id, name, description, price, quantity, is_deleted, created_at)\n"
    "- orders(id, user_id, total_price, status, created_at)\n"
    "- order_items(id, order_id, product_id, quantity, unit_price)\n\n"
    "Rules:\n"
    "- Only generate SELECT queries\n"
    "- Never use DROP, DELETE, UPDATE, INSERT, ALTER\n"
    "- Return ONLY the SQL query, nothing else, no markdown, no explanation"
)

SUMMARY_SYSTEM = (
    "You are a helpful data analyst. "
    "Given a SQL query result, write a concise human-readable summary in the same language as the original question. "
    "Be brief and informative."
)


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_report(self, query: str) -> dict:
        if not settings.gemini_api_key:
            return {
                "success": False,
                "message": "AI service not configured. Please set GEMINI_API_KEY.",
                "sql": None,
                "rows": [],
                "summary": None,
            }

        try:
            return self._run(query)
        except RuntimeError as exc:
            return {"success": False, "message": str(exc), "sql": None, "rows": [], "summary": None}
        except Exception as exc:
            return {"success": False, "message": f"Unexpected error: {exc}", "sql": None, "rows": [], "summary": None}

    def _run(self, query: str) -> dict:
        # Step 1: generate SQL
        sql = call_gemini(f"{SCHEMA_SYSTEM}\n\nRequest: {query}").strip()

        # Strip markdown code fences if Gemini added them despite instructions
        if sql.startswith("```"):
            lines = sql.splitlines()
            sql = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()

        # Step 2: validate — must be a SELECT
        if not sql.upper().lstrip().startswith("SELECT"):
            return {
                "success": False,
                "message": "Generated query is not a SELECT statement. Request rejected for safety.",
                "sql": sql,
                "rows": [],
                "summary": None,
            }

        # Step 3: execute
        result = self.db.execute(text(sql))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]

        # Step 4: summarize
        rows_preview = str(rows[:20])
        summary_prompt = (
            f"{SUMMARY_SYSTEM}\n\n"
            f"Original question: {query}\n"
            f"SQL: {sql}\n"
            f"Result ({len(rows)} rows): {rows_preview}"
        )
        summary = call_gemini(summary_prompt)

        return {
            "success": True,
            "message": "Report generated successfully.",
            "sql": sql,
            "rows": rows,
            "summary": summary,
        }
