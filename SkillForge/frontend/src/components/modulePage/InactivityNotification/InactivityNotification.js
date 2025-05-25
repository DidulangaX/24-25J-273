// src/components/modulePage/InactivityNotification/InactivityNotification.js
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Text,
  HStack,
  VStack,
  Flex,
  Circle,
  useColorModeValue,
  Icon,
  Progress,
  Fade,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaEye, FaClock, FaPlay } from "react-icons/fa";

// Pulse animation for urgency
const pulseRing = keyframes`
  0% { transform: scale(0.33); }
  40%, 50% { opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
`;

const InactivityNotification = ({
  onResume,
  onClose,
  onTimeout,
  responseTimeSeconds = 15,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(responseTimeSeconds);
  const [hasResponded, setHasResponded] = useState(false);
  const intervalRef = useRef(null);

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subtleTextColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    // FIXED: Proper countdown timer with ref cleanup
    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;

        if (newTime <= 0) {
          // Clear interval when time is up
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (!hasResponded) {
            // User didn't respond - trigger timeout
            setIsVisible(false);
            setTimeout(() => {
              onTimeout(); // This will mark user as inactive
              onClose();
            }, 500);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Remove dependencies to prevent timer restart

  const handleResume = () => {
    if (hasResponded) return; // Prevent multiple calls

    setHasResponded(true);

    // Clear the timer immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsVisible(false);
    setTimeout(() => {
      onResume(); // This will reset the inactivity timer
      onClose();
    }, 300);
  };

  const handleDismiss = () => {
    if (hasResponded) return; // Prevent multiple calls

    setHasResponded(true);

    // Clear the timer immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const progressValue =
    ((responseTimeSeconds - timeLeft) / responseTimeSeconds) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <Fade in={isVisible}>
      <Box
        position="fixed"
        top="50%" // FIXED: Positioned in center of screen instead of top
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1500}
        maxW="480px"
        w="90%"
      >
        {/* Professional Alert Card */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          boxShadow="2xl"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
          position="relative"
        >
          {/* Header with gradient */}
          <Box
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            p={4}
            color="white"
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={3}>
                <Circle size="40px" bg="whiteAlpha.200" position="relative">
                  <Icon as={FaEye} boxSize={5} />
                  {isUrgent && (
                    <Circle
                      size="40px"
                      position="absolute"
                      border="2px solid"
                      borderColor="red.300"
                      animation={`${pulseRing} 1.5s infinite`}
                    />
                  )}
                </Circle>
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={1}>
                    Still Watching?
                  </Text>
                  <Text fontSize="sm" opacity={0.9}>
                    We haven't detected any activity
                  </Text>
                </Box>
              </HStack>

              {/* Time Circle */}
              <Circle
                size="50px"
                bg={isUrgent ? "red.500" : "whiteAlpha.200"}
                color="white"
                fontSize="sm"
                fontWeight="bold"
                border="3px solid"
                borderColor={isUrgent ? "red.300" : "whiteAlpha.300"}
                transition="all 0.3s ease"
              >
                {timeLeft}s
              </Circle>
            </Flex>
          </Box>

          {/* Body */}
          <Box p={6}>
            <VStack spacing={4} align="stretch">
              <Text color={textColor} fontSize="md" textAlign="center">
                Click below to continue your learning session, or we'll pause
                automatically.
              </Text>

              {/* Progress Bar */}
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text
                    fontSize="xs"
                    color={subtleTextColor}
                    fontWeight="medium"
                  >
                    Auto-pause in:
                  </Text>
                  <Text
                    fontSize="xs"
                    color={isUrgent ? "red.500" : "blue.500"}
                    fontWeight="bold"
                  >
                    {timeLeft} seconds
                  </Text>
                </Flex>
                <Progress
                  value={progressValue}
                  size="md"
                  colorScheme={isUrgent ? "red" : "blue"}
                  bg="gray.100"
                  borderRadius="full"
                  transition="all 0.3s ease"
                />
                {isUrgent && (
                  <Text
                    fontSize="xs"
                    color="red.500"
                    fontWeight="medium"
                    mt={2}
                    textAlign="center"
                  >
                    ⚠️ Session will pause soon...
                  </Text>
                )}
              </Box>

              {/* Action Buttons */}
              <VStack spacing={3}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  leftIcon={<Icon as={FaPlay} />}
                  onClick={handleResume}
                  boxShadow="md"
                  _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                  transition="all 0.2s ease"
                  fontWeight="medium"
                  fontSize="md"
                >
                  Yes, Continue Learning
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleDismiss}
                  color={subtleTextColor}
                  _hover={{ bg: "gray.100" }}
                  fontSize="sm"
                >
                  Pause Session
                </Button>
              </VStack>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default InactivityNotification;
