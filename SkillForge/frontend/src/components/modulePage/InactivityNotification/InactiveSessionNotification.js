// src/components/modulePage/InactivityNotification/InactiveSessionNotification.js
import React, { useState } from "react";
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
  Fade,
  Badge,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaPause, FaPlay, FaUserClock, FaRedo } from "react-icons/fa";

// Gentle pulse animation
const gentlePulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const InactiveSessionNotification = ({ onResume, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subtleTextColor = useColorModeValue("gray.500", "gray.400");

  const handleResume = () => {
    setIsVisible(false);
    setTimeout(() => {
      onResume();
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Fade in={isVisible}>
      <Box
        position="fixed"
        bottom="80px" // FIXED: Positioned at bottom instead of blocking video
        right="20px"
        zIndex={1000}
        maxW="400px"
        w="90%"
      >
        {/* Professional Inactive Card */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
          position="relative"
        >
          {/* Header with muted gradient */}
          <Box
            bg="linear-gradient(135deg, #718096 0%, #4A5568 100%)"
            p={4}
            color="white"
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={3}>
                <Circle size="40px" bg="whiteAlpha.200" position="relative">
                  <Icon as={FaPause} boxSize={4} />
                  <Circle
                    size="40px"
                    position="absolute"
                    border="2px solid"
                    borderColor="whiteAlpha.400"
                    animation={`${gentlePulse} 2s infinite`}
                  />
                </Circle>
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={1}>
                    Session Paused
                  </Text>
                  <Text fontSize="xs" opacity={0.9}>
                    Due to inactivity
                  </Text>
                </Box>
              </HStack>

              <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                INACTIVE
              </Badge>
            </Flex>
          </Box>

          {/* Body */}
          <Box p={5}>
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Circle size="24px" bg="gray.100" color="gray.600">
                  <Icon as={FaUserClock} boxSize={3} />
                </Circle>
                <Text color={textColor} fontSize="sm">
                  Your learning session has been paused to save progress.
                </Text>
              </HStack>

              {/* Action Buttons */}
              <VStack spacing={2}>
                <Button
                  colorScheme="blue"
                  size="md"
                  width="full"
                  leftIcon={<Icon as={FaPlay} />}
                  onClick={handleResume}
                  boxShadow="sm"
                  _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                  transition="all 0.2s ease"
                  fontWeight="medium"
                >
                  Resume Learning
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  color={subtleTextColor}
                  _hover={{ bg: "gray.50" }}
                  fontSize="xs"
                  leftIcon={<Icon as={FaRedo} boxSize={3} />}
                >
                  Dismiss
                </Button>
              </VStack>

              <Text fontSize="xs" color={subtleTextColor} textAlign="center">
                💡 Move your mouse or click anywhere to resume
              </Text>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default InactiveSessionNotification;
