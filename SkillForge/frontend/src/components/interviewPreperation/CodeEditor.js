import { useState } from "react";
import { Box, Textarea, Button, VStack, Text } from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie"; // Import for authentication token

export default function CodeEditor({ question }) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState(""); // State to track errors

  const handleSubmit = async () => {
    try {
      const authToken = Cookies.get("authToken"); // Retrieve authentication token

      if (!authToken) {
        setError("Authentication required. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5001/api/interview/submit-answer",
        { code },
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Include token in request
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback(response.data.feedback);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Error submitting answer:", error);
      
      if (error.response && error.response.status === 401) {
        setError("Unauthorized access. Please log in again.");
      } else {
        setError("An error occurred while submitting your answer.");
      }
    }
  };

  return (
    <VStack spacing={4} width="100%">
      <Text fontSize="xl" fontWeight="bold">{question}</Text>
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
      />
      <Button colorScheme="blue" onClick={handleSubmit}>Submit Answer</Button>

      {/* Error Message Display */}
      {error && (
        <Box p={4} bg="blue.100" borderRadius="md" width="100%">
          <Text fontSize="lg" fontWeight="bold" color="red.600">
            {error}
          </Text>
        </Box>
      )}

      {/* Feedback Display */}
      {feedback.length > 0 && (
        <Box p={4} bg="gray.100" borderRadius="md" width="100%">
          <Text fontSize="lg" fontWeight="bold">Feedback:</Text>
          {feedback.map((err, idx) => (
            <Text key={idx} color={err.error_type === "No Errors Detected" ? "green.600" : "red.600"}>
              {err.error_type}: {err.explanation}
            </Text>
          ))}
        </Box>
      )}
    </VStack>
  );
}
