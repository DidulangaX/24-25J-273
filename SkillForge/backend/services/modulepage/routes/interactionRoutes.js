const express = require("express");
const router = express.Router();
const {
  recordInteraction,
  recordUserFeedback,
} = require("../controllers/userInteractionController");

router.post("/record", recordInteraction);
router.post("/feedback", recordUserFeedback);

module.exports = router;
