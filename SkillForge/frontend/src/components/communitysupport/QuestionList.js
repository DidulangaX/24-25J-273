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
    Spinner,
    useToast,
    Divider,
    Stack,
    Avatar,
    Button, 
    FormControl, 
    FormLabel, 
    Input, 
    Textarea, 
    Grid,
    GridItem,
} from '@chakra-ui/react';
import { FaComment, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import Cookies

function QuestionList() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const authToken = Cookies.get('authToken'); // Get token for auth check
    const [isAskingQuestion, setIsAskingQuestion] = useState(false); 
    const [newQuestionTitle, setNewQuestionTitle] = useState(''); 
    const [newQuestionContent, setNewQuestionContent] = useState('');
      const [currentTagInput, setCurrentTagInput] = useState('');
      const [newQuestionTags, setNewQuestionTags] = useState([]);
    

    useEffect(() => {
        console.log("QuestionList useEffect is running!");
        const fetchQuestions = async () => {
            try {
                const response = await axios.get('http://localhost:5002/api/community/questions');
                console.log("API response.data:", response.data);
                setQuestions(response.data.questions);
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

    // Function to re-fetch questions - useful after voting to update counts
    const refreshQuestions = async () => {
        console.log("refreshQuestions() called");
    
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5002/api/community/questions');
            console.log("API response from refreshQuestions:", response.data);
    
            console.log("State questions BEFORE update:", questions);
            if (questions.length > 0) {
                // ADDED: Log upvotes and downvotes of the FIRST question BEFORE update for comparison
                console.log("BEFORE UPDATE - First Question UPVOTES:", questions[0].upvotes, "DOWNVOTES:", questions[0].downvotes);
            }
    
            // Create a NEW array to trigger re-render - IMPORTANT!
            const newQuestionsArray = [...response.data.questions];
            setQuestions(newQuestionsArray); // Update state with the NEW array
    
            console.log("State questions AFTER update:", questions); // This might log the PREVIOUS state in React, careful!
            if (newQuestionsArray.length > 0) {
                // ADDED: Log upvotes and downvotes of the FIRST question AFTER update for comparison
                console.log("AFTER UPDATE - First Question UPVOTES:", newQuestionsArray[0].upvotes, "DOWNVOTES:", newQuestionsArray[0].downvotes);
            }
    
    
            setLoading(false);
        } catch (error) {
            console.error("Error refreshing questions:", error);
            setLoading(false);
            toast({
                title: "Error refreshing questions.",
                description: "Failed to update questions list.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };


    const handleUpvoteQuestionList = async (questionId) => {
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
                `http://localhost:5002/api/community/questions/${questionId}/upvote`,
                {},
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log("Question upvoted:", response.data)
           
    
            // **OPTIMISTIC UI UPDATE:** Update the state immediately
            setQuestions(prevQuestions =>
                prevQuestions.map(question =>
                    question._id === questionId
                        ? { ...question, upvotes: response.data.upvotes, downvotes: response.data.downvotes } // Also update downvotes for consistency
                        : question
                )
            );
    
         
    
        } catch (error) {
            console.error("Error upvoting question:", error);
            toast({
                title: "Error upvoting question.",
                description: "Failed to upvote the question.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
    
           
        }
    };
    
    const handleDownvoteQuestionList = async (questionId) => {
        // ... (similarly modify your handleDownvoteQuestionList function) ...
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
                `http://localhost:5002/api/community/questions/${questionId}/downvote`,
                {},
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log("Question downvoted:", response.data);
            
    
            // **OPTIMISTIC UI UPDATE FOR DOWNVOTE:**
            setQuestions(prevQuestions =>
                prevQuestions.map(question =>
                    question._id === questionId
                        ? { ...question, upvotes: response.data.upvotes, downvotes: response.data.downvotes } // Also update upvotes for consistency
                        : question
                )
            );
    
           
    
        } catch (error) {
            console.error("Error downvoting question:", error);
            toast({
                title: "Error downvoting question.",
                description: "Failed to downvote the question.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            // Consider rollback if needed
        }
    };

    //---------------ask question method
    const handlePostNewQuestion = async () => {
        if (!authToken) {
            toast({
                title: "Authentication required.",
                description: "Please log in to ask a question.",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
            toast({
                title: "Please fill in both the title and content.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5002/api/community/questions',
                {title: newQuestionTitle,
                content: newQuestionContent,
                tags: newQuestionTags,
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            console.log("New question posted:", response.data);
            toast({
                title: "Question posted successfully!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Reset the form and refresh the question list
            setNewQuestionTitle('');
            setNewQuestionContent('');
            setIsAskingQuestion(false);
            refreshQuestions(); // Call your existing function to refresh the list
        } catch (error) {
            console.error("Error posting new question:", error);
            toast({
                title: "Error posting question.",
                description: "Failed to submit your question.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
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
        <Box>
        <Flex justify="end" mb={4}> {/* Align the button to the right */}
            <Button colorScheme="blue" onClick={() => setIsAskingQuestion(true)}>
                Ask Question
            </Button>
        </Flex>

        {isAskingQuestion && (
    <Box
        bg="gray.50" // Light gray background
        p={6} // Increased padding for better spacing
        borderRadius="md"
        boxShadow="md"
        mb={4}
        maxWidth="md" // Limit the maximum width of the form
        mx="auto" // Center the form horizontally
        border="1px solid" // Add a subtle border
        borderColor="gray.200"
    >
        <Heading as="h2" size="md" mb={5} color="gray.700">
            Ask a New Question
        </Heading>
        <Stack spacing={5}>
            <FormControl>
                <FormLabel htmlFor="question-title" color="gray.700">
                    Title
                </FormLabel>
                <Input
                    id="question-title"
                    type="text"
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    bg="white" // Ensure input background is white
                    borderColor="gray.300"
                    _focus={{ borderColor: "blue.500" }}
                />
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="question-content" color="gray.700">
                    Content
                </FormLabel>
                <Textarea
                    id="question-content"
                    value={newQuestionContent}
                    onChange={(e) => setNewQuestionContent(e.target.value)}
                    rows={5}
                    bg="white"
                    borderColor="gray.300"
                    _focus={{ borderColor: "blue.500" }}
                />
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="question-tags" color="gray.700">
                    Tags (press Enter to add)
                </FormLabel>
                <Input
                    id="question-tags"
                    type="text"
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && currentTagInput.trim()) {
                            setNewQuestionTags([...newQuestionTags, currentTagInput.trim()]);
                            setCurrentTagInput('');
                        }
                    }}
                    bg="white"
                    borderColor="gray.300"
                    _focus={{ borderColor: "blue.500" }}
                />
                <Flex mt={2} wrap="wrap">
                    {newQuestionTags.map((tag, index) => (
                        <Badge key={index} colorScheme="blue" mr={2} mb={1}>
                            {tag}
                        </Badge>
                    ))}
                </Flex>
            </FormControl>
            <Flex justify="end">
                <Button colorScheme="gray" mr={2} onClick={() => setIsAskingQuestion(false)}>
                    Cancel
                </Button>
                <Button colorScheme="blue" onClick={handlePostNewQuestion}>
                    Post Question
                </Button>
            </Flex>
        </Stack>
    </Box>
)}
        

        {loading ? (
            <Flex justify="center" align="center" minHeight="200px">
                <Spinner size="lg" color="blue.500" />
            </Flex>
        ) : (
        <List spacing={4} mt="4">
            
            {questions.map((question, index) => (
                
                <ListItem
                    key={question._id}
                    padding="5"
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.200"
                    bg="white"
                    _hover={{
                        boxShadow: "md",
                        borderColor: "gray.300",
                    }}
                    transition="all 0.2s ease-in-out"
                >
                    
                    <Stack direction={{ base: 'column', md: 'row' }} spacing="4" align="stretch">
                        {/* Avatar and Vote Counts - Left Side */}
                        <Flex direction="column" align="center" width={{ base: '100%', md: '70px' }} >
                            <Avatar
                                size="md"
                                name={question.authorName || 'Anonymous'}
                                src={question.authorProfilePic}
                                icon={<Box boxSize='md' bg='gray.100' />}
                                fallback='initials'
                                mb="2"
                            />
                            {/* Question Vote Buttons and Counts in QuestionList */}
                            <Flex direction="column" alignItems="center">
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => handleUpvoteQuestionList(question._id)}
                                    aria-label={`Upvote question ${question._id}`}
                                >
                                    <FaThumbsUp size="14px" mr={1} />
                                </Button>
                                <Text fontWeight="bold" fontSize="sm" color="gray.700">
                                   {question.upvotes || 0}
                                </Text>
                                <Button
                                    size="sm"
                                    colorScheme="gray"
                                    variant="ghost"
                                    onClick={() => handleDownvoteQuestionList(question._id)}
                                    aria-label={`Downvote question ${question._id}`}
                                >
                                    <FaThumbsDown size="14px" mr={1} />
                                </Button>
                                <Text fontWeight="bold" fontSize="sm" color="gray.700">
                                    {question.downvotes || 0}
                                </Text>
                            </Flex>
                        </Flex>

                        <Box flex="1" minWidth="0">
                            <Link to={`/community/questions/${question._id}`} style={{ textDecoration: 'none' }}>
                                <Heading as="h3" size="md" fontWeight="semibold" color="gray.700" noOfLines={2}>
                                    {question.title}
                                </Heading>
                            </Link>
                            <Flex mt={1} alignItems="center">
                                <Text fontSize="sm" color="gray.500" mr={2}>
                                    Asked by {question.authorName || 'Anonymous'}
                                </Text>
                            </Flex>
                            <Text fontSize="sm" color="gray.600" mt={2} noOfLines={3}>
                                {question.content}
                            </Text>
                            <Flex mt={2} alignItems="baseline" flexWrap="wrap" >
                                <Flex flexWrap="wrap" align="baseline">
                                    {question.tags && question.tags.map((tag, index) => (
                                        <Badge key={index} colorScheme="blue" mr={2} mb={1}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </Flex>
                                {/* Moved Answer Count to the right side Flex */}
                                <Flex display="flex" alignItems="baseline" mt={{ base: 2, md: 0 }} ml={4}>
                                    <FaComment color="gray.500" size="14px" mr={1} />
                                    <Text fontSize="sm" color="gray.500" ml={1}>
                                        {question.answerCount || 0} Answers
                                    </Text>
                                </Flex>
                            </Flex>
                        </Box>
                    </Stack>
                    {index < questions.length - 1 && <Divider mt="4" />}
                </ListItem>
            ))}
        </List>
    )}
    </Box>

    );
}
export default QuestionList;