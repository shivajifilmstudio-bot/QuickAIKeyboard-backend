const OpenAI = require("openai");
const { AIProvider } = require("./aiProvider");

// ============================================================
// QuickAI / VAANI - Message AI Instructions
// ============================================================

const ACTION_INSTRUCTIONS = {
  AIReply:
    "You are writing the exact message the user will send to another person in a real chat. " +
    "Understand the incoming message completely before writing anything. " +
    "Identify the actual situation, intent, emotion, relationship, request, question, complaint, and important details. " +
    "Then write a natural reply that directly responds to that situation. " +
    "The reply must sound like a real human who knows the conversation, not like an AI assistant or customer-support bot. " +
    "Do not merely acknowledge the message. Actually respond to what the person is saying. " +
    "If the person is complaining, take the complaint seriously and respond appropriately. " +
    "If they are asking for something, address that request directly. " +
    "If they ask a question, answer it naturally. " +
    "If they are casual, be casual. If they are emotional, be appropriately warm. If they are serious, stay serious. " +
    "Do not repeat, quote, paraphrase, summarize, translate, or restate the incoming message. " +
    "Never begin the reply by repeating the sender's words or first sentence. " +
    "Never copy the opening line or substantial phrases from the incoming message. " +
    "Do not use generic AI openings such as 'Bilkul', 'Aapki concern valid hai', 'Aapki concern noted hai', 'I understand your concern', 'I completely understand', or 'Samajh sakta hoon aapki baat' unless they are genuinely necessary and natural. " +
    "Do not use customer-support language such as 'your concern has been noted', 'we will look into this', or similar corporate wording. " +
    "Do not invent facts, names, events, actions, promises, guarantees, or personal commitments that the incoming message does not support. " +
    "Do not claim that the user personally did something unless that is clear from the conversation. " +
    "Do not make promises such as personally checking, assigning someone, calling someone, or ensuring something unless the incoming message clearly gives that context. " +
    "Do not add unnecessary jokes, laughter, emojis, questions, explanations, or advice. " +
    "Use natural WhatsApp-style language. " +
    "Keep the response concise but complete enough to properly answer the message. " +
    "Output ONLY the final message that the user can copy and send.",

  Friendly:
    "Write a warm, natural, casual and friendly reply suitable for WhatsApp. " +
    "Make it feel like a real person is replying to a friend or familiar person. " +
    "Do not sound robotic, formal, repetitive, or overly enthusiastic.",

  Funny:
    "Write a naturally funny, playful WhatsApp-style reply that fits the context of the message. " +
    "The humor must feel spontaneous and conversational, not like a joke generated from a template. " +
    "Use suitable emojis only when they naturally fit the message. " +
    "Do not force humor when the incoming message is serious, sensitive, sad, or inappropriate for joking.",

  Love:
    "Write a natural romantic, caring, sweet and emotionally warm reply suitable for a close romantic relationship. " +
    "Match the emotional intensity of the incoming message and do not become unnecessarily dramatic or cheesy. " +
    "Use suitable romantic or affectionate emojis only when they naturally fit the context.",

  Professional:
    "Write a clean, respectful, polished and professional reply suitable for work or formal communication. " +
    "Keep it natural and human rather than overly corporate or robotic.",

  Translate:
    "Translate the user's text into the selected target language. " +
    "Preserve the exact meaning, intent, tone and important details. " +
    "Use natural phrasing used by native speakers rather than word-for-word translation.",

  Improve:
    "Improve the clarity and quality of the text while keeping its original meaning and tone.",

  Rewrite:
    "Rewrite the text naturally without changing its intended meaning.",

  Grammar:
    "Correct grammar and spelling mistakes while preserving the original meaning.",

  Shorten:
    "Make the text shorter and more concise while preserving its meaning."
};

// ============================================================
// Language guidance
// ============================================================

const LANGUAGE_NOTES = {
  Auto:
    "Automatically detect the language and writing script of the incoming message. " +
    "For AIReply, Friendly, Funny, Love and Professional, respond in the SAME language and SAME writing style as the incoming message. " +
    "If Hindi is written using English/Roman letters, reply in natural Roman Hindi/Hinglish using English letters. " +
    "If Hindi is written in Devanagari, reply in natural Devanagari Hindi. " +
    "If English is used, reply in natural everyday English. " +
    "If another supported language is used, reply in that same language and script. " +
    "If the message naturally mixes Hindi and English, preserve that natural mixed style. " +
    "Never convert Roman Hindi into English unless translation is explicitly requested.",

  English:
    "Use natural, everyday English.",

  Hindi:
    "Write in natural, fluent everyday Hindi using Devanagari script. " +
    "Use correct Hindi grammar, natural sentence structure, gender and verb agreement, tense, punctuation, and common Indian Hindi phrasing.",

  Hinglish:
    "Use natural conversational Indian Hinglish written in Latin/English letters."
};

