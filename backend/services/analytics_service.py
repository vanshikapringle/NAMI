import logging
from typing import Optional
from models.schemas import AnalyticsStatsResponseSchema, HeatmapResponseSchema, HeatmapPointSchema
from analytics.statistics import StatisticsCalculator
from analytics.heatmap import HeatmapGenerator
from analytics.insights import InsightsEngine

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service orchestrating statistical aggregations, geographic heatmap point calculations,
    and AI travel trend insights.
    """
    @staticmethod
    def get_user_statistics(user_id: Optional[str] = None) -> AnalyticsStatsResponseSchema:
        """Fetch comprehensive statistical summary and AI insights for travel archives."""
        logger.info(f"Orchestrating travel analytics dashboard for user: {user_id or 'All'}")
        stats = StatisticsCalculator.calculate_summary(user_id)
        insights = InsightsEngine.generate_insights(user_id)
        
        return AnalyticsStatsResponseSchema(
            total_memories=stats["total_memories"],
            countries_visited=stats["countries_visited"],
            cities_visited=stats["cities_visited"],
            top_categories=stats["top_categories"],
            insights=insights
        )

    @staticmethod
    def get_heatmap_data(user_id: Optional[str] = None) -> HeatmapResponseSchema:
        """Fetch coordinate points for geographical heatmap rendering."""
        logger.info(f"Orchestrating heatmap coordinate generation for user: {user_id or 'All'}")
        raw_points = HeatmapGenerator.generate_heatmap_points(user_id)
        points = [HeatmapPointSchema(**p) for p in raw_points]
        return HeatmapResponseSchema(points=points)
