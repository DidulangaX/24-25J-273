//src/components/modulePage/ModulePage.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import LearningAnalytics from "./LearningAnalytics/LearningAnalytics";
import FeedbackPrompt from "./FeedbackPrompt/FeedbackPrompt";
import ResourceViewer from "./ResourceViewer/ResourceViewer";
import InteractionGuidance from "./InteractionGuidance/InteractionGuidance";
import PersonalizedRecommendationsPanel from "./RecommendationsPanel/PersonalizedRecommendationsPanel";
import TabSwitchPrompt from "./TabSwitchPrompt/TabSwitchPrompt";
import SessionResumeDialog from "./SessionResumeDialog/SessionResumeDialog";
import LearningPathVisualization from "./LearningPathVisualization/LearningPathVisualization";
import SessionContinuityTracker from "../../utils/sessionContinuityTracker";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  Badge,
  Spinner,
  useColorModeValue,
  Stack,
  useToast,
  Divider,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
} from "@chakra-ui/react";

import { InfoIcon, ChevronLeftIcon, SearchIcon } from "@chakra-ui/icons";
import { FaPlay, FaFilter } from "react-icons/fa";

const ModulePage = ({ userId = "user123" }) => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [personalizedRecommendations, setPersonalizedRecommendations] =
    useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);
  const [currentInteractionData, setCurrentInteractionData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTabSwitchPrompt, setShowTabSwitchPrompt] = useState(false);
  const analyticsRef = useRef(null);
  const videoRef = useRef(null);
  const toast = useToast();

  // Session continuity tracking
  const [sessionTracker] = useState(new SessionContinuityTracker());
  const [sessionData, setSessionData] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const cardBg = useColorModeValue("white", "gray.700");
  const bgGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.600, blue.800)"
  );
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/videos");
        if (response.data.length > 0) {
          setVideos(response.data);
          setFilteredVideos(response.data);
          if (videoId) {
            const video = response.data.find((v) => v._id === videoId);
            if (video) {
              setSelectedVideo(video);
              setShowPlayer(true);
            } else {
              setSelectedVideo(null);
              setError(`Video with ID ${videoId} not found.`);
            }
          } else {
            setSelectedVideo(null);
          }
        } else {
          setError("No videos available. Please upload videos first.");
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [videoId]);

  // Check for existing session and show resume dialog
  useEffect(() => {
    if (selectedVideo && userId) {
      // Check if there's an existing session
      const existingSession = sessionTracker.getSession(
        selectedVideo._id,
        userId
      );

      // If there's a significant position and it wasn't recent (within the last minute)
      if (
        existingSession &&
        existingSession.lastPosition > 30 &&
        Date.now() - existingSession.lastUpdated > 60000
      ) {
        setSessionData(existingSession);
        setShowResumeDialog(true);
      } else {
        // Start a new session
        const sessionInfo = sessionTracker.startSession(
          selectedVideo._id,
          userId,
          0
        );
        setSessionData(sessionInfo.sessionData);
        // No need to show dialog for new sessions
      }
    }
  }, [selectedVideo, userId]);

  // Periodically update the session position during playback
  useEffect(() => {
    if (!selectedVideo || !userId) return;

    const updateSessionInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        sessionTracker.updatePosition(
          selectedVideo._id,
          userId,
          videoRef.current.currentTime
        );
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(updateSessionInterval);
  }, [selectedVideo, userId]);

  // Handle session end when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedVideo && userId && videoRef.current) {
        sessionTracker.updatePosition(
          selectedVideo._id,
          userId,
          videoRef.current.currentTime
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // End session when component unmounts
      if (selectedVideo && userId && videoRef.current) {
        sessionTracker.endSession(
          selectedVideo._id,
          userId,
          videoRef.current.currentTime,
          videoRef.current.duration || 0
        );
      }
    };
  }, [selectedVideo, userId]);

  useEffect(() => {
    if (videos.length === 0) return;
    const filtered = videos.filter((video) => {
      const matchesSearch =
        searchTerm === "" ||
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description &&
          video.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.category &&
          video.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDifficulty =
        difficultyFilter === "" || video.difficultyLevel === difficultyFilter;
      const matchesCategory =
        categoryFilter === "" || video.category === categoryFilter;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
    setFilteredVideos(filtered);
  }, [searchTerm, difficultyFilter, categoryFilter, videos]);

  // Check for tab switching behavior threshold
  useEffect(() => {
    if (currentInteractionData?.tabSwitchCount > 3 && !showTabSwitchPrompt) {
      setShowTabSwitchPrompt(true);
    }
  }, [currentInteractionData?.tabSwitchCount]);

  const categories = [
    ...new Set(videos.map((video) => video.category).filter(Boolean)),
  ];

  const handleSelectVideo = (video) => {
    // Navigate to the selected video
    if (video && video._id) {
      navigate(`/module-page/${video._id}`);
    }
  };

  const handleBackToVideos = () => {
    setShowPlayer(false);
    setViewingResource(null);
    setPersonalizedRecommendations(null);
    setRecommendationsError(null);
    setShowAnalytics(false);
  };

  const handleOpenResource = (resource) => {
    console.log("Opening resource:", resource);
    setViewingResource(resource);
  };

  const handleToggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    if (!showAnalytics && analyticsRef.current) {
      setTimeout(() => {
        analyticsRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDifficultyFilterChange = (e) => {
    setDifficultyFilter(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDifficultyFilter("");
    setCategoryFilter("");
  };

  const handleFeedbackSubmit = async (difficulty, responseData) => {
    console.log(`Feedback received with difficulty: ${difficulty}`);
    toast({
      title: "Feedback received",
      description: `You rated this content as ${
        difficulty === "difficult"
          ? "difficult"
          : difficulty === "justright"
          ? "just right"
          : "easy"
      }`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    console.log("Full response from feedback:", responseData);
    if (!responseData || !responseData.success) {
      console.error("Invalid response from server:", responseData);
      setRecommendationsError(
        "Failed to get personalized recommendations. Please try again."
      );
      return;
    }
    if (responseData.recommendations) {
      const formattedRecommendations = {
        resources: Array.isArray(responseData.recommendations.resources)
          ? responseData.recommendations.resources
          : [],
        nextVideo: responseData.recommendations.nextVideo || null,
        learningPath: responseData.recommendations.learningPath || [],
        difficulty: difficulty,
      };
      console.log("Storing recommendations with difficulty:", difficulty);
      console.log("Formatted recommendations:", formattedRecommendations);
      setPersonalizedRecommendations(formattedRecommendations);
      setRecommendationsLoading(false);
      // Show success toast for resources
      const resourceCount = formattedRecommendations.resources.length;
      const hasNextVideo = !!formattedRecommendations.nextVideo;
      const hasLearningPath = formattedRecommendations.learningPath.length > 0;
      if (resourceCount > 0 || hasNextVideo || hasLearningPath) {
        let message = [];
        if (resourceCount > 0) {
          message.push(
            `${resourceCount} learning resource${resourceCount > 1 ? "s" : ""}`
          );
        }
        if (hasNextVideo) {
          message.push("a recommended next video");
        }
        if (hasLearningPath) {
          message.push("a personalized learning path");
        }
        toast({
          title: "Learning Recommendations Ready",
          description: `We've prepared ${message.join(
            ", "
          )} based on your feedback.`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Learning Tips Available",
          description: "We've provided learning tips based on your feedback.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      const basicRecommendations = {
        resources: [],
        nextVideo: null,
        learningPath: [],
        difficulty: difficulty,
      };
      setPersonalizedRecommendations(basicRecommendations);
      setRecommendationsLoading(false);
      toast({
        title: "Learning Tips Available",
        description:
          "We've provided basic learning tips based on your feedback.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGuidanceAction = (actionType) => {
    switch (actionType) {
      case "EXCESSIVE_PAUSING":
        toast({
          title: "Note-Taking Tips",
          description:
            "Try the Cornell note-taking method for technical content: divide your notes into main points and details.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        break;
      case "MULTIPLE_REPLAYS":
        setShowAnalytics(true);
        setTimeout(() => {
          analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        break;
      case "SKIPPING_FORWARD":
        toast({
          title: "Looking for more challenge?",
          description:
            "We've noticed you're skipping content. Try our advanced materials for a deeper dive into this topic.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        break;
      case "LEARNING_INSIGHT":
        setShowAnalytics(true);
        setTimeout(() => {
          analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        break;
      default:
        break;
    }
  };

  const handleResumeSession = (position) => {
    // Set video position to the last saved position
    if (videoRef.current) {
      videoRef.current.currentTime = position;
      videoRef.current.play();
    }
    setShowResumeDialog(false);
  };

  const handleStartOver = () => {
    // Start from the beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    // Update session data to reflect starting over
    const sessionInfo = sessionTracker.startSession(
      selectedVideo._id,
      userId,
      0
    );
    setSessionData(sessionInfo.sessionData);
    setShowResumeDialog(false);
  };

  const handleViewRecommendedVideo = (video) => {
    if (video && video._id) {
      setSelectedVideo(video);
      setViewingResource(null);
      setPersonalizedRecommendations(null);
      setShowAnalytics(false);
      toast({
        title: "Video changed",
        description: `Now playing: ${video.title}`,
        status: "info",
        duration: 3000,
      });
    }
  };

  const getDifficultyProps = (level) => {
    switch (level) {
      case "beginner":
        return { colorScheme: "green", text: "Beginner" };
      case "intermediate":
        return { colorScheme: "orange", text: "Intermediate" };
      case "advanced":
        return { colorScheme: "red", text: "Advanced" };
      default:
        return { colorScheme: "blue", text: level || "All Levels" };
    }
  };

  const getThumbnailUrl = (video) => {
    if (video.thumbnailPath && video.thumbnailPath.trim() !== "") {
      if (video.thumbnailPath.startsWith("http")) {
        return video.thumbnailPath;
      } else {
        return `http://localhost:5000/${video.thumbnailPath}`;
      }
    }
    const categoryImages = {
      programming:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80",
      database:
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2071&q=80",
      networking:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2034&q=80",
      security:
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    };
    return (
      categoryImages[video.category] ||
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
    );
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={4} pt={20}>
      {/* Welcome Header - Only show when not viewing a video */}
      {!showPlayer && !viewingResource && (
        <Box bg="blue.500" p={6} borderRadius="xl" mb={8} boxShadow="md">
          <Heading as="h1" size="xl" textAlign="center" color="white">
            Welcome to the SkillForge Module Page
          </Heading>
          <Text textAlign="center" color="white" mt={2} fontSize="lg">
            Explore our learning modules to build your skills
          </Text>
        </Box>
      )}

      {viewingResource ? (
        // Resource Viewer
        <ResourceViewer
          resource={viewingResource}
          onBack={() => setViewingResource(null)}
        />
      ) : !showPlayer ? (
        // Search/Filter Bar and Video Grid
        <Box>
          {/* Search and Filter Bar */}
          <Box mb={8} p={4} bg="white" borderRadius="lg" boxShadow="sm">
            {/* Search input */}
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search for videos..."
                value={searchTerm}
                onChange={handleSearchChange}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
              />
            </InputGroup>
            {/* Filter controls - Mobile first approach */}
            <Flex wrap="wrap" gap={3}>
              <Box flex="1" minW="200px">
                <Select
                  placeholder="Difficulty Level"
                  value={difficultyFilter}
                  onChange={handleDifficultyFilterChange}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  h="40px"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </Box>
              <Box flex="1" minW="200px">
                <Select
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  h="40px"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Button
                  colorScheme="gray"
                  onClick={handleClearFilters}
                  leftIcon={<Icon as={FaFilter} />}
                  h="40px"
                >
                  Clear Filters
                </Button>
              </Box>
            </Flex>
          </Box>
          {/* Results count and feedback */}
          <Box mb={4} pl={2}>
            <Text color="gray.600" fontSize="sm">
              Showing {filteredVideos.length} of {videos.length} videos
            </Text>
          </Box>
          {/* Video Grid */}
          {filteredVideos.length > 0 ? (
            <Grid
              templateColumns={{
                base: "1fr",
                sm: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
              gap={6}
            >
              {filteredVideos.map((video) => (
                <Card
                  key={video._id}
                  maxW="sm"
                  overflow="hidden"
                  cursor="pointer"
                  onClick={() => handleSelectVideo(video)}
                  bg={cardBg}
                  boxShadow="md"
                  transition="transform 0.3s, box-shadow 0.3s"
                  _hover={{
                    transform: "translateY(-8px)",
                    boxShadow: "lg",
                  }}
                  h="100%"
                >
                  <Box position="relative" height="180px" overflow="hidden">
                    <Image
                      src={getThumbnailUrl(video)}
                      alt={video.title}
                      objectFit="cover"
                      width="100%"
                      height="100%"
                      fallback={
                        <Box
                          bgGradient={bgGradient}
                          height="100%"
                          width="100%"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text
                            fontSize="5xl"
                            fontWeight="bold"
                            color="white"
                            opacity={0.8}
                          >
                            {video.title.substring(0, 2).toUpperCase()}
                          </Text>
                        </Box>
                      }
                    />
                    <Badge
                      position="absolute"
                      top="2"
                      right="2"
                      colorScheme={
                        getDifficultyProps(video.difficultyLevel).colorScheme
                      }
                      px="2"
                      py="1"
                      borderRadius="md"
                    >
                      {getDifficultyProps(video.difficultyLevel).text}
                    </Badge>
                  </Box>
                  <CardBody pb={2}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.500"
                      textTransform="uppercase"
                      mb={2}
                    >
                      {video.category}
                    </Text>
                    <Heading size="md" mb={2}>
                      {video.title}
                    </Heading>
                    <Text color={textColor} noOfLines={2}>
                      {video.description || "No description available"}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Duration:{" "}
                      {video.duration
                        ? `${Math.floor(video.duration / 60)}:${String(
                            video.duration % 60
                          ).padStart(2, "0")}`
                        : "10:00"}
                    </Text>
                  </CardBody>
                  <CardFooter pt={0} mt="auto">
                    <Button
                      colorScheme="blue"
                      size="sm"
                      width="full"
                      leftIcon={<Icon as={FaPlay} />}
                    >
                      Watch Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
              <Text fontSize="lg" color="gray.600">
                No videos match your search criteria.
              </Text>
              <Button mt={4} colorScheme="blue" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        // Video Player and Analysis
        <Box maxW="900px" mx="auto">
          <Button
            leftIcon={<ChevronLeftIcon />}
            variant="outline"
            mb={6}
            onClick={handleBackToVideos}
          >
            Back to videos
          </Button>
          {selectedVideo ? (
            <Box>
              <Heading as="h3" size="lg" mb={4}>
                {selectedVideo.title}
              </Heading>

              {/* Session Resume Dialog */}
              {showResumeDialog && (
                <SessionResumeDialog
                  isOpen={showResumeDialog}
                  onClose={() => setShowResumeDialog(false)}
                  onResume={handleResumeSession}
                  onStartOver={handleStartOver}
                  sessionData={sessionData}
                  videoDuration={selectedVideo?.duration || 0}
                />
              )}

              {/* Video Player */}
              <VideoPlayer
                videoId={selectedVideo._id}
                videoUrl={`http://localhost:5000/api/videos/stream/${selectedVideo._id}`}
                userId={userId}
                onInteractionUpdate={setCurrentInteractionData}
                videoRef={videoRef}
              />

              {/* Interactive Guidance Component */}
              <InteractionGuidance
                interactionData={currentInteractionData}
                videoPosition={currentInteractionData?.lastPosition || 0}
                onAction={handleGuidanceAction}
              />

              {/* Tab Switch Prompt */}
              {showTabSwitchPrompt && (
                <TabSwitchPrompt
                  videoId={selectedVideo._id}
                  userId={userId}
                  currentTime={currentInteractionData?.lastPosition || 0}
                  onClose={() => setShowTabSwitchPrompt(false)}
                />
              )}

              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                my={4}
                borderLeft="4px solid"
                borderLeftColor="blue.400"
              >
                <Text>
                  {selectedVideo.description || "No description available"}
                </Text>
              </Box>

              {/* Learning Path Visualization */}
              {selectedVideo.sequenceId && (
                <LearningPathVisualization
                  currentVideoId={selectedVideo._id}
                  userId={userId}
                  sequenceId={selectedVideo.sequenceId}
                  onSelectVideo={handleSelectVideo}
                />
              )}

              {/* Learning Action Buttons */}
              <Stack spacing={4} my={6}>
                {/* Feedback Button */}
                <Box width="100%" textAlign="center">
                  <FeedbackPrompt
                    videoId={selectedVideo._id}
                    userId={userId}
                    interactionData={currentInteractionData}
                    onFeedbackSubmit={handleFeedbackSubmit}
                  />
                </Box>
                {/* Analyze Learning Pattern Button - styled like the feedback button */}
                <Box width="100%" textAlign="center">
                  <Button
                    id="learning-analytics-button"
                    colorScheme="teal" // Matching the likely color of FeedbackPrompt button
                    leftIcon={<InfoIcon />}
                    onClick={handleToggleAnalytics}
                    size="md" // Ensure consistent size with feedback button
                    px={6} // Add padding to match feedback button width
                  >
                    Analyze My Learning Pattern
                  </Button>
                </Box>
              </Stack>

              {/* Personalized Recommendations Panel */}
              <PersonalizedRecommendationsPanel
                recommendations={personalizedRecommendations}
                loading={recommendationsLoading}
                error={recommendationsError}
                onViewResource={handleOpenResource}
                onViewVideo={handleViewRecommendedVideo}
                interactionData={currentInteractionData}
              />

              {/* Learning Analytics Section - only shown when button clicked */}
              <Box
                id="learning-analytics-container"
                mt={8}
                ref={analyticsRef}
                display={showAnalytics ? "block" : "none"}
              >
                <Divider mb={6} />
                <Heading as="h4" size="md" mb={4}>
                  Learning Analytics
                </Heading>
                <LearningAnalytics
                  videoId={selectedVideo._id}
                  userId={userId}
                />
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={10} color="gray.500">
              <Text>
                No video selected. Please select a video from the list or upload
                a new one.
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ModulePage;
