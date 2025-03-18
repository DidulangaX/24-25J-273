import { useState, useEffect } from "react";
import { Button, Container, Text, VStack, Box, Spinner, Progress, Flex, IconButton } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { FaVolumeUp } from "react-icons/fa"; // Import speaker icon
import CodeEditor from "./CodeEditor"; // Import CodeEditor for coding questions
import AnswerEditor from "./AnswerEditor";

export default function InterviewSession() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedText, setAnimatedText] = useState("");
  const [roboExpression, setRoboExpression] = useState("🤔"); // Thinking emoji
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const authToken = Cookies.get("authToken");
        if (!authToken) {
          console.error("No auth token found");
          return;
        }

        const response = await axios.get("http://localhost:5001/api/interview/interview-questions", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
          setQuestions(response.data.questions);
          setAnimatedText(response.data.questions[0]?.question || "Welcome to your interview!");
          setRoboExpression("🤔"); // Thinking emoji when question is displayed
          playTextToSpeech(response.data.questions[0]?.question || "Welcome to your interview!"); // Speak question
        } else {
          console.error("API response does not contain a valid questions array", response.data);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const playTextToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // Set language
      utterance.rate = 1; // Adjust speech speed if needed
      speechSynthesis.speak(utterance);
    } else {
      console.error("Text-to-Speech is not supported in this browser.");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setRoboExpression("😊"); // Smiling before moving to next question
      setTimeout(() => {
        const nextQuestion = questions[currentQuestionIndex + 1]?.question || "Good job! Interview complete.";
        setCurrentQuestionIndex((prev) => prev + 1);
        setAnimatedText(nextQuestion);
        setRoboExpression("🤔"); // Back to thinking when new question appears
        playTextToSpeech(nextQuestion); // Speak new question
      }, 500);
    } else {
      navigate("/interview-complete");
    }
  };

  if (loading) {
    return (
      <Container
        centerContent
        maxW="container.lg"
        h="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
      >
        <Spinner size="xl" color="white" />
      </Container>
    );
  }

  return (
    <Container
      centerContent
      maxW="1000px"
      h="600px"
      mt={12} // Move interview container down
      py={6}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      bg="gray.50"
      borderRadius="12px"
      boxShadow="xl"
      border="4px solid #2b6cb0"
      px={12}
    >
      {/* Progress Bar */}
      <Box width="100%" mt={2} mb={2}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        >
          <Progress
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            size="sm"
            colorScheme="blue"
            borderRadius="8px"
          />
        </motion.div>
      </Box>

      {/* IntervuBot Title */}
      <Text fontSize="xl" fontWeight="bold" color="blue.700" textAlign="center">
        IntervuBot
      </Text>

      {/* Animated Robo Character */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.9, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <motion.img
            src="images/robo-avatar.png"
            alt="IntervuBot"
            width="100px"
            height="100px"
            animate={{ rotate: [0, -2, 2, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "mirror" }}
          />
          {/* Robo Expression */}
          <Text fontSize="2xl" mt={1}>{roboExpression}</Text>
        </Box>
      </motion.div>

      {/* Speech Bubble with Sound Button */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          bg="blue.600"
          color="white"
          p={5}
          borderRadius="10px"
          boxShadow="md"
          maxW="80%"
          textAlign="center"
          mt={4}
          position="relative"
        >
          <Text fontSize="lg" fontWeight="medium">{animatedText}</Text>

          {/* Sound Button */}
          <IconButton
            aria-label="Play Question"
            icon={<FaVolumeUp />}
            colorScheme="whiteAlpha"
            color="white"
            size="sm"
            position="absolute"
            bottom="-10px"
            right="-10px"
            onClick={() => playTextToSpeech(animatedText)}
          />
        </Box>
      </motion.div>

      {/* Code Editor for Coding Questions */}
      {questions[currentQuestionIndex]?.questionType === "coding" && (
        <CodeEditor question={animatedText} />
      )}
      {/* Code Editor for Coding Questions */}
      {questions[currentQuestionIndex]?.questionType === "theory" && (
        <AnswerEditor question={animatedText} />
      )}

      {/* Next Button Positioned to the Right */}
      <Flex justify="flex-end" width="100%" mt={5}>
        <motion.div whileHover={{ scale: 1.05 }}>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleNextQuestion}
            boxShadow="md"
            borderRadius="8px"
          >
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
          </Button>
        </motion.div>
      </Flex>
    </Container>
  );
}
