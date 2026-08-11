const requests = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

const aiRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const record = requests.get(ip);

  if (!record || now - record.start >= WINDOW_MS) {
    requests.set(ip, {
      start: now,
      count: 1
    });

    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please try again in a minute."
    });
  }

  record.count += 1;
  return next();
};

module.exports = {
  aiRateLimiter
};