class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();

    if (!apiKey) {
      throw new Error(
        "OpenAI API key is missing. Set OPENAI_API_KEY in your environment."
      );
    }

    this.client = new OpenAI({ apiKey });
  }

  // ==========================================================
  // AIReply quality checker
  // ==========================================================

  isBadAIReply(inputText, outputText) {
    if (!inputText || !outputText) {
      return true;
    }

    const normalize = (value) =>
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

    const input = normalize(inputText);
    const output = normalize(outputText);

    // --------------------------------------------------------
    // 1. Generic AI / customer-support openings
    // --------------------------------------------------------

    const badOpenings = [
      "bilkul aapki concern",
      "aapki concern valid hai",
      "aapki concern noted hai",
      "aapki baat bilkul",
      "i understand your concern",
      "i completely understand",
      "i understand your point",
      "your concern has been noted",
      "your concern is valid",
      "samajh sakta hoon aapki baat",
      "samajh sakta hoon aapki pareshani",
      "samajh sakta hoon aapki concern",
      "how can i help",
      "what do you think"
    ];

    if (
      badOpenings.some((phrase) =>
        output.startsWith(phrase)
      )
    ) {
      return true;
    }

    // --------------------------------------------------------
    // 2. Detect copied opening from incoming message
    // --------------------------------------------------------

    const inputWords = input.split(" ");
    const outputWords = output.split(" ");

    const compareCount = Math.min(10, inputWords.length);

    let sameOpeningWords = 0;

    for (let i = 0; i < compareCount; i++) {
      if (outputWords[i] === inputWords[i]) {
        sameOpeningWords++;
      } else {
        break;
      }
    }

    if (
      compareCount >= 6 &&
      sameOpeningWords >= 6
    ) {
      return true;
    }

    // --------------------------------------------------------
    // 3. Detect substantial phrase copied from input
    // --------------------------------------------------------

    const firstInputWords = inputWords
      .slice(0, 12)
      .join(" ");

    if (
      firstInputWords.length >= 45 &&
      output.includes(firstInputWords)
    ) {
      return true;
    }

    // --------------------------------------------------------
    // 4. Very short generic response
    // --------------------------------------------------------

    const genericShortReplies = [
      "okay",
      "ok",
      "noted",
      "understood",
      "bilkul",
      "samajh gaya",
      "samajh gayi",
      "sure",
      "no worries"
    ];

    if (
      genericShortReplies.includes(output)
    ) {
      return true;
    }

    return false;
  }

  async generate({ text, action, language }) {
    const instruction =
      ACTION_INSTRUCTIONS[action] ||
      ACTION_INSTRUCTIONS.Improve;

    const languageNote =
      LANGUAGE_NOTES[language] || "";

    const isReplyAction = [
      "AIReply",
      "Friendly",
      "Funny",
      "Love",
      "Professional"
    ].includes(action);

    const isTranslateAction =
      action === "Translate";

    let languageInstruction = "";

    if (isReplyAction && language === "Auto") {
  languageInstruction =
    "Detect the PRIMARY language and writing script of the entire incoming message before writing the reply. " +
    "The final reply MUST use the same primary language and the same writing script consistently from beginning to end. " +
    "Do not partially translate, transliterate, or convert only some sentences or phrases. " +
    "If the incoming message is Hindi written in Roman/English letters, write the ENTIRE reply in natural Roman Hindi/Hinglish using Latin letters. " +
    "If the incoming message is Hindi written in Devanagari, write the ENTIRE reply in natural Devanagari Hindi. " +
    "If the incoming message is English, write the ENTIRE reply in natural English. " +
    "If the incoming message uses another supported language, write the ENTIRE reply in that language and its normal script. " +
    "Do not switch languages or scripts in the middle of the reply unless the incoming message itself clearly and intentionally mixes languages. " +
    "Natural names, brand names, URLs, and commonly used technical terms may remain unchanged.";
} else if (isTranslateAction) {
      languageInstruction =
        `The target language is "${language}". Translate into that target language.`;
    } else {
      languageInstruction =
        `Write the output in "${language}".`;
    }

    const systemPrompt =
      "You are a highly natural conversational AI assistant embedded inside a mobile keyboard. " +
      "Your output will be pasted directly into WhatsApp or another chat application. " +
      "Think about the situation before responding, but output only the final message. " +
      "Never explain your reasoning. " +
      "Never add labels such as Reply, Answer, Response, or Translation. " +
      "Never put the final response inside quotation marks. " +
      "CRITICAL: For Translate, output ONLY the selected target language from beginning to end. " +
"Never leave sentences, phrases, or portions of the source language untranslated. " +
      instruction +
      " " +
      languageInstruction +
      " " +
      languageNote;

    // ========================================================
    // First generation
    // ========================================================

    const completion =
      await this.client.chat.completions.create({
        model: "gpt-5.6-terra",
        max_completion_tokens: 400,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ]
      });

    let result =
      completion.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("EMPTY_RESPONSE");
    }

    // ========================================================
    // AIReply second attempt if first answer is bad
    // ========================================================

    if (
      action === "AIReply" &&
      this.isBadAIReply(text, result)
    ) {
      const retrySystemPrompt =
        systemPrompt +
        " " +
        "IMPORTANT RETRY: The previous answer was rejected because it sounded generic or repeated the incoming message. " +
        "Start the reply directly with the natural response. " +
        "Do not repeat or paraphrase the sender's opening sentence. " +
        "Do not use customer-support language. " +
        "Do not say that the concern has been noted or is valid. " +
        "Do not invent promises or actions. " +
        "Do not say what you will personally do unless the incoming message explicitly establishes that you can do it. " +
        "Address the actual situation naturally. " +
        "Write the message exactly as a real person would send it on WhatsApp. " +
        "Output ONLY the final message.";

      const retryCompletion =
        await this.client.chat.completions.create({
          model: "gpt-5.6-terra",
          max_completion_tokens: 400,
          messages: [
            {
              role: "system",
              content: retrySystemPrompt
            },
            {
              role: "user",
              content: text
            }
          ]
        });

      const retryResult =
        retryCompletion.choices?.[0]?.message?.content?.trim();

      if (
        retryResult &&
        !this.isBadAIReply(text, retryResult)
      ) {
        result = retryResult;
      }
    }

    return result;
  }
}

module.exports = { OpenAIProvider };