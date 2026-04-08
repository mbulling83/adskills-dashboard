export const PLATFORM_PATTERNS = {
  google_ads: {
    patterns: [
      /googleads/i,
      /adwords/i,
      /google\.apis\.com\/ads/i,
      /googleads\.googleapis\.com/i,
      /customer_id/i,
      /campaign_id/i,
      /ad_group_id/i,
    ],
    skills: [
      "google-ads-campaign-management",
      "google-ads-reporting",
      "google-ads-bidding",
    ],
    confidence: "high" as const,
  },
  meta_ads: {
    patterns: [
      /facebook\.com\/ads/i,
      /graph\.facebook\.com/i,
      /meta.*ads/i,
      /facebook.*marketing/i,
      /adaccount/i,
    ],
    skills: [
      "meta-ads-campaign-management",
      "meta-ads-creative",
      "meta-ads-audience-insights",
    ],
    confidence: "high" as const,
  },
  tiktok_ads: {
    patterns: [
      /tiktok.*ads/i,
      /ads\.tiktok\.com/i,
      /advertiser_id/i,
      /tiktok_campaign/i,
    ],
    skills: [
      "tiktok-ads-campaign-management",
      "tiktok-ads-creative",
      "tiktok-ads-targeting",
    ],
    confidence: "high" as const,
  },
  linkedin_ads: {
    patterns: [
      /linkedin.*ads/i,
      /api\.linkedin\.com.*ad/i,
      /linkedin_campaign/i,
    ],
    skills: [
      "linkedin-ads-campaign-management",
      "linkedin-ads-audience-network",
    ],
    confidence: "high" as const,
  },
} as const;

export type PlatformName = keyof typeof PLATFORM_PATTERNS;

export interface DetectedPlatform {
  name: PlatformName;
  confidence: "high" | "medium" | "low";
  suggestedSkills: string[];
  matchedPattern: string;
}

export function detectPlatforms(eventData: unknown): DetectedPlatform[] {
  const text = JSON.stringify(eventData);
  const detections: DetectedPlatform[] = [];

  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS) as [
    PlatformName,
    (typeof PLATFORM_PATTERNS)[PlatformName],
  ][]) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        detections.push({
          name: platform,
          confidence: config.confidence,
          suggestedSkills: [...config.skills],
          matchedPattern: pattern.toString(),
        });
        break; // one detection per platform
      }
    }
  }

  return detections;
}
