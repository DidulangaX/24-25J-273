// Enhanced UserInteraction Model with Behavioral Tracking
const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },

  // Basic interaction metrics
  pauseCount: { type: Number, default: 0 },
  skipCount: { type: Number, default: 0 },
  replayCount: { type: Number, default: 0 },
  replayDuration: { type: Number, default: 0 },
  skippedContent: { type: Number, default: 0 },

  // Enhanced tab/browser tracking
  tabSwitchCount: { type: Number, default: 0 },
  browserSwitchCount: { type: Number, default: 0 },
  totalHiddenTime: { type: Number, default: 0 },
  totalInactiveTime: { type: Number, default: 0 },
  exitAttemptCount: { type: Number, default: 0 },

  // Visibility and engagement ratios
  tabVisibilityRatio: { type: Number, default: 1.0 },
  browserVisibilityRatio: { type: Number, default: 1.0 },
  activeViewingRatio: { type: Number, default: 1.0 },
  inactivityRatio: { type: Number, default: 0.0 },

  // Enhanced behavioral feedback
  tabSwitchFeedback: [
    {
      reason: {
        type: String,
        enum: [
          "search_help",
          "distracted",
          "taking_notes",
          "checking_reference",
          "pause_break",
          "technical_issue",
          "other",
        ],
      },
      comment: { type: String, maxlength: 500 },
      position: Number,
      timestamp: { type: Date, default: Date.now },
      switchDuration: Number, // How long they were away
    },
  ],

  exitFeedback: [
    {
      reason: {
        type: String,
        enum: [
          "content_too_difficult",
          "content_too_easy",
          "technical_issues",
          "not_interested",
          "time_constraint",
          "found_better_resource",
          "completed_learning",
          "other",
        ],
      },
      comment: { type: String, maxlength: 500 },
      position: Number,
      timestamp: { type: Date, default: Date.now },
      sessionDuration: Number,
    },
  ],

  // Behavioral patterns analysis
  behavioralPatterns: {
    distractionLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    helpSeekingBehavior: {
      type: Boolean,
      default: false,
    },
    noteTakingBehavior: {
      type: Boolean,
      default: false,
    },
    focusQuality: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      default: "good",
    },
    learningStyle: {
      type: String,
      enum: ["focused", "multitasking", "break-heavy", "quick-browsing"],
    },
  },

  // Engagement quality metrics
  engagementMetrics: {
    qualityScore: { type: Number, default: 100, min: 0, max: 100 },
    attentionScore: { type: Number, default: 100, min: 0, max: 100 },
    persistenceScore: { type: Number, default: 100, min: 0, max: 100 },
    interactionIntensity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },

  // Session continuity tracking
  sessionMetrics: {
    totalSessions: { type: Number, default: 1 },
    averageSessionLength: { type: Number, default: 0 },
    longestFocusStreak: { type: Number, default: 0 }, // Longest time without tab switch
    shortestAttentionSpan: { type: Number }, // Shortest time between distractions
    preferredLearningTimes: [
      {
        dayOfWeek: Number,
        hourOfDay: Number,
        focusQuality: Number,
      },
    ],
  },

  // Contextual information
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    deviceType: { type: String, enum: ["mobile", "tablet", "desktop"] },
    browserType: String,
  },

  environmentalFactors: {
    timeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },
    dayOfWeek: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
    estimatedEnvironment: {
      type: String,
      enum: ["quiet", "moderate", "noisy", "unknown"],
      default: "unknown",
    },
  },

  // AI-generated insights
  aiInsights: {
    difficultyPrediction: { type: Boolean, default: false },
    confidenceLevel: { type: Number, default: 0.5, min: 0, max: 1 },
    learningEffectiveness: { type: String, enum: ["low", "medium", "high"] },
    recommendedInterventions: [String],
    learningPathSuggestions: [String],
    riskFactors: [String],
    strengthAreas: [String],
  },

  // User self-assessment
  userFeedback: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },
  difficultyPrediction: { type: Boolean, default: false },
  comments: { type: String, maxlength: 1000 },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for better query performance
userInteractionSchema.index({ userId: 1, videoId: 1 });
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ videoId: 1, createdAt: -1 });
userInteractionSchema.index({ "behavioralPatterns.distractionLevel": 1 });
userInteractionSchema.index({ "engagementMetrics.qualityScore": -1 });

// Pre-save middleware to update behavioral patterns
userInteractionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Calculate behavioral patterns
  this.calculateBehavioralPatterns();

  // Calculate engagement metrics
  this.calculateEngagementMetrics();

  // Determine environmental factors
  this.determineEnvironmentalFactors();

  next();
});

