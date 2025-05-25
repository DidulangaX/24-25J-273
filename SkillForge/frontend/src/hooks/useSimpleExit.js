// src/hooks/useSimpleExit.js - BULLETPROOF SIMPLE EXIT
import { useState, useRef } from "react";
import { useToast } from "@chakra-ui/react";

const useSimpleExit = (videoId, userId, sendTrackingData) => {
  const toast = useToast();

  // Simple exit modal states
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [exitComment, setExitComment] = useState("");
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const sessionStart = useRef(Date.now());
  const exitAttempts = useRef(0);
  const lastExitTime = useRef(0);

  // Get session duration
  const getSessionDuration = () => {
    return Math.round((Date.now() - sessionStart.current) / 1000);
  };

  // Handle exit attempt - ONLY CALLED MANUALLY
  const handleExitAttempt = (method, navigationCallback = null) => {
    // STRICT VALIDATION - reject invalid calls
    if (!method || typeof method !== "string" || method.trim() === "") {
      console.error("🚫 INVALID EXIT ATTEMPT - REJECTED:", method);
      console.trace("Call stack:"); // Show where this invalid call is coming from
      return false;
    }

    const now = Date.now();

    console.log(`🚪 MANUAL EXIT: ${method} (${getSessionDuration()}s)`);

    // Super strong debounce - prevent spam
    if (now - lastExitTime.current < 5000) {
      console.log("❌ BLOCKED: Too recent");
      return false;
    }

    lastExitTime.current = now;
    exitAttempts.current += 1;

    // Track the attempt
    if (sendTrackingData) {
      sendTrackingData("exit_attempt", {
        method,
        exitAttemptNumber: exitAttempts.current,
        sessionDuration: getSessionDuration(),
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error("Tracking error:", err));
    }

    // Show modal for sessions > 30 seconds
    const sessionDuration = getSessionDuration();
    if (sessionDuration > 30) {
      console.log("✅ SHOWING MODAL");
      setPendingNavigation(() => navigationCallback);
      setShowExitModal(true);
      return true; // Prevent immediate exit
    }

    console.log("⚠️ SHORT SESSION - DIRECT EXIT");
    // For short sessions, execute navigation immediately
    if (navigationCallback) {
      try {
        navigationCallback();
      } catch (err) {
        console.error("Navigation error:", err);
      }
    }
    return false;
  };

  // Handle stay and continue
  const handleStayAndContinue = () => {
    console.log("👍 STAYING");

    setShowExitModal(false);
    setExitReason("");
    setExitComment("");
    setPendingNavigation(null);

    if (sendTrackingData) {
      sendTrackingData("exit_cancelled", {
        exitAttemptNumber: exitAttempts.current,
        sessionDuration: getSessionDuration(),
        reason: "stayed_to_continue",
      }).catch((err) => console.error("Tracking error:", err));
    }

    toast({
      title: "Great choice! 🎯",
      description: "Keep learning!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle leave anyway
  const handleLeaveAnyway = async () => {
    console.log("🚪 LEAVING");

    if (!exitReason) {
      toast({
        title: "Please select a reason",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingExit(true);

    try {
      if (sendTrackingData) {
        await sendTrackingData("exit_confirmed", {
          reason: exitReason,
          comment: exitComment,
          exitAttempts: exitAttempts.current,
          sessionDuration: getSessionDuration(),
        });
      }

      toast({
        title: "Thank you!",
        description: "Progress saved.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      setShowExitModal(false);

      // Execute navigation
      if (pendingNavigation) {
        setTimeout(() => {
          try {
            pendingNavigation();
          } catch (err) {
            console.error("Navigation error:", err);
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error:", error);

      // Still allow exit on error
      if (pendingNavigation) {
        setTimeout(() => {
          try {
            pendingNavigation();
          } catch (err) {
            console.error("Navigation error:", err);
          }
        }, 300);
      }
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    // Exit modal state
    showExitModal,
    exitReason,
    setExitReason,
    exitComment,
    setExitComment,
    isSubmittingExit,
    sessionDuration: getSessionDuration(),

    // Exit actions
    handleExitAttempt,
    handleStayAndContinue,
    handleLeaveAnyway,
    formatDuration,
  };
};

export default useSimpleExit;
