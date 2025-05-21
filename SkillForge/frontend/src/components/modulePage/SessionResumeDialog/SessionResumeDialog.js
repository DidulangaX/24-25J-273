// src/components/modulePage/SessionResumeDialog/SessionResumeDialog.js
import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Flex,
  Icon,
  Badge,
  Box,
  Progress,
} from "@chakra-ui/react";
import { FaHistory, FaRegClock, FaRegCalendarAlt } from "react-icons/fa";

const SessionResumeDialog = ({
  isOpen,
  onClose,
  onResume,
  onStartOver,
  sessionData,
  videoDuration,
}) => {
  if (!sessionData) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const calculateCompletionPercentage = () => {
    if (!videoDuration || !sessionData.lastPosition) return 0;
    return Math.min(
      Math.round((sessionData.lastPosition / videoDuration) * 100),
      100
    );
  };

  const timeSinceLastSession = () => {
    if (!sessionData.lastUpdated) return "Unknown";
    const now = Date.now();
    const diff = now - sessionData.lastUpdated;

    // Convert to appropriate time unit
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="lg" boxShadow="xl">
        <ModalHeader>Resume Your Learning Session</ModalHeader>

        <ModalBody>
          <Text mb={4}>
            We noticed you previously watched this video. Would you like to
            continue where you left off?
          </Text>

          <Box
            p={4}
            borderRadius="md"
            bg="blue.50"
            mb={4}
            borderLeft="4px solid"
            borderLeftColor="blue.500"
          >
            <Flex align="center" mb={3}>
              <Icon as={FaHistory} color="blue.500" mr={2} />
              <Text fontWeight="medium">Previous session details:</Text>
            </Flex>

            <Flex direction="column" gap={2}>
              <Flex align="center">
                <Icon as={FaRegClock} color="blue.700" mr={2} />
                <Text fontSize="sm">
                  Last position: {formatTime(sessionData.lastPosition)}
                </Text>
              </Flex>

              <Flex align="center">
                <Icon as={FaRegCalendarAlt} color="blue.700" mr={2} />
                <Text fontSize="sm">
                  Last watched: {timeSinceLastSession()}
                </Text>
              </Flex>

              <Box mt={2}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs">Progress</Text>
                  <Badge colorScheme="blue">
                    {calculateCompletionPercentage()}%
                  </Badge>
                </Flex>
                <Progress
                  value={calculateCompletionPercentage()}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>
            </Flex>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} variant="ghost" onClick={onStartOver}>
            Start from Beginning
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => onResume(sessionData.lastPosition)}
          >
            Resume from {formatTime(sessionData.lastPosition)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SessionResumeDialog;
