// src/components/modulePage/InteractionGuidance/InteractionGuidance.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse,
  Button,
  CloseButton,
  Flex,
  Badge,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import { InfoIcon, WarningIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { FaLightbulb, FaPauseCircle, FaUndo, FaForward } from "react-icons/fa";

// Guidance patterns to detect
const PATTERNS = {
  EXCESSIVE_PAUSING: {
    threshold: 3,
    timeframe: 60, // seconds
    level: "info",
    title: "Pausing Frequently?",
    icon: FaPauseCircle,
    message:
      "You're pausing frequently. Consider taking notes to help retain this information.",
    action: "Try Note-Taking",
  },
  MULTIPLE_REPLAYS: {
    threshold: 2,
    timeframe: 120, // seconds
    level: "warning",
    title: "Repeating Content?",
    icon: FaUndo,
    message:
      "You've replayed this section multiple times. This might be a challenging concept.",
    action: "View Related Resources",
  },
  SKIPPING_FORWARD: {
    threshold: 3,
    timeframe: 60, // seconds
    level: "info",
    title: "Skipping Content?",
    icon: FaForward,
    message:
      "You're skipping through content quickly. Would you prefer more advanced material?",
    action: "Find Advanced Content",
  },
  LEARNING_INSIGHT: {
    threshold: 10, // minimum interactions
    level: "success",
    title: "Learning Insight",
    icon: FaLightbulb,
    message:
      "Based on your viewing pattern, you might benefit from additional resources on this topic.",
    action: "View Analysis",
  },
};

const InteractionGuidance = ({ interactionData, videoPosition, onAction }) => {
  const [activeGuidance, setActiveGuidance] = useState(null);
  const [dismissed, setDismissed] = useState([]);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    // Only analyze after collecting enough data
    if (!interactionData || interactionData.interactionCount < 5) return;

    // Don't show guidance that was dismissed
    const detectPatterns = () => {
      // Get recent interactions based on current video position
      const {
        totalPauses,
        replayEvents,
        seekForwardEvents,
        interactionCount,
        lastPauseTime,
        lastReplayTime,
        lastSkipTime,
      } = interactionData;

      const currentTime = Date.now();

      // Check for excessive pausing in recent timeframe
      if (
        totalPauses >= PATTERNS.EXCESSIVE_PAUSING.threshold &&
        lastPauseTime &&
        (currentTime - lastPauseTime) / 1000 <
          PATTERNS.EXCESSIVE_PAUSING.timeframe &&
        !dismissed.includes("EXCESSIVE_PAUSING")
      ) {
        return "EXCESSIVE_PAUSING";
      }

      // Check for multiple replays of the same section
      if (
        replayEvents >= PATTERNS.MULTIPLE_REPLAYS.threshold &&
        lastReplayTime &&
        (currentTime - lastReplayTime) / 1000 <
          PATTERNS.MULTIPLE_REPLAYS.timeframe &&
        !dismissed.includes("MULTIPLE_REPLAYS")
      ) {
        return "MULTIPLE_REPLAYS";
      }

      // Check for rapid skipping forward
      if (
        seekForwardEvents >= PATTERNS.SKIPPING_FORWARD.threshold &&
        lastSkipTime &&
        (currentTime - lastSkipTime) / 1000 <
          PATTERNS.SKIPPING_FORWARD.timeframe &&
        !dismissed.includes("SKIPPING_FORWARD")
      ) {
        return "SKIPPING_FORWARD";
      }

      // General learning insight after sufficient interaction
      if (
        interactionCount >= PATTERNS.LEARNING_INSIGHT.threshold &&
        !dismissed.includes("LEARNING_INSIGHT")
      ) {
        return "LEARNING_INSIGHT";
      }

      return null;
    };

    const detectedPattern = detectPatterns();

    if (detectedPattern && detectedPattern !== activeGuidance) {
      setActiveGuidance(detectedPattern);
      setShowGuidance(true);

      // Auto-hide guidance after 15 seconds
      const timer = setTimeout(() => {
        setShowGuidance(false);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [interactionData, videoPosition, dismissed, activeGuidance]);

  // Handle dismissal
  const handleDismiss = () => {
    if (activeGuidance) {
      setDismissed([...dismissed, activeGuidance]);
      setShowGuidance(false);
    }
  };

  // Handle action
  const handleAction = () => {
    if (activeGuidance && onAction) {
      onAction(activeGuidance);
      setShowGuidance(false);
    }
  };

  // Don't render if no guidance or if hidden
  if (!activeGuidance || !showGuidance) return null;

  const currentPattern = PATTERNS[activeGuidance];

  return (
    <Collapse in={showGuidance} animateOpacity>
      <Alert
        status={currentPattern.level}
        variant="subtle"
        flexDirection="column"
        alignItems="start"
        borderRadius="md"
        boxShadow="md"
        p={4}
        mt={4}
      >
        <Flex w="100%" justifyContent="space-between" alignItems="center">
          <Flex alignItems="center">
            <Icon as={currentPattern.icon} mr={2} boxSize="20px" />
            <AlertTitle mr={2}>{currentPattern.title}</AlertTitle>
            <Badge
              colorScheme={
                currentPattern.level === "info"
                  ? "blue"
                  : currentPattern.level === "warning"
                  ? "orange"
                  : "green"
              }
            >
              Learning Tip
            </Badge>
          </Flex>
          <CloseButton size="sm" onClick={handleDismiss} />
        </Flex>

        <AlertDescription mt={2}>{currentPattern.message}</AlertDescription>

        <Button
          size="sm"
          mt={3}
          colorScheme={
            currentPattern.level === "info"
              ? "blue"
              : currentPattern.level === "warning"
              ? "orange"
              : "green"
          }
          onClick={handleAction}
        >
          {currentPattern.action}
        </Button>
      </Alert>
    </Collapse>
  );
};

export default InteractionGuidance;
