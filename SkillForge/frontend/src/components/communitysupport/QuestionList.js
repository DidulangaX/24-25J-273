
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Flex,
  Button,
  Spinner,
  Text,
  Badge,
  List,
  ListItem,
  Divider,
  Avatar,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Stack,
  useToast
} from '@chakra-ui/react';
import { FaComment, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

//export default function QuestionList() {
    export default function QuestionList({ initialFilterUrgency = 'All' }) {
 
  const toast     = useToast();
  const authToken = Cookies.get('authToken');

  // Questions + loading
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);

  // “Ask Question” form state
  const [isAskingQuestion, setIsAskingQuestion]     = useState(false);
  const [newQuestionTitle, setNewQuestionTitle]     = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [currentTagInput, setCurrentTagInput]       = useState('');
  const [newQuestionTags, setNewQuestionTags]       = useState([]);

  // Filter & sort state
  const [filterUrgency, setFilterUrgency] = useState(initialFilterUrgency);
  const [sortBy, setSortBy]               = useState('Newest');

  // Fetch questions once on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data } = await axios.get('http://localhost:5002/api/community/questions');
        setQuestions(data.questions);
      } catch (err) {
        toast({
          title: "Error loading questions.",
          status: "error",
          description: err.message,
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [toast]);

  // derive filtered + sorted list
  const displayedQuestions = useMemo(() => {
    let arr = [...questions];
    if (filterUrgency !== 'All') {
      arr = arr.filter(q => q.urgency === filterUrgency);
    }
    if (sortBy === 'Newest') {
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const rank = { High: 2, Medium: 1, Low: 0 };
      arr.sort((a, b) => rank[b.urgency] - rank[a.urgency]);
    }
    return arr;
  }, [questions, filterUrgency, sortBy]);

  // Helper to refresh questions
  async function refreshQuestions() {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5002/api/community/questions');
      setQuestions(data.questions);
    } catch {
      toast({
        title: "Error refreshing.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // (You would fill in these handlers exactly as before)
  const handleUpvoteQuestionList   = async (id) => { /* … */ };
  const handleDownvoteQuestionList = async (id) => { /* … */ };
  const handlePostNewQuestion      = async ()   => { /* … */ };

  // top‐level loading
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* ─── Ask Question Button */}
      <Flex justify="end" mb={4}>
        <Button colorScheme="blue" onClick={() => setIsAskingQuestion(true)}>
          Ask Question
        </Button>
      </Flex>

      {/* ─── Ask Question Form */}
      {isAskingQuestion && (
        <Box
          bg="gray.50" p={6} mb={4}
          border="1px solid" borderColor="gray.200"
          borderRadius="md" boxShadow="md"
          maxW="md" mx="auto"
        >
          <Heading size="md" mb={4}>Ask a New Question</Heading>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input
                value={newQuestionTitle}
                onChange={e => setNewQuestionTitle(e.target.value)}
                placeholder="Question title"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Content</FormLabel>
              <Textarea
                value={newQuestionContent}
                onChange={e => setNewQuestionContent(e.target.value)}
                placeholder="Describe your question"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Tags (Enter to add)</FormLabel>
              <Input
                value={currentTagInput}
                onChange={e => setCurrentTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && currentTagInput.trim()) {
                    setNewQuestionTags(tags => [...tags, currentTagInput.trim()]);
                    setCurrentTagInput('');
                  }
                }}
                placeholder="e.g. React, CSS"
              />
              <Flex wrap="wrap" mt={2}>
                {newQuestionTags.map((t,i) => (
                  <Badge key={i} colorScheme="blue" mr={1} mb={1}>{t}</Badge>
                ))}
              </Flex>
            </FormControl>
            <Flex justify="flex-end">
              <Button mr={2} onClick={() => setIsAskingQuestion(false)}>Cancel</Button>
              <Button colorScheme="blue" onClick={handlePostNewQuestion}>Post</Button>
            </Flex>
          </Stack>
        </Box>
      )}

      {/* ─── Filter & Sort Controls ─────────────────────────────────── */}
      <Flex mb={4} wrap="wrap" gridGap={3} align="center">
        <Select
          w="160px"
          value={filterUrgency}
          onChange={e => setFilterUrgency(e.target.value)}
        >
          <option value="All">All Urgencies</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>

        <Select
          w="180px"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="Newest">Sort: Newest</option>
          <option value="Urgency">Sort: Urgency</option>
        </Select>
      </Flex>

      {/* ─── No match message ────────────────────────────────────────── */}
      {displayedQuestions.length === 0 && (
        <Text textAlign="center" mt={8}>No questions match that filter.</Text>
      )}

      {/* ─── Questions List ──────────────────────────────────────────── */}
      <List spacing={4}>
        {displayedQuestions.map((q, i) => (
          <ListItem
            key={q._id}
            p={5}
            border="1px solid" borderColor="gray.200"
            borderRadius="md" bg="white"
            _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} align="stretch" gap={4}>
              {/* Avatar & votes */}
              <Flex direction="column" align="center" w="70px">
                <Avatar name={q.authorName} src={q.authorProfilePic} mb={2}/>
                <Button size="sm" onClick={() => handleUpvoteQuestionList(q._id)}><FaThumbsUp/></Button>
                <Text>{q.upvotes}</Text>
                <Button size="sm" onClick={() => handleDownvoteQuestionList(q._id)}><FaThumbsDown/></Button>
                <Text>{q.downvotes}</Text>
              </Flex>

              {/* Main content */}
              <Box flex="1">
                <Flex align="center" mb={2}>
                  <Link to={`/community/questions/${q._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <Heading size="md" noOfLines={2}>{q.title}</Heading>
                  </Link>
                  <Badge
                    ml={3} px={2} py={1} borderRadius="md"
                    colorScheme={ q.urgency === 'High'   ? 'red'
                               : q.urgency === 'Medium' ? 'orange'
                                                         : 'green'
                             }
                  >
                    {q.urgency}
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Asked by {q.authorName || 'Anonymous'}
                </Text>
                <Text noOfLines={3} mb={2}>{q.content}</Text>
                <Flex wrap="wrap" align="center" gap={2}>
                  {q.tags?.map((t,k) => <Badge key={k} colorScheme="blue">{t}</Badge>)}
                  <Flex align="center" ml="auto">
                    <FaComment/> 
                    <Text ml={1}>{q.answerCount} Answers</Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
            {i < displayedQuestions.length - 1 && <Divider mt={4}/>}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

