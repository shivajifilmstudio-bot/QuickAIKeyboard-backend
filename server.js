require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const aiRoutes = require("./routes/ai");

const app = express();

// Fail fast and clearly if the key is missing, rather than starting a
// server that will error on every request.
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable. Set it in your .env file (see .env.example) or your hosting platform's environment variable settings.");
  process.exit(1);
}

app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*").split(",").map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);

// Keyboard messages are short — no need to accept large bodies.
app.use(express.json({ limit: "20kb" }));

// Simple, unauthenticated health check — useful for confirming the
// deployment is live and for host platform "is it up" checks.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", aiRoutes);

// 404 for anything else
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found." });
});

// Final safety net — never leak stack traces to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err?.message || err);
  res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QuickAI Keyboard backend listening on port ${PORT}`);
});
