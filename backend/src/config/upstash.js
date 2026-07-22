import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Redis client - used for storing OTPs with auto-expiry
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter - used to limit OTP send requests
// Allows 3 requests per phone number per 10 minutes
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "600 s"),
});