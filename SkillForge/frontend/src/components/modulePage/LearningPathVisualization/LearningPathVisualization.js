// src/components/modulePage/LearningPathVisualization/LearningPathVisualization.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Icon,
  Button,
  useColorModeValue,
  Divider,
  Badge,
  Tooltip,
  SimpleGrid,
  Progress,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaCheckCircle, FaCircle, FaLock, FaPlay } from "react-icons/fa";
import axios from "axios";

const LearningPathVisualization = ({
  currentVideoId,
  userId,
  sequenceId,
  onSelectVideo,
}) => {
  const [pathVideos, setPathVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [sessionsData, setSessionsData] = useState({});

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");
  const headerBg = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    if (!sequenceId) return;

    const fetchSequenceVideos = async () => {
      try {
        setLoading(true);
        // Fetch all videos in this sequence
        const response = await axios.get(`http://localhost:5000/api/videos`, {
          params: { sequenceId },
        });

        if (response.data) {
          // Sort by sequence position
          const sortedVideos = response.data
            .filter((video) => video.sequenceId === sequenceId)
            .sort((a, b) => a.sequencePosition - b.sequencePosition);

          setPathVideos(sortedVideos);

          // Find current video index
          const index = sortedVideos.findIndex(
            (video) => video._id === currentVideoId
          );
          setCurrentIndex(index);
        }
      } catch (error) {
        console.error("Error fetching sequence videos:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserSessions = async () => {
      try {
        // Get user's session data
        const response = await axios.get(
          `http://localhost:5000/api/videos/user-sessions/${userId}`
        );

        if (response.data && response.data.sessions) {
          // Transform to map for easier lookup
          const sessionsMap = {};
          response.data.sessions.forEach((session) => {
            sessionsMap[session.videoId] = session;
          });
          setSessionsData(sessionsMap);
        }
      } catch (error) {
        console.error("Error fetching user sessions:", error);
      }
    };

    fetchSequenceVideos();
    fetchUserSessions();
  }, [sequenceId, currentVideoId, userId]);

  const getVideoStatus = (video, index) => {
    const session = sessionsData[video._id];

    if (video._id === currentVideoId) {
      return "current";
    }

    if (session && session.completionRatio >= 0.9) {
      return "completed";
    }

    if (session && session.completionRatio > 0) {
      return "inProgress";
    }

    if (index <= currentIndex + 1) {
      return "available";
    }

    return "locked";
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Icon as={FaCheckCircle} color="green.500" />;
      case "current":
        return <Icon as={FaPlay} color="blue.500" />;
      case "inProgress":
        return <Icon as={FaCircle} color="orange.500" />;
      case "available":
        return <Icon as={FaCircle} color="gray.400" />;
      case "locked":
        return <Icon as={FaLock} color="gray.400" />;
      default:
        return null;
    }
  };

  const getCompletionPercentage = (videoId) => {
    const session = sessionsData[videoId];
    if (!session) return 0;
    return Math.min(Math.round(session.completionRatio * 100), 100);
  };

  const handleContinue = (video, status) => {
    if (status === "locked") return;

    if (onSelectVideo) {
      onSelectVideo(video);
    }
  };

  if (loading || pathVideos.length === 0) {
    return null;
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      mb={6}
      bg={bgColor}
      borderColor={borderColor}
    >
      <Heading size="md" mb={4}>
        Your Learning Path
      </Heading>
      <Divider mb={4} />

      <SimpleGrid columns={1} spacing={4}>
        {pathVideos.map((video, index) => {
          const status = getVideoStatus(video, index);
          const isDisabled = status === "locked";

          return (
            <Box
              key={video._id}
              borderWidth="1px"
              borderRadius="md"
              borderColor={borderColor}
              bg={video._id === currentVideoId ? headerBg : "transparent"}
              position="relative"
              _hover={{
                boxShadow: isDisabled ? "none" : "sm",
                transform: isDisabled ? "none" : "translateY(-2px)",
                borderColor: isDisabled ? borderColor : "blue.300",
              }}
              transition="all 0.2s"
              opacity={isDisabled ? 0.7 : 1}
            >
              <Flex
                p={4}
                cursor={isDisabled ? "not-allowed" : "pointer"}
                onClick={() => handleContinue(video, status)}
                justifyContent="space-between"
                alignItems="center"
              >
                <Flex align="center" maxW="70%">
                  <Box mr={3}>{renderStatusIcon(status)}</Box>
                  <Box>
                    <Text fontWeight="medium" noOfLines={1}>
                      {video.title}
                    </Text>
                    <Flex mt={1} gap={2}>
                      {video.difficultyLevel && (
                        <Badge
                          colorScheme={
                            video.difficultyLevel === "beginner"
                              ? "green"
                              : video.difficultyLevel === "intermediate"
                              ? "blue"
                              : "red"
                          }
                          fontSize="xs"
                        >
                          {video.difficultyLevel}
                        </Badge>
                      )}
                      {video.level && (
                        <Badge colorScheme="orange" fontSize="xs">
                          Level {video.level}
                        </Badge>
                      )}
                      <Badge colorScheme="purple" fontSize="xs">
                        #{video.sequencePosition}
                      </Badge>
                    </Flex>
                  </Box>
                </Flex>

                <Flex align="center" gap={2}>
                  {status === "inProgress" && (
                    <Tooltip
                      label={`${getCompletionPercentage(video._id)}% completed`}
                    >
                      <Box w="80px">
                        <Progress
                          value={getCompletionPercentage(video._id)}
                          size="sm"
                          colorScheme="orange"
                          borderRadius="full"
                        />
                      </Box>
                    </Tooltip>
                  )}

                  <Button
                    size="sm"
                    variant={status === "current" ? "solid" : "outline"}
                    colorScheme={status === "locked" ? "gray" : "blue"}
                    isDisabled={isDisabled}
                    rightIcon={<ChevronRightIcon />}
                  >
                    {status === "completed"
                      ? "Review"
                      : status === "current"
                      ? "Continue"
                      : status === "inProgress"
                      ? "Resume"
                      : "Start"}
                  </Button>
                </Flex>
              </Flex>

              {status === "inProgress" && (
                <Box px={4} pb={3} pt={0}>
                  <Text fontSize="xs" color="orange.500" fontWeight="medium">
                    You've watched {getCompletionPercentage(video._id)}% of this
                    video
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default LearningPathVisualization;
