// src/hooks/useSessionExit.js
import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";

const useSessionExit = (videoId, userId, sendTrackingData) => {
  const [exitData, setExitData] = useState({
    sessionStart: Date.now(),
    exitAttempts: 0,
    lastExitMethod: null,
  });

  const toast = useToast();

  // Track exit attempt
  const handleExitAttempt = useCallback(
    (method, additionalData = {}) => {
      console.log(`🚪 EXIT ATTEMPT: ${method}`);

      setExitData((prev) => ({
        ...prev,
        exitAttempts: prev.exitAttempts + 1,
        lastExitMethod: method,
      }));

      // Send tracking data if available
      if (sendTrackingData) {
        sendTrackingData("exit_attempt", {
          method,
          exitAttemptNumber: exitData.exitAttempts + 1,
          sessionDuration: (Date.now() - exitData.sessionStart) / 1000,
          timestamp: new Date().toISOString(),
          ...additionalData,
        });
      }
    },
    [exitData.exitAttempts, exitData.sessionStart, sendTrackingData]
  );

  // Handle exit confirmation
  const handleExitConfirmed = useCallback(
    (reason, comment) => {
      console.log(`✅ EXIT CONFIRMED: ${reason}`);

      if (sendTrackingData) {
        sendTrackingData("exit_confirmed", {
          reason,
          comment,
          method: exitData.lastExitMethod,
          totalExitAttempts: exitData.exitAttempts,
          sessionDuration: (Date.now() - exitData.sessionStart) / 1000,
          timestamp: new Date().toISOString(),
        });
      }

      toast({
        title: "Session ended",
        description:
          "Thank you for your feedback! Your progress has been saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    [exitData, sendTrackingData, toast]
  );

  // Handle exit cancelled
  const handleExitCancelled = useCallback(() => {
    console.log("❌ EXIT CANCELLED: User chose to continue");

    if (sendTrackingData) {
      sendTrackingData("exit_cancelled", {
        method: exitData.lastExitMethod,
        exitAttemptNumber: exitData.exitAttempts,
        sessionDuration: (Date.now() - exitData.sessionStart) / 1000,
        timestamp: new Date().toISOString(),
      });
    }
  }, [exitData, sendTrackingData]);

  // Handle feedback submission
  const handleFeedbackSubmitted = useCallback(
    async (type, data) => {
      console.log(`📝 FEEDBACK SUBMITTED: ${type}`, data);

      if (sendTrackingData) {
        return await sendTrackingData(type, data);
      }
    },
    [sendTrackingData]
  );

  // Get session data for the exit handler
  const getSessionData = useCallback(
    () => ({
      sessionStart: exitData.sessionStart,
      exitAttempts: exitData.exitAttempts,
      lastExitMethod: exitData.lastExitMethod,
      sessionDuration: (Date.now() - exitData.sessionStart) / 1000,
    }),
    [exitData]
  );

  return {
    // Data
    exitData,
    sessionData: getSessionData(),

    // Actions
    handleExitAttempt,
    handleExitConfirmed,
    handleExitCancelled,
    handleFeedbackSubmitted,

    // Helpers
    getSessionData,
  };
};

export default useSessionExit;
