//src/hooks/useBehavioralTracking.js
import { useState, useEffect, useRef } from "react";
import { useToast } from "@chakra-ui/react";

const useBehavioralTracking = (videoId, userId, videoRef) => {
  const toast = useToast();

  // 🐛 Debug helper for development
  const debugInterventions = useRef({
    enabled: process.env.NODE_ENV === "development",
    log: (...args) => {
      if (debugInterventions.current.enabled) {
        console.log("🐛 INTERVENTION DEBUG:", ...args);
      }
    },
  });

  // Existing behavioral tracking state (keep unchanged for your AI model)
  const [behavioralData, setBehavioralData] = useState({
    sessionStart: Date.now(),
    tabSwitches: [],
    browserSwitches: [],
    inactivityPeriods: [],
    focusPeriods: [],
    engagementScore: 100,
    attentionQuality: "excellent",
    distractionLevel: "low",
  });

  // Current session state
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [browserSwitchCount, setBrowserSwitchCount] = useState(0);
  const [totalHiddenTime, setTotalHiddenTime] = useState(0);
  const [totalInactiveTime, setTotalInactiveTime] = useState(0);

  // 🆕 INTERVENTION TRIGGER STATE
  const [interventionTriggers, setInterventionTriggers] = useState({
    shouldShowTabSwitchPrompt: false,
    shouldShowPausePrompt: false,
    shouldShowReplayPrompt: false,
    currentInterventionData: null,
    lastInterventionTime: 0,
  });

  // Modal trigger states (keep existing for backward compatibility)
  const [pendingTabSwitchFeedback, setPendingTabSwitchFeedback] =
    useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);

  // Inactivity confirmation states
  const [showInactivityNotification, setShowInactivityNotification] =
    useState(false);
  const [isAwaitingInactivityResponse, setIsAwaitingInactivityResponse] =
    useState(false);

  // Exit detection states (keep existing)
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [exitComment, setExitComment] = useState("");
  const [exitAttempts, setExitAttempts] = useState(0);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Enhanced tracking refs
  const trackingRefs = useRef({
    // Existing refs
    isTabHidden: false,
    tabHiddenStartTime: null,
    lastVisibilityChange: 0,
    isInactive: false,
    inactiveStartTime: null,
    inactivityTimer: null,
    inactivityWarningTimer: null,
    lastActivityTime: Date.now(),

    // 🆕 INTERVENTION TRACKING
    recentInteractions: {
      pauses: [],
      plays: [],
      seeks: [],
      tabSwitches: [],
    },

    // 🔧 IMPROVED intervention thresholds (more responsive)
    interventionThresholds: {
      rapidTabSwitches: 2, // Reduced from 3 to 2
      frequentPausing: 3, // Reduced from 4 to 3
      multipleReplays: 2, // Keep at 2
      longHiddenTime: 8, // Reduced from 10 to 8 seconds
      cooldownPeriod: 60000, // Reduced from 120000 to 60000 (1 minute)
    },

    // Exit detection
    exitData: {
      hasShownExitModal: false,
      isPreventingExit: true,
      lastExitAttempt: 0,
      exitCooldown: false,
    },

    lastEventTime: {
      visibility: 0,
      activity: 0,
      exit: 0,
    },
  });

  // Calculate engagement score (keep existing)
  const calculateCurrentEngagementScore = () => {
    const sessionDuration = Math.max(
      Date.now() - behavioralData.sessionStart,
      1000
    );
    const hiddenTimeRatio = (totalHiddenTime || 0) / sessionDuration;
    const inactivityRatio = (totalInactiveTime || 0) / sessionDuration;

    let score = 100;
    score -= Math.min(hiddenTimeRatio * 50, 40);
    score -= Math.min(inactivityRatio * 30, 25);
    score -= Math.min((tabSwitchCount || 0) * 2, 15);

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getSessionDuration = () => {
    return Math.round((Date.now() - behavioralData.sessionStart) / 1000);
  };

  // Send tracking data (keep existing)
  const sendTrackingData = async (interactionType, data = {}) => {
    try {
      const currentEngagementScore = calculateCurrentEngagementScore();

      const payload = {
        videoId,
        userId,
        interactionType,
        timestamp: new Date().toISOString(),
        ...data,
        tabVisible: isTabVisible,
        tabSwitchCount: tabSwitchCount || 0,
        totalHiddenTime: (totalHiddenTime || 0) / 1000,
        totalInactiveTime: (totalInactiveTime || 0) / 1000,
        isUserActive,
        engagementScore: currentEngagementScore,
      };

      const response = await fetch(
        "http://localhost:5000/api/videos/interaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error tracking ${interactionType}:`, error);
    }
  };

  // 🔧 IMPROVED: Enhanced intervention trigger check with better debugging
  const checkForInterventionTrigger = (interactionType, data = {}) => {
    const now = Date.now();
    const refs = trackingRefs.current;

    debugInterventions.current.log(`Checking ${interactionType} intervention`, {
      interactionType,
      data,
      currentTime: now,
      lastInterventionTime: interventionTriggers.lastInterventionTime,
      cooldownRemaining: Math.max(
        0,
        (refs.interventionThresholds.cooldownPeriod -
          (now - interventionTriggers.lastInterventionTime)) /
          1000
      ),
    });

    // 🔧 FIX: Check cooldown but allow different intervention types
    const timeSinceLastIntervention =
      now - interventionTriggers.lastInterventionTime;
    const isInCooldown =
      timeSinceLastIntervention < refs.interventionThresholds.cooldownPeriod;

    // 🆕 IMPROVEMENT: Allow different intervention types even during cooldown
    const currentlyActiveInterventions = [
      interventionTriggers.shouldShowTabSwitchPrompt,
      interventionTriggers.shouldShowPausePrompt,
      interventionTriggers.shouldShowReplayPrompt,
    ].filter(Boolean).length;

    if (isInCooldown && currentlyActiveInterventions > 0) {
      debugInterventions.current.log(
        `Skipping ${interactionType} - cooldown active`,
        {
          timeSinceLastIntervention: timeSinceLastIntervention / 1000,
          cooldownPeriod: refs.interventionThresholds.cooldownPeriod / 1000,
          activeInterventions: currentlyActiveInterventions,
        }
      );
      return false;
    }

    // Add to recent interactions
    if (refs.recentInteractions[interactionType + "s"]) {
      refs.recentInteractions[interactionType + "s"].push({
        timestamp: now,
        data,
        position: videoRef.current?.currentTime || 0,
      });

      // Keep only recent interactions (last 5 minutes)
      refs.recentInteractions[interactionType + "s"] = refs.recentInteractions[
        interactionType + "s"
      ].filter((item) => now - item.timestamp < 300000);
    }

    // Check specific intervention conditions with better logging
    let shouldTrigger = false;
    let triggerType = null;
    let triggerData = null;

    switch (interactionType) {
      case "tabSwitch":
        const recentSwitches = refs.recentInteractions.tabSwitches.filter(
          (item) => now - item.timestamp < 120000 // Last 2 minutes
        );

        debugInterventions.current.log(`Tab switch analysis`, {
          recentSwitches: recentSwitches.length,
          threshold: refs.interventionThresholds.rapidTabSwitches,
          totalSwitches: tabSwitchCount,
        });

        if (
          recentSwitches.length >= refs.interventionThresholds.rapidTabSwitches
        ) {
          shouldTrigger = true;
          triggerType = "tabSwitch";
          triggerData = {
            recentSwitchCount: recentSwitches.length,
            totalSwitchCount: tabSwitchCount,
            lastHiddenDuration: data.hiddenDuration || 0,
          };
        }
        break;

      case "pause":
        const recentPauses = refs.recentInteractions.pauses.filter(
          (item) => now - item.timestamp < 180000 // Last 3 minutes
        );

        debugInterventions.current.log(`Pause analysis`, {
          recentPauses: recentPauses.length,
          threshold: refs.interventionThresholds.frequentPausing,
          pauseFrequency: recentPauses.length / 3,
        });

        if (
          recentPauses.length >= refs.interventionThresholds.frequentPausing
        ) {
          shouldTrigger = true;
          triggerType = "pause";
          triggerData = {
            recentPauseCount: recentPauses.length,
            pauseFrequency: recentPauses.length / 3,
          };
        }
        break;

      case "seek":
        if (data.direction === "backward") {
          const recentReplays = refs.recentInteractions.seeks.filter(
            (item) =>
              now - item.timestamp < 120000 &&
              item.data.direction === "backward"
          );

          debugInterventions.current.log(`Replay analysis`, {
            recentReplays: recentReplays.length,
            threshold: refs.interventionThresholds.multipleReplays,
          });

          if (
            recentReplays.length >= refs.interventionThresholds.multipleReplays
          ) {
            shouldTrigger = true;
            triggerType = "replay";
            triggerData = {
              recentReplayCount: recentReplays.length,
              lastReplayAmount: data.skipAmount || 0,
            };
          }
        }
        break;

      case "longHidden":
        debugInterventions.current.log(`Long hidden analysis`, {
          hiddenDuration: data.hiddenDuration,
          threshold: refs.interventionThresholds.longHiddenTime,
        });

        if (data.hiddenDuration >= refs.interventionThresholds.longHiddenTime) {
          shouldTrigger = true;
          triggerType = "tabSwitch";
          triggerData = {
            hiddenDuration: data.hiddenDuration,
            isLongAbsence: true,
          };
        }
        break;
    }

    if (shouldTrigger) {
      debugInterventions.current.log(
        `✅ TRIGGERING ${triggerType}`,
        triggerData
      );
      triggerIntervention(triggerType, triggerData);
      return true;
    } else {
      debugInterventions.current.log(`❌ No trigger for ${interactionType}`);
    }

    return false;
  };

  // 🔧 IMPROVED: Enhanced trigger intervention with state management fix
  const triggerIntervention = (type, data) => {
    debugInterventions.current.log(`🚨 TRIGGERING INTERVENTION: ${type}`, data);

    setInterventionTriggers((prev) => {
      // Create new state object
      const newState = {
        ...prev,
        currentInterventionData: {
          type,
          data,
          timestamp: Date.now(),
          videoPosition: videoRef.current?.currentTime || 0,
        },
        lastInterventionTime: Date.now(),
      };

      // Set the specific intervention flag
      if (type === "tabSwitch") {
        newState.shouldShowTabSwitchPrompt = true;
      } else if (type === "pause") {
        newState.shouldShowPausePrompt = true;
      } else if (type === "replay") {
        newState.shouldShowReplayPrompt = true;
      }

      debugInterventions.current.log(
        `✅ Intervention state set for ${type}`,
        newState
      );
      return newState;
    });
  };

  // 🔧 IMPROVED: Enhanced intervention response handler with better cleanup
  const handleInterventionResponse = async (response) => {
    const { type, reason, needsHelp, comment, helpType } = response;

    debugInterventions.current.log(
      `📝 Processing intervention response:`,
      response
    );

    try {
      // 🔧 FIX: Ensure we're sending to the correct endpoint
      const endpoint = "http://localhost:5000/api/videos/intervention-feedback";

      const requestBody = {
        userId,
        videoId,
        interventionType: type,
        reason,
        needsHelp: needsHelp || false,
        comment: comment || "",
        helpType: helpType || null,
        difficulty: response.difficulty || null,
        metadata: interventionTriggers?.currentInterventionData?.data || {},
        sessionContext: {
          tabSwitchCount,
          totalHiddenTime: totalHiddenTime / 1000,
          engagementScore: calculateCurrentEngagementScore(),
          sessionDuration: getSessionDuration(),
        },
        timestamp: new Date().toISOString(),
      };

      debugInterventions.current.log(
        "📤 Sending intervention feedback:",
        requestBody
      );

      const response_result = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response_result.ok) {
        debugInterventions.current.log(
          "✅ Intervention response sent successfully"
        );
      } else {
        debugInterventions.current.log(
          "⚠️ Backend response not OK:",
          response_result.status
        );
      }

      // Execute immediate help if requested
      if (needsHelp && helpType) {
        debugInterventions.current.log(`🆘 Executing help: ${helpType}`);
        executeImmediateHelp(helpType);
      }

      // 🔧 FIX: Properly close intervention prompt and reset cooldown
      closeInterventionPrompt(type);

      // 🔧 FIX: Reset cooldown after successful response (allow new interventions sooner)
      setTimeout(() => {
        setInterventionTriggers((prev) => ({
          ...prev,
          lastInterventionTime: Date.now() - 60000, // Reduce cooldown by 1 minute
        }));
        debugInterventions.current.log(
          `🔄 Cooldown reduced for future interventions`
        );
      }, 3000); // Wait 3 seconds then reduce cooldown

      toast({
        title: needsHelp
          ? "Help is on the way! 🆘"
          : "Thanks for the feedback! 👍",
        description: needsHelp
          ? "We've applied some adjustments to help you learn better."
          : "Your input helps us improve the learning experience.",
        status: needsHelp ? "info" : "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Error recording intervention response:", error);
      debugInterventions.current.log("❌ Backend error:", error);

      // 🔧 FIX: Still close the prompt even if backend fails
      closeInterventionPrompt(type);

      toast({
        title: "Response recorded locally",
        description: "Your feedback has been saved.",
        status: "info",
        duration: 2000,
      });
    }
  };

  // 🆕 EXECUTE IMMEDIATE HELP
  const executeImmediateHelp = (helpType) => {
    switch (helpType) {
      case "slow_down":
        if (videoRef.current) {
          videoRef.current.playbackRate = 0.75;
          debugInterventions.current.log("🐌 Video speed reduced to 0.75x");
        }
        break;
      case "replay_section":
        if (videoRef.current) {
          const newPosition = Math.max(videoRef.current.currentTime - 30, 0);
          videoRef.current.currentTime = newPosition;
          debugInterventions.current.log("⏪ Replaying last 30 seconds");
        }
        break;
      case "pause_and_notes":
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          debugInterventions.current.log("⏸️ Video paused for note-taking");
        }
        break;
      case "show_summary":
        debugInterventions.current.log("📋 Summary mode activated");
        break;
      default:
        debugInterventions.current.log(`❓ Unknown help type: ${helpType}`);
        break;
    }
  };

  // 🔧 IMPROVED: Enhanced close intervention prompt
  const closeInterventionPrompt = (type) => {
    debugInterventions.current.log(`🔒 Closing ${type} intervention prompt`);

    setInterventionTriggers((prev) => {
      const newState = { ...prev };

      if (type === "tabSwitch") {
        newState.shouldShowTabSwitchPrompt = false;
      } else if (type === "pause") {
        newState.shouldShowPausePrompt = false;
      } else if (type === "replay") {
        newState.shouldShowReplayPrompt = false;
      }

      newState.currentInterventionData = null;

      debugInterventions.current.log(
        `🔒 Intervention closed for ${type}`,
        newState
      );
      return newState;
    });
  };

  // 🆕 DEBUG: Reset interventions function for testing
  const resetInterventionsForTesting = () => {
    debugInterventions.current.log(
      "🔄 MANUAL RESET: Clearing all interventions for testing"
    );

    setInterventionTriggers({
      shouldShowTabSwitchPrompt: false,
      shouldShowPausePrompt: false,
      shouldShowReplayPrompt: false,
      currentInterventionData: null,
      lastInterventionTime: 0,
    });

    // Clear recent interactions
    trackingRefs.current.recentInteractions = {
      pauses: [],
      plays: [],
      seeks: [],
      tabSwitches: [],
    };

    toast({
      title: "🔄 Interventions Reset",
      description: "All intervention triggers cleared for testing.",
      status: "info",
      duration: 2000,
    });
  };

  // Enhanced visibility change handler
  const handleVisibilityChange = () => {
    const now = Date.now();
    const timeSinceLastEvent =
      now - trackingRefs.current.lastEventTime.visibility;

    if (timeSinceLastEvent < 200) return;
    trackingRefs.current.lastEventTime.visibility = now;

    if (document.hidden && !trackingRefs.current.isTabHidden) {
      trackingRefs.current.isTabHidden = true;
      trackingRefs.current.tabHiddenStartTime = now;
      setIsTabVisible(false);
      setTabSwitchCount((prev) => prev + 1);

      console.log("ENHANCED: Tab unfocused");
      sendTrackingData("tab_unfocused", {
        position: videoRef.current?.currentTime || 0,
        timestamp: new Date().toISOString(),
      });
    } else if (!document.hidden && trackingRefs.current.isTabHidden) {
      trackingRefs.current.isTabHidden = false;
      const hiddenDuration = trackingRefs.current.tabHiddenStartTime
        ? (now - trackingRefs.current.tabHiddenStartTime) / 1000
        : 0;

      setIsTabVisible(true);
      setTotalHiddenTime((prev) => prev + hiddenDuration * 1000);

      console.log(`ENHANCED: Tab focused after ${hiddenDuration}s`);

      sendTrackingData("tab_focused", {
        position: videoRef.current?.currentTime || 0,
        hiddenDuration,
        timestamp: new Date().toISOString(),
      });

      // 🆕 Check for intervention
      if (hiddenDuration >= 8) {
        checkForInterventionTrigger("longHidden", { hiddenDuration });
      } else {
        checkForInterventionTrigger("tabSwitch", { hiddenDuration });
      }

      trackingRefs.current.tabHiddenStartTime = null;
    }
  };

  // Enhanced activity handler (keep existing logic)
  const handleActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity =
      now - trackingRefs.current.lastEventTime.activity;

    if (timeSinceLastActivity < 1000) return;
    trackingRefs.current.lastEventTime.activity = now;

    if (isAwaitingInactivityResponse) {
      handleInactivityResponse();
      return;
    }

    if (
      trackingRefs.current.isInactive &&
      trackingRefs.current.inactiveStartTime
    ) {
      const inactiveDuration =
        (now - trackingRefs.current.inactiveStartTime) / 1000;
      trackingRefs.current.isInactive = false;
      setIsUserActive(true);
      setTotalInactiveTime((prev) => prev + inactiveDuration * 1000);

      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play();
      }

      sendTrackingData("activity_resumed", {
        position: videoRef.current?.currentTime || 0,
        inactiveDuration,
        totalInactiveTime: (totalInactiveTime + inactiveDuration * 1000) / 1000,
        videoResumed: true,
        timestamp: new Date().toISOString(),
      });

      trackingRefs.current.inactiveStartTime = null;
    }

    startInactivityTimer();
  };

  // Enhanced inactivity timer (keep existing)
  const startInactivityTimer = () => {
    if (trackingRefs.current.inactivityTimer) {
      clearTimeout(trackingRefs.current.inactivityTimer);
    }
    if (trackingRefs.current.inactivityWarningTimer) {
      clearTimeout(trackingRefs.current.inactivityWarningTimer);
    }

    trackingRefs.current.lastActivityTime = Date.now();

    trackingRefs.current.inactivityWarningTimer = setTimeout(() => {
      if (!trackingRefs.current.isInactive && !isAwaitingInactivityResponse) {
        console.log(
          "INACTIVITY WARNING: Showing 'Are you there?' notification"
        );
        setIsAwaitingInactivityResponse(true);
        setShowInactivityNotification(true);

        sendTrackingData("inactivity_warning_shown", {
          position: videoRef.current?.currentTime || 0,
          warningAfterSeconds: 45,
          timestamp: new Date().toISOString(),
        });
      }
    }, 45000);
  };

  // Handle user response to inactivity notification (keep existing)
  const handleInactivityResponse = () => {
    console.log(
      "USER RESPONDED: Inactivity warning dismissed - user is active"
    );
    setIsAwaitingInactivityResponse(false);
    setShowInactivityNotification(false);

    if (trackingRefs.current.inactivityWarningTimer) {
      clearTimeout(trackingRefs.current.inactivityWarningTimer);
      trackingRefs.current.inactivityWarningTimer = null;
    }

    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
    }

    startInactivityTimer();

    sendTrackingData("inactivity_warning_dismissed", {
      position: videoRef.current?.currentTime || 0,
      userResponded: true,
      videoResumed: !videoRef.current?.paused,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: "Welcome back!",
      description: "Continuing your learning session...",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle inactivity timeout (keep existing)
  const handleInactivityTimeout = () => {
    console.log(
      "INACTIVITY TIMEOUT: User did not respond - marking as inactive"
    );
    setIsAwaitingInactivityResponse(false);
    setShowInactivityNotification(false);

    if (!trackingRefs.current.isInactive) {
      trackingRefs.current.isInactive = true;
      trackingRefs.current.inactiveStartTime = Date.now();
      setIsUserActive(false);

      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      sendTrackingData("user_inactive", {
        position: videoRef.current?.currentTime || 0,
        inactivityDuration: 60,
        userResponded: false,
        videoPaused: true,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Learning session paused",
        description:
          "We've paused your session due to inactivity. Move your mouse or click to resume.",
        status: "info",
        duration: 8000,
        isClosable: true,
      });
    }
  };

  // Exit detection handlers (keep existing)
  const handleExitAttempt = (event, method) => {
    const now = Date.now();
    const sessionDuration = getSessionDuration();

    if (
      trackingRefs.current.exitData.exitCooldown ||
      now - trackingRefs.current.lastEventTime.exit < 1000
    ) {
      if (event && method === "beforeunload") {
        event.preventDefault();
        event.returnValue =
          "Are you sure you want to leave? Your progress will be saved.";
        return "Are you sure you want to leave? Your progress will be saved.";
      }
      return;
    }

    trackingRefs.current.lastEventTime.exit = now;
    trackingRefs.current.exitData.exitCooldown = true;
    setExitAttempts((prev) => prev + 1);

    sendTrackingData("exit_attempt", {
      method,
      sessionDuration,
      exitAttemptNumber: exitAttempts + 1,
      timestamp: new Date().toISOString(),
    });

    if (
      sessionDuration > 30 &&
      !trackingRefs.current.exitData.hasShownExitModal &&
      trackingRefs.current.exitData.isPreventingExit
    ) {
      trackingRefs.current.exitData.hasShownExitModal = true;
      setShowExitModal(true);

      setTimeout(() => {
        trackingRefs.current.exitData.exitCooldown = false;
      }, 2000);

      if (event && method === "beforeunload") {
        event.preventDefault();
        event.returnValue =
          "We'd love to know why you're leaving to improve your learning experience.";
        return "We'd love to know why you're leaving to improve your learning experience.";
      }

      return true;
    }

    setTimeout(() => {
      trackingRefs.current.exitData.exitCooldown = false;
    }, 1000);

    return false;
  };

  // Exit handlers (keep existing)
  const handleContinueLearning = () => {
    setShowExitModal(false);
    trackingRefs.current.exitData.hasShownExitModal = false;
    sendTrackingData("exit_cancelled", {
      exitAttemptNumber: exitAttempts,
      sessionDuration: getSessionDuration(),
      timestamp: new Date().toISOString(),
    });
    toast({
      title: "Welcome back! 🎉",
      description: "Your learning session continues...",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExitWithFeedback = async () => {
    if (!exitReason) {
      toast({
        title: "Please select a reason",
        description: "Help us understand why you're leaving",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingExit(true);
    try {
      await sendTrackingData("exit_feedback", {
        reason: exitReason,
        comment: exitComment,
        sessionDuration: getSessionDuration(),
        totalExitAttempts: exitAttempts,
        engagementScore: calculateCurrentEngagementScore(),
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Thank you for your feedback! 💙",
        description: "Your progress has been saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      trackingRefs.current.exitData.isPreventingExit = false;
      setShowExitModal(false);

      setTimeout(() => {
        window.location.href = "/module-page";
      }, 1000);
    } catch (error) {
      console.error("Error submitting exit feedback:", error);
      toast({
        title: "Feedback saved locally",
        description: "You can safely exit now.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      trackingRefs.current.exitData.isPreventingExit = false;
      setShowExitModal(false);
    } finally {
      setIsSubmittingExit(false);
    }
  };

  const handleForceExit = () => {
    sendTrackingData("exit_force", {
      totalExitAttempts: exitAttempts,
      sessionDuration: getSessionDuration(),
      timestamp: new Date().toISOString(),
    });
    trackingRefs.current.exitData.isPreventingExit = false;
    setShowExitModal(false);
    setTimeout(() => {
      window.location.href = "/module-page";
    }, 300);
  };

  // Get attention quality
  const getAttentionQuality = () => {
    const engagementScore = calculateCurrentEngagementScore();
    if (engagementScore >= 90) return "excellent";
    if (engagementScore >= 75) return "good";
    if (engagementScore >= 60) return "fair";
    return "poor";
  };

  // Get distraction level
  const getDistractionLevel = () => {
    const sessionTime = Math.max(
      Date.now() - behavioralData.sessionStart,
      1000
    );
    const hiddenTimeRatio = (totalHiddenTime || 0) / sessionTime;
    if ((tabSwitchCount || 0) > 10 || hiddenTimeRatio > 0.5) return "high";
    if ((tabSwitchCount || 0) > 5 || hiddenTimeRatio > 0.2) return "medium";
    return "low";
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Record feedback and close modals (keep existing for backward compatibility)
  const recordTabSwitchReason = async (reason, comment = "") => {
    await sendTrackingData("tab_switch_feedback", {
      reason,
      comment,
      position: videoRef.current?.currentTime || 0,
    });
    setShowTabSwitchModal(false);
    setPendingTabSwitchFeedback(false);
  };

  const closeTabSwitchModal = () => {
    setShowTabSwitchModal(false);
    setPendingTabSwitchFeedback(false);
  };

  const closeInactivityNotification = () => {
    setShowInactivityNotification(false);
    setIsAwaitingInactivityResponse(false);
  };

  // 🆕 TRACK VIDEO INTERACTIONS WITH INTERVENTION CHECKS
  const trackVideoInteraction = async (type, data = {}) => {
    try {
      const position = videoRef.current ? videoRef.current.currentTime : 0;

      // Send to your existing tracking system
      await sendTrackingData(type, {
        position,
        timestamp: new Date().toISOString(),
        ...data,
      });

      // 🆕 Check for intervention triggers
      if (type === "pause") {
        checkForInterventionTrigger("pause", data);
      } else if (type === "seek" && data.direction === "backward") {
        checkForInterventionTrigger("seek", data);
      }
    } catch (error) {
      console.error(`Error tracking ${type} interaction:`, error);
    }
  };

  // Set up event listeners
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const activityEvents = [
      "mousemove",
      "mousedown",
      "mouseup",
      "click",
      "keydown",
      "keyup",
      "scroll",
      "wheel",
      "touchstart",
      "touchmove",
      "touchend",
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    const handleBeforeUnload = (e) => handleExitAttempt(e, "browser_close");
    const handleKeyDown = (e) => {
      if (
        e.key === "F5" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
        (e.ctrlKey && (e.key === "w" || e.key === "W")) ||
        (e.altKey && e.key === "F4")
      ) {
        const intercepted = handleExitAttempt(e, "keyboard_shortcut");
        if (intercepted) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    const handlePopState = (e) => {
      const intercepted = handleExitAttempt(e, "back_button");
      if (intercepted) {
        e.preventDefault();
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown, true);

    startInactivityTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown, true);

      if (trackingRefs.current.inactivityTimer) {
        clearTimeout(trackingRefs.current.inactivityTimer);
      }
      if (trackingRefs.current.inactivityWarningTimer) {
        clearTimeout(trackingRefs.current.inactivityWarningTimer);
      }
    };
  }, []);

  return {
    // Existing returns (for your AI model)
    behavioralData,
    isTabVisible,
    isUserActive,
    tabSwitchCount,
    browserSwitchCount,
    totalHiddenTime: (totalHiddenTime || 0) / 1000,
    totalInactiveTime: (totalInactiveTime || 0) / 1000,
    engagementScore: calculateCurrentEngagementScore(),
    attentionQuality: getAttentionQuality(),
    distractionLevel: getDistractionLevel(),

    // 🆕 INTERVENTION SYSTEM
    interventionTriggers,
    handleInterventionResponse,
    closeInterventionPrompt,

    // Actions
    trackVideoInteraction,
    sendTrackingData,
    recordTabSwitchReason,
    closeTabSwitchModal,

    // Inactivity actions
    handleInactivityResponse,
    handleInactivityTimeout,
    closeInactivityNotification,

    // Modal flags
    shouldShowTabSwitchModal: showTabSwitchModal,
    shouldShowInactivityNotification: showInactivityNotification,
    isAwaitingInactivityResponse,

    // Exit detection
    showExitModal,
    exitReason,
    exitComment,
    exitAttempts,
    isSubmittingExit,
    setExitReason,
    setExitComment,
    handleContinueLearning,
    handleExitWithFeedback,
    handleForceExit,
    formatDuration,
    getSessionDuration,

    // 🆕 DEBUG UTILITIES (only in development)
    resetInterventionsForTesting,
    debugInfo:
      process.env.NODE_ENV === "development"
        ? {
            recentInteractions: trackingRefs.current.recentInteractions,
            thresholds: trackingRefs.current.interventionThresholds,
            cooldownRemaining: Math.max(
              0,
              (trackingRefs.current.interventionThresholds.cooldownPeriod -
                (Date.now() - interventionTriggers.lastInterventionTime)) /
                1000
            ),
            activeInterventions: [
              interventionTriggers.shouldShowTabSwitchPrompt && "TabSwitch",
              interventionTriggers.shouldShowPausePrompt && "Pause",
              interventionTriggers.shouldShowReplayPrompt && "Replay",
            ].filter(Boolean),
          }
        : null,
  };
};

export default useBehavioralTracking;
