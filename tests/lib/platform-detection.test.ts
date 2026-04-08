import { describe, it, expect } from "vitest";
import { detectPlatforms } from "@/lib/platform-detection";

describe("detectPlatforms", () => {
  describe("Google Ads", () => {
    it("detects googleads domain", () => {
      const result = detectPlatforms({ endpoint: "https://googleads.googleapis.com/v14/customers" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("google_ads");
    });

    it("detects customer_id field", () => {
      const result = detectPlatforms({ customer_id: "1234567890" });
      expect(result.some(d => d.name === "google_ads")).toBe(true);
    });

    it("detects adwords keyword", () => {
      const result = detectPlatforms({ source: "adwords_campaign" });
      expect(result.some(d => d.name === "google_ads")).toBe(true);
    });

    it("returns suggested skills", () => {
      const result = detectPlatforms({ endpoint: "googleads.googleapis.com" });
      expect(result[0].suggestedSkills).toContain("google-ads-campaign-management");
      expect(result[0].suggestedSkills).toContain("google-ads-reporting");
    });

    it("returns high confidence", () => {
      const result = detectPlatforms({ endpoint: "googleads.googleapis.com" });
      expect(result[0].confidence).toBe("high");
    });
  });

  describe("Meta Ads", () => {
    it("detects facebook.com/ads URL", () => {
      const result = detectPlatforms({ url: "https://facebook.com/ads/manager" });
      expect(result.some(d => d.name === "meta_ads")).toBe(true);
    });

    it("detects graph.facebook.com", () => {
      const result = detectPlatforms({ api: "graph.facebook.com/v18.0/adaccount" });
      expect(result.some(d => d.name === "meta_ads")).toBe(true);
    });

    it("detects meta ads pattern", () => {
      const result = detectPlatforms({ platform: "meta_ads_api" });
      expect(result.some(d => d.name === "meta_ads")).toBe(true);
    });
  });

  describe("TikTok Ads", () => {
    it("detects ads.tiktok.com", () => {
      const result = detectPlatforms({ endpoint: "https://ads.tiktok.com/open_api" });
      expect(result.some(d => d.name === "tiktok_ads")).toBe(true);
    });

    it("detects advertiser_id field", () => {
      const result = detectPlatforms({ advertiser_id: "7890" });
      expect(result.some(d => d.name === "tiktok_ads")).toBe(true);
    });
  });

  describe("LinkedIn Ads", () => {
    it("detects api.linkedin.com ad endpoint", () => {
      const result = detectPlatforms({ url: "https://api.linkedin.com/rest/adAccounts" });
      expect(result.some(d => d.name === "linkedin_ads")).toBe(true);
    });

    it("detects linkedin_campaign field", () => {
      const result = detectPlatforms({ linkedin_campaign: "123" });
      expect(result.some(d => d.name === "linkedin_ads")).toBe(true);
    });
  });

  describe("multiple platforms", () => {
    it("detects multiple platforms in the same payload", () => {
      const result = detectPlatforms({
        google_endpoint: "googleads.googleapis.com",
        facebook_endpoint: "graph.facebook.com/ads",
      });
      const names = result.map(d => d.name);
      expect(names).toContain("google_ads");
      expect(names).toContain("meta_ads");
    });

    it("does not duplicate detections for the same platform", () => {
      const result = detectPlatforms({
        a: "googleads.googleapis.com",
        b: "adwords campaign",
      });
      const googleDetections = result.filter(d => d.name === "google_ads");
      expect(googleDetections).toHaveLength(1);
    });
  });

  describe("no match", () => {
    it("returns empty array for unrelated data", () => {
      const result = detectPlatforms({ fruit: "banana", count: 42 });
      expect(result).toHaveLength(0);
    });

    it("returns empty array for empty object", () => {
      expect(detectPlatforms({})).toHaveLength(0);
    });

    it("handles null safely", () => {
      expect(detectPlatforms(null)).toHaveLength(0);
    });
  });
});
