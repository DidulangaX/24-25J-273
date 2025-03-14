import { Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function InterviewPractice() {
  return (
    <Container centerContent maxW="container.md" py={10}>
      <VStack spacing={6} textAlign="center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Heading color="#0056d2">Interview Practice</Heading>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Text fontSize="lg" color="gray.600">
            Get ready for real-world interviews with AI-driven feedback. Practice your skills and receive valuable insights to improve.
          </Text>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Button as={Link} to="/start-interview" colorScheme="blue" size="lg">
            Start Interview Practice
          </Button>
        </motion.div>
      </VStack>
    </Container>
  );
}
