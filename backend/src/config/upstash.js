import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Redis client - used for storing login sessions and OTPs
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://ample-reindeer-116200.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "gQAAAAAAAcXoAAIgcDFjZGViNmNiNmI1ZDU0NTgwOGVmZTE5YWE2OTQxZDFiZA",
});

// Rate limiter - used to limit OTP send requests
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "600 s"),
});