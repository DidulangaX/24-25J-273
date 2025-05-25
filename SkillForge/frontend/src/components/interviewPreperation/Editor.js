// src/components/interviewPreperation/Editor.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Textarea,
  Button,
  VStack,
  Text,
  Spinner,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";

export default function Editor({ question, type }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const bg = useColorModeValue("gray.100", "gray.700");

  // Reset when question changes
  useEffect(() => {
    setAnswer("");
    setFeedback([]);
    setError("");
    setLoading(false);
  }, [question]);

  const handleSubmit = async () => {
    const authToken = Cookies.get("authToken");
    if (!authToken) {
      setError("Please log in to submit answers.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { answer, questionType: type , question };
      const response = await axios.post(
        "http://localhost:5001/api/interview/submit-answer",
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setFeedback(response.data.feedback);
      toast({ title: "Feedback received", status: "success", duration: 2000 });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4} w="100%">
      <Text fontSize="lg" fontWeight="semibold">
        {question}
      </Text>
      <Box w="100%" p={4} bg={bg} rounded="lg" shadow="sm">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={
            type === "coding"
              ? "Write your code here..."
              : "Type your theory answer..."
          }
          rows={6}
          fontFamily="mono"
        />
      </Box>
      {error && <Text color="red.500">{error}</Text>}
      <Button
        w="100%"
        colorScheme="brand"
        onClick={handleSubmit}
        isLoading={loading}
      >
        Submit Answer
      </Button>
      {feedback?.length > 0 && (
        <Box w="100%" p={4} bg={bg} rounded="lg" shadow="sm">
          <Text fontWeight="bold" mb={2}>
            Feedback:
          </Text>
          {feedback.map((f, i) => (
            <Text key={i} color={f.error_type === "No Errors Detected" ? "green.500" : "yellow.500"}>
              {f.error_type}: {f.explanation}
            </Text>
          ))}
        </Box>
      )}
    </VStack>
  );
}
