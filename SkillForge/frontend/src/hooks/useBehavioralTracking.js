// SkillForge-frontend/src/hooks/useBehavioralTracking.js
import { useState, useEffect, useRef } from "react";
import { useToast } from "@chakra-ui/react";

const useBehavioralTracking = (videoId, userId, videoRef) => {
  const toast = useToast();

  // Behavioral tracking state
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

  // Modal trigger states
  const [pendingTabSwitchFeedback, setPendingTabSwitchFeedback] =
    useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);

  // Inactivity confirmation states
  const [showInactivityNotification, setShowInactivityNotification] =
    useState(false);
  const [isAwaitingInactivityResponse, setIsAwaitingInactivityResponse] =
    useState(false);

  // 🆕 EXIT DETECTION STATES
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [exitComment, setExitComment] = useState("");
  const [exitAttempts, setExitAttempts] = useState(0);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Single tracking refs
  const trackingRefs = useRef({
    // Visibility tracking
    isTabHidden: false,
    tabHiddenStartTime: null,
    lastVisibilityChange: 0,

    // Inactivity tracking
    isInactive: false,
    inactiveStartTime: null,
    inactivityTimer: null,
    inactivityWarningTimer: null,
    lastActivityTime: Date.now(),

    // 🆕 EXIT TRACKING
    exitData: {
      hasShownExitModal: false,
      isPreventingExit: true,
      lastExitAttempt: 0,
      exitCooldown: false,
    },

    // Debounce tracking
    lastEventTime: {
      visibility: 0,
      activity: 0,
      exit: 0,
    },
  });

  // Calculate engagement score
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

  // Get session duration in seconds
  const getSessionDuration = () => {
    return Math.round((Date.now() - behavioralData.sessionStart) / 1000);
  };

  // Send tracking data to backend
  const sendTrackingData = async (interactionType, data = {}) => {
    try {
      const currentEngagementScore = calculateCurrentEngagementScore();

      const payload = {
        videoId,
        userId,
        interactionType,
        timestamp: new Date().toISOString(),
        ...data,
        // Enhanced metadata
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
          headers: {
            "Content-Type": "application/json",
          },
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

  // 🆕 SIMPLE EXIT DETECTION HANDLER
  const handleExitAttempt = (event, method) => {
    const now = Date.now();
    const sessionDuration = getSessionDuration();

    // Prevent rapid duplicate attempts
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

    // Increment exit attempts
    setExitAttempts((prev) => prev + 1);

    console.log(
      `🚪 EXIT ATTEMPT: ${method} (Session: ${sessionDuration}s, Attempt: ${
        exitAttempts + 1
      })`
    );

    // Track the exit attempt immediately
    sendTrackingData("exit_attempt", {
      method,
      sessionDuration,
      exitAttemptNumber: exitAttempts + 1,
      timestamp: new Date().toISOString(),
    });

    // Show modal for meaningful sessions (>30s) and first time
    if (
      sessionDuration > 30 &&
      !trackingRefs.current.exitData.hasShownExitModal &&
      trackingRefs.current.exitData.isPreventingExit
    ) {
      trackingRefs.current.exitData.hasShownExitModal = true;
      setShowExitModal(true);

      // Reset cooldown after showing modal
      setTimeout(() => {
        trackingRefs.current.exitData.exitCooldown = false;
      }, 2000);

      // Prevent browser exit for beforeunload
      if (event && method === "beforeunload") {
        event.preventDefault();
        event.returnValue =
          "We'd love to know why you're leaving to improve your learning experience.";
        return "We'd love to know why you're leaving to improve your learning experience.";
      }

      return true; // Exit intercepted
    }

    // Allow exit for short sessions or repeat attempts
    setTimeout(() => {
      trackingRefs.current.exitData.exitCooldown = false;
    }, 1000);

    return false; // Allow exit
  };

  // 🆕 EXIT MODAL HANDLERS
  const handleContinueLearning = () => {
    console.log("👍 User chose to continue learning");
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

      // Allow exit
      trackingRefs.current.exitData.isPreventingExit = false;
      setShowExitModal(false);

      // Navigate away after delay
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
    console.log("⚠️ User chose to exit without feedback");

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

  // Single event handler for visibility
  const handleVisibilityChange = () => {
    const now = Date.now();
    const timeSinceLastEvent =
      now - trackingRefs.current.lastEventTime.visibility;

    if (timeSinceLastEvent < 200) {
      return;
    }

    trackingRefs.current.lastEventTime.visibility = now;

    if (document.hidden && !trackingRefs.current.isTabHidden) {
      trackingRefs.current.isTabHidden = true;
      trackingRefs.current.tabHiddenStartTime = now;
      setIsTabVisible(false);
      setTabSwitchCount((prev) => prev + 1);

      console.log("SINGLE EVENT: Tab unfocused");
      sendTrackingData("tab_unfocused", {
        position: videoRef.current?.currentTime || 0,
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => {
        setPendingTabSwitchFeedback(true);
      }, 2000);
    } else if (!document.hidden && trackingRefs.current.isTabHidden) {
      trackingRefs.current.isTabHidden = false;
      const hiddenDuration = trackingRefs.current.tabHiddenStartTime
        ? (now - trackingRefs.current.tabHiddenStartTime) / 1000
        : 0;

      setIsTabVisible(true);
      setTotalHiddenTime((prev) => prev + hiddenDuration * 1000);

      console.log(`SINGLE EVENT: Tab focused after ${hiddenDuration}s`);
      sendTrackingData("tab_focused", {
        position: videoRef.current?.currentTime || 0,
        hiddenDuration,
        timestamp: new Date().toISOString(),
      });

      if (hiddenDuration > 3 && pendingTabSwitchFeedback) {
        setTimeout(() => {
          setShowTabSwitchModal(true);
          setPendingTabSwitchFeedback(false);
        }, 1500);
      } else {
        setPendingTabSwitchFeedback(false);
      }

      trackingRefs.current.tabHiddenStartTime = null;
    }
  };

  // Enhanced inactivity timer with confirmation step
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

  // Handle user response to inactivity notification
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
      console.log("🎵 Video resumed - user responded to inactivity warning");
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

  // Handle inactivity timeout
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
        console.log("🎵 Video paused due to inactivity");
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

  // Activity handler
  const handleActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity =
      now - trackingRefs.current.lastEventTime.activity;

    if (timeSinceLastActivity < 1000) {
      return;
    }

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
        console.log("🎵 Video resumed due to user activity");
      }

      console.log(`ACTIVITY RESUMED: Was inactive for ${inactiveDuration}s`);
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

  // 🆕 SET UP EXIT DETECTION + EXISTING EVENT LISTENERS
  useEffect(() => {
    // 1. Visibility change (Tab switching)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Activity tracking
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

    // 🆕 3. EXIT DETECTION - Simple and reliable
    const handleBeforeUnload = (e) => {
      console.log("📡 beforeunload event triggered");
      return handleExitAttempt(e, "browser_close");
    };

    const handleKeyDown = (e) => {
      // Detect exit shortcuts
      if (
        e.key === "F5" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
        (e.ctrlKey && (e.key === "w" || e.key === "W")) ||
        (e.altKey && e.key === "F4")
      ) {
        console.log(`📡 keyboard shortcut detected: ${e.key}`);
        const intercepted = handleExitAttempt(e, "keyboard_shortcut");
        if (intercepted) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handlePopState = (e) => {
      console.log("📡 popstate event triggered (back/forward button)");
      const intercepted = handleExitAttempt(e, "back_button");
      if (intercepted) {
        e.preventDefault();
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    // Set up history state for back button detection
    window.history.pushState(null, null, window.location.pathname);

    // Add exit detection listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown, true);

    console.log(
      "✅ ALL EVENT LISTENERS ADDED: visibility, activity, exit detection"
    );

    startInactivityTimer();

    return () => {
      // Clean up all listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      // Clean up exit detection
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown, true);

      // Clean up timers
      if (trackingRefs.current.inactivityTimer) {
        clearTimeout(trackingRefs.current.inactivityTimer);
      }
      if (trackingRefs.current.inactivityWarningTimer) {
        clearTimeout(trackingRefs.current.inactivityWarningTimer);
      }

      console.log("🧹 ALL EVENT LISTENERS CLEANED UP");
    };
  }, []);

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

  // Record feedback and close modals
  const recordTabSwitchReason = async (reason, comment = "") => {
    await sendTrackingData("tab_switch_feedback", {
      reason,
      comment,
      position: videoRef.current?.currentTime || 0,
    });
    setShowTabSwitchModal(false);
    setPendingTabSwitchFeedback(false);
  };

  // Functions to close modals without feedback
  const closeTabSwitchModal = () => {
    setShowTabSwitchModal(false);
    setPendingTabSwitchFeedback(false);
  };

  // Functions for inactivity notification
  const closeInactivityNotification = () => {
    setShowInactivityNotification(false);
    setIsAwaitingInactivityResponse(false);
  };

  // 🆕 FORMAT SESSION DURATION FOR DISPLAY
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    // State
    behavioralData,
    isTabVisible,
    isUserActive,
    tabSwitchCount,
    browserSwitchCount,
    totalHiddenTime: (totalHiddenTime || 0) / 1000,
    totalInactiveTime: (totalInactiveTime || 0) / 1000,

    // Computed values
    engagementScore: calculateCurrentEngagementScore(),
    attentionQuality: getAttentionQuality(),
    distractionLevel: getDistractionLevel(),

    // Actions
    recordTabSwitchReason,
    sendTrackingData,
    closeTabSwitchModal,

    // Inactivity actions
    handleInactivityResponse,
    handleInactivityTimeout,
    closeInactivityNotification,

    // 🆕 EXIT DETECTION INTERFACE
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

    // Modal flags
    shouldShowTabSwitchModal: showTabSwitchModal,

    // Inactivity notification flag
    shouldShowInactivityNotification: showInactivityNotification,
    isAwaitingInactivityResponse,
  };
};

export default useBehavioralTracking;