// Method to calculate behavioral patterns
userInteractionSchema.methods.calculateBehavioralPatterns = function () {
  // Distraction level based on tab switching and visibility
  if (this.tabSwitchCount > 10 || this.tabVisibilityRatio < 0.5) {
    this.behavioralPatterns.distractionLevel = "high";
  } else if (this.tabSwitchCount > 5 || this.tabVisibilityRatio < 0.8) {
    this.behavioralPatterns.distractionLevel = "medium";
  } else {
    this.behavioralPatterns.distractionLevel = "low";
  }

  // Help seeking behavior
  const helpSeekingReasons = this.tabSwitchFeedback.filter(
    (feedback) =>
      feedback.reason === "search_help" ||
      feedback.reason === "checking_reference"
  );
  this.behavioralPatterns.helpSeekingBehavior = helpSeekingReasons.length > 0;

  // Note taking behavior
  const noteTakingReasons = this.tabSwitchFeedback.filter(
    (feedback) => feedback.reason === "taking_notes"
  );
  this.behavioralPatterns.noteTakingBehavior = noteTakingReasons.length > 0;

  // Focus quality
  if (this.tabVisibilityRatio > 0.95 && this.tabSwitchCount < 3) {
    this.behavioralPatterns.focusQuality = "excellent";
  } else if (this.tabVisibilityRatio > 0.8 && this.tabSwitchCount < 6) {
    this.behavioralPatterns.focusQuality = "good";
  } else if (this.tabVisibilityRatio > 0.6) {
    this.behavioralPatterns.focusQuality = "fair";
  } else {
    this.behavioralPatterns.focusQuality = "poor";
  }

  // Learning style
  if (this.pauseCount > 10 && this.tabSwitchCount < 3) {
    this.behavioralPatterns.learningStyle = "break-heavy";
  } else if (this.tabSwitchCount > 8) {
    this.behavioralPatterns.learningStyle = "multitasking";
  } else if (this.replayCount < 2 && this.skipCount > 5) {
    this.behavioralPatterns.learningStyle = "quick-browsing";
  } else {
    this.behavioralPatterns.learningStyle = "focused";
  }
};

// Method to calculate engagement metrics
userInteractionSchema.methods.calculateEngagementMetrics = function () {
  let qualityScore = 100;
  let attentionScore = 100;
  let persistenceScore = 100;

  // Quality score based on multiple factors
  qualityScore -= (1 - this.tabVisibilityRatio) * 40;
  qualityScore -= (1 - this.activeViewingRatio) * 30;
  qualityScore -= Math.min(this.exitAttemptCount * 10, 20);

  // Attention score based on focus patterns
  attentionScore = this.tabVisibilityRatio * 100;

  // Persistence score based on completion behavior
  persistenceScore -= this.exitAttemptCount * 15;
  persistenceScore = Math.max(persistenceScore - this.skipCount * 2, 0);

  this.engagementMetrics.qualityScore = Math.max(
    0,
    Math.min(100, qualityScore)
  );
  this.engagementMetrics.attentionScore = Math.max(
    0,
    Math.min(100, attentionScore)
  );
  this.engagementMetrics.persistenceScore = Math.max(
    0,
    Math.min(100, persistenceScore)
  );

  // Interaction intensity
  const totalInteractions =
    this.pauseCount + this.replayCount + this.tabSwitchCount + this.skipCount;
  if (totalInteractions > 20) {
    this.engagementMetrics.interactionIntensity = "high";
  } else if (totalInteractions > 10) {
    this.engagementMetrics.interactionIntensity = "medium";
  } else {
    this.engagementMetrics.interactionIntensity = "low";
  }
};

// Method to determine environmental factors
userInteractionSchema.methods.determineEnvironmentalFactors = function () {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Time of day
  if (hour >= 6 && hour < 12) {
    this.environmentalFactors.timeOfDay = "morning";
  } else if (hour >= 12 && hour < 17) {
    this.environmentalFactors.timeOfDay = "afternoon";
  } else if (hour >= 17 && hour < 21) {
    this.environmentalFactors.timeOfDay = "evening";
  } else {
    this.environmentalFactors.timeOfDay = "night";
  }

  // Day of week
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  this.environmentalFactors.dayOfWeek = days[day];

  // Estimate environment based on behavior patterns
  if (
    this.tabSwitchCount > 15 ||
    this.behavioralPatterns.distractionLevel === "high"
  ) {
    this.environmentalFactors.estimatedEnvironment = "noisy";
  } else if (this.tabSwitchCount > 8) {
    this.environmentalFactors.estimatedEnvironment = "moderate";
  } else if (this.behavioralPatterns.focusQuality === "excellent") {
    this.environmentalFactors.estimatedEnvironment = "quiet";
  }
};

// Static method to get behavioral insights for a user
userInteractionSchema.statics.getUserBehavioralProfile = async function (
  userId
) {
  const interactions = await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10);

  if (interactions.length === 0) {
    return null;
  }

  // Aggregate behavioral patterns
  const profile = {
    averageDistractionLevel: 0,
    helpSeekingTendency: 0,
    preferredLearningStyle: null,
    averageEngagementScore: 0,
    commonExitReasons: [],
    commonTabSwitchReasons: [],
    learningEffectiveness: "medium",
    recommendations: [],
  };

  // Calculate averages and patterns
  let totalQualityScore = 0;
  let distractionLevels = { low: 0, medium: 0, high: 0 };
  let learningStyles = {
    focused: 0,
    multitasking: 0,
    "break-heavy": 0,
    "quick-browsing": 0,
  };

  interactions.forEach((interaction) => {
    totalQualityScore += interaction.engagementMetrics.qualityScore;
    distractionLevels[interaction.behavioralPatterns.distractionLevel]++;
    if (interaction.behavioralPatterns.learningStyle) {
      learningStyles[interaction.behavioralPatterns.learningStyle]++;
    }
  });

  profile.averageEngagementScore = totalQualityScore / interactions.length;

  // Determine predominant learning style
  profile.preferredLearningStyle = Object.keys(learningStyles).reduce((a, b) =>
    learningStyles[a] > learningStyles[b] ? a : b
  );

  // Generate recommendations based on profile
  if (profile.averageEngagementScore < 60) {
    profile.recommendations.push(
      "Focus on minimizing distractions during learning sessions"
    );
    profile.recommendations.push(
      "Consider shorter, more focused learning blocks"
    );
  }

  if (distractionLevels.high > distractionLevels.low) {
    profile.recommendations.push("Try using focus apps or website blockers");
    profile.recommendations.push("Create a dedicated learning environment");
  }

  return profile;
};

module.exports = mongoose.model("UserInteraction", userInteractionSchema);
