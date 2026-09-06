import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics to measure caching effectiveness
export const cacheHitRate = new Rate("cache_hit_rate");
export const videoFeedDuration = new Trend("video_feed_duration_ms");

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // Warm-up to 10 VUs
    { duration: "1m",  target: 50 },  // Ramp to 50 VUs (moderate load)
    { duration: "1m",  target: 100 }, // Peak load at 100 VUs (testing cache & ECS scale)
    { duration: "30s", target: 0 },   // Graceful ramp-down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],            // Error rate below 1%
    http_req_duration: ["p(95)<350"],          // 95% of requests below 350ms
    video_feed_duration_ms: ["p(95)<200"],     // Cached feeds should respond fast
    cache_hit_rate: ["rate>0.70"],             // Expect >70% cache hits under read load
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:8000";

export default function () {
  // 1. Healthcheck Probe (simulating ALB target healthcheck)
  const healthRes = http.get(`${BASE_URL}/api/v1/healthcheck`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
  });

  // 2. Paginated Video Feed (Cache-Aside Test)
  const feedRes = http.get(`${BASE_URL}/api/v1/videos?page=1&limit=24`);
  const isCacheHit = feedRes.headers["X-Cache"] === "HIT";
  cacheHitRate.add(isCacheHit ? 1 : 0);
  videoFeedDuration.add(feedRes.timings.duration);

  check(feedRes, {
    "feed status is 200": (r) => r.status === 200,
    "feed has valid json": (r) => {
      try {
        return JSON.parse(r.body).statusCode === 200;
      } catch {
        return false;
      }
    },
  });

  // 3. Search Query Request
  const searchRes = http.get(`${BASE_URL}/api/v1/videos?query=Architecture`);
  check(searchRes, {
    "search status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
