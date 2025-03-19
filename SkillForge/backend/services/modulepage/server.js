const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("sessionInteractions", {});

mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

const uploadsPath = path.join(__dirname, "uploads");
const pdfsPath = path.join(__dirname, "uploads/pdfs");
console.log("Uploads path:", uploadsPath);
console.log("PDFs path:", pdfsPath);

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads directory");
}
if (!fs.existsSync(pdfsPath)) {
  fs.mkdirSync(pdfsPath, { recursive: true });
  console.log("Created uploads/pdfs directory");
}

app.use("/uploads", express.static(uploadsPath));
app.use("/uploads/pdfs", express.static(pdfsPath));

// Add logging for static file requests
app.use((req, res, next) => {
  console.log("Request path:", req.path);
  next();
});

// Routes
app.use("/api/videos", require("./routes/videoRoutes"));
app.use("/api/interactions", require("./routes/interactionRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));

// Add the new recommendations routes
app.use("/api/recommendations", require("./routes/recommendationRoutes"));

// Custom middleware to update session interactions from video interactions
app.use("/api/videos/interaction", (req, res, next) => {
  const { videoId, userId, interactionType, position, timestamp } = req.body;

  // Check if we have required fields
  if (!videoId || !userId || !interactionType) {
    return next(); // Continue to regular handler
  }

  // Store interaction in app-level session data
  const sessionInteractions = app.get("sessionInteractions") || {};

  if (!sessionInteractions[videoId]) {
    sessionInteractions[videoId] = {};
  }
  if (!sessionInteractions[videoId][userId]) {
    sessionInteractions[videoId][userId] = [];
  }

  sessionInteractions[videoId][userId].push({
    ...req.body,
    timestamp: timestamp || new Date().toISOString(),
  });

  app.set("sessionInteractions", sessionInteractions);

  next();
});

app.get("/list-pdfs", (req, res) => {
  try {
    if (!fs.existsSync(pdfsPath)) {
      return res.json({
        error: "PDFs directory doesn't exist",
        directory: pdfsPath,
      });
    }
    const files = fs.readdirSync(pdfsPath);

    res.json({
      count: pdfs.length,
      directory: pdfsPath,
      pdfs: pdfs,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

app.get("/api-routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
      });
    } else if (middleware.name === "router") {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          routes.push({
            path: middleware.regexp.toString().includes("/api/resources")
              ? "/api/resources" + path
              : path,
            method,
          });
        }
      });
    }
  });

  res.json(routes);
});

const cleanupOldInteractions = () => {
  const sessionInteractions = app.get("sessionInteractions") || {};
  const cutoffTime = Date.now() - 30 * 60 * 1000;

  for (const videoId in sessionInteractions) {
    for (const userId in sessionInteractions[videoId]) {
      sessionInteractions[videoId][userId] = sessionInteractions[videoId][
        userId
      ].filter(
        (interaction) => new Date(interaction.timestamp).getTime() > cutoffTime
      );

      if (sessionInteractions[videoId][userId].length === 0) {
        delete sessionInteractions[videoId][userId];
      }
    }

    if (Object.keys(sessionInteractions[videoId]).length === 0) {
      delete sessionInteractions[videoId];
    }
  }

  app.set("sessionInteractions", sessionInteractions);
  console.log("Cleaned up old interactions");
};

// Run cleanup every 5 minutes
setInterval(cleanupOldInteractions, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
