const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Make uploads folder static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/videos", require("./routes/videoRoutes"));
app.use("/api/interactions", require("./routes/interactionRoutes"));
//app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
