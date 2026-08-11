const OpenAI = require("openai");
const { AIProvider } = require("./aiProvider");

// Maps each DefaultAIAction case (from the iOS app) to an instruction.
// {language} is substituted at request time.
const ACTION_INSTRUCTIONS = {
  AIReply:
    "Understand the user's message and write the best possible reply to it. Act as a smart personal assistant. First understand the meaning, intent, context, and emotion of the message. Then create a natural, human-sounding reply that the user can send directly to the other person. Do NOT translate, rewrite, correct, or repeat the original message. The output must be a reply to the message, not a translation of it. Match the requested language and tone. Output only the reply text.",

  Improve:
    "Improve the clarity and quality of the text while keeping the original meaning and tone. Output only in {language}.",

  Translate:
    "Translate the text into {language}, preserving meaning and natural phrasing.",

  Rewrite:
    "Rewrite the text naturally without changing its intended meaning. Output only in {language}.",

  Grammar:
    "Correct grammar and spelling mistakes while preserving the original meaning. Output only in {language}.",

  Professional:
    "Rewrite the text in a professional, polished tone suitable for work communication. Output only in {language}.",

  Friendly:
    "Rewrite the text in a warm, friendly, conversational tone. Output only in {language}.",

  Shorten:
    "Make the text shorter and more concise while preserving its meaning. Output only in {language}."
};

// Extra guidance for Hindi/Hinglish so results read naturally rather than
// like a stiff literal translation.
const LANGUAGE_NOTES = {
  English: "Use natural, everyday English.",
  Hindi: "Write in natural, grammatically correct, fluent everyday Hindi in Devanagari script. Use proper Hindi grammar, natural sentence structure, correct gender and verb agreement, correct tense, punctuation, and common Indian Hindi phrasing. Do not translate word-for-word. Preserve the exact meaning and tone of the original text. Output only the final Hindi text.",
  Hinglish:
    "Use natural, conversational Indian Hinglish — Hindi and English mixed the way people actually text, written in Latin script.",
};

class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();
    if (!apiKey) {
      throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY in your environment.");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generate({ text, action, language }) {
    const template = ACTION_INSTRUCTIONS[action] || ACTION_INSTRUCTIONS.Improve;
    const instruction = template.replace("{language}", language);
    const languageNote = LANGUAGE_NOTES[language] || LANGUAGE_NOTES.English;

    const systemPrompt =
      "You are a precise writing assistant embedded in a mobile keyboard. " +
      "You receive a short message and one instruction. Respond with ONLY the " +
      "rewritten text — no explanations, no quotation marks, no preamble. " +
      instruction +
      " " +
      languageNote;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    const result = completion.choices?.[0]?.message?.content?.trim();
    if (!result) {
      throw new Error("EMPTY_RESPONSE");
    }
    return result;
  }
}

module.exports = { OpenAIProvider };
