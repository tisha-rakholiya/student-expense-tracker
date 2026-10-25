import calendar
import re
from datetime import datetime, timezone

from schemas import BiggestExpense, CategoryTotal, DailyTotal, Insights, PaymentTotal

MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def current_month() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year}-{now.month:02d}"


def month_bounds(month: str):
    """'2026-10' -> (1 Oct 2026, 1 Nov 2026) in UTC, same as the Express backend."""
    year, mon = map(int, month.split("-"))
    start = datetime(year, mon, 1, tzinfo=timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=timezone.utc) if mon == 12 else datetime(year, mon + 1, 1, tzinfo=timezone.utc)
    return start, end


def previous_month(month: str) -> str:
    year, mon = map(int, month.split("-"))
    return f"{year - 1}-12" if mon == 1 else f"{year}-{mon - 1:02d}"


def rupees(amount: float) -> str:
    """12345 -> '₹12,345' (Indian digit grouping)."""
    n = int(round(amount))
    digits = str(abs(n))
    if len(digits) > 3:
        head = re.sub(r"(\d)(?=(\d\d)+$)", r"\1,", digits[:-3])
        digits = head + "," + digits[-3:]
    return ("-" if n < 0 else "") + "₹" + digits


def _match(user_id, month: str) -> dict:
    start, end = month_bounds(month)
    return {"user": user_id, "date": {"$gte": start, "$lt": end}}


def _month_total(db, user_id, month: str) -> float:
    rows = list(db.expenses.aggregate([
        {"$match": _match(user_id, month)},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]))
    return rows[0]["total"] if rows else 0


def _tips(*, total, budget, status, projected, days_left, top, change) -> list[str]:
    if total == 0:
        return ["Add a few expenses to see tips for this month."]

    tips = []
    if top and top.share >= 40:
        tips.append(f"{top.category} takes {top.share}% of your spending. Small cuts here will save the most.")

    if status == "no_budget":
        tips.append("Set a monthly budget on the Dashboard to get pace warnings.")
    elif status == "over_budget":
        tips.append(f"You have crossed your budget by {rupees(total - budget)}.")
    elif status == "over_pace":
        tip = f"At this pace you will spend about {rupees(projected)}, which is {rupees(projected - budget)} above your budget."
        if days_left > 0:
            tip += f" Keep daily spending under {rupees((budget - total) / days_left)} for the remaining {days_left} days."
        tips.append(tip)
    elif days_left > 0:
        tips.append(f"You are on track. You can spend about {rupees((budget - total) / days_left)} per day for the remaining {days_left} days.")
    else:
        tips.append("You stayed within your budget this month. Well done!")

    if change is not None and change >= 10:
        tips.append(f"Spending is up {change:g}% compared with last month.")
    elif change is not None and change <= -10:
        tips.append(f"Nice! Spending is down {abs(change):g}% compared with last month.")
    return tips


def build_insights(db, user_id, month: str) -> Insights:
    """Uses MongoDB aggregation to turn a month's expenses into insights."""
    match = _match(user_id, month)
    year, mon = map(int, month.split("-"))
    days_in_month = calendar.monthrange(year, mon)[1]

    by_category = list(db.expenses.aggregate([
        {"$match": match},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ]))
    by_payment = list(db.expenses.aggregate([
        {"$match": match},
        {"$group": {"_id": "$paymentMethod", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
    ]))
    by_day = {
        row["_id"]: row["total"]
        for row in db.expenses.aggregate([
            {"$match": match},
            {"$group": {"_id": {"$dayOfMonth": "$date"}, "total": {"$sum": "$amount"}}},
        ])
    }

    total = sum(row["total"] for row in by_category)
    count = db.expenses.count_documents(match)

    # How many days of this month have passed (a past month counts as fully passed)
    today = datetime.now(timezone.utc)
    is_current = (today.year, today.month) == (year, mon)
    days_passed = today.day if is_current else days_in_month
    days_left = days_in_month - days_passed if is_current else 0
    daily_average = round(total / max(days_passed, 1), 2)
    projected = round(daily_average * days_in_month) if is_current else total

    budget_doc = db.budgets.find_one({"user": user_id, "month": month})
    budget = budget_doc["amount"] if budget_doc else 0

    if budget == 0:
        status = "no_budget"
    elif total > budget:
        status = "over_budget"
    elif projected > budget:
        status = "over_pace"
    else:
        status = "on_track"

    previous_total = _month_total(db, user_id, previous_month(month))
    change = round((total - previous_total) / previous_total * 100, 1) if previous_total > 0 else None

    categories = [
        CategoryTotal(category=row["_id"], total=row["total"], share=round(row["total"] / total * 100))
        for row in by_category
    ]
    top = categories[0] if categories else None

    biggest_doc = db.expenses.find_one(match, sort=[("amount", -1)])
    biggest = (
        BiggestExpense(
            title=biggest_doc["title"],
            amount=biggest_doc["amount"],
            category=biggest_doc["category"],
            date=biggest_doc["date"].strftime("%Y-%m-%d"),
        )
        if biggest_doc
        else None
    )

    return Insights(
        month=month,
        total=total,
        count=count,
        daily_average=daily_average,
        projected_total=projected,
        days_left=days_left,
        budget=budget,
        budget_status=status,
        previous_total=previous_total,
        change_percent=change,
        top_category=top,
        biggest_expense=biggest,
        by_category=categories,
        by_payment_method=[PaymentTotal(method=r["_id"], total=r["total"], count=r["count"]) for r in by_payment],
        daily=[DailyTotal(day=d, total=by_day.get(d, 0)) for d in range(1, days_passed + 1)],
        tips=_tips(total=total, budget=budget, status=status, projected=projected,
                   days_left=days_left, top=top, change=change),
    )


def _safe_cell(value) -> str:
    """Stops spreadsheet formulas: a cell starting with = + - @ gets a ' in front."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@") else text


def expenses_csv(db, user_id, month: str) -> str:
    import csv
    import io

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Date", "Title", "Category", "Payment method", "Amount", "Note"])
    for doc in db.expenses.find(_match(user_id, month)).sort([("date", 1), ("createdAt", 1)]):
        writer.writerow([
            doc["date"].strftime("%Y-%m-%d"),
            _safe_cell(doc.get("title")),
            doc.get("category", ""),
            doc.get("paymentMethod", ""),
            doc.get("amount", 0),
            _safe_cell(doc.get("note")),
        ])
    return out.getvalue()
