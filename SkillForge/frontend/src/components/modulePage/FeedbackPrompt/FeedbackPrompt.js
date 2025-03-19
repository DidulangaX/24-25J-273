import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  RadioGroup,
  Radio,
  Stack,
  Textarea,
  useToast,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Collapse,
  Progress,
  Badge,
  Icon,
  VStack,
  HStack,
} from "@chakra-ui/react";
import {
  InfoOutlineIcon,
  CheckCircleIcon,
  StarIcon,
  ChatIcon,
} from "@chakra-ui/icons";
import axios from "axios";

const FeedbackPrompt = ({
  videoId,
  userId,
  interactionData,
  onFeedbackSubmit,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [difficultyRating, setDifficultyRating] = useState("");
  const [specificFeedback, setSpecificFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!interactionData) return;

    const shouldPrompt =
      (interactionData.session_duration > 120 && !isOpen) ||
      (interactionData.total_pauses > 5 &&
        interactionData.replay_frequency > 2);

    if (shouldPrompt && !showPrompt) {
      setShowPrompt(true);
    }
  }, [interactionData, isOpen, showPrompt]);

  const submitFeedback = async () => {
    if (!difficultyRating) {
      setError("Please select a difficulty rating");
      return;
    }

    if (!videoId || !userId) {
      setError("Missing videoId or userId");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log(
        `Submitting feedback for video ${videoId}: ${difficultyRating}`
      );

      const response = await axios.post(
        "http://localhost:5000/api/recommendations/feedback",
        {
          videoId,
          userId,
          perceivedDifficulty: difficultyRating,
          comments: specificFeedback,
          interactionData,
        }
      );

      console.log("Feedback response:", response.data);

      if (response.data && response.data.success) {
        setSubmissionResult(response.data);
        setSubmitted(true);

        toast({
          title: "Feedback Submitted",
          description:
            "Thank you for your input! We've personalized your learning path.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });

        if (onFeedbackSubmit && typeof onFeedbackSubmit === "function") {
          onFeedbackSubmit(difficultyRating, response.data);
        }
      } else {
        setError(
          response.data?.message ||
            "Error submitting feedback. Please try again."
        );
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error submitting feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitted) {
      setDifficultyRating("");
      setSpecificFeedback("");
      setShowPrompt(false);
      setSubmitted(false);
      setSubmissionResult(null);
    }
    onClose();
  };

  const getDifficultyColors = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return {
          bg: "green.50",
          border: "green.200",
          icon: "green.500",
        };
      case "justright":
        return {
          bg: "blue.50",
          border: "blue.200",
          icon: "blue.500",
        };
      case "difficult":
        return {
          bg: "red.50",
          border: "red.200",
          icon: "red.500",
        };
      default:
        return {
          bg: "gray.50",
          border: "gray.200",
          icon: "gray.500",
        };
    }
  };

  return (
    <>
      {/* Primary button that appears in the video player UI */}
      <Button
        colorScheme="blue"
        variant="outline"
        leftIcon={<InfoOutlineIcon />}
        onClick={onOpen}
        width={{ base: "full", md: "auto" }}
        size="md"
        fontWeight="medium"
        borderRadius="md"
        _hover={{ bg: "blue.50" }}
      >
        Rate This Content
      </Button>

      {/* Auto-prompt notification that appears after significant interaction */}
      {showPrompt && !isOpen && (
        <Flex
          position="fixed"
          bottom="30px"
          right="30px"
          bg="white"
          boxShadow="lg"
          borderRadius="lg"
          p={4}
          zIndex={999}
          maxW="300px"
          onClick={onOpen}
          cursor="pointer"
          borderLeftWidth="4px"
          borderLeftColor="blue.500"
          transition="all 0.3s ease"
          _hover={{ transform: "translateY(-5px)" }}
        >
          <Flex direction="column" width="100%">
            <Flex align="center" mb={2}>
              <ChatIcon mr={2} color="blue.500" />
              <Heading size="sm">Share Your Experience</Heading>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              Help us personalize your learning path by providing feedback on
              this content.
            </Text>
            <Button
              size="sm"
              colorScheme="blue"
              mt={3}
              width="full"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              Rate Content
            </Button>
          </Flex>
        </Flex>
      )}

      {/* Feedback Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent borderRadius="lg" boxShadow="xl">
          <ModalHeader></ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            {error && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {!submitted ? (
              <>
                <Text mb={4} color="gray.700">
                  Your feedback helps us personalize your learning journey and
                  recommend the most relevant resources.
                </Text>

                <Heading size="sm" mb={4} color="gray.700">
                  How would you rate the difficulty of this content?
                </Heading>

                <RadioGroup
                  onChange={setDifficultyRating}
                  value={difficultyRating}
                  mb={6}
                >
                  <Stack direction="column" spacing={3}>
                    <Radio
                      value="easy"
                      colorScheme="green"
                      size="lg"
                      padding={2}
                      borderWidth={1}
                      borderRadius="md"
                      borderColor={
                        difficultyRating === "easy" ? "green.300" : "gray.200"
                      }
                      bg={difficultyRating === "easy" ? "green.50" : "white"}
                    >
                      <Flex align="center" justify="space-between" width="100%">
                        <Box>
                          <Text fontWeight="bold">Easy</Text>
                          <Text fontSize="sm" color="gray.600">
                            I understood everything clearly
                          </Text>
                        </Box>
                        {difficultyRating === "easy" && (
                          <Box color="green.500">
                            <CheckCircleIcon boxSize={5} />
                          </Box>
                        )}
                      </Flex>
                    </Radio>

                    <Radio
                      value="justright"
                      colorScheme="blue"
                      size="lg"
                      padding={2}
                      borderWidth={1}
                      borderRadius="md"
                      borderColor={
                        difficultyRating === "justright"
                          ? "blue.300"
                          : "gray.200"
                      }
                      bg={
                        difficultyRating === "justright" ? "blue.50" : "white"
                      }
                    >
                      <Flex align="center" justify="space-between" width="100%">
                        <Box>
                          <Text fontWeight="bold">Just Right</Text>
                          <Text fontSize="sm" color="gray.600">
                            Appropriately challenging
                          </Text>
                        </Box>
                        {difficultyRating === "justright" && (
                          <Box color="blue.500">
                            <CheckCircleIcon boxSize={5} />
                          </Box>
                        )}
                      </Flex>
                    </Radio>

                    <Radio
                      value="difficult"
                      colorScheme="red"
                      size="lg"
                      padding={2}
                      borderWidth={1}
                      borderRadius="md"
                      borderColor={
                        difficultyRating === "difficult"
                          ? "red.300"
                          : "gray.200"
                      }
                      bg={difficultyRating === "difficult" ? "red.50" : "white"}
                    >
                      <Flex align="center" justify="space-between" width="100%">
                        <Box>
                          <Text fontWeight="bold">Challenging</Text>
                          <Text fontSize="sm" color="gray.600">
                            I struggled with this content
                          </Text>
                        </Box>
                        {difficultyRating === "difficult" && (
                          <Box color="red.500">
                            <CheckCircleIcon boxSize={5} />
                          </Box>
                        )}
                      </Flex>
                    </Radio>
                  </Stack>
                </RadioGroup>

                <Box mb={4}>
                  <Text mb={2} fontWeight="medium">
                    Additional comments (optional):
                  </Text>
                  <Textarea
                    value={specificFeedback}
                    onChange={(e) => setSpecificFeedback(e.target.value)}
                    placeholder="Which concepts were clear or challenging? Any specific topics you'd like to explore further?"
                    size="md"
                    resize="vertical"
                    borderRadius="md"
                    rows={4}
                    bg="gray.50"
                    _focus={{ bg: "white", borderColor: "blue.300" }}
                  />
                </Box>
              </>
            ) : (
              // Feedback submission result view
              <VStack spacing={6} align="stretch">
                <Box
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  {...getDifficultyColors(difficultyRating)}
                  borderColor={getDifficultyColors(difficultyRating).border}
                  bg={getDifficultyColors(difficultyRating).bg}
                >
                  <Flex align="center" mb={2}>
                    <Icon
                      as={StarIcon}
                      color={getDifficultyColors(difficultyRating).icon}
                      mr={2}
                    />
                    <Text fontWeight="bold">
                      You rated this content:
                      <Text as="span" ml={1}>
                        {difficultyRating === "easy"
                          ? "Easy"
                          : difficultyRating === "justright"
                          ? "Just Right"
                          : "Challenging"}
                      </Text>
                    </Text>
                  </Flex>

                  {specificFeedback && (
                    <Box mt={2} pl={6}>
                      <Text fontSize="sm" fontStyle="italic" color="gray.700">
                        "{specificFeedback}"
                      </Text>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Heading size="sm" mb={3}>
                    Based on your feedback, we recommend:
                  </Heading>
                  {submissionResult?.recommendations?.learningPath?.length >
                  0 ? (
                    <VStack align="stretch" spacing={2}>
                      {submissionResult.recommendations.learningPath.map(
                        (video, index) => (
                          <HStack
                            key={index}
                            p={3}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                            bg="gray.50"
                            _hover={{ bg: "blue.50", borderColor: "blue.200" }}
                            transition="all 0.2s"
                            spacing={3}
                          >
                            <Box
                              borderRadius="full"
                              bg="blue.500"
                              color="white"
                              width="24px"
                              height="24px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="sm"
                              fontWeight="bold"
                            >
                              {index + 1}
                            </Box>
                            <Text fontWeight="medium" flex={1}>
                              {video.title}
                            </Text>
                            <Badge
                              colorScheme={
                                video.difficultyLevel === "beginner"
                                  ? "green"
                                  : video.difficultyLevel === "advanced"
                                  ? "red"
                                  : "blue"
                              }
                            >
                              {video.difficultyLevel}
                            </Badge>
                          </HStack>
                        )
                      )}
                    </VStack>
                  ) : (
                    <Text color="gray.500">
                      No specific recommendations available at this time.
                    </Text>
                  )}
                </Box>

                {submissionResult?.recommendations?.learningTips?.length >
                  0 && (
                  <Box>
                    <Heading size="sm" mb={2}>
                      Learning Tips:
                    </Heading>
                    <VStack align="stretch" spacing={1}>
                      {submissionResult.recommendations.learningTips.map(
                        (tip, index) => (
                          <Flex key={index} align="flex-start">
                            <Box color="blue.500" mt={1} mr={2}>
                              <CheckCircleIcon boxSize={3} />
                            </Box>
                            <Text fontSize="sm">{tip}</Text>
                          </Flex>
                        )
                      )}
                    </VStack>
                  </Box>
                )}

                <Alert status="success" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">
                      Your learning path has been updated
                    </Text>
                    <Text fontSize="sm">
                      Continue your personalized journey with the recommended
                      resources
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.100">
            {!submitted ? (
              <>
                <Button mr={3} onClick={handleClose} variant="ghost">
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={submitFeedback}
                  isLoading={submitting}
                  loadingText="Submitting..."
                >
                  Submit Feedback
                </Button>
              </>
            ) : (
              <Button colorScheme="blue" onClick={handleClose}>
                Continue Learning
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FeedbackPrompt;
