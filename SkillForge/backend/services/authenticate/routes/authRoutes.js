//SkillForge\backend\services\authenticate\routes\authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../authMiddleware");
const { authenticateToken } = require("../authMiddleware");
const updateLastActive = require("../updateLastActive");



router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/users", authMiddleware.authenticateToken, authController.getAllUsers);
router.get("/users/:id", authController.getUserById);
router.put("/users/:id", authController.updateUser);
router.delete("/users/:id", authController.deleteUser);



// Active users route – note the chain: first token verification, then update lastActive, then controller.
router.get('/activeUsers', authenticateToken, updateLastActive, authController.getActiveUsers);

module.exports = router;
