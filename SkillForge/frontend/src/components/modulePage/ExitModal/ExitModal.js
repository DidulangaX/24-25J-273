// src/components/modulePage/ExitModal/ExitModal.js
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
  VStack,
  HStack,
  RadioGroup,
  Radio,
  Textarea,
  Box,
  Flex,
  Icon,
  Badge,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  FaSignOutAlt,
  FaPlay,
  FaSave,
  FaClock,
  FaChartLine,
} from "react-icons/fa";

const ExitModal = ({
  isOpen,
  onClose,
  exitReason,
  setExitReason,
  exitComment,
  setExitComment,
  onContinue,
  onSubmitAndExit,
  onForceExit,
  isSubmitting,
  sessionDuration,
  formatDuration,
  engagementScore,
  exitAttempts,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="lg"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl" boxShadow="2xl" maxW="500px">
        <ModalHeader
          bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          color="white"
          borderTopRadius="xl"
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Icon as={FaSignOutAlt} boxSize={6} />
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  Hold on! 🛑
                </Text>
                <Text fontSize="sm" opacity={0.9}>
                  Before you leave your learning session...
                </Text>
              </Box>
            </HStack>
            <VStack spacing={1}>
              <Badge
                bg="whiteAlpha.200"
                color="white"
                px={3}
                py={1}
                borderRadius="full"
              >
                {formatDuration(sessionDuration)} learned
              </Badge>
              <Badge
                bg="whiteAlpha.200"
                color="white"
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {exitAttempts} exit attempts
              </Badge>
            </VStack>
          </Flex>
        </ModalHeader>

        <ModalBody p={6}>
          <VStack spacing={5} align="stretch">
            {/* Progress Alert */}
            <Alert
              status="info"
              borderRadius="lg"
              bg="blue.50"
              border="1px"
              borderColor="blue.200"
            >
              <AlertIcon color="blue.500" />
              <Box>
                <Text fontWeight="medium" color="blue.800">
                  Your progress will be saved automatically
                </Text>
                <Text fontSize="sm" color="blue.600">
                  You can resume from where you left off anytime
                </Text>
              </Box>
            </Alert>

            {/* Session Stats */}
            <HStack spacing={4} p={4} bg="gray.50" borderRadius="lg">
              <HStack>
                <Icon as={FaClock} color="gray.600" />
                <Text fontSize="sm" color="gray.700">
                  <strong>{formatDuration(sessionDuration)}</strong> learned
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaChartLine} color="green.600" />
                <Text fontSize="sm" color="gray.700">
                  <strong>{engagementScore}%</strong> engagement
                </Text>
              </HStack>
            </HStack>

            {/* Exit Reason Selection */}
            <Box>
              <Text fontWeight="medium" mb={3} color="gray.800">
                What's your primary reason for leaving?
              </Text>
              <RadioGroup value={exitReason} onChange={setExitReason}>
                <VStack align="stretch" spacing={3}>
                  <Radio value="time_constraint" colorScheme="purple">
                    <Box>
                      <Text fontWeight="medium">Don't have enough time</Text>
                      <Text fontSize="sm" color="gray.500">
                        Need to handle other priorities right now
                      </Text>
                    </Box>
                  </Radio>

                  <Radio value="found_better_resource" colorScheme="purple">
                    <Box>
                      <Text fontWeight="medium">
                        Found better learning material
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Discovered more suitable content elsewhere
                      </Text>
                    </Box>
                  </Radio>

                  <Radio value="completed_objective" colorScheme="purple">
                    <Box>
                      <Text fontWeight="medium">Got what I needed</Text>
                      <Text fontSize="sm" color="gray.500">
                        Learned enough for my current goal
                      </Text>
                    </Box>
                  </Radio>
                </VStack>
              </RadioGroup>
            </Box>

            {/* Optional Comment */}
            <Box>
              <Text fontWeight="medium" mb={2} color="gray.800">
                Any additional feedback? (optional)
              </Text>
              <Textarea
                value={exitComment}
                onChange={(e) => setExitComment(e.target.value)}
                placeholder="Help us improve your learning experience..."
                rows={3}
                resize="vertical"
                borderColor="gray.300"
                _focus={{
                  borderColor: "purple.400",
                  boxShadow: "0 0 0 1px #9F7AEA",
                }}
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="1px"
          borderColor="gray.200"
          bg="gray.50"
          borderBottomRadius="xl"
        >
          <VStack spacing={3} width="100%">
            <HStack spacing={3} width="100%">
              <Button
                leftIcon={<Icon as={FaPlay} />}
                colorScheme="green"
                flex="1"
                onClick={onContinue}
                size="lg"
                fontWeight="medium"
              >
                Continue Learning
              </Button>

              <Button
                leftIcon={<Icon as={FaSave} />}
                colorScheme="purple"
                flex="1"
                onClick={onSubmitAndExit}
                isDisabled={!exitReason}
                isLoading={isSubmitting}
                loadingText="Saving..."
                size="lg"
                fontWeight="medium"
              >
                Submit & Exit
              </Button>
            </HStack>

            <Button
              variant="ghost"
              size="sm"
              onClick={onForceExit}
              color="gray.600"
              _hover={{ bg: "gray.100" }}
              leftIcon={<Icon as={FaSignOutAlt} />}
            >
              Exit without feedback
            </Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExitModal;
