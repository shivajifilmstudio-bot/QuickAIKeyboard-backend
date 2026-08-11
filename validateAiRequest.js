const { AIService } = require("../services/aiService");

const MAX_TEXT_LENGTH = 2000; // characters — generous for a chat message

function validateAiRequest(req, res, next) {
  const { text, action, language } = req.body || {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ success: false, error: "Type something first." });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res
      .status(400)
      .json({ success: false, error: `Text is too long (max ${MAX_TEXT_LENGTH} characters).` });
  }

  if (typeof action !== "string" || !AIService.isValidAction(action)) {
    return res.status(400).json({ success: false, error: "Unsupported action." });
  }

  if (typeof language !== "string" || !AIService.isValidLanguage(language)) {
    return res.status(400).json({ success: false, error: "Unsupported language." });
  }

  next();
}

module.exports = { validateAiRequest, MAX_TEXT_LENGTH };
