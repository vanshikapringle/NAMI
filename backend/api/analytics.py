import logging
from typing import Optional
from fastapi import APIRouter, Query
from models.schemas import AnalyticsStatsResponseSchema, HeatmapResponseSchema
from models.responses import APIResponse
from services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/analytics", tags=["Travel Analytics & Insights"])

@router.get("/stats", response_model=APIResponse[AnalyticsStatsResponseSchema])
async def get_analytics_stats(user_id: Optional[str] = Query(None, description="User identifier filter")) -> APIResponse[AnalyticsStatsResponseSchema]:
    """Retrieve statistical aggregations, category breakdowns, and AI travel insights."""
    logger.info(f"API route /v1/analytics/stats invoked for user: {user_id}")
    stats = AnalyticsService.get_user_statistics(user_id)
    return APIResponse(success=True, message="Analytics statistics computed successfully.", data=stats)

@router.get("/heatmap", response_model=APIResponse[HeatmapResponseSchema])
async def get_heatmap_data(user_id: Optional[str] = Query(None, description="User identifier filter")) -> APIResponse[HeatmapResponseSchema]:
    """Retrieve spatial latitude/longitude coordinate clusters for rendering map heatmaps."""
    logger.info(f"API route /v1/analytics/heatmap invoked for user: {user_id}")
    heatmap = AnalyticsService.get_heatmap_data(user_id)
    return APIResponse(success=True, message="Heatmap coordinates fetched successfully.", data=heatmap)
