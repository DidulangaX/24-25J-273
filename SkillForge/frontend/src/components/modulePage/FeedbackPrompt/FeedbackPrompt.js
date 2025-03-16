/* eslint-disable react-hooks/exhaustive-deps */
// src/components/modulePage/FeedbackPrompt/FeedbackPrompt.js
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
} from "@chakra-ui/react";
import { InfoIcon, ChatIcon } from "@chakra-ui/icons";
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
  const toast = useToast();

  // Check if we should automatically prompt the user based on interaction data
  useEffect(() => {
    if (!interactionData) return;

    // Show prompt after significant interaction (e.g., watching 70% of video or showing signs of difficulty)
    const shouldPrompt =
      (interactionData.session_duration > 120 && !isOpen) || // After 2 minutes
      (interactionData.total_pauses > 5 &&
        interactionData.replay_frequency > 2); // Signs of difficulty

    if (shouldPrompt && !showPrompt) {
      setShowPrompt(true);
    }
  }, [interactionData, isOpen]);

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

      // Use the new endpoint for personalized recommendations
      const response = await axios.post(
        "http://localhost:5000/api/recommendations/feedback",
        {
          videoId,
          userId,
          perceivedDifficulty: difficultyRating,
          comments: specificFeedback,
          interactionData, // Pass the interaction data for better personalization
        }
      );

      console.log("Feedback response:", response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast({
          title: "Feedback submitted",
          description:
            "Thank you for your feedback! We've personalized recommendations for you.",
          status: "success",
          duration: 3000,
        });

        // Pass data to parent component
        if (onFeedbackSubmit && typeof onFeedbackSubmit === "function") {
          onFeedbackSubmit(difficultyRating, response.data);
        }

        // Reset form and close modal
        setDifficultyRating("");
        setSpecificFeedback("");
        setShowPrompt(false);
        onClose();
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
    setError(null);
    setDifficultyRating("");
    setSpecificFeedback("");
    setShowPrompt(false);
    onClose();
  };

  return (
    <>
      {/* Regular button */}
      <Button
        colorScheme="green"
        leftIcon={<InfoIcon />}
        onClick={onOpen}
        width={{ base: "full", md: "auto" }}
      >
        Rate Video Difficulty
      </Button>

      {/* Auto-prompt notification that appears after significant interaction */}
      {showPrompt && !isOpen && (
        <Box
          position="fixed"
          bottom="20px"
          right="20px"
          bg="white"
          boxShadow="lg"
          borderRadius="md"
          p={4}
          zIndex={999}
          maxW="300px"
          onClick={onOpen}
          cursor="pointer"
          borderLeftWidth="4px"
          borderLeftColor="green.500"
        >
          <Flex align="center" mb={2}>
            <ChatIcon mr={2} color="green.500" />
            <Heading size="sm">How was this content?</Heading>
          </Flex>
          <Text fontSize="sm">
            Share your thoughts to help us recommend better content for your
            learning style.
          </Text>
          <Button
            size="sm"
            colorScheme="green"
            mt={2}
            width="full"
            onClick={onOpen}
          >
            Give Feedback
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How difficult was this content?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <Text mb={4}>
              Your feedback helps us personalize your learning experience and
              recommend the most helpful resources.
            </Text>
            <RadioGroup
              onChange={setDifficultyRating}
              value={difficultyRating}
              mb={6}
            >
              <Stack direction="column" spacing={4}>
                <Radio value="easy" size="lg" colorScheme="green">
                  <Flex
                    align="center"
                    direction="column"
                    alignItems="flex-start"
                  >
                    <Text fontWeight="bold">Easy</Text>
                    <Text fontSize="sm" color="gray.600">
                      I understood everything easily
                    </Text>
                  </Flex>
                </Radio>
                <Radio value="justright" size="lg" colorScheme="blue">
                  <Flex
                    align="center"
                    direction="column"
                    alignItems="flex-start"
                  >
                    <Text fontWeight="bold">Just Right</Text>
                    <Text fontSize="sm" color="gray.600">
                      Challenging but manageable
                    </Text>
                  </Flex>
                </Radio>
                <Radio value="difficult" size="lg" colorScheme="red">
                  <Flex
                    align="center"
                    direction="column"
                    alignItems="flex-start"
                  >
                    <Text fontWeight="bold">Difficult</Text>
                    <Text fontSize="sm" color="gray.600">
                      I struggled with this content
                    </Text>
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
                placeholder="Which parts were easy or challenging? What topics would you like to learn next?"
                size="md"
                resize="vertical"
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={handleClose} variant="ghost">
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={submitFeedback}
              isLoading={submitting}
              loadingText="Submitting..."
            >
              Submit Feedback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FeedbackPrompt;
