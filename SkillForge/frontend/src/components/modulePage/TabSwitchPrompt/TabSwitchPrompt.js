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
};

export default TabSwitchPrompt;
