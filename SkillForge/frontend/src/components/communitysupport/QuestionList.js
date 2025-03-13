// frontend/src/components/communitysupport/QuestionList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    List,
    ListItem,
    Heading,
    Text,
    Badge,
    Flex,
    Spacer,
    Box,
    IconButton,
    useToast,
    Spinner
} from '@chakra-ui/react';
import { FaComment, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function QuestionList() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        console.log("QuestionList useEffect is running!");
        const fetchQuestions = async () => {
            try {
                const response = await axios.get('http://localhost:5002/api/community/questions');
                console.log("API response.data:", response.data); // Keep this for now
    
                // **UPDATE THIS LINE to access the questions array correctly:**
                setQuestions(response.data.questions); // Access the 'questions' ARRAY from response.data
    
                setLoading(false);
            } catch (error) {
                console.error("Error fetching questions:", error);
                setLoading(false);
                toast({
                    title: "Error loading questions.",
                    description: "Failed to fetch questions from the server.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        };
        fetchQuestions();
    }, []);

    const handleVote = (questionId, voteType) => {
        // Placeholder for vote handling - implement API call later
        console.log(`Vote ${voteType} for question ID: ${questionId}`);
        toast({
            title: `Voted ${voteType}!`,
            description: `Your vote (${voteType}) for question ${questionId} was recorded (placeholder).`,
            status: "info",
            duration: 3000,
            isClosable: true,
        });
    };


    if (loading) {
        return (
            <Flex justify="center" align="center" minHeight="200px">
                <Spinner size="lg" color="blue.500" />
            </Flex>
        );
    }

    if (!questions || questions.length === 0) {
        return <Text textAlign="center">No questions yet. Be the first to ask!</Text>;
    }


    return (
        <List spacing={3}>
            {questions.map(question => (
                <ListItem
                    key={question._id}
                    padding="4"
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.200"
                >
                    <Flex direction="column" align="center" width="50px">
                        <IconButton
                            aria-label="Upvote"
                            icon={<FaArrowUp />}
                            size="sm"
                            onClick={() => handleVote(question._id, 'upvote')}
                        />
                        <Text fontWeight="bold" fontSize="md">
                            {/* Placeholder for vote count */}0
                        </Text>
                        <IconButton
                            aria-label="Downvote"
                            icon={<FaArrowDown />}
                            size="sm"
                            onClick={() => handleVote(question._id, 'downvote')}
                        />
                    </Flex>

                    <Flex direction="column" marginLeft="4">
                        <Link to={`/community/questions/${question._id}`} style={{ textDecoration: 'none' }}>
                            <Heading as="h3" size="md" fontWeight="semibold">
                                {question.title}
                            </Heading>
                        </Link>
                        <Text fontSize="sm" color="gray.600" mt={2} noOfLines={2}>
                            {question.content}
                        </Text>
                        <Flex mt={2} alignItems="center">
                            {question.tags && question.tags.map((tag, index) => (
                                <Badge key={index} colorScheme="blue" mr={2}>
                                    {tag}
                                </Badge>
                            ))}
                            <Spacer />
                            <Box display="flex" alignItems="center">
                                <FaComment color="gray" size="14px" />
                                <Text fontSize="sm" color="gray.500" ml={1}>
                                    {/* Placeholder for answer count */} 0 Answers
                                </Text>
                            </Box>
                        </Flex>
                    </Flex>
                </ListItem>
            ))}
        </List>
    );
}

export default QuestionList;