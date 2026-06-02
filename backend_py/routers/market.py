import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from requests import RequestException
from services.ai_service import generate_ai_insights
from services.market_analysis_service import market_analysis_service

router = APIRouter()

DATA_PATH = Path(__file__).resolve().parent.parent / "bds_tool" / "average.json"


def load_average_data() -> List[Dict[str, Any]]:
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("result", [])
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Không tìm thấy file dữ liệu average.json")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Dữ liệu average.json không hợp lệ")


@router.get("/average-prices")
def get_average_prices(province: Optional[str] = None):
    records = load_average_data()
    if province:
        province_lower = province.lower()
        filtered = [record for record in records if record.get("province", "").lower() == province_lower]
        if not filtered:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dữ liệu cho tỉnh/thành '{province}'")
        return {"success": True, "result": filtered}
    return {"success": True, "result": records}


@router.get("/average-prices/summary")
def get_average_price_summary():
    records = load_average_data()
    if not records:
        return {"success": True, "summary": {}}

    provinces = {}
    for record in records:
        province = record.get("province", "")
        provinces.setdefault(province, []).append(record.get("avg_price_per_m2", 0))

    summary = {
        province: {
            "average_price_per_m2": sum(values) / len(values) if values else 0,
            "zones": len(values),
        }
        for province, values in provinces.items()
    }
    return {"success": True, "summary": summary}


@router.get("/ai-insights")
def get_ai_insights(province: Optional[str] = None):
    records = load_average_data()
    if province:
        province_lower = province.lower()
        records = [record for record in records if record.get("province", "").lower() == province_lower]
        if not records:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dữ liệu cho tỉnh/thành '{province}'")

    try:
        insights = generate_ai_insights(records)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Lỗi khi gọi OpenRouter API: {exc}")

    return {"success": True, "insights": insights}


@router.get("/trends")
def get_trends(
    district: Optional[str] = None,
    city: str = "TP.HCM",
    property_type: Optional[str] = None,
    period: str = "monthly"
):
    """Get price trends over time"""
    return market_analysis_service.get_price_trends(
        district=district,
        city=city,
        property_type=property_type,
        period=period
    )


@router.get("/districts")
def get_districts(city: str = "TP.HCM"):
    """Get statistics by district"""
    return market_analysis_service.get_district_stats(city=city)


@router.get("/forecast")
def get_forecast(district: Optional[str] = None, city: str = "TP.HCM"):
    """Get price forecast"""
    trends = market_analysis_service.get_price_trends(district=district, city=city)
    return {
        "forecast": trends.get("forecast", {}),
        "current_avg": trends.get("current_avg_price", 0),
        "trend": trends.get("trend_direction", "stable")
    }
