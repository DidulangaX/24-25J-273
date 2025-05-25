/* Enhanced User Activity Tracker Component */
import React, { useEffect, useRef, useState } from "react";

const UserActivityTracker = ({
  videoId,
  userId,
  onActivityUpdate,
  isVideoPlaying = false,
}) => {
  // Tracking states
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isUserActive, setIsUserActive] = useState(true);
  const [inactiveStartTime, setInactiveStartTime] = useState(null);
  const [totalInactiveTime, setTotalInactiveTime] = useState(0);
  const [exitAttempts, setExitAttempts] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Refs for tracking
  const lastActivityTime = useRef(Date.now());
  const inactivityTimer = useRef(null);
  const activityCheckInterval = useRef(null);
  const trackingData = useRef({
    sessionStart: Date.now(),
    totalInactiveTime: 0,
    exitAttempts: 0,
    tabSwitches: 0,
    tabVisibilityEvents: [],
    mouseMovements: 0,
    keyPresses: 0,
    clicks: 0,
  });

  // Constants
  const INACTIVITY_THRESHOLD = 30000; // 30 seconds
  const ACTIVITY_CHECK_INTERVAL = 1000; // 1 second
  const MOUSE_MOVEMENT_THRESHOLD = 50; // pixels

  // Track user activity (mouse, keyboard, scroll)
  const updateActivity = (eventType = "general") => {
    const now = Date.now();
    lastActivityTime.current = now;

    if (!isUserActive) {
      // User became active again
      if (inactiveStartTime) {
        const inactiveDuration = now - inactiveStartTime;
        setTotalInactiveTime((prev) => prev + inactiveDuration);
        trackingData.current.totalInactiveTime += inactiveDuration;
        setInactiveStartTime(null);
      }
      setIsUserActive(true);
    }

    // Track specific activity types
    switch (eventType) {
      case "mousemove":
        trackingData.current.mouseMovements++;
        break;
      case "keydown":
        trackingData.current.keyPresses++;
        break;
      case "click":
        trackingData.current.clicks++;
        break;
    }

    // Reset inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setIsUserActive(false);
      setInactiveStartTime(Date.now());
    }, INACTIVITY_THRESHOLD);
  };

  // Track mouse movement with throttling
  const handleMouseMove = useRef(
    throttle((e) => {
      updateActivity("mousemove");
    }, 500)
  ).current;

  // Track keyboard activity
  const handleKeyDown = (e) => {
    updateActivity("keydown");
  };

  // Track clicks
  const handleClick = (e) => {
    updateActivity("click");
  };

  // Track scroll activity
  const handleScroll = useRef(
    throttle(() => {
      updateActivity("scroll");
    }, 1000)
  ).current;

  // Track tab visibility changes
  const handleVisibilityChange = () => {
    const isVisible = !document.hidden;
    const now = Date.now();

    setIsTabVisible(isVisible);

    if (!isVisible) {
      // Tab became hidden
      setTabSwitches((prev) => prev + 1);
      trackingData.current.tabSwitches++;
      trackingData.current.tabVisibilityEvents.push({
        type: "hidden",
        timestamp: now,
      });
    } else {
      // Tab became visible
      trackingData.current.tabVisibilityEvents.push({
        type: "visible",
        timestamp: now,
      });
      updateActivity("tab_visible");
    }
  };

  // Track exit attempts (multiple methods)
  const handleBeforeUnload = (e) => {
    setExitAttempts((prev) => prev + 1);
    trackingData.current.exitAttempts++;

    // Save tracking data before exit
    saveTrackingData();

    // Show exit warning (optional)
    e.preventDefault();
    e.returnValue = "";
    return "";
  };

  // Track page hide (more reliable than beforeunload)
  const handlePageHide = () => {
    setExitAttempts((prev) => prev + 1);
    trackingData.current.exitAttempts++;
    saveTrackingData();
  };

  // Track focus/blur events
  const handleWindowFocus = () => {
    updateActivity("window_focus");
  };

  const handleWindowBlur = () => {
    // Window lost focus
    if (isUserActive) {
      setIsUserActive(false);
      setInactiveStartTime(Date.now());
    }
  };

  // Track ESC key (exit attempt)
  const handleEscKey = (e) => {
    if (e.key === "Escape") {
      setExitAttempts((prev) => prev + 1);
      trackingData.current.exitAttempts++;
    }
  };

  // Track browser navigation (back/forward buttons)
  const handlePopState = () => {
    setExitAttempts((prev) => prev + 1);
    trackingData.current.exitAttempts++;
  };

  // Save tracking data to backend
  const saveTrackingData = async () => {
    if (!videoId || !userId) return;

    const currentData = {
      ...trackingData.current,
      totalInactiveTime,
      exitAttempts,
      tabSwitches,
      isTabVisible,
      isUserActive,
      sessionDuration: Date.now() - trackingData.current.sessionStart,
      timestamp: Date.now(),
    };

    try {
      await fetch(
        `http://localhost:5000/api/videos/track-activity/${videoId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            activityData: currentData,
          }),
        }
      );
    } catch (error) {
      console.error("Error saving activity data:", error);
    }

    // Update parent component
    if (onActivityUpdate) {
      onActivityUpdate(currentData);
    }
  };

  // Periodic activity check
  const checkActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;

    if (timeSinceLastActivity > INACTIVITY_THRESHOLD && isUserActive) {
      setIsUserActive(false);
      setInactiveStartTime(now - timeSinceLastActivity);
    }
  };

  // Setup event listeners
  useEffect(() => {
    // Mouse and keyboard events
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleScroll);
    document.addEventListener("keydown", handleEscKey);

    // Tab visibility
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Window focus/blur
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    // Exit attempts
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("popstate", handlePopState);

    // Periodic activity check
    activityCheckInterval.current = setInterval(
      checkActivity,
      ACTIVITY_CHECK_INTERVAL
    );

    // Initial activity timer
    inactivityTimer.current = setTimeout(() => {
      setIsUserActive(false);
      setInactiveStartTime(Date.now());
    }, INACTIVITY_THRESHOLD);

    return () => {
      // Cleanup event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("popstate", handlePopState);

      // Clear timers
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current);
      }

      // Save final data
      saveTrackingData();
    };
  }, [videoId, userId]);

  // Save data periodically
  useEffect(() => {
    const saveInterval = setInterval(saveTrackingData, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  }, [totalInactiveTime, exitAttempts, tabSwitches]);

  // Return tracking status for debugging (optional)
  return null; // This component doesn't render anything
};

// Throttle utility function
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default UserActivityTracker;
