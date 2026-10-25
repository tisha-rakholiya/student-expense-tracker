from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import analytics
from auth import current_user_id
from config import CORS_ORIGINS
from db import get_db
from schemas import Insights

app = FastAPI(
    title="SpendWise Analytics API",
    description="Python FastAPI service: spending insights and CSV export. "
    "It verifies the JWT created by the Express backend and reads the same MongoDB database.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["Authorization"],
)


def month_param(month: str | None = Query(None, description="Month as YYYY-MM (default: this month)")) -> str:
    month = month or analytics.current_month()
    if not analytics.MONTH_PATTERN.match(month):
        raise HTTPException(status_code=400, detail="Month must be in YYYY-MM format")
    return month


@app.get("/health")
def health():
    get_db().command("ping")
    return {"status": "ok", "service": "fastapi", "database": "connected"}


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/insights", response_model=Insights)
def insights(month: str = Depends(month_param), user_id: ObjectId = Depends(current_user_id)):
    """Totals, top category, daily spending, budget pace and tips for one month."""
    return analytics.build_insights(get_db(), user_id, month)


@router.get("/export")
def export_csv(month: str = Depends(month_param), user_id: ObjectId = Depends(current_user_id)):
    """Download the month's expenses as a CSV file (opens in Excel)."""
    content = analytics.expenses_csv(get_db(), user_id, month)
    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="expenses-{month}.csv"'},
    )


app.include_router(router)
