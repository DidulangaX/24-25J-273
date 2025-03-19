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

const PATTERNS = {
  EXCESSIVE_PAUSING: {
    threshold: 3,
    timeframe: 60,
    level: "info",
    title: "Pausing Frequently?",
    icon: FaPauseCircle,
    message:
      "You're pausing frequently. Consider taking notes to help retain this information.",
    action: "Try Note-Taking",
  },
  MULTIPLE_REPLAYS: {
    threshold: 2,
    timeframe: 120,
    level: "warning",
    title: "Repeating Content?",
    icon: FaUndo,
    message:
      "You've replayed this section multiple times. This might be a challenging concept.",
    action: "View Related Resources",
  },
  SKIPPING_FORWARD: {
    threshold: 3,
    timeframe: 60,
    level: "info",
    title: "Skipping Content?",
    icon: FaForward,
    message:
      "You're skipping through content quickly. Would you prefer more advanced material?",
    action: "Find Advanced Content",
  },
  LEARNING_INSIGHT: {
    threshold: 10,
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
    if (!interactionData || interactionData.interactionCount < 5) return;

    const detectPatterns = () => {
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

      if (
        totalPauses >= PATTERNS.EXCESSIVE_PAUSING.threshold &&
        lastPauseTime &&
        (currentTime - lastPauseTime) / 1000 <
          PATTERNS.EXCESSIVE_PAUSING.timeframe &&
        !dismissed.includes("EXCESSIVE_PAUSING")
      ) {
        return "EXCESSIVE_PAUSING";
      }

      if (
        replayEvents >= PATTERNS.MULTIPLE_REPLAYS.threshold &&
        lastReplayTime &&
        (currentTime - lastReplayTime) / 1000 <
          PATTERNS.MULTIPLE_REPLAYS.timeframe &&
        !dismissed.includes("MULTIPLE_REPLAYS")
      ) {
        return "MULTIPLE_REPLAYS";
      }

      if (
        seekForwardEvents >= PATTERNS.SKIPPING_FORWARD.threshold &&
        lastSkipTime &&
        (currentTime - lastSkipTime) / 1000 <
          PATTERNS.SKIPPING_FORWARD.timeframe &&
        !dismissed.includes("SKIPPING_FORWARD")
      ) {
        return "SKIPPING_FORWARD";
      }

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

      const timer = setTimeout(() => {
        setShowGuidance(false);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [interactionData, videoPosition, dismissed, activeGuidance]);

  const handleDismiss = () => {
    if (activeGuidance) {
      setDismissed([...dismissed, activeGuidance]);
      setShowGuidance(false);
    }
  };

  const handleAction = () => {
    if (activeGuidance && onAction) {
      onAction(activeGuidance);
      setShowGuidance(false);
    }
  };

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
