const rateLimit = require("express-rate-limit");

// Generous enough for a single personal user tapping the AI button
// repeatedly, but enough to block abuse if the backend URL ever leaks.
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Please try again in a moment." },
});

module.exports = { aiRateLimiter };
