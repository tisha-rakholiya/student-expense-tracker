from pydantic import BaseModel


class CategoryTotal(BaseModel):
    category: str
    total: float
    share: int  # percent of the month's spending


class PaymentTotal(BaseModel):
    method: str
    total: float
    count: int


class DailyTotal(BaseModel):
    day: int
    total: float


class BiggestExpense(BaseModel):
    title: str
    amount: float
    category: str
    date: str


class Insights(BaseModel):
    month: str
    total: float
    count: int
    daily_average: float
    projected_total: float  # expected spending by the end of the month
    days_left: int
    budget: float
    budget_status: str  # no_budget | on_track | over_pace | over_budget
    previous_total: float
    change_percent: float | None  # compared with the previous month
    top_category: CategoryTotal | None
    biggest_expense: BiggestExpense | None
    by_category: list[CategoryTotal]
    by_payment_method: list[PaymentTotal]
    daily: list[DailyTotal]
    tips: list[str]
