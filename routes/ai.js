const express = require("express");
const { aiService } = require("../services/aiService");
const { validateAiRequest } = require("../middleware/validateAiRequest");
const { aiRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/ai", aiRateLimiter, validateAiRequest, async (req, res) => {
  const { text, action, language } = req.body;

  try {
    const result = await aiService.process({ text, action, language });

    if (!result) {
      return res.status(502).json({ success: false, error: "AI returned an empty response. Please try again." });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    // Never leak the raw error (which could include SDK internals) to the client.
    // Log a short, text-free line for debugging.
    console.error("AI request failed:", err?.status || err?.code || err?.message || "unknown error");

    if (err?.status === 401 || err?.status === 403) {
      return res.status(500).json({ success: false, error: "AI is temporarily unavailable. Please try again." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ success: false, error: "AI is busy right now. Please try again in a moment." });
    }
    if (err?.code === "ETIMEDOUT" || err?.type === "request-timeout") {
      return res.status(504).json({ success: false, error: "Taking longer than expected. Try again." });
    }

    return res.status(500).json({ success: false, error: "AI is temporarily unavailable. Please try again." });
  }
});

module.exports = router;
