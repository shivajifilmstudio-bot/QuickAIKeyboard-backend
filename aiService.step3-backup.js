const { OpenAIProvider } = require("./openaiService");

// ============================================================
// QuickAI / VAANI - Valid AI Actions
// ============================================================

const VALID_ACTIONS = [
  // Main 6 features
  "AIReply",
  "Friendly",
  "Funny",
  "Love",
  "Professional",
  "Translate",

  // Existing features kept for compatibility
  "Improve",
  "Rewrite",
  "Grammar",
  "Shorten"
];

// "Auto" is used by the 5 reply modes.
// Translate will continue to receive a target language.
const VALID_LANGUAGES = [
  "Auto",
  "English",
  "Hindi",
  "Hinglish",

  // Indian languages
  "Bengali",
  "Assamese",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",

  // Thai
  "Thai"
];

class AIService {
  constructor(provider) {
    this.provider = provider;
  }

  static isValidAction(action) {
    return VALID_ACTIONS.includes(action);
  }

  static isValidLanguage(language) {
    return VALID_LANGUAGES.includes(language);
  }

  async process({ text, action, language }) {
    return this.provider.generate({
      text,
      action,
      language
    });
  }
}

// Single shared instance.
// The API key is read from the environment once when the backend starts.
const aiService = new AIService(
  new OpenAIProvider(process.env.OPENAI_API_KEY)
);

module.exports = {
  AIService,
  aiService,
  VALID_ACTIONS,
  VALID_LANGUAGES
};
