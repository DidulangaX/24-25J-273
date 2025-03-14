// src/components/modulePage/ModulePage.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

import VideoPlayer from "./VideoPlayer/VideoPlayer";

import LearningAnalytics from "./LearningAnalytics/LearningAnalytics";
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
} from "@chakra-ui/react";

const ModulePage = ({ userId = "user123" }) => {
  const { videoId } = useParams();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPlayer, setShowPlayer] = useState(false);

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const bgGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.600, blue.800)"
  );
  const textColor = useColorModeValue("gray.700", "white");

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
  };

  const handleBackToVideos = () => {
    setShowPlayer(false);
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

  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  // Error state
  if (error && !videos.length) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" textAlign="center" my={8}>
        <Text color="red.500" mb={4}>
          {error}
        </Text>
        <Button as={Link} to="/upload-video" colorScheme="blue">
          Upload Videos
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <Heading as="h2" size="xl" textAlign="center" mb={8}>
        Learning Modules
      </Heading>

      {!showPlayer ? (
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
            >
              <Box
                bgGradient={bgGradient}
                height="180px"
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

              <CardBody pb={2}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.500"
                    textTransform="uppercase"
                  >
                    {video.category}
                  </Text>
                  <Badge
                    colorScheme={
                      getDifficultyProps(video.difficultyLevel).colorScheme
                    }
                    borderRadius="full"
                    px={2}
                  >
                    {getDifficultyProps(video.difficultyLevel).text}
                  </Badge>
                </Flex>

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

              <CardFooter pt={0}>
                <Button
                  colorScheme="blue"
                  size="sm"
                  width="full"
                  leftIcon={<span>▶</span>}
                >
                  Watch Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      ) : (
        <Box maxW="900px" mx="auto">
          <Button
            leftIcon={<span>←</span>}
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

              <Stack
                spacing={4}
                my={6}
                direction={{ base: "column", md: "row" }}
              >
                <LearningAnalytics
                  videoId={selectedVideo._id}
                  userId={userId}
                />
              </Stack>
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
