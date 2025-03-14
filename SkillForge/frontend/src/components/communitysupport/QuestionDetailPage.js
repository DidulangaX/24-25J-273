// frontend/src/components/communitysupport/QuestionDetailPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
    Flex,
    Heading,
    Text,
    Button,
    Box,
    Avatar,
    Badge,
    Spacer,
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
import Cookies from 'js-cookie'; // Import js-cookie

function QuestionDetailPage() {
    const { questionId } = useParams();
    const [question, setQuestion] = useState(null);
    const [answerContent, setAnswerContent] = useState('');
    const [loadingQuestion, setLoadingQuestion] = useState(true);
    const [answers, setAnswers] = useState([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const toast = useToast();
    const authToken = Cookies.get('authToken'); // Get token from cookies


    // -------------------------------------------------------------------
    // Moved fetchQuestionDetails OUTSIDE useEffect
    const fetchQuestionDetails = async () => {
        setLoadingQuestion(true);
        try {
            const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}`);
            console.log("Question Details API Response:", response.data);
            setQuestion(response.data);
            setLoadingQuestion(false);
        } catch (error) {
            console.error("Error fetching question details:", error);
            setLoadingQuestion(false);
            toast({
                title: "Error loading question details.",
                description: "Failed to fetch question information.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Moved fetchAnswers OUTSIDE useEffect
    const fetchAnswers = async () => {
        setLoadingAnswers(true);
        try {
            const response = await axios.get(`http://localhost:5002/api/community/questions/${questionId}/answers`);
            console.log("Answers API Response:", response.data);
            setAnswers(response.data || []);
            setLoadingAnswers(false);
        } catch (error) {
            console.error("Error fetching answers:", error);
            setAnswers([]);
            setLoadingAnswers(false);
            toast({
                title: "Error loading answers.",
                description: "Failed to retrieve answers for this question.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };
    // -------------------------------------------------------------------

    useEffect(() => {
        const loadData = async () => {
            await fetchQuestionDetails();
            await fetchAnswers();
        };
        loadData();
    }, [questionId]);


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
                {/* Conditionally render the question details section */}
                {loadingQuestion ? (
                    <Flex justify="center" align="center" minHeight="200px">
                        <Spinner size="lg" color="blue.500" />
                    </Flex>
                ) : question ? (
                    <>
                        {/* Question Details Display - Re-added Title, Author, etc. */}
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
                                {/* <Flex align="center" mb={2}>
                                <Text fontSize="sm" color="gray.500">Asked by {question.userIdObject?.username || 'Anonymous'}</Text>
                            </Flex> */}
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

                        {/* "Add Answer" Input Area and Button - No changes here */}
                        <Textarea
                            placeholder="Your Answer"
                            value={answerContent}
                            onChange={(e) => setAnswerContent(e.target.value)}
                            mb={3}
                        />
                        <Button colorScheme="blue" onClick={handlePostAnswer}>Add Answer</Button>

                        {/* Answers Display Section - Basic Structure - No changes here */}
                        {/* Answers Display Section - Displaying Answers */}
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
                                            <Text>{answer.content}</Text> {/* Answer Content */}
                                            <Flex mt={2} fontSize="sm" color="gray.500" alignItems="center">
                                                <FaComment color="gray.500" size="12px" mr={1} />
                                                <Text mr={2}>{answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : 'Unknown Date'}</Text> {/* Answer Date */}
                                                {/* ... (more answer details like votes can be added later) ... */}
                                            </Flex>
                                            <Flex alignItems="center">
                                                
    <Button
        size="sm"
        colorScheme="blue"
        variant="ghost"
        mr={2}
        onClick={() => handleUpvoteAnswer(answer._id)} // Function to handle upvote
    >
        <FaThumbsUp size="14px" mr={1} />
        <Text fontWeight="bold" fontSize="sm">{answer.upvotes?.length || 0}</Text> {/* Display upvote count */}
    </Button>
    <Button
        size="sm"
        colorScheme="gray"
        variant="ghost"
        onClick={() => handleDownvoteAnswer(answer._id)} // Function to handle downvote
    >
        <FaThumbsDown size="14px" mr={1} />
        <Text fontWeight="bold" fontSize="sm">{answer.downvotes?.length || 0}</Text> {/* Display downvote count */}
    </Button>
</Flex>
                                        </ListItem>
                                    ))
                                ) : !loadingQuestion && ( // If not loading answers and no answers available (and question is loaded), show "No answers yet"
                                    <Text fontStyle="italic" color="gray.500">No answers yet. Be the first to answer!</Text>
                                )}
                            </List>
                            {/* Removed redundant "No answers yet" message outside List */}
                            {/* Removed loadingAnswers spinner from here - moved inside List */}
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