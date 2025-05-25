import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Spinner,
  Progress,
  Flex,
  Button,
  Text,
  useColorModeValue,
  Avatar,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";
import Editor from "./Editor";
import { FaVolumeUp } from "react-icons/fa";

export default function InterviewSession() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const bg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    (async () => {
      const token = Cookies.get("authToken");
      try {
        const res = await axios.get(
          "http://localhost:5001/api/interview/interview-questions",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuestions(res.data.questions);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNext = () => index < questions.length - 1 && setIndex(i => i + 1);
  const speak = text => speechSynthesis.speak(new SpeechSynthesisUtterance(text));

  if (loading) return (
    <Container centerContent h="100vh">
      <Spinner size="xl" />
    </Container>
  );

  const current = questions[index] || {};

  return (
    <Box bgGradient="linear(to-br, gray.500, gray.100)" minH="100vh" py={6} px={4}>
      <Flex align="center" mb={4}>
        <Avatar size="md" mr={3} name="Interviewer" src="/avatar.png" />
        <Text fontSize="2xl" fontWeight="bold">
          InterviewBot
        </Text>
      </Flex>

      <Container maxW="container.md" pt="160px" bg={bg} rounded="xl" shadow="xl" py={6}>
        <Box mb={4}>
          <Progress value={((index + 1) / questions.length) * 100} rounded="md" />
        </Box>

        <Flex align="center" justify="space-between" mb={6}>
          <Text fontSize="xl" fontWeight="semibold">
            Question {index + 1} of {questions.length}
          </Text>
          <Button
            variant="outline"
            leftIcon={<FaVolumeUp />}
            onClick={() => speak(current.question)}
          >
            Listen
          </Button>
        </Flex>

        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Editor question={current.question} type={current.questionType} />
        </motion.div>

        <Flex justify="flex-end" mt={8}>
          <Button colorScheme="brand" onClick={handleNext}>
            {index < questions.length - 1 ? "Next" : "Finish"}
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
