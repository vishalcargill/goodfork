export const RECOMMENDATION_DATA_SOURCES = ["backend", "supabase"] as const;

export type RecommendationDataSource = (typeof RECOMMENDATION_DATA_SOURCES)[number];

export const DEFAULT_RECOMMENDATION_DATA_SOURCE: RecommendationDataSource = "backend";

export function normalizeRecommendationSource(value?: string | null): RecommendationDataSource {
  return RECOMMENDATION_DATA_SOURCES.includes(value as RecommendationDataSource)
    ? (value as RecommendationDataSource)
    : DEFAULT_RECOMMENDATION_DATA_SOURCE;
}
