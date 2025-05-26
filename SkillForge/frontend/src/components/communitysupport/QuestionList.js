// src/components/QuestionList.jsx
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
  useToast,
  Container,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  Tooltip,
  AvatarBadge,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputLeftElement,
  Grid,
  GridItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Fade,
  ScaleFade
} from '@chakra-ui/react';
import { 
  FaComment, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaPlus,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUser,
  FaTags,
  FaCalendarAlt,
  FaHeart,
  FaShare,
  FaBookmark,
  FaEye // Added for views
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function QuestionList({ initialFilterUrgency = 'All' }) {
  const toast = useToast();
  const authToken = Cookies.get('authToken');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values for consistent theming - ALL HOOKS MUST BE AT THE TOP
  const bgColor = useColorModeValue('blue.50', 'gray.900'); // Lighter blue for light mode, dark gray for dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.100', 'gray.600'); // Slightly bluer border
  const textColor = useColorModeValue('gray.700', 'gray.300'); // Darker text for light mode
  const headingColor = useColorModeValue('blue.700', 'white'); // Blue headings
  const inputBg = useColorModeValue('white', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('blue.500', 'blue.300'); // Consistent accent for icons/highlights
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400'); // For dates, small info

  // Questions + loading
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // "Ask Question" form state
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [newQuestionTags, setNewQuestionTags] = useState([]);

  // Filter & sort state
  const [filterUrgency, setFilterUrgency] = useState(initialFilterUrgency);
  const [sortBy, setSortBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch questions on mount
  useEffect(() => {
    (async function fetchQuestions() {
      try {
        const { data } = await axios.get('http://localhost:5002/api/community/questions');
        // Add dummy answerCount and viewCount for demonstration
        const questionsWithDummyData = data.questions.map(q => ({
            ...q,
            answerCount: Math.floor(Math.random() * 10), // Random answers for demo
            viewCount: Math.floor(Math.random() * 100) + 10 // Random views for demo
        }));
        setQuestions(questionsWithDummyData);
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
    })();
  }, [toast]);

  // derive filtered + sorted list
  const displayedQuestions = useMemo(() => {
    let arr = [...questions];
    
    // Search filter
    if (searchQuery.trim()) {
      arr = arr.filter(q => 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Urgency filter
    if (filterUrgency !== 'All') {
      arr = arr.filter(q => q.urgency === filterUrgency);
    }
    
    // Sort
    if (sortBy === 'Newest') {
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Urgency') {
      const rank = { High: 2, Medium: 1, Low: 0 };
      arr.sort((a, b) => rank[b.urgency] - rank[a.urgency]);
    } else if (sortBy === 'Most Answers') { // New sort option
        arr.sort((a, b) => b.answerCount - a.answerCount);
    } else if (sortBy === 'Most Views') { // New sort option
        arr.sort((a, b) => b.viewCount - a.viewCount);
    }
    return arr;
  }, [questions, filterUrgency, sortBy, searchQuery]);

  // refresh questions
  async function refreshQuestions() {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5002/api/community/questions');
      const questionsWithDummyData = data.questions.map(q => ({
          ...q,
          answerCount: Math.floor(Math.random() * 10), // Random answers for demo
          viewCount: Math.floor(Math.random() * 100) + 10 // Random views for demo
      }));
      setQuestions(questionsWithDummyData);
    } catch (err) {
      toast({
        title: "Error refreshing.",
        status: "error",
        description: err.message,
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // upvote handler
  const handleUpvoteQuestionList = async (id) => {
    if (!authToken) {
      toast({ title: "Please log in to vote.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      const { data } = await axios.post(
        `http://localhost:5002/api/community/questions/${id}/upvote`, {},
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      setQuestions(qs => qs.map(q => q._id === id ? { ...q, upvotes: data.upvotes, downvotes: data.downvotes } : q));
    } catch (err) {
      toast({ title: "Upvote failed.", status: "error", description: err.message, duration: 3000, isClosable: true });
    }
  };

  // downvote handler
  const handleDownvoteQuestionList = async (id) => {
    if (!authToken) {
      toast({ title: "Please log in to vote.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      const { data } = await axios.post(
        `http://localhost:5002/api/community/questions/${id}/downvote`, {},
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      setQuestions(qs => qs.map(q => q._id === id ? { ...q, upvotes: data.upvotes, downvotes: data.downvotes } : q));
    } catch (err) {
      toast({ title: "Downvote failed.", status: "error", description: err.message, duration: 3000, isClosable: true });
    }
  };

  // post new question
  const handlePostNewQuestion = async () => {
    if (!authToken) {
      toast({ title: "Please log in to ask.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      toast({ title: "Title & content required.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      await axios.post(
        'http://localhost:5002/api/community/questions',
        {
          title: newQuestionTitle,
          content: newQuestionContent,
          tags: newQuestionTags
        },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      toast({ title: "Question posted!", status: "success", duration: 3000, isClosable: true });
      // reset form
      setNewQuestionTitle('');
      setNewQuestionContent('');
      setNewQuestionTags([]);
      onClose(); // Close the modal
      // refresh list
      await refreshQuestions();
    } catch (err) {
      toast({ title: "Post failed.", status: "error", description: err.response?.data?.message || err.message, duration: 3000, isClosable: true });
    }
  };

  const removeTag = (indexToRemove) => {
    setNewQuestionTags(tags => tags.filter((_, index) => index !== indexToRemove));
  };

  const getUrgencyIcon = (urgency) => {
    switch(urgency) {
      case 'High': return <FaExclamationTriangle />;
      case 'Medium': return <FaClock />;
      case 'Low': return <FaCheckCircle />;
      default: return <FaClock />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={8} bg={bgColor}> {/* Apply bgColor here too */}
        <Flex justify="center" align="center" minH="400px" direction="column">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          <Text mt={4} color={textColor} fontSize="lg">Loading community questions...</Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="7xl">
        {/* Header Section */}
        <Box mb={8}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="xl" color={headingColor} mb={2}>
                  Community Support
                </Heading>
                <Text color={textColor} fontSize="lg">
                  Get help from the community and share your knowledge
                </Text>
              </Box>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                size="lg"
                onClick={onOpen}
                boxShadow="lg"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Ask Question
              </Button>
            </Flex>

            {/* Stats Cards */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Questions</StatLabel>
                    <StatNumber color={accentColor}>{questions.length}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>High Priority</StatLabel>
                    <StatNumber color="red.500">
                      {questions.filter(q => q.urgency === 'High').length}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Answered Questions</StatLabel> {/* Changed label */}
                    <StatNumber color="green.500">
                      {questions.filter(q => q.answerCount > 0).length}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>
          </VStack>
        </Box>

        {/* Search and Filter Section */}
        <Card bg={cardBg} borderColor={borderColor} mb={6} boxShadow="md">
          <CardBody>
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr 1fr" }} gap={4} alignItems="end">
              <FormControl>
                <FormLabel color={textColor} fontWeight="semibold">
                  <FaSearch style={{ display: 'inline', marginRight: '8px' }} />
                  Search Questions
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by title, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontWeight="semibold">
                  <FaFilter style={{ display: 'inline', marginRight: '8px' }} />
                  Filter by Urgency
                </FormLabel>
                <Select 
                  value={filterUrgency} 
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                >
                  <option value="All">All Urgencies</option>
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontWeight="semibold">
                  <FaSortAmountDown style={{ display: 'inline', marginRight: '8px' }} />
                  Sort By
                </FormLabel>
                <Select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                >
                  <option value="Newest">📅 Newest First</option>
                  <option value="Urgency">⚡ By Priority</option>
                  <option value="Most Answers">💬 Most Answers</option> {/* New sort option */}
                  <option value="Most Views">👁️ Most Views</option> {/* New sort option */}
                </Select>
              </FormControl>
            </Grid>
          </CardBody>
        </Card>

        {/* Results Info */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text color={textColor} fontSize="md">
            Showing <Text as="span" fontWeight="bold" color={headingColor}>{displayedQuestions.length}</Text> of <Text as="span" fontWeight="bold" color={headingColor}>{questions.length}</Text> questions
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshQuestions}
            leftIcon={<FaClock />}
            color={textColor}
            _hover={{ color: accentColor }}
          >
            Refresh
          </Button>
        </Flex>

        {/* No Results */}
        {displayedQuestions.length === 0 && (
          <Card bg={cardBg} borderColor={borderColor} textAlign="center" py={12}>
            <CardBody>
              <VStack spacing={4}>
                <Box fontSize="4xl" color="gray.400">
                  🔍
                </Box>
                <Heading size="md" color={textColor}>No questions found</Heading>
                <Text color={textColor}>
                  {searchQuery || filterUrgency !== 'All' 
                    ? "Try adjusting your search or filter criteria"
                    : "Be the first to ask a question!"
                  }
                </Text>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchQuery('')}
                    size="sm"
                    colorScheme="blue"
                  >
                    Clear search
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Questions List */}
        <VStack spacing={6} align="stretch">
          {displayedQuestions.map((q, i) => (
            <ScaleFade key={q._id} in={true} initialScale={0.9}>
              <Card
                bg={cardBg}
                borderColor={borderColor}
                boxShadow="md"
                _hover={{ 
                  boxShadow: 'xl', 
                  borderColor: accentColor,
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.3s ease"
                borderWidth="1px" // Explicitly set border width
                borderRadius="lg" // Slightly rounded corners
              >
                <CardBody p={6}>
                  <Grid 
                    templateColumns={{ base: "1fr", md: "80px 1fr auto" }} // Added auto column for stats
                    gap={6} 
                    alignItems="start" // Align items to the top
                  >
                    {/* Left: User Avatar & Votes (Centralized) */}
                    <VStack spacing={2} align="center">
                      <Avatar 
                        name={q.authorName} 
                        src={q.authorProfilePic} 
                        size="md"
                        bg={accentColor}
                      >
                        {/* Optional: Add online status badge or similar if applicable */}
                        {/* <AvatarBadge boxSize="1em" bg="green.500" /> */}
                      </Avatar>
                      <Text fontSize="sm" fontWeight="semibold" color={headingColor} noOfLines={1}>{q.authorName || 'Anonymous'}</Text>
                      <HStack spacing={1} fontSize="xs" color={subtleTextColor}>
                          <FaCalendarAlt />
                          <Text>{new Date(q.createdAt).toLocaleDateString()}</Text>
                      </HStack>
                      <Divider orientation="horizontal" borderColor={borderColor} w="70%" />
                      <VStack spacing={1} align="center">
                        <Tooltip label="Upvotes" hasArrow>
                          <Flex align="center" gap={1}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<FaThumbsUp />}
                              onClick={() => handleUpvoteQuestionList(q._id)}
                              colorScheme="green"
                              _hover={{ bg: 'green.50', transform: 'scale(1.1)' }}
                              transition="all 0.2s"
                            />
                            <Text fontWeight="bold" color="green.500" fontSize="md">
                              {q.upvotes}
                            </Text>
                          </Flex>
                        </Tooltip>
                        <Tooltip label="Downvotes" hasArrow>
                          <Flex align="center" gap={1}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<FaThumbsDown />}
                              onClick={() => handleDownvoteQuestionList(q._id)}
                              colorScheme="red"
                              _hover={{ bg: 'red.50', transform: 'scale(1.1)' }}
                              transition="all 0.2s"
                            />
                            <Text fontWeight="bold" color="red.500" fontSize="md">
                              {q.downvotes}
                            </Text>
                          </Flex>
                        </Tooltip>
                      </VStack>
                    </VStack>

                    {/* Middle: Question Content (Main Area) */}
                    <Box flex="1">
                      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                        <Link to={`/community/questions/${q._id}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <Heading 
                            size="md" 
                            color={headingColor}
                            _hover={{ color: accentColor, textDecoration: 'underline' }}
                            transition="color 0.2s"
                            noOfLines={2}
                            mb={1} // Adjusted margin
                          >
                            {q.title}
                          </Heading>
                        </Link>
                        
                        <Badge
                          colorScheme={getUrgencyColor(q.urgency)}
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs" // Slightly smaller badge font
                          fontWeight="bold"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          flexShrink={0} // Prevent badge from shrinking
                        >
                          {getUrgencyIcon(q.urgency)}
                          {q.urgency} Priority
                        </Badge>
                      </Flex>

                      <Text 
                        color={textColor} 
                        mb={3} // Adjusted margin
                        noOfLines={3}
                        lineHeight="1.6"
                        fontSize="sm" // Slightly smaller content font
                      >
                        {q.content}
                      </Text>

                      {/* Tags */}
                      {q.tags && q.tags.length > 0 && (
                        <Flex wrap="wrap" gap={2} mb={3}> {/* Adjusted margin */}
                          {q.tags.map((tag, k) => (
                            <Tag key={k} size="sm" colorScheme="purple" borderRadius="full"> {/* Changed tag color */}
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          ))}
                        </Flex>
                      )}
                      
                      {/* Read More button */}
                      <Link to={`/community/questions/${q._id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="link" colorScheme="blue" size="sm" rightIcon={<FaEye />}>
                            Read More
                        </Button>
                      </Link>
                    </Box>

                    {/* Right: Answer/Views Stats (Vertical Stack) */}
                    <VStack spacing={3} align="flex-end" justifyContent="space-between" height="100%">
                        <VStack spacing={1} align="flex-end">
                            <Text fontSize="xl" fontWeight="bold" color={accentColor}>{q.answerCount}</Text>
                            <Text fontSize="sm" color={subtleTextColor}>Answers</Text>
                        </VStack>
                        <VStack spacing={1} align="flex-end">
                            <Text fontSize="xl" fontWeight="bold" color={accentColor}>{q.viewCount}</Text>
                            <Text fontSize="sm" color={subtleTextColor}>Views</Text>
                        </VStack>
                        {/* Optional: Add more stats here if needed */}
                    </VStack>
                  </Grid>

                  {/* Separator and Bottom Actions */}
                  <Divider mt={6} mb={4} borderColor={borderColor} /> {/* Increased margin */}
                  <Flex justify="flex-end" align="center" gap={4}> {/* Aligned right */}
                    <HStack spacing={2}>
                      <Tooltip label="Save question" hasArrow>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={<FaBookmark />}
                          color={subtleTextColor}
                          _hover={{ color: accentColor }}
                        />
                      </Tooltip>
                      <Tooltip label="Share question" hasArrow>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={<FaShare />}
                          color={subtleTextColor}
                          _hover={{ color: accentColor }}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            </ScaleFade>
          ))}
        </VStack>

        {/* Ask Question Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
          <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent bg={modalBg} borderColor={borderColor} boxShadow="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
              <HStack>
                <Box color={accentColor}>
                  <FaPlus />
                </Box>
                <Text>Ask a New Question</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody py={6}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">Question Title</FormLabel>
                  <Input
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    placeholder="What's your question? Be specific and clear..."
                    size="lg"
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">Question Details</FormLabel>
                  <Textarea
                    value={newQuestionContent}
                    onChange={(e) => setNewQuestionContent(e.target.value)}
                    placeholder="Provide more details about your question. What have you tried? What specific help do you need?"
                    rows={6}
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor} fontWeight="semibold">Tags</FormLabel>
                  <Input
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentTagInput.trim()) {
                        e.preventDefault();
                        if (!newQuestionTags.includes(currentTagInput.trim())) {
                          setNewQuestionTags(tags => [...tags, currentTagInput.trim()]);
                        }
                        setCurrentTagInput('');
                      }
                    }}
                    placeholder="Add relevant tags (press Enter to add)"
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  />
                  {newQuestionTags.length > 0 && (
                    <Flex wrap="wrap" gap={2} mt={3}>
                      {newQuestionTags.map((tag, i) => (
                        <Tag key={i} size="md" colorScheme="blue" borderRadius="full">
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => removeTag(i)} />
                        </Tag>
                      ))}
                    </Flex>
                  )}
                  <Text fontSize="sm" color={textColor} mt={2}>
                    Add tags to help others find your question (e.g., React, JavaScript, CSS)
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handlePostNewQuestion}
                leftIcon={<FaPlus />}
                isDisabled={!newQuestionTitle.trim() || !newQuestionContent.trim()}
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Post Question
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}