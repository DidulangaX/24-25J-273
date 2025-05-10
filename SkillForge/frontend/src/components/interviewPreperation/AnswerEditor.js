import { useState, useEffect } from "react";
import { Box, Textarea, Button, VStack, Text } from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";

export default function AnswerEditor({ question }) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = "en-US";

      recog.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCode(transcript);
      };

      recog.onerror = (event) => {
        console.error("Speech recognition error:", event);
        setError("Speech recognition error occurred.");
      };

      setRecognition(recog);
    } else {
      setError("Speech recognition is not supported in your browser.");
    }
  }, []);

  const handleStartStop = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const authToken = Cookies.get("authToken");
      if (!authToken) {
        setError("Authentication required. Please log in.");
        return;
      }
      const response = await axios.post(
        "http://localhost:5001/api/interview/submit-theory-answer",
        { code },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback(response.data.feedback);
      setError("");
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
      <Text fontSize="xl" fontWeight="bold">
        {question}
      </Text>
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
      />
      <Button colorScheme="blue" onClick={handleStartStop}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </Button>
      <Button colorScheme="blue" onClick={handleSubmit}>
        Submit Answer
      </Button>

      {/* Error Message Display */}
      {error && (
        <Box p={4} bg="red.100" borderRadius="md" width="100%">
          <Text fontSize="lg" fontWeight="bold" color="red.600">
            {error}
          </Text>
        </Box>
      )}

      {/* Feedback Display */}
      {feedback.length > 0 && (
        <Box p={4} bg="gray.100" borderRadius="md" width="100%">
          <Text fontSize="lg" fontWeight="bold">
            Feedback:
          </Text>
          {feedback.map((err, idx) => (
            <Text
              key={idx}
              color={err.error_type === "No Errors Detected" ? "green.600" : "red.600"}
            >
              {err.error_type}: {err.explanation}
            </Text>
          ))}
        </Box>
      )}
    </VStack>
  );
}
