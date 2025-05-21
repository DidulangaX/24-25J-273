import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Select,
  Button,
  Flex,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";

const TabSwitchPrompt = ({ videoId, userId, currentTime, onClose }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/videos/tab-switch-feedback", {
        videoId,
        userId,
        reason,
        position: currentTime,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Feedback received",
        description: "Thank you for your input!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error("Error submitting tab switch feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit your feedback. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="fixed"
      bottom="30px"
      right="30px"
      bg="white"
      boxShadow="lg"
      borderRadius="lg"
      p={4}
      zIndex={999}
      maxW="300px"
      borderLeftWidth="4px"
      borderLeftColor="purple.500"
      transition="all 0.3s ease"
      _hover={{ transform: "translateY(-5px)" }}
    >
      <Heading size="sm" mb={2}>
        Were you looking for help?
      </Heading>
      <Text fontSize="sm" mb={3}>
        We noticed you've been switching tabs. What were you looking for?
      </Text>
      <Select
        placeholder="Select reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        mb={2}
        size="sm"
      >
        <option value="search">Searching for more info</option>
        <option value="distracted">Got distracted</option>
        <option value="documentation">Looking for documentation</option>
        <option value="notes">Taking notes</option>
        <option value="other">Other reason</option>
      </Select>
      <Flex justify="space-between">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Dismiss
        </Button>
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={!reason}
        >
          Submit
        </Button>
      </Flex>
    </Box>
  );
};

export default TabSwitchPrompt;
