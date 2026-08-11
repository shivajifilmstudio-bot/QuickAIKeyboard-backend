/**
 * AIProvider is a small interface: anything that implements
 * `generate({ text, action, language })` and resolves to a plain string
 * can be swapped in here later (e.g. a different model or vendor) without
 * changing routes/ai.js or the iOS app at all.
 */
class AIProvider {
  // eslint-disable-next-line no-unused-vars
  async generate({ text, action, language }) {
    throw new Error("Not implemented");
  }
}

module.exports = { AIProvider };
