// frontend/src/components/communitysupport/QuestionDetailPage.js
import React, {useCallback, useState, useEffect } from 'react';
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
    List, // Import List and ListItem for answers
    ListItem,
} from '@chakra-ui/react';
import { FaComment, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useParams } from 'react-router-dom';

function QuestionDetailPage() {
    const { questionId } = useParams();
    const [question, setQuestion] = useState(null);
    const [answerContent, setAnswerContent] = useState('');
    const [loadingQuestion, setLoadingQuestion] = useState(true);
    const [answers, setAnswers] = useState();
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const toast = useToast();
    const authToken = Cookies.get('authToken'); // Get token from cookies
    const decodedToken = authToken ? jwtDecode(authToken) : null;
    const currentUserId = decodedToken ? decodedToken.userId : null; // Adjust 'userId' to the actual claim in your JWT
    const [editingAnswerId, setEditingAnswerId] = useState(null);
    const [editAnswerContent, setEditAnswerContent] = useState('');


    // -------------------------------------------------------------------
    // Moved fetchQuestionDetails OUTSIDE useEffect
    const fetchQuestionDetails = useCallback(async () => {
        setLoadingQuestion(true);
        try {
            const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}`);
            console.log("Question Details API Response:", response.data);
            setQuestion(response.data);
        } catch (error) {
            console.error("Error fetching question details:", error);
        } finally {
            setLoadingQuestion(false);
        }
    }, [questionId]);

    const fetchAnswers = useCallback(async () => {
        setLoadingAnswers(true);
        try {
            const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}/answers`);
            console.log("Answers API Response:", response.data);
            setAnswers(response.data || []);
        } catch (error) {
            console.error("Error fetching answers:", error);
        } finally {
            setLoadingAnswers(false);
        }
    }, [questionId]);

    useEffect(() => {
        const loadData = async () => {
            await fetchQuestionDetails();
            await fetchAnswers();
        };

        loadData();
    }, [fetchQuestionDetails, fetchAnswers]);

    //-------------------------------
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
            const response = await axios.post(
                `http://localhost:5002/api/community/answers/${answerId}/upvote`, // Backend upvote endpoint
                {}, // Empty request body
                { headers: { Authorization: `Bearer ${Cookies.get('authToken')}` } }
            );

            console.log("Answer upvoted successfully:", response.data);
            // After successful upvote, refresh the answer list to update vote counts
            fetchAnswers(); // Re-fetch answers to update the vote counts in UI

        } catch (error) {
            console.error("Error upvoting answer:", error);
            console.error("Full error response (upvote):", error.response); // For debugging
            toast({
                title: "Error upvoting answer.",
                description: "Failed to upvote the answer.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

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
            const response = await axios.post(
                `http://localhost:5002/api/community/answers/${answerId}/downvote`, // Backend downvote endpoint
                {}, // Empty request body
                { headers: { Authorization: `Bearer ${Cookies.get('authToken')}` } }
            );

            console.log("Answer downvoted successfully:", response.data);
            // After successful downvote, refresh the answer list to update vote counts
            fetchAnswers(); // Re-fetch answers to update vote counts in UI

        } catch (error) {
            console.error("Error downvoting answer:", error);
            console.error("Full error response (downvote):", error.response); // For debugging
            toast({
                title: "Error downvoting answer.",
                description: "Failed to downvote the answer.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };


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
            toast({
                title: "Please enter your answer.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5002/api/community/answers/`, // <---- UPDATED URL - No questionId in path
                { questionId: questionId, content: answerContent }, // <---- Added questionId to request body
                { headers: { Authorization: `Bearer ${Cookies.get('authToken')}` } }
            );

            console.log("Answer posted successfully:", response.data);
            toast({
                title: "Answer posted!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            setAnswerContent('');
            fetchAnswers();

        } catch (error) {
            console.error("Error posting answer:", error);
            console.error("Full error response:", error.response); // Keep this for debugging
            toast({
                title: "Error posting answer.",
                description: "Failed to submit your answer.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleEditAnswer = (answer) => {
        setEditingAnswerId(answer._id);
        setEditAnswerContent(answer.content);
    };

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
            const response = await axios.put(
                `http://localhost:5002/api/community/answers/${answerId}`, // Replace with your actual API endpoint
                { content: editAnswerContent },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log("Answer updated successfully:", response.data);
            toast({ title: "Answer updated!", status: "success", duration: 3000, isClosable: true });
            setEditingAnswerId(null); // Exit editing mode
            fetchAnswers(); // Refresh answers
        } catch (error) {
            console.error("Error updating answer:", error);
            toast({ title: "Error updating answer.", description: "Failed to update your answer.", status: "error", duration: 5000, isClosable: true });
        }
    };

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
        if (window.confirm("Are you sure you want to delete this answer?")) { // Basic confirmation
            try {
                const response = await axios.delete(
                    `http://localhost:5002/api/community/answers/${answerId}`, // Replace with your actual API endpoint
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                console.log("Answer deleted successfully:", response.data);
                toast({ title: "Answer deleted!", status: "success", duration: 3000, isClosable: true });
                fetchAnswers(); // Refresh answers
            } catch (error) {
                console.error("Error deleting answer:", error);
                toast({ title: "Error deleting answer.", description: "Failed to delete the answer.", status: "error", duration: 5000, isClosable: true });
            }
        }
    };

    return (
        // Updated Flex container with paddingTop, minHeight and height adjustments
        <Flex
            direction="column"
            p={5}
            bg="gray.50"
            minH="calc(100vh - 80px)" // minHeight adjusted to subtract navbar height (example: 80px)
            height="auto" // Height set to auto to grow with content
            paddingTop={20} // Increased paddingTop to create space below navbar (example: 20 - which is 80px)
            align="center"
        >
            <Box bg="white" borderRadius="md" boxShadow="md" p={5} maxWidth="container.md" width="100%">
                {loadingQuestion ? (
                    <Flex justify="center" align="center" minHeight="200px">
                        <Spinner size="lg" color="blue.500" />
                    </Flex>
                ) : question ? (
                    <>
                        <Stack direction={{ base: 'column', md: 'row' }} spacing="4" align="stretch" mb={4}>
                            <Flex direction="column" align="center" width={{ base: '100%', md: '70px' }} >
                                <Avatar
                                    size="md"
                                    name={question.authorName || 'Anonymous'}
                                    src={question.authorProfilePic}
                                    icon={<Box boxSize='md' bg='gray.100' />}
                                    fallback='initials'
                                    mb="2"
                                />

                            </Flex>

                            <Box flex="1" minWidth="0">
                                <Heading as="h2" size="lg" mb={2}>{question.title}</Heading>
                                <Text mb={4}>{question.content}</Text>
                                <Flex mt={2} alignItems="center" flexWrap="wrap">
                                    {question.tags && question.tags.map((tag, index) => (
                                        <Badge key={index} colorScheme="blue" mr={2} mb={1}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </Flex>
                            </Box>
                        </Stack>

                        <Divider mb={4} />

                        <Textarea
                            placeholder="Your Answer"
                            value={answerContent}
                            onChange={(e) => setAnswerContent(e.target.value)}
                            mb={3}
                        />
                        <Button colorScheme="blue" onClick={handlePostAnswer}>Add Answer</Button>

                        <Box mt={6}>
                            <Heading as="h3" size="md" mb={3}>Answers</Heading>
                            <List spacing={3}>
                                {loadingAnswers ? ( // Show spinner if loading answers
                                    <Flex justify="center" align="center" mt={4}>
                                        <Spinner size="md" color="blue.500" />
                                    </Flex>
                                ) : answers.length > 0 ? ( // If not loading and answers are available, map and display
                                    answers.map((answer) => (
                                        <ListItem key={answer._id} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                                            <Text fontWeight="bold" mb={1}>{answer.userId?.username || 'Anonymous User'}</Text> {/* Answer Author Name */}
                                            {editingAnswerId === answer._id ? (
                                                // Render textarea for editing
                                                <Textarea
                                                    value={editAnswerContent}
                                                    onChange={(e) => setEditAnswerContent(e.target.value)}
                                                    mb={2}
                                                />
                                            ) : (
                                                // Render answer content
                                                <Text>{answer.content}</Text>
                                            )}
                                            <Flex mt={2} fontSize="sm" color="gray.500" alignItems="center">
                                                <FaComment color="gray.500" size="12px" mr={1} />
                                                <Text mr={2}>{answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : 'Unknown Date'}</Text>
                                            </Flex>
                                            <Flex alignItems="center" justify="space-between"> {/* Added justify */}
                                                <Flex alignItems="center">
                                                    <Button
                                                        size="sm"
                                                        colorScheme="blue"
                                                        variant="ghost"
                                                        mr={2}
                                                        onClick={() => handleUpvoteAnswer(answer._id)}
                                                    >
                                                        <FaThumbsUp size="14px" mr={1} />
                                                        <Text fontWeight="bold" fontSize="sm">{answer.upvotes?.length || 0}</Text>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="gray"
                                                        variant="ghost"
                                                        onClick={() => handleDownvoteAnswer(answer._id)}
                                                    >
                                                        <FaThumbsDown size="14px" mr={1} />
                                                        <Text fontWeight="bold" fontSize="sm">{answer.downvotes?.length || 0}</Text>
                                                    </Button>
                                                </Flex>
                                                {currentUserId === answer.userId?._id && ( // Check if the current user owns the answer
                                                    <Flex>
                                                        {editingAnswerId === answer._id ? (
                                                            <>
                                                                <Button size="sm" colorScheme="green" mr={2} onClick={() => handleUpdateAnswer(answer._id)}>
                                                                    Save
                                                                </Button>
                                                                <Button size="sm" onClick={() => setEditingAnswerId(null)}>
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button size="sm" colorScheme="yellow" mr={2} onClick={() => handleEditAnswer(answer)}>
                                                                Edit
                                                            </Button>
                                                        )}
                                                        <Button size="sm" colorScheme="red" onClick={() => handleDeleteAnswer(answer._id)}>
                                                            Delete
                                                        </Button>
                                                    </Flex>
                                                )}
                                            </Flex>
                                        </ListItem>
                                    ))
                                ) : !loadingQuestion && ( // If not loading answers and no answers available (and question is loaded), show "No answers yet"
                                    <Text fontStyle="italic" color="gray.500">No answers yet. Be the first to answer!</Text>
                                )}
                            </List>
                        </Box>
                    </>
                ) : (
                    <Text textAlign="center">Error loading question.</Text>
                )}
            </Box>
        </Flex>
    );
}

export default QuestionDetailPage;