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
  HStack,
  VStack,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Collapse,
} from "@chakra-ui/react";

import {
  CheckCircleIcon,
  InfoIcon,
  TimeIcon,
  RepeatIcon,
  WarningIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
} from "@chakra-ui/icons";

import {
  FaBrain,
  FaChartLine,
  FaLightbulb,
  FaExclamationTriangle,
  FaFileAlt,
  FaHistory,
  FaChartBar,
  FaUserGraduate,
  FaCheckCircle,
  FaPauseCircle,
  FaRedoAlt,
  FaAngleDoubleRight,
  FaEye,
  FaClock,
  FaBookOpen,
  FaLock,
} from "react-icons/fa";

const LearningAnalytics = ({ videoId, userId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [resources, setResources] = useState([]);
  const [showResourcesSection, setShowResourcesSection] = useState(true);
  const [showInsightsSection, setShowInsightsSection] = useState(true);
  const [showSectionsSection, setShowSectionsSection] = useState(true);

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const difficultBg = useColorModeValue("red.50", "red.900");
  const easyBg = useColorModeValue("green.50", "green.900");
  const sectionBg = useColorModeValue("gray.50", "gray.700");
  const accentBg = useColorModeValue("blue.50", "blue.900");
  const accentColor = useColorModeValue("blue.500", "blue.200");
  const subtleTextColor = useColorModeValue("gray.600", "gray.400");

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

        if (response.data.interactionSummary.problematic_sections) {
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

  const fetchSectionResources = async (videoId, sections) => {
    try {
      const sectionPromises = sections.map((section) => {
        return axios.get(
          `http://localhost:5000/api/videos/resources/video/${videoId}`
        );
      });

      const results = await Promise.all(sectionPromises);

      let allResources = [];
      results.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allResources = [...allResources, ...result.data];
        }
      });

      const filteredResources = allResources.filter((resource) => {
        if (!resource.sectionStart && !resource.sectionEnd) return true;

        return sections.some((section) => {
          return (
            resource.sectionStart <= section.endTime &&
            resource.sectionEnd >= section.startTime
          );
        });
      });

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

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const jumpToTimestamp = (seconds) => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = seconds;
      videoElement.play();
    }
  };

  const openResource = (resource) => {
    if (resource.type === "link" && resource.url) {
      window.open(resource.url, "_blank");
    } else if (resource.type === "pdf" && resource.filePath) {
      const filename = resource.filePath.split("\\").pop().split("/").pop();
      window.open(`http://localhost:5000/uploads/pdfs/${filename}`, "_blank");
    } else if (resource.type === "text" && resource.content) {
      alert(resource.content);
    }
  };

  // Get resource icon by type
  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf":
        return <Icon as={FaFileAlt} color="red.500" />;
      case "link":
        return <Icon as={FaAngleDoubleRight} color="blue.500" />;
      case "text":
        return <Icon as={FaFileAlt} color="green.500" />;
      default:
        return <Icon as={FaFileAlt} color="gray.500" />;
    }
  };

  const getDifficultyColorScheme = (isDifficult) => {
    return isDifficult ? "red" : "green";
  };

  const getConfidenceDisplay = (confidence) => {
    const confidencePercent = Math.round(confidence * 100);

    if (confidencePercent >= 80) {
      return { text: "Very High", color: "green" };
    } else if (confidencePercent >= 60) {
      return { text: "High", color: "teal" };
    } else if (confidencePercent >= 40) {
      return { text: "Moderate", color: "blue" };
    } else if (confidencePercent >= 20) {
      return { text: "Low", color: "orange" };
    } else {
      return { text: "Very Low", color: "red" };
    }
  };

  return (
    <Box width="100%">
      {!showAnalytics ? (
        <Button
          colorScheme="blue"
          leftIcon={<Icon as={FaChartLine} />}
          onClick={() => {
            setShowAnalytics(true);
            analyzeLearning();
          }}
          width={{ base: "full", md: "auto" }}
          size="md"
          boxShadow="sm"
          _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
          transition="all 0.2s"
        >
          Analyze My Learning Pattern
        </Button>
      ) : (
        <Box
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          {/* Header section */}
          <Flex
            bg={accentBg}
            p={4}
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <Flex alignItems="center">
              <Icon as={FaBrain} fontSize="xl" color={accentColor} mr={2} />
              <Heading size="md">Learning Analytics</Heading>
            </Flex>

            <HStack spacing={2}>
              {analytics && (
                <Badge
                  colorScheme={
                    analytics.prediction.predicted_difficulty === 1
                      ? "red"
                      : "green"
                  }
                  fontSize="md"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {analytics.prediction.predicted_difficulty === 1
                    ? "Challenging"
                    : "Comfortable"}
                </Badge>
              )}
            </HStack>
          </Flex>

          {/* Loading state */}
          {loading ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              p={10}
              bg={cardBg}
            >
              <Spinner size="xl" color={accentColor} thickness="4px" mb={4} />
              <Text color={subtleTextColor}>
                Analyzing your learning patterns...
              </Text>
            </Flex>
          ) : error ? (
            <Alert status="error" variant="subtle" borderRadius="0">
              <AlertIcon />
              <Box flex="1">
                <Text fontWeight="medium">{error}</Text>
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
            <Box bg={cardBg}>
              {/* Analytics Summary */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} p={5}>
                <Card variant="outline" borderRadius="md">
                  <CardHeader
                    bg={
                      analytics.prediction.predicted_difficulty === 1
                        ? difficultBg
                        : easyBg
                    }
                    py={3}
                  >
                    <Heading size="sm">
                      <Flex align="center">
                        <Icon
                          as={
                            analytics.prediction.predicted_difficulty === 1
                              ? FaExclamationTriangle
                              : FaCheckCircle
                          }
                          mr={2}
                          color={
                            analytics.prediction.predicted_difficulty === 1
                              ? "red.600"
                              : "green.600"
                          }
                        />
                        Content Difficulty Analysis
                      </Flex>
                    </Heading>
                  </CardHeader>

                  <CardBody>
                    <Stack spacing={4}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium">Learning Pattern:</Text>
                        <Badge
                          size="lg"
                          colorScheme={getDifficultyColorScheme(
                            analytics.prediction.predicted_difficulty === 1
                          )}
                          px={2}
                          py={1}
                          borderRadius="full"
                          fontSize="sm"
                        >
                          {analytics.prediction.predicted_difficulty === 1
                            ? "Signs of Difficulty"
                            : "Comfortable Learning"}
                        </Badge>
                      </Flex>

                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm">Analysis Confidence:</Text>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={`${
                              getConfidenceDisplay(
                                analytics.prediction.confidence
                              ).color
                            }.500`}
                          >
                            {
                              getConfidenceDisplay(
                                analytics.prediction.confidence
                              ).text
                            }
                          </Text>
                        </Flex>
                        <Progress
                          value={Math.round(
                            analytics.prediction.confidence * 100
                          )}
                          size="sm"
                          colorScheme={
                            getConfidenceDisplay(
                              analytics.prediction.confidence
                            ).color
                          }
                          borderRadius="md"
                        />
                      </Box>

                      <Divider />

                      <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                          <StatLabel color={subtleTextColor} fontSize="xs">
                            Pause Rate
                          </StatLabel>
                          <StatNumber fontSize="lg">
                            {analytics.interactionSummary.pause_rate
                              ? analytics.interactionSummary.pause_rate.toFixed(
                                  1
                                )
                              : 0}
                          </StatNumber>
                          <StatHelpText fontSize="xs">
                            pauses per min
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel color={subtleTextColor} fontSize="xs">
                            Replay Frequency
                          </StatLabel>
                          <StatNumber fontSize="lg">
                            {analytics.interactionSummary.replay_frequency || 0}
                          </StatNumber>
                          <StatHelpText fontSize="xs">replays</StatHelpText>
                        </Stat>
                      </SimpleGrid>
                    </Stack>
                  </CardBody>
                </Card>

                <Card variant="outline" borderRadius="md">
                  <CardHeader bg={accentBg} py={3}>
                    <Heading size="sm">
                      <Flex align="center">
                        <Icon as={FaLightbulb} mr={2} color={accentColor} />
                        Analysis Insights
                      </Flex>
                    </Heading>
                  </CardHeader>

                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      {analytics.prediction.insights &&
                        analytics.prediction.insights.map((insight, index) => (
                          <Flex key={index} align="flex-start">
                            <Icon
                              as={InfoIcon}
                              color={accentColor}
                              mt={1}
                              mr={2}
                            />
                            <Text fontSize="sm">{insight}</Text>
                          </Flex>
                        ))}

                      {analytics.recommendations &&
                        analytics.recommendations.length > 0 && (
                          <>
                            <Divider />
                            <Text fontWeight="medium" fontSize="sm">
                              Recommendations:
                            </Text>
                            <List spacing={2}>
                              {analytics.recommendations.map((rec, index) => (
                                <ListItem
                                  key={index}
                                  display="flex"
                                  alignItems="flex-start"
                                >
                                  <ListIcon
                                    as={CheckCircleIcon}
                                    color="green.500"
                                    mt={1}
                                  />
                                  <Text fontSize="sm">{rec}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Collapsible Sections */}
              {analytics.interactionSummary.problematic_sections &&
                analytics.interactionSummary.problematic_sections.length >
                  0 && (
                  <Box p={5} borderTopWidth="1px" borderColor={borderColor}>
                    <Flex
                      justify="space-between"
                      align="center"
                      onClick={() =>
                        setShowSectionsSection(!showSectionsSection)
                      }
                      cursor="pointer"
                      mb={showSectionsSection ? 4 : 0}
                    >
                      <Heading size="sm">
                        <Flex align="center">
                          <Icon as={FaHistory} mr={2} color="orange.500" />
                          Sections That Need Attention
                        </Flex>
                      </Heading>
                      <Icon
                        as={
                          showSectionsSection ? ChevronUpIcon : ChevronDownIcon
                        }
                        color="gray.500"
                      />
                    </Flex>

                    <Collapse in={showSectionsSection}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {analytics.interactionSummary.problematic_sections.map(
                          (section, index) => (
                            <Card
                              key={index}
                              variant="outline"
                              borderLeftWidth="4px"
                              borderLeftColor="orange.400"
                            >
                              <CardBody py={3}>
                                <Flex
                                  justify="space-between"
                                  align="center"
                                  mb={2}
                                >
                                  <Flex align="center">
                                    <Icon
                                      as={FaClock}
                                      color="orange.500"
                                      mr={2}
                                    />
                                    <Text fontWeight="medium">
                                      {formatTime(section.startTime)} -{" "}
                                      {formatTime(section.endTime)}
                                    </Text>
                                  </Flex>

                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<Icon as={FaEye} />}
                                    onClick={() =>
                                      jumpToTimestamp(section.startTime)
                                    }
                                  >
                                    Review Section
                                  </Button>
                                </Flex>

                                <Flex wrap="wrap" gap={3} mt={3}>
                                  {section.replayCount > 0 && (
                                    <Badge
                                      colorScheme="purple"
                                      variant="subtle"
                                    >
                                      <Flex align="center">
                                        <Icon as={FaRedoAlt} mr={1} />
                                        <Text>
                                          Replayed {section.replayCount} times
                                        </Text>
                                      </Flex>
                                    </Badge>
                                  )}

                                  {section.pauseCount > 0 && (
                                    <Badge colorScheme="blue" variant="subtle">
                                      <Flex align="center">
                                        <Icon as={FaPauseCircle} mr={1} />
                                        <Text>
                                          Paused {section.pauseCount} times
                                        </Text>
                                      </Flex>
                                    </Badge>
                                  )}
                                </Flex>
                              </CardBody>
                            </Card>
                          )
                        )}
                      </SimpleGrid>
                    </Collapse>
                  </Box>
                )}

              {/* Resources Section */}
              {resources.length > 0 && (
                <Box p={5} borderTopWidth="1px" borderColor={borderColor}>
                  <Flex
                    justify="space-between"
                    align="center"
                    onClick={() =>
                      setShowResourcesSection(!showResourcesSection)
                    }
                    cursor="pointer"
                    mb={showResourcesSection ? 4 : 0}
                  >
                    <Heading size="sm">
                      <Flex align="center">
                        <Icon as={FaBookOpen} mr={2} color="blue.500" />
                        Recommended Learning Resources
                      </Flex>
                    </Heading>
                    <Icon
                      as={
                        showResourcesSection ? ChevronUpIcon : ChevronDownIcon
                      }
                      color="gray.500"
                    />
                  </Flex>

                  <Collapse in={showResourcesSection}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {resources.map((resource, index) => (
                        <Card key={index} variant="outline">
                          <CardHeader pb={2}>
                            <Flex align="center">
                              {getResourceIcon(resource.type)}
                              <Heading size="xs" ml={2}>
                                {resource.title}
                              </Heading>
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

                          <CardFooter pt={0} justifyContent="space-between">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => openResource(resource)}
                              leftIcon={getResourceIcon(resource.type)}
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
                                leftIcon={<TimeIcon />}
                              >
                                Jump to Section
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Collapse>
                </Box>
              )}

              {/* Footer Actions */}
              <Flex
                justify="flex-end"
                p={4}
                borderTopWidth="1px"
                borderColor={borderColor}
              >
                <Button
                  size="sm"
                  leftIcon={<RepeatIcon />}
                  onClick={() => analyzeLearning()}
                  mr={3}
                  colorScheme="blue"
                  variant="outline"
                >
                  Refresh Analysis
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
