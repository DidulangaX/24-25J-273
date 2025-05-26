// frontend/src/components/communitysupport/QuestionDetailPage.js
import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie'; // Import js-cookie
import { jwtDecode } from 'jwt-decode';

import {
  Flex,
  Heading,
  Text,
  Button,
  Box,
  Avatar,
  Badge,
  Divider,
  Stack,
  Textarea,
  useToast,
  Spinner,
  List,
  ListItem,
  HStack,
  VStack,
  IconButton,
  useColorModeValue, // Import useColorModeValue
  Card,
  CardBody,
  Tooltip,
  Grid, 
  Input // For edit mode
} from '@chakra-ui/react';
import {
  FaComment,
  FaThumbsUp,
  FaThumbsDown,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';

function QuestionDetailPage() {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [answers, setAnswers] = useState([]); // Initialize as empty array
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const toast = useToast();
  const authToken = Cookies.get('authToken');
  const decodedToken = authToken ? jwtDecode(authToken) : null;
  const currentUserId = decodedToken ? decodedToken.userId : null;
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');

  // --- Color mode values for consistent theming ---
  const bgColor = useColorModeValue('blue.50', 'gray.900'); // Lighter blue for light mode, dark gray for dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.100', 'gray.600'); // Slightly bluer border
  const textColor = useColorModeValue('gray.700', 'gray.300'); // Darker text for light mode
  const headingColor = useColorModeValue('blue.700', 'white'); // Blue headings
  const inputBg = useColorModeValue('white', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300'); // Consistent accent for icons/highlights
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400'); // For dates, small info

  // --- Fetch Question Details ---
  const fetchQuestionDetails = useCallback(async () => {
    setLoadingQuestion(true);
    try {
      const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}`);
      console.log("Question Details API Response:", response.data);
      setQuestion(response.data);
    } catch (error) {
      console.error("Error fetching question details:", error);
      toast({
        title: "Error loading question.",
        description: "Failed to load question details.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingQuestion(false);
    }
  }, [questionId, toast]);

  // --- Fetch Answers ---
  const fetchAnswers = useCallback(async () => {
    setLoadingAnswers(true);
    try {
      const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}/answers`);
      console.log("Answers API Response:", response.data);
      // Ensure answers are sorted by creation date, newest first
      const sortedAnswers = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnswers(sortedAnswers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      toast({
        title: "Error loading answers.",
        description: "Failed to load answers for this question.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAnswers(false);
    }
  }, [questionId, toast]);

  // --- Initial Data Load ---
  useEffect(() => {
    const loadData = async () => {
      await fetchQuestionDetails();
      await fetchAnswers();
    };
    loadData();
  }, [fetchQuestionDetails, fetchAnswers]);

  // --- Upvote Answer ---
  const handleUpvoteAnswer = async (answerId) => {
    if (!authToken) {
      toast({
        title: "Authentication required.",
        description: "Please log in to vote.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      await axios.post(
        `http://localhost:5002/api/community/answers/${answerId}/upvote`, {}, { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({ title: "Answer upvoted!", status: "success", duration: 1500, isClosable: true });
      fetchAnswers();
    } catch (error) {
      console.error("Error upvoting answer:", error);
      toast({
        title: "Error upvoting answer.",
        description: error.response?.data?.message || "Failed to upvote the answer.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- Downvote Answer ---
  const handleDownvoteAnswer = async (answerId) => {
    if (!authToken) {
      toast({
        title: "Authentication required.",
        description: "Please log in to vote.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      await axios.post(
        `http://localhost:5002/api/community/answers/${answerId}/downvote`, {}, { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({ title: "Answer downvoted!", status: "info", duration: 1500, isClosable: true });
      fetchAnswers();
    } catch (error) {
      console.error("Error downvoting answer:", error);
      toast({
        title: "Error downvoting answer.",
        description: error.response?.data?.message || "Failed to downvote the answer.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- Post New Answer ---
  const handlePostAnswer = async () => {
    if (!authToken) {
      toast({
        title: "Authentication required.",
        description: "Please log in to answer questions.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!answerContent.trim()) {
      toast({ title: "Please enter your answer.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      await axios.post(
        'http://localhost:5002/api/community/answers/',
        { questionId: questionId, content: answerContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({ title: "Answer posted!", status: "success", duration: 3000, isClosable: true });
      setAnswerContent('');
      fetchAnswers(); // Refresh answers
    } catch (error) {
      console.error("Error posting answer:", error);
      toast({
        title: "Error posting answer.",
        description: error.response?.data?.message || "Failed to submit your answer.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- Handle Edit Answer ---
  const handleEditAnswer = (answer) => {
    setEditingAnswerId(answer._id);
    setEditAnswerContent(answer.content);
  };

  // --- Update Answer ---
  const handleUpdateAnswer = async (answerId) => {
    if (!authToken) {
      toast({
        title: "Authentication required.",
        description: "Please log in to update your answer.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!editAnswerContent.trim()) {
      toast({ title: "Answer content cannot be empty.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      await axios.put(
        `http://localhost:5002/api/community/answers/${answerId}`,
        { content: editAnswerContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({ title: "Answer updated!", status: "success", duration: 3000, isClosable: true });
      setEditingAnswerId(null); // Exit editing mode
      fetchAnswers(); // Refresh answers
    } catch (error) {
      console.error("Error updating answer:", error);
      toast({
        title: "Error updating answer.",
        description: error.response?.data?.message || "Failed to update your answer.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- Delete Answer ---
  const handleDeleteAnswer = async (answerId) => {
    if (!authToken) {
      toast({
        title: "Authentication required.",
        description: "Please log in to delete your answer.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (window.confirm("Are you sure you want to delete this answer?")) {
      try {
        await axios.delete(
          `http://localhost:5002/api/community/answers/${answerId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        toast({ title: "Answer deleted!", status: "success", duration: 3000, isClosable: true });
        fetchAnswers(); // Refresh answers
      } catch (error) {
        console.error("Error deleting answer:", error);
        toast({
          title: "Error deleting answer.",
          description: error.response?.data?.message || "Failed to delete the answer.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // --- Helper function for urgency badge ---
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'High': return <FaExclamationTriangle />;
      case 'Medium': return <FaClock />;
      case 'Low': return <FaCheckCircle />;
      default: return <FaClock />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  // --- Render Logic ---
  if (loadingQuestion) {
    return (
      <Flex direction="column" p={5} bg={bgColor} minH="calc(100vh - 80px)" paddingTop={20} align="center">
        <Card bg={cardBg} borderRadius="md" boxShadow="md" p={5} maxWidth="container.md" width="100%">
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="lg" thickness="4px" speed="0.65s" color="blue.500" />
            <Text ml={4} color={textColor}>Loading question details...</Text>
          </Flex>
        </Card>
      </Flex>
    );
  }

  if (!question) {
    return (
      <Flex direction="column" p={5} bg={bgColor} minH="calc(100vh - 80px)" paddingTop={20} align="center">
        <Card bg={cardBg} borderRadius="md" boxShadow="md" p={5} maxWidth="container.md" width="100%" textAlign="center">
          <Heading size="md" color="red.500">Question not found.</Heading>
          <Text mt={2} color={textColor}>The question you are looking for might have been deleted or doesn't exist.</Text>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      p={5}
      bg={bgColor}
      minH="calc(100vh - 80px)"
      paddingTop={20}
      align="center"
    >
      <Card bg={cardBg} borderRadius="lg" boxShadow="xl" p={6} maxWidth="container.lg" width="100%" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          {/* Question Section */}
          <Grid
            templateColumns={{ base: "1fr", md: "80px 1fr" }}
            gap={6}
            alignItems="start"
          >
            {/* Left: Author Info */}
            <VStack spacing={2} align="center">
              <Avatar
                size="lg"
                name={question.authorName || 'Anonymous'}
                src={question.authorProfilePic}
                bg={accentColor}
              />
              <Text fontSize="md" fontWeight="semibold" color={headingColor} noOfLines={1}>
                {question.authorName || 'Anonymous'}
              </Text>
              <HStack spacing={1} fontSize="sm" color={subtleTextColor}>
                <FaCalendarAlt />
                <Text>{new Date(question.createdAt).toLocaleDateString()}</Text>
              </HStack>
              <Divider orientation="horizontal" borderColor={borderColor} w="70%" />
            </VStack>

            {/* Right: Question Content */}
            <Box flex="1">
              <HStack justify="space-between" align="flex-start" mb={3} wrap="wrap">
                <Heading as="h1" size="xl" color={headingColor} flex="1" mr={4}>{question.title}</Heading>
                <Badge
                  colorScheme={getUrgencyColor(question.urgency)}
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexShrink={0}
                >
                  {getUrgencyIcon(question.urgency)}
                  {question.urgency} Priority
                </Badge>
              </HStack>
              <Text color={textColor} fontSize="lg" lineHeight="1.7" mb={4}>
                {question.content}
              </Text>

              {question.tags && question.tags.length > 0 && (
                <Flex wrap="wrap" gap={2} mb={4}>
                  {question.tags.map((tag, index) => (
                    <Badge key={index} colorScheme="purple" borderRadius="full" px={3} py={1}>
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>
          </Grid>
        </CardBody>
      </Card>

      <Divider my={8} borderColor={borderColor} />

      {/* Answer Section */}
      <Card bg={cardBg} borderRadius="lg" boxShadow="xl" p={6} maxWidth="container.lg" width="100%" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Heading as="h2" size="lg" mb={6} color={headingColor}>Your Answer</Heading>
          <Textarea
            placeholder="Share your insights and help the community!"
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            mb={4}
            size="lg"
            bg={inputBg}
            borderColor={borderColor}
            _hover={{ borderColor: accentColor }}
            _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
          />
          <Button
            colorScheme="blue"
            onClick={handlePostAnswer}
            leftIcon={<FaComment />}
            size="lg"
            isDisabled={!answerContent.trim()}
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            Post Your Answer
          </Button>

          <Divider my={8} borderColor={borderColor} />

          <HStack justify="space-between" mb={6}>
            <Heading as="h3" size="lg" color={headingColor}>
              Answers ({answers.length})
            </Heading>
            {loadingAnswers && (
              <Spinner size="md" color="blue.500" />
            )}
          </HStack>

          <List spacing={6}>
            {!loadingAnswers && answers.length === 0 ? (
              <Text fontStyle="italic" color={subtleTextColor} textAlign="center" py={4}>
                No answers yet. Be the first to share your knowledge!
              </Text>
            ) : (
              answers.map((answer) => (
                <ListItem key={answer._id}>
                  <Card bg={cardBg} borderRadius="md" boxShadow="sm" p={5} borderWidth="1px" borderColor={borderColor}
                    _hover={{ boxShadow: 'md', borderColor: accentColor }} transition="all 0.2s"
                  >
                    <CardBody>
                      <Grid
                        templateColumns={{ base: "1fr", md: "60px 1fr" }}
                        gap={4}
                        alignItems="start"
                      >
                        {/* Answer Author Info (Left Column) */}
                        <VStack spacing={1} align="center" mt={1}>
                          <Avatar
                            size="md"
                            name={answer.userId?.username || 'Anonymous User'}
                            src={answer.userId?.profilePic} // Assuming userId object has profilePic
                            bg={accentColor}
                          />
                          <Text fontSize="sm" fontWeight="medium" color={headingColor} noOfLines={1}>
                            {answer.userId?.username || 'Anonymous'}
                          </Text>
                          <HStack spacing={1} fontSize="xs" color={subtleTextColor}>
                            <FaCalendarAlt />
                            <Text>{answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : 'Unknown Date'}</Text>
                          </HStack>
                        </VStack>

                        {/* Answer Content & Actions (Right Column) */}
                        <Box>
                          {editingAnswerId === answer._id ? (
                            <VStack align="stretch" spacing={3}>
                              <Input
                                value={editAnswerContent}
                                onChange={(e) => setEditAnswerContent(e.target.value)}
                                placeholder="Edit your answer..."
                                size="md"
                                bg={inputBg}
                                borderColor={borderColor}
                                _hover={{ borderColor: accentColor }}
                                _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                              />
                              <HStack spacing={2}>
                                <Button size="sm" colorScheme="green" onClick={() => handleUpdateAnswer(answer._id)}>
                                  Save
                                </Button>
                                <Button size="sm" onClick={() => setEditingAnswerId(null)} variant="outline">
                                  Cancel
                                </Button>
                              </HStack>
                            </VStack>
                          ) : (
                            <Text color={textColor} fontSize="md" lineHeight="1.6">
                              {answer.content}
                            </Text>
                          )}

                          <Divider my={4} borderColor={borderColor} />

                          <Flex alignItems="center" justify="space-between" wrap="wrap" gap={2}>
                            {/* Votes */}
                            <HStack spacing={2}>
                              <Tooltip label="Upvote this answer" hasArrow>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  leftIcon={<FaThumbsUp />}
                                  onClick={() => handleUpvoteAnswer(answer._id)}
                                  _hover={{ bg: 'green.50', transform: 'scale(1.05)' }}
                                >
                                  <Text fontWeight="bold">{answer.upvotes?.length || 0}</Text>
                                </Button>
                              </Tooltip>
                              <Tooltip label="Downvote this answer" hasArrow>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  leftIcon={<FaThumbsDown />}
                                  onClick={() => handleDownvoteAnswer(answer._id)}
                                  _hover={{ bg: 'red.50', transform: 'scale(1.05)' }}
                                >
                                  <Text fontWeight="bold">{answer.downvotes?.length || 0}</Text>
                                </Button>
                              </Tooltip>
                            </HStack>

                            {/* Edit/Delete Buttons */}
                            {currentUserId === answer.userId?._id && (
                              <HStack spacing={2}>
                                {editingAnswerId !== answer._id && (
                                  <Tooltip label="Edit your answer" hasArrow>
                                    <IconButton
                                      size="sm"
                                      icon={<FaEdit />}
                                      onClick={() => handleEditAnswer(answer)}
                                      colorScheme="yellow"
                                      variant="outline"
                                      _hover={{ bg: 'yellow.50' }}
                                    />
                                  </Tooltip>
                                )}
                                <Tooltip label="Delete your answer" hasArrow>
                                  <IconButton
                                    size="sm"
                                    icon={<FaTrash />}
                                    onClick={() => handleDeleteAnswer(answer._id)}
                                    colorScheme="red"
                                    variant="outline"
                                    _hover={{ bg: 'red.50' }}
                                  />
                                </Tooltip>
                              </HStack>
                            )}
                          </Flex>
                        </Box>
                      </Grid>
                    </CardBody>
                  </Card>
                </ListItem>
              ))
            )}
          </List>
        </CardBody>
      </Card>
    </Flex>
  );
}

export default QuestionDetailPage;