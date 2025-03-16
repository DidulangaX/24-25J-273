/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
// src/components/modulePage/RecommendationsPanel/PersonalizedRecommendationsPanel.js
import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stack,
  Divider,
  Icon,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Image,
  Link,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import {
  InfoIcon,
  ExternalLinkIcon,
  WarningIcon,
  CheckCircleIcon,
  TimeIcon,
  ChevronRightIcon,
  StarIcon,
} from "@chakra-ui/icons";
import {
  FaBookOpen,
  FaVideo,
  FaFileAlt,
  FaLink,
  FaLightbulb,
  FaRoad,
  FaClock,
  FaThumbsUp,
} from "react-icons/fa";

const PersonalizedRecommendationsPanel = ({
  recommendations,
  loading,
  error,
  onViewResource,
  onViewVideo,
  interactionData,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Early return if no data and not loading
  if (
    (!recommendations || Object.keys(recommendations).length === 0) &&
    !loading &&
    !error
  ) {
    return null;
  }

  // Colors based on difficulty level
  const getColorScheme = (difficulty) => {
    switch (difficulty) {
      case "difficult":
        return {
          bg: useColorModeValue("red.50", "red.900"),
          border: useColorModeValue("red.100", "red.700"),
          heading: useColorModeValue("red.700", "red.200"),
          badge: "red",
        };
      case "easy":
        return {
          bg: useColorModeValue("green.50", "green.900"),
          border: useColorModeValue("green.100", "green.700"),
          heading: useColorModeValue("green.700", "green.200"),
          badge: "green",
        };
      default: // justright
        return {
          bg: useColorModeValue("blue.50", "blue.900"),
          border: useColorModeValue("blue.100", "blue.700"),
          heading: useColorModeValue("blue.700", "blue.200"),
          badge: "blue",
        };
    }
  };

  // Get resource icon based on type
  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf":
        return FaFileAlt;
      case "link":
        return FaLink;
      case "video":
        return FaVideo;
      default:
        return FaBookOpen;
    }
  };

  const colorScheme = getColorScheme(recommendations?.difficulty);
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Generate learning tips based on difficulty level and interaction data
  const getLearningTips = () => {
    const tips = [];

    if (recommendations?.difficulty === "difficult") {
      tips.push("Break complex concepts into smaller parts");
      tips.push("Review prerequisite material before continuing");
      tips.push("Use spaced repetition to review challenging sections");

      // Add interaction-specific tips
      if (interactionData?.replay_frequency > 2) {
        tips.push("Try taking notes on sections you repeatedly review");
      }
      if (interactionData?.pause_rate > 5) {
        tips.push(
          "Consider slowing down video playback in challenging sections"
        );
      }
    } else if (recommendations?.difficulty === "easy") {
      tips.push("Challenge yourself with more advanced content");
      tips.push("Apply these concepts to practical projects");
      tips.push("Look for connections between this topic and other areas");

      // Add interaction-specific tips
      if (interactionData?.average_speed > 1) {
        tips.push(
          "Continue using increased playback speed for efficient learning"
        );
      }
    } else {
      // justright
      tips.push("Continue with your current learning pace");
      tips.push("Practice applying concepts as you learn them");
      tips.push("Connect new information with what you already know");
    }

    return tips;
  };

  return (
    <Box mt={6} mb={8}>
      <Heading as="h3" size="md" mb={4}>
        Personalized Learning Recommendations
      </Heading>

      {loading && (
        <Flex justify="center" align="center" p={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text ml={4}>Personalizing your recommendations...</Text>
        </Flex>
      )}

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {recommendations && !loading && !error && (
        <Tabs
          colorScheme={colorScheme.badge}
          variant="enclosed"
          onChange={(index) => setActiveTab(index)}
        >
          <TabList>
            <Tab>
              <Icon as={FaLightbulb} mr={2} />
              Learning Tips
            </Tab>
            <Tab>
              <Icon as={FaBookOpen} mr={2} />
              Resources
              {recommendations.resources?.length > 0 &&
                ` (${recommendations.resources.length})`}
            </Tab>
            <Tab>
              <Icon as={FaRoad} mr={2} />
              Learning Path
            </Tab>
          </TabList>

          <TabPanels>
            {/* Learning Tips Panel */}
            <TabPanel>
              <Box
                p={4}
                borderRadius="md"
                bg={colorScheme.bg}
                borderWidth="1px"
                borderColor={colorScheme.border}
              >
                <Flex align="center" mb={2}>
                  <Icon
                    as={
                      recommendations.difficulty === "difficult"
                        ? WarningIcon
                        : recommendations.difficulty === "easy"
                        ? CheckCircleIcon
                        : InfoIcon
                    }
                    mr={2}
                    color={colorScheme.heading}
                  />
                  <Heading size="sm" color={colorScheme.heading}>
                    Based on your feedback:{" "}
                    {recommendations.difficulty === "difficult"
                      ? "Challenging"
                      : recommendations.difficulty === "easy"
                      ? "Easy"
                      : "Just Right"}{" "}
                    Content
                  </Heading>
                </Flex>

                <Divider mb={3} />

                <List spacing={2}>
                  {getLearningTips().map((tip, index) => (
                    <ListItem key={index}>
                      <Flex align="flex-start">
                        <ListIcon
                          as={FaLightbulb}
                          mt={1}
                          color={colorScheme.heading}
                        />
                        <Text>{tip}</Text>
                      </Flex>
                    </ListItem>
                  ))}
                </List>

                {interactionData &&
                  interactionData.problematic_sections &&
                  interactionData.problematic_sections.length > 0 && (
                    <Box
                      mt={4}
                      pt={4}
                      borderTopWidth="1px"
                      borderColor={borderColor}
                    >
                      <Heading size="sm" mb={2}>
                        Challenging Sections Detected
                      </Heading>

                      {interactionData.problematic_sections.map(
                        (section, index) => (
                          <Box
                            key={index}
                            p={2}
                            borderRadius="md"
                            bg={useColorModeValue("gray.50", "gray.600")}
                            mb={2}
                          >
                            <Flex justify="space-between" align="center">
                              <Text fontSize="sm">
                                <Icon as={FaClock} mr={1} />
                                {formatTime(section.startTime)} -{" "}
                                {formatTime(section.endTime)}
                              </Text>
                              <Badge colorScheme="red">
                                {section.difficulty
                                  ? `${Math.round(
                                      section.difficulty * 100
                                    )}% difficulty`
                                  : "Challenging"}
                              </Badge>
                            </Flex>
                          </Box>
                        )
                      )}
                    </Box>
                  )}
              </Box>
            </TabPanel>

            {/* Resources Panel */}
            <TabPanel>
              {recommendations.resources &&
              recommendations.resources.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {recommendations.resources.map((resource, index) => (
                    <Card key={index} variant="outline" size="sm" bg={cardBg}>
                      <CardHeader pb={2}>
                        <Flex align="center">
                          <Icon
                            as={getResourceIcon(resource.type)}
                            mr={2}
                            color={`${colorScheme.badge}.500`}
                          />
                          <Heading size="xs">{resource.title}</Heading>
                        </Flex>
                      </CardHeader>
                      <CardBody py={2}>
                        <Text fontSize="sm" noOfLines={2}>
                          {resource.description ||
                            "Additional learning material"}
                        </Text>

                        {/* Display badges for resource metadata */}
                        <Flex mt={2} wrap="wrap" gap={2}>
                          {resource.type && (
                            <Badge
                              variant="subtle"
                              colorScheme={
                                resource.type === "pdf"
                                  ? "purple"
                                  : resource.type === "video"
                                  ? "red"
                                  : resource.type === "link"
                                  ? "blue"
                                  : "gray"
                              }
                            >
                              {resource.type}
                            </Badge>
                          )}

                          {resource.recommendedFor && (
                            <Badge
                              variant="subtle"
                              colorScheme={
                                getColorScheme(resource.recommendedFor).badge
                              }
                            >
                              {resource.recommendedFor === "difficult"
                                ? "For challenging content"
                                : resource.recommendedFor === "easy"
                                ? "For review"
                                : "Complementary"}
                            </Badge>
                          )}

                          {resource.matchedSection && (
                            <Tooltip
                              label={`Matched with section ${formatTime(
                                resource.matchedSection.start
                              )} - ${formatTime(resource.matchedSection.end)}`}
                            >
                              <Badge variant="subtle" colorScheme="orange">
                                Section-specific
                              </Badge>
                            </Tooltip>
                          )}
                        </Flex>
                      </CardBody>
                      <CardFooter pt={2}>
                        <Button
                          size="sm"
                          colorScheme={colorScheme.badge}
                          leftIcon={
                            <Icon as={getResourceIcon(resource.type)} />
                          }
                          onClick={() => onViewResource(resource)}
                          width="full"
                        >
                          {resource.type === "pdf"
                            ? "View PDF"
                            : resource.type === "link"
                            ? "Open Link"
                            : resource.type === "text"
                            ? "Read Content"
                            : "View Resource"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Box
                  p={4}
                  borderRadius="md"
                  bg={useColorModeValue("gray.50", "gray.700")}
                >
                  <Flex direction="column" align="center" justify="center">
                    <Icon as={InfoIcon} boxSize={8} color="blue.400" mb={3} />
                    <Text>No specific resources available yet.</Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Try watching more content to get personalized resource
                      recommendations.
                    </Text>
                  </Flex>
                </Box>
              )}
            </TabPanel>

            {/* Learning Path Panel */}
            <TabPanel>
              <Box>
                {recommendations.nextVideo && (
                  <Box mb={6}>
                    <Heading
                      size="sm"
                      mb={3}
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={FaVideo} mr={2} />
                      Recommended Next Video
                    </Heading>
                    <Card
                      variant="outline"
                      direction={{ base: "column", sm: "row" }}
                      overflow="hidden"
                    >
                      <Image
                        objectFit="cover"
                        maxW={{ base: "100%", sm: "200px" }}
                        src={
                          recommendations.nextVideo.thumbnailPath ||
                          "/placeholder-video.jpg"
                        }
                        alt={recommendations.nextVideo.title}
                        fallback={
                          <Flex
                            bg={`${colorScheme.badge}.500`}
                            w="100%"
                            h="100%"
                            minH="150px"
                            align="center"
                            justify="center"
                          >
                            <Icon as={FaVideo} color="white" boxSize={10} />
                          </Flex>
                        }
                      />
                      <Stack>
                        <CardBody>
                          <Heading size="md">
                            {recommendations.nextVideo.title}
                          </Heading>
                          <Text py={2} noOfLines={2}>
                            {recommendations.nextVideo.description ||
                              "Continue your learning journey with this video."}
                          </Text>
                          <Flex mt={2}>
                            {recommendations.nextVideo.difficultyLevel && (
                              <Badge
                                colorScheme={
                                  recommendations.nextVideo.difficultyLevel ===
                                  "beginner"
                                    ? "green"
                                    : recommendations.nextVideo
                                        .difficultyLevel === "intermediate"
                                    ? "blue"
                                    : "red"
                                }
                              >
                                {recommendations.nextVideo.difficultyLevel}
                              </Badge>
                            )}
                            {recommendations.nextVideo.category && (
                              <Badge ml={2} variant="outline">
                                {recommendations.nextVideo.category}
                              </Badge>
                            )}
                            {recommendations.nextVideo.duration && (
                              <Badge ml={2} variant="subtle" colorScheme="gray">
                                {formatDuration(
                                  recommendations.nextVideo.duration
                                )}
                              </Badge>
                            )}
                          </Flex>
                        </CardBody>
                        <CardFooter>
                          <Button
                            colorScheme={colorScheme.badge}
                            rightIcon={<ChevronRightIcon />}
                            onClick={() =>
                              onViewVideo(recommendations.nextVideo)
                            }
                          >
                            Watch Next
                          </Button>
                        </CardFooter>
                      </Stack>
                    </Card>
                  </Box>
                )}

                {recommendations.learningPath &&
                  recommendations.learningPath.length > 0 && (
                    <Box>
                      <Heading
                        size="sm"
                        mb={3}
                        display="flex"
                        alignItems="center"
                      >
                        <Icon as={FaRoad} mr={2} />
                        Your Personalized Learning Path
                      </Heading>

                      <Stack spacing={4}>
                        {recommendations.learningPath.map((video, index) => (
                          <Flex
                            key={index}
                            borderWidth="1px"
                            borderRadius="md"
                            p={3}
                            align="center"
                            _hover={{
                              bg: useColorModeValue("gray.50", "gray.700"),
                            }}
                            cursor="pointer"
                            onClick={() => onViewVideo(video)}
                          >
                            <Box
                              borderRadius="full"
                              bg={`${colorScheme.badge}.500`}
                              color="white"
                              w="36px"
                              h="36px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="lg"
                              fontWeight="bold"
                              mr={4}
                            >
                              {index + 1}
                            </Box>
                            <Box flex="1">
                              <Text fontWeight="medium">{video.title}</Text>
                              <Flex mt={1}>
                                <Badge
                                  colorScheme={
                                    video.difficultyLevel === "beginner"
                                      ? "green"
                                      : video.difficultyLevel === "intermediate"
                                      ? "blue"
                                      : "red"
                                  }
                                >
                                  {video.difficultyLevel}
                                </Badge>
                                {video.duration && (
                                  <Badge
                                    ml={2}
                                    variant="subtle"
                                    colorScheme="gray"
                                  >
                                    {formatDuration(video.duration)}
                                  </Badge>
                                )}
                              </Flex>
                            </Box>
                            <ChevronRightIcon ml={2} />
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  )}

                {!recommendations.nextVideo &&
                  (!recommendations.learningPath ||
                    recommendations.learningPath.length === 0) && (
                    <Box
                      p={4}
                      borderRadius="md"
                      bg={useColorModeValue("gray.50", "gray.700")}
                    >
                      <Flex direction="column" align="center" justify="center">
                        <Icon
                          as={InfoIcon}
                          boxSize={8}
                          color="blue.400"
                          mb={3}
                        />
                        <Text>Learning path not available yet.</Text>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Continue watching content to get a personalized
                          learning path.
                        </Text>
                      </Flex>
                    </Box>
                  )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds) {
  if (typeof seconds !== "number") return "--:--";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Helper function to format duration (seconds to MM:SS or HH:MM:SS)
function formatDuration(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default PersonalizedRecommendationsPanel;
