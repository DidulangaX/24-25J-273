import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  List,
  ListItem,
  ListIcon,
  Badge,
  Progress,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stack,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Icon,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  InfoIcon,
  TimeIcon,
  RepeatIcon,
} from "@chakra-ui/icons";

const LearningAnalytics = ({ videoId, userId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [resources, setResources] = useState([]);

  // Chakra color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const difficultBg = useColorModeValue("red.50", "red.900");
  const easyBg = useColorModeValue("green.50", "green.900");
  const sectionBg = useColorModeValue("gray.50", "gray.700");

  const analyzeLearning = async () => {
    if (!videoId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/videos/detect-difficulty/${videoId}`,
        { userId }
      );
      console.log("Difficulty analysis response:", response.data);
      if (response.data && response.data.success) {
        setAnalytics(response.data);

        // Look for problematic sections
        if (response.data.interactionSummary.problematic_sections) {
          // Fetch resources for these sections
          await fetchSectionResources(
            videoId,
            response.data.interactionSummary.problematic_sections
          );
        }
      } else {
        setError(
          response.data?.message || "Failed to analyze learning pattern"
        );
      }
    } catch (err) {
      console.error("Error analyzing learning:", err);
      if (err.response?.status === 404) {
        setError("Not enough viewing data. Please watch more of the video.");
      } else {
        setError("Failed to analyze learning pattern. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources for problematic sections
  const fetchSectionResources = async (videoId, sections) => {
    try {
      // Collect unique section timeframes
      const sectionPromises = sections.map((section) => {
        return axios.get(
          `http://localhost:5000/api/videos/resources/video/${videoId}`
        );
      });

      const results = await Promise.all(sectionPromises);

      // Combine and filter resources
      let allResources = [];
      results.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allResources = [...allResources, ...result.data];
        }
      });

      // Filter for section-specific resources
      const filteredResources = allResources.filter((resource) => {
        if (!resource.sectionStart && !resource.sectionEnd) return true;

        // Check if resource applies to any problematic section
        return sections.some((section) => {
          return (
            resource.sectionStart <= section.endTime &&
            resource.sectionEnd >= section.startTime
          );
        });
      });

      // Remove duplicates
      const uniqueResources = filteredResources.reduce((acc, current) => {
        const isDuplicate = acc.some((item) => item._id === current._id);
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      setResources(uniqueResources);
    } catch (error) {
      console.error("Error fetching section resources:", error);
    }
  };

  // Helper to format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Jump to a specific timestamp in the video
  const jumpToTimestamp = (seconds) => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = seconds;
      videoElement.play();
    }
  };

  // Open a resource URL
  const openResource = (resource) => {
    if (resource.type === "link" && resource.url) {
      window.open(resource.url, "_blank");
    } else if (resource.type === "pdf" && resource.filePath) {
      // Extract the filename from the filepath
      const filename = resource.filePath.split("\\").pop().split("/").pop();
      window.open(`http://localhost:5000/uploads/pdfs/${filename}`, "_blank");
    } else if (resource.type === "text" && resource.content) {
      // Show text content in a modal or expand it in the UI
      alert(resource.content);
    }
  };

  // Get resource icon by type
  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "link":
        return "🔗";
      case "text":
        return "📝";
      default:
        return "📚";
    }
  };

  return (
    <Box width="100%">
      {!showAnalytics ? (
        <Button
          colorScheme="blue"
          leftIcon={<InfoIcon />}
          onClick={() => {
            setShowAnalytics(true);
            analyzeLearning();
          }}
          width={{ base: "full", md: "auto" }}
        >
          Analyze My Learning Pattern
        </Button>
      ) : (
        <Box
          borderRadius="lg"
          borderWidth="1px"
          boxShadow="sm"
          bg={cardBg}
          overflow="hidden"
        >
          {loading ? (
            <Flex direction="column" align="center" justify="center" p={10}>
              <Spinner size="xl" color="blue.500" thickness="4px" mb={4} />
              <Text color="gray.500">Analyzing your learning pattern...</Text>
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <Text>{error}</Text>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAnalytics(false)}
                  mt={2}
                >
                  Close
                </Button>
              </Box>
            </Alert>
          ) : analytics ? (
            <Box>
              <Box
                p={5}
                bg={
                  analytics.prediction.predicted_difficulty === 1
                    ? difficultBg
                    : easyBg
                }
                borderBottomWidth="1px"
              >
                <Heading size="md" mb={2}>
                  Learning Analysis Results
                </Heading>
                <Flex
                  align="center"
                  justify="space-between"
                  flexWrap="wrap"
                  gap={3}
                >
                  <Stack>
                    <Text fontWeight="bold">Content Difficulty:</Text>
                    <Badge
                      colorScheme={
                        analytics.prediction.predicted_difficulty === 1
                          ? "red"
                          : "green"
                      }
                      fontSize="md"
                      p={2}
                      borderRadius="md"
                    >
                      {analytics.prediction.predicted_difficulty === 1
                        ? "Challenging"
                        : "Manageable"}
                    </Badge>
                  </Stack>

                  <Box>
                    <Text mb={1}>Confidence:</Text>
                    <Progress
                      value={Math.round(analytics.prediction.confidence * 100)}
                      size="sm"
                      colorScheme={
                        analytics.prediction.predicted_difficulty === 1
                          ? "red"
                          : "green"
                      }
                      borderRadius="md"
                      width="150px"
                    />
                    <Text fontSize="sm" mt={1} textAlign="center">
                      {Math.round(analytics.prediction.confidence * 100)}%
                    </Text>
                  </Box>
                </Flex>
              </Box>

              {/* Insights Section */}
              {analytics.prediction.insights && (
                <Box p={5} borderBottomWidth="1px">
                  <Heading size="sm" mb={3}>
                    Analysis Insights:
                  </Heading>
                  <List spacing={2}>
                    {analytics.prediction.insights.map((insight, index) => (
                      <ListItem
                        key={index}
                        display="flex"
                        alignItems="baseline"
                      >
                        <ListIcon as={InfoIcon} color="blue.500" />
                        <Text>{insight}</Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Problematic Sections */}
              {analytics.interactionSummary.problematic_sections &&
                analytics.interactionSummary.problematic_sections.length >
                  0 && (
                  <Box p={5} borderBottomWidth="1px">
                    <Heading size="sm" mb={3}>
                      Sections You Found Challenging:
                    </Heading>
                    <List spacing={3}>
                      {analytics.interactionSummary.problematic_sections.map(
                        (section, index) => (
                          <ListItem
                            key={index}
                            p={3}
                            bg={sectionBg}
                            borderRadius="md"
                            borderLeftWidth="4px"
                            borderLeftColor="red.400"
                          >
                            <Flex
                              justify="space-between"
                              align="center"
                              mb={2}
                              flexWrap="wrap"
                              gap={2}
                            >
                              <Text fontWeight="medium">
                                {formatTime(section.startTime)} -{" "}
                                {formatTime(section.endTime)}
                              </Text>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                leftIcon={<TimeIcon />}
                                onClick={() =>
                                  jumpToTimestamp(section.startTime)
                                }
                              >
                                Review Section
                              </Button>
                            </Flex>

                            <Flex gap={4} fontSize="sm" color="gray.600" mt={1}>
                              {section.replayCount > 0 && (
                                <Flex align="center">
                                  <RepeatIcon mr={1} />
                                  <Text>
                                    Replayed {section.replayCount} times
                                  </Text>
                                </Flex>
                              )}
                              {section.pauseCount > 0 && (
                                <Flex align="center">
                                  <Icon as={() => <span>⏸️</span>} mr={1} />
                                  <Text>Paused {section.pauseCount} times</Text>
                                </Flex>
                              )}
                            </Flex>
                          </ListItem>
                        )
                      )}
                    </List>
                  </Box>
                )}

              {/* Recommendations */}
              {analytics.recommendations &&
                analytics.recommendations.length > 0 && (
                  <Box p={5} borderBottomWidth="1px">
                    <Heading size="sm" mb={3}>
                      Personalized Recommendations:
                    </Heading>
                    <List spacing={2}>
                      {analytics.recommendations.map((rec, index) => (
                        <ListItem
                          key={index}
                          display="flex"
                          alignItems="baseline"
                        >
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          <Text>{rec}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

              {/* Resource Recommendations */}
              {resources.length > 0 && (
                <Box p={5} borderBottomWidth="1px">
                  <Heading size="sm" mb={3}>
                    Learning Resources:
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {resources.map((resource, index) => (
                      <Card key={index} variant="outline" size="sm">
                        <CardHeader pb={2}>
                          <Flex align="center" gap={2}>
                            <Text fontSize="xl">
                              {getResourceIcon(resource.type)}
                            </Text>
                            <Heading size="xs">{resource.title}</Heading>
                          </Flex>
                        </CardHeader>
                        <CardBody py={2}>
                          <Text fontSize="sm" noOfLines={2}>
                            {resource.description}
                          </Text>
                          {resource.sectionStart !== undefined &&
                            resource.sectionEnd !== undefined && (
                              <Badge
                                mt={2}
                                colorScheme="blue"
                                variant="outline"
                                fontSize="xs"
                              >
                                Section: {formatTime(resource.sectionStart)} -{" "}
                                {formatTime(resource.sectionEnd)}
                              </Badge>
                            )}
                        </CardBody>
                        <CardFooter pt={2} justifyContent="space-between">
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={() => openResource(resource)}
                          >
                            {resource.type === "link"
                              ? "Open Link"
                              : resource.type === "pdf"
                              ? "View PDF"
                              : "Read Content"}
                          </Button>
                          {resource.sectionStart !== undefined && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() =>
                                jumpToTimestamp(resource.sectionStart)
                              }
                            >
                              Jump to Section
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              <Flex justify="flex-end" p={4} gap={3}>
                <Button
                  size="sm"
                  leftIcon={<RepeatIcon />}
                  onClick={() => analyzeLearning()}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAnalytics(false)}
                >
                  Close
                </Button>
              </Flex>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default LearningAnalytics;
