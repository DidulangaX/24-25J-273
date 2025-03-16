/* eslint-disable no-unused-vars */
// src/components/modulePage/ModulePage.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

// Import components
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import LearningAnalytics from "./LearningAnalytics/LearningAnalytics";
import FeedbackPrompt from "./FeedbackPrompt/FeedbackPrompt";
import ResourceViewer from "./ResourceViewer/ResourceViewer";
import InteractionGuidance from "./InteractionGuidance/InteractionGuidance";
import PersonalizedRecommendationsPanel from "./RecommendationsPanel/PersonalizedRecommendationsPanel";

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
  Wrap,
  WrapItem,
  Divider,
  Tooltip,
  Icon,
  Collapse,
} from "@chakra-ui/react";
import {
  InfoIcon,
  WarningIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@chakra-ui/icons";
import { FaPlay, FaLightbulb } from "react-icons/fa";

const ModulePage = ({ userId = "user123" }) => {
  const { videoId } = useParams();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Personalized recommendations state
  const [personalizedRecommendations, setPersonalizedRecommendations] =
    useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const [viewingResource, setViewingResource] = useState(null);
  const [currentInteractionData, setCurrentInteractionData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const analyticsRef = useRef(null);
  const toast = useToast();

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const bgGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.600, blue.800)"
  );
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Fetch all videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/videos");
        if (response.data.length > 0) {
          setVideos(response.data);
          // If videoId is provided in URL, use that video
          if (videoId) {
            const video = response.data.find((v) => v._id === videoId);
            if (video) {
              setSelectedVideo(video);
              setShowPlayer(true); // Automatically show player when video is in URL
            } else {
              setSelectedVideo(null);
              setError(`Video with ID ${videoId} not found.`);
            }
          } else {
            // Otherwise just load the videos without selecting one
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

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
    setViewingResource(null);
    // Reset recommendations when changing videos
    setPersonalizedRecommendations(null);
    setRecommendationsError(null);
    setShowAnalytics(false);
  };

  const handleBackToVideos = () => {
    setShowPlayer(false);
    setViewingResource(null);
    // Reset recommendations when going back to video list
    setPersonalizedRecommendations(null);
    setRecommendationsError(null);
    setShowAnalytics(false);
  };

  // Handle opening resources
  const handleOpenResource = (resource) => {
    console.log("Opening resource:", resource);
    setViewingResource(resource);
  };

  // Handle analytics toggle
  const handleToggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    // Scroll to analytics section if opening
    if (!showAnalytics && analyticsRef.current) {
      setTimeout(() => {
        analyticsRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Handle feedback submission with personalized recommendations
  const handleFeedbackSubmit = async (difficulty, responseData) => {
    console.log(`Feedback received with difficulty: ${difficulty}`);

    // Show toast notification for feedback
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

    // Validate response data
    if (!responseData || !responseData.success) {
      console.error("Invalid response from server:", responseData);
      setRecommendationsError(
        "Failed to get personalized recommendations. Please try again."
      );
      return;
    }

    console.log(
      "Setting personalized recommendations from response:",
      responseData.recommendations
    );

    // Set recommendations from response
    if (responseData.recommendations) {
      setPersonalizedRecommendations(responseData.recommendations);
      setRecommendationsLoading(false);

      // Show success toast for personalized content
      const resourceCount = responseData.recommendations.resources?.length || 0;
      const hasNextVideo = !!responseData.recommendations.nextVideo;
      const hasLearningPath =
        responseData.recommendations.learningPath?.length > 0;

      if (resourceCount > 0 || hasNextVideo || hasLearningPath) {
        let message = [];
        if (resourceCount > 0) {
          message.push(
            `${resourceCount} personalized resource${
              resourceCount > 1 ? "s" : ""
            }`
          );
        }
        if (hasNextVideo) {
          message.push("a recommended next video");
        }
        if (hasLearningPath) {
          message.push("a customized learning path");
        }

        toast({
          title: "Personalized Learning Plan",
          description: `We've created ${message.join(
            ", "
          )} based on your feedback.`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      // If no recommendations, create a basic structure with difficulty
      setPersonalizedRecommendations({
        resources: [],
        nextVideo: null,
        learningPath: [],
        difficulty: difficulty,
      });
      setRecommendationsLoading(false);
    }
  };

  // Handler for guidance actions
  const handleGuidanceAction = (actionType) => {
    switch (actionType) {
      case "EXCESSIVE_PAUSING":
        // Open a note-taking panel or provide tips
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
        // Show resources for difficult sections
        setShowAnalytics(true);
        setTimeout(() => {
          analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        break;
      case "SKIPPING_FORWARD":
        // Suggest more advanced content
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
        // Open learning analytics
        setShowAnalytics(true);
        setTimeout(() => {
          analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        break;
      default:
        break;
    }
  };

  // Handle viewing a recommended video
  const handleViewRecommendedVideo = (video) => {
    // Navigate to the recommended video
    if (video && video._id) {
      // You can either change the URL or just update the current video
      // Option 1: Navigate to a new URL
      // history.push(`/module-page/${video._id}`);

      // Option 2: Just update the current video
      setSelectedVideo(video);
      setViewingResource(null);
      setPersonalizedRecommendations(null);

      // Reset other state as needed
      setShowAnalytics(false);

      // Show confirmation toast
      toast({
        title: "Video changed",
        description: `Now playing: ${video.title}`,
        status: "info",
        duration: 3000,
      });
    }
  };

  // Get difficulty badge for card styling
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

  // Generate thumbnail URL based on video data
  const getThumbnailUrl = (video) => {
    // If video has a thumbnailPath, use it
    if (video.thumbnailPath && video.thumbnailPath.trim() !== "") {
      // If it's a full URL, use as is, otherwise prepend with your API base
      if (video.thumbnailPath.startsWith("http")) {
        return video.thumbnailPath;
      } else {
        return `http://localhost:5000/${video.thumbnailPath}`;
      }
    }
    // If no thumbnail, return a default one based on category
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

  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  // Return complete UI based on state
  return (
    <Box maxW="1200px" mx="auto" p={4} pt={20}>
      <Heading as="h2" size="xl" textAlign="center" mb={8}>
        Learning Modules
      </Heading>
      {viewingResource ? (
        // Resource Viewer
        <ResourceViewer
          resource={viewingResource}
          onBack={() => setViewingResource(null)}
        />
      ) : !showPlayer ? (
        // Video Grid
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
          gap={6}
        >
          {videos.map((video) => (
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
              <VideoPlayer
                videoId={selectedVideo._id}
                videoUrl={`http://localhost:5000/api/videos/stream/${selectedVideo._id}`}
                userId={userId}
                onInteractionUpdate={setCurrentInteractionData}
              />
              {/* Interactive Guidance Component */}
              <InteractionGuidance
                interactionData={currentInteractionData}
                videoPosition={currentInteractionData?.lastPosition || 0}
                onAction={handleGuidanceAction}
              />
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
