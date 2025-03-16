// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize session interactions storage for recommendation engine
app.set("sessionInteractions", {}); // Global storage for session data

// Connect to MongoDB
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

// Log directories for debugging
const uploadsPath = path.join(__dirname, "uploads");
const pdfsPath = path.join(__dirname, "uploads/pdfs");
console.log("Uploads path:", uploadsPath);
console.log("PDFs path:", pdfsPath);

// Create directories if they don't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads directory");
}
if (!fs.existsSync(pdfsPath)) {
  fs.mkdirSync(pdfsPath, { recursive: true });
  console.log("Created uploads/pdfs directory");
}

// Make uploads folder static
app.use("/uploads", express.static(uploadsPath));
app.use("/uploads/pdfs", express.static(pdfsPath));

// Add logging for static file requests
app.use((req, res, next) => {
  console.log("Request path:", req.path);
  next();
});

// Special route for serving PDFs - Adding this before regular routes
app.get("/direct-pdf/:filename", (req, res) => {
  const { filename } = req.params;
  // First try uploads/pdfs directory
  let pdfPath = path.join(__dirname, "uploads/pdfs", filename);
  if (!fs.existsSync(pdfPath)) {
    // Then try just uploads directory
    pdfPath = path.join(__dirname, "uploads", filename);
  }
  if (!fs.existsSync(pdfPath)) {
    // Finally try at the root level
    pdfPath = path.join(__dirname, filename);
  }
  console.log(`Looking for PDF at: ${pdfPath}`);
  if (fs.existsSync(pdfPath)) {
    console.log("PDF found, sending file");
    // Set correct content type header
    res.setHeader("Content-Type", "application/pdf");
    // Set filename for download
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    // Send the file
    return res.sendFile(pdfPath);
  }
  console.log("PDF not found");
  res.status(404).send("PDF not found");
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

  // Initialize if needed
  if (!sessionInteractions[videoId]) {
    sessionInteractions[videoId] = {};
  }
  if (!sessionInteractions[videoId][userId]) {
    sessionInteractions[videoId][userId] = [];
  }

  // Add the interaction
  sessionInteractions[videoId][userId].push({
    ...req.body,
    timestamp: timestamp || new Date().toISOString(),
  });

  // Update app variable
  app.set("sessionInteractions", sessionInteractions);

  // Continue with request
  next();
});

// Add a route to list all PDFs for debugging
app.get("/list-pdfs", (req, res) => {
  try {
    // Check if the pdfs directory exists
    if (!fs.existsSync(pdfsPath)) {
      return res.json({
        error: "PDFs directory doesn't exist",
        directory: pdfsPath,
      });
    }
    // Read files from the directory
    const files = fs.readdirSync(pdfsPath);
    // Get details for each file
    const pdfs = files.map((file) => {
      const fullPath = path.join(pdfsPath, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        url: `/uploads/pdfs/${file}`,
        directUrl: `/direct-pdf/${file}`,
        size: stats.size,
        created: stats.birthtime,
      };
    });
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

// Add this after all your routes are registered
app.get("/api-routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
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

// Session cleanup function to remove old interactions
const cleanupOldInteractions = () => {
  const sessionInteractions = app.get("sessionInteractions") || {};
  // Keep only interactions from the last 30 minutes
  const cutoffTime = Date.now() - 30 * 60 * 1000;

  for (const videoId in sessionInteractions) {
    for (const userId in sessionInteractions[videoId]) {
      // Filter out old interactions
      sessionInteractions[videoId][userId] = sessionInteractions[videoId][
        userId
      ].filter(
        (interaction) => new Date(interaction.timestamp).getTime() > cutoffTime
      );

      // Remove empty user arrays
      if (sessionInteractions[videoId][userId].length === 0) {
        delete sessionInteractions[videoId][userId];
      }
    }

    // Remove empty video objects
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
  console.log(
    `- Access a PDF at: http://localhost:${PORT}/direct-pdf/pdf-1742027762887.pdf`
  );
  console.log(`- View all PDFs at: http://localhost:${PORT}/list-pdfs`);
});
