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
  VStack,
  HStack,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";

import {
  InfoIcon,
  ExternalLinkIcon,
  WarningIcon,
  CheckCircleIcon,
  TimeIcon,
  ChevronRightIcon,
  StarIcon,
  ArrowForwardIcon,
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
  FaChalkboardTeacher,
  FaCode,
  FaRegCompass,
  FaCheckCircle,
  FaGraduationCap,
  FaFileCode,
  FaDatabase,
  FaServer,
  FaNetworkWired,
  FaBrain,
  FaLock,
} from "react-icons/fa";

/**
 * Enhanced professional recommendations panel for personalized learning
 */
const PersonalizedRecommendationsPanel = ({
  recommendations,
  loading,
  error,
  onViewResource,
  onViewVideo,
  interactionData,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // All color mode values defined at the top level of the component
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const accentBg = useColorModeValue("gray.50", "gray.800");

  // Difficult theme colors
  const difficultBg = useColorModeValue("red.50", "red.900");
  const difficultBorder = useColorModeValue("red.100", "red.700");
  const difficultHeading = useColorModeValue("red.700", "red.200");

  // Easy theme colors
  const easyBg = useColorModeValue("green.50", "green.900");
  const easyBorder = useColorModeValue("green.100", "green.700");
  const easyHeading = useColorModeValue("green.700", "green.200");

  // Just right theme colors
  const justrightBg = useColorModeValue("blue.50", "blue.900");
  const justrightBorder = useColorModeValue("blue.100", "blue.700");
  const justrightHeading = useColorModeValue("blue.700", "blue.200");

  // Early return if no data and not loading
  if (
    (!recommendations || Object.keys(recommendations).length === 0) &&
    !loading &&
    !error
  ) {
    return null;
  }

  // Get resource icon based on type
  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf":
        return FaFileAlt;
      case "link":
        return FaLink;
      case "video":
        return FaVideo;
      case "text":
        return FaBookOpen;
      default:
        return FaBookOpen;
    }
  };

  // Get category icon based on category
  const getCategoryIcon = (category) => {
    const lowercase = category?.toLowerCase() || "";
    switch (lowercase) {
      case "programming":
        return FaCode;
      case "database":
        return FaDatabase;
      case "networking":
        return FaNetworkWired;
      case "security":
        return FaLock;
      case "general":
        return FaGraduationCap;
      default:
        return FaChalkboardTeacher;
    }
  };

  // Get color scheme without hooks
  const getColorScheme = (difficulty) => {
    switch (difficulty) {
      case "difficult":
        return {
          bg: difficultBg,
          border: difficultBorder,
          heading: difficultHeading,
          badge: "red",
        };
      case "easy":
        return {
          bg: easyBg,
          border: easyBorder,
          heading: easyHeading,
          badge: "green",
        };
      default: // justright
        return {
          bg: justrightBg,
          border: justrightBorder,
          heading: justrightHeading,
          badge: "blue",
        };
    }
  };

  const colorScheme = getColorScheme(recommendations?.difficulty);

  return (
    <Box
      mt={6}
      mb={8}
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Box
        p={4}
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={accentBg}
      >
        <Flex justify="space-between" align="center">
          <Heading as="h3" size="md">
            Personalized Learning Path
          </Heading>
          <Badge
            colorScheme={colorScheme.badge}
            fontSize="md"
            px={2}
            py={1}
            borderRadius="md"
          >
            {recommendations?.difficulty === "difficult"
              ? "Challenging"
              : recommendations?.difficulty === "easy"
              ? "Accelerated"
              : "Standard"}
          </Badge>
        </Flex>
      </Box>

      {loading && (
        <Flex justify="center" align="center" p={8} bg={cardBg}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text ml={4} fontSize="md" fontWeight="medium">
            Personalizing your learning experience...
          </Text>
        </Flex>
      )}

      {error && (
        <Alert status="error" mb={0} variant="subtle">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {recommendations && !loading && !error && (
        <Tabs
          colorScheme={colorScheme.badge}
          variant="enclosed"
          onChange={(index) => setActiveTab(index)}
          bg={cardBg}
        >
          <TabList
            px={4}
            pt={4}
            borderBottomWidth="1px"
            borderBottomColor={borderColor}
          >
            <Tab
              fontWeight="medium"
              _selected={{
                color: `${colorScheme.badge}.600`,
                borderColor: borderColor,
                borderBottomColor: cardBg,
                bg: cardBg,
              }}
            >
              <Icon as={FaRegCompass} mr={2} />
              Learning Path
            </Tab>
            <Tab
              fontWeight="medium"
              _selected={{
                color: `${colorScheme.badge}.600`,
                borderColor: borderColor,
                borderBottomColor: cardBg,
                bg: cardBg,
              }}
            >
              <Icon as={FaBookOpen} mr={2} />
              Resources
              {recommendations.resources?.length > 0 &&
                ` (${recommendations.resources.length})`}
            </Tab>
            <Tab
              fontWeight="medium"
              _selected={{
                color: `${colorScheme.badge}.600`,
                borderColor: borderColor,
                borderBottomColor: cardBg,
                bg: cardBg,
              }}
            >
              <Icon as={FaLightbulb} mr={2} />
              Learning Tips
            </Tab>
          </TabList>

          <TabPanels>
            {/* Learning Path Panel */}
            <TabPanel p={4}>
              <VStack align="stretch" spacing={6}>
                {recommendations.nextVideo && (
                  <Box>
                    <Flex justify="space-between" align="center" mb={3}>
                      <Heading size="sm">
                        <Icon
                          as={FaVideo}
                          mr={2}
                          color={`${colorScheme.badge}.500`}
                        />
                        Recommended Next Video
                      </Heading>
                      <Badge colorScheme={colorScheme.badge} variant="subtle">
                        {recommendations.nextVideo.difficultyLevel}
                      </Badge>
                    </Flex>

                    <Card
                      direction={{ base: "column", sm: "row" }}
                      overflow="hidden"
                      variant="outline"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                        borderColor: `${colorScheme.badge}.200`,
                      }}
                    >
                      <Image
                        objectFit="cover"
                        maxW={{ base: "100%", sm: "180px" }}
                        maxH="140px"
                        src={
                          recommendations.nextVideo.thumbnailPath ||
                          `https://via.placeholder.com/300x200/4299E1/FFFFFF?text=IT+Learning`
                        }
                        alt={recommendations.nextVideo.title}
                        fallbackSrc={`https://via.placeholder.com/300x200/4299E1/FFFFFF?text=IT+Learning`}
                      />

                      <Stack flex="1">
                        <CardBody py={3}>
                          <Heading size="sm" mb={1}>
                            {recommendations.nextVideo.title}
                          </Heading>
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            noOfLines={2}
                            mb={2}
                          >
                            {recommendations.nextVideo.description ||
                              "Continue your learning journey with this video."}
                          </Text>

                          <HStack spacing={2} mt={1}>
                            {recommendations.nextVideo.category && (
                              <Tooltip
                                label={`Category: ${recommendations.nextVideo.category}`}
                              >
                                <Badge variant="subtle" colorScheme="purple">
                                  <Flex align="center">
                                    <Icon
                                      as={getCategoryIcon(
                                        recommendations.nextVideo.category
                                      )}
                                      mr={1}
                                      fontSize="xs"
                                    />
                                    {recommendations.nextVideo.category}
                                  </Flex>
                                </Badge>
                              </Tooltip>
                            )}

                            {recommendations.nextVideo.level && (
                              <Tooltip label="Content complexity level">
                                <Badge variant="subtle" colorScheme="orange">
                                  <Flex align="center">
                                    <Icon as={StarIcon} mr={1} fontSize="xs" />
                                    Level {recommendations.nextVideo.level}
                                  </Flex>
                                </Badge>
                              </Tooltip>
                            )}
                          </HStack>
                        </CardBody>

                        <CardFooter pt={0} pb={3} px={4}>
                          <Button
                            rightIcon={<ArrowForwardIcon />}
                            colorScheme={colorScheme.badge}
                            size="sm"
                            onClick={() =>
                              onViewVideo(recommendations.nextVideo)
                            }
                            width={{ base: "full", md: "auto" }}
                          >
                            Start Learning
                          </Button>
                        </CardFooter>
                      </Stack>
                    </Card>
                  </Box>
                )}

                {recommendations.learningPath &&
                  recommendations.learningPath.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={3}>
                        <Icon
                          as={FaRoad}
                          mr={2}
                          color={`${colorScheme.badge}.500`}
                        />
                        Your Personalized Learning Path
                      </Heading>

                      <VStack spacing={3} align="stretch">
                        {recommendations.learningPath.map((video, index) => (
                          <Card
                            key={index}
                            variant="outline"
                            overflow="hidden"
                            _hover={{
                              transform: "translateY(-2px)",
                              boxShadow: "sm",
                              borderColor: `${colorScheme.badge}.200`,
                            }}
                            transition="all 0.2s"
                          >
                            <CardBody p={0}>
                              <Flex
                                direction={{ base: "column", sm: "row" }}
                                align="center"
                              >
                                <Flex
                                  bg={`${colorScheme.badge}.100`}
                                  color={`${colorScheme.badge}.700`}
                                  p={4}
                                  align="center"
                                  justify="center"
                                  boxSize={{ base: "60px", sm: "80px" }}
                                  fontWeight="bold"
                                  fontSize="xl"
                                >
                                  {index + 1}
                                </Flex>

                                <Box p={4} flex="1">
                                  <Heading size="sm" mb={1}>
                                    {video.title}
                                  </Heading>
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    noOfLines={2}
                                    mb={2}
                                  >
                                    {video.description ||
                                      "Continue your learning journey."}
                                  </Text>

                                  <HStack spacing={2}>
                                    <Badge
                                      colorScheme={
                                        video.difficultyLevel === "beginner"
                                          ? "green"
                                          : video.difficultyLevel ===
                                            "intermediate"
                                          ? "blue"
                                          : "red"
                                      }
                                    >
                                      {video.difficultyLevel}
                                    </Badge>

                                    {video.category && (
                                      <Badge
                                        variant="outline"
                                        colorScheme="purple"
                                      >
                                        {video.category}
                                      </Badge>
                                    )}

                                    {video.level && (
                                      <Badge
                                        variant="subtle"
                                        colorScheme="orange"
                                      >
                                        Level {video.level}
                                      </Badge>
                                    )}
                                  </HStack>
                                </Box>

                                <Box p={3}>
                                  <Button
                                    rightIcon={<ChevronRightIcon />}
                                    onClick={() => onViewVideo(video)}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme={colorScheme.badge}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </Box>
                  )}

                {!recommendations.nextVideo &&
                  (!recommendations.learningPath ||
                    recommendations.learningPath.length === 0) && (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      p={8}
                      bg={accentBg}
                      borderRadius="md"
                    >
                      <Icon
                        as={FaGraduationCap}
                        boxSize={12}
                        color="gray.400"
                        mb={4}
                      />
                      <Heading size="sm" mb={2} textAlign="center">
                        Learning path not available yet
                      </Heading>
                      <Text fontSize="sm" color="gray.500" textAlign="center">
                        Continue watching content and providing feedback to
                        receive a personalized learning path.
                      </Text>
                    </Flex>
                  )}
              </VStack>
            </TabPanel>

            {/* Resources Panel */}
            <TabPanel p={4}>
              {recommendations.resources &&
              recommendations.resources.length > 0 ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  {recommendations.resources.map((resource, index) => (
                    <Card
                      key={index}
                      variant="outline"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                        borderColor: `${colorScheme.badge}.200`,
                      }}
                    >
                      <CardHeader pb={2} bg={accentBg}>
                        <Flex align="center">
                          <Icon
                            as={getResourceIcon(resource.type)}
                            mr={2}
                            color={`${
                              resource.type === "pdf"
                                ? "red"
                                : resource.type === "link"
                                ? "purple"
                                : "blue"
                            }.500`}
                            boxSize={5}
                          />
                          <Heading size="sm">{resource.title}</Heading>
                        </Flex>
                      </CardHeader>

                      <CardBody py={3}>
                        <Text fontSize="sm" noOfLines={2} mb={3}>
                          {resource.description ||
                            "Additional learning material"}
                        </Text>

                        <Flex wrap="wrap" gap={2}>
                          <Badge
                            colorScheme={
                              resource.type === "pdf"
                                ? "red"
                                : resource.type === "link"
                                ? "purple"
                                : "blue"
                            }
                          >
                            {resource.type?.charAt(0).toUpperCase() +
                              resource.type?.slice(1)}
                          </Badge>

                          {resource.recommendedFor && (
                            <Badge
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
                              <Badge colorScheme="orange">
                                Section-specific
                              </Badge>
                            </Tooltip>
                          )}
                        </Flex>
                      </CardBody>

                      <CardFooter pt={0}>
                        <Button
                          leftIcon={
                            <Icon as={getResourceIcon(resource.type)} />
                          }
                          colorScheme={
                            resource.type === "pdf"
                              ? "red"
                              : resource.type === "link"
                              ? "purple"
                              : "blue"
                          }
                          size="sm"
                          onClick={() => onViewResource(resource)}
                          width="full"
                          variant="outline"
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
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={8}
                  bg={accentBg}
                  borderRadius="md"
                >
                  <Icon as={FaBookOpen} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="sm" mb={2} textAlign="center">
                    No resources available yet
                  </Heading>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Continue watching content to get personalized resource
                    recommendations.
                  </Text>
                </Flex>
              )}
            </TabPanel>

            {/* Learning Tips Panel */}
            <TabPanel p={4}>
              <Box
                p={4}
                borderWidth="1px"
                borderColor={colorScheme.border}
                bg={colorScheme.bg}
                borderRadius="md"
              >
                <Flex align="center" mb={3}>
                  <Icon
                    as={FaLightbulb}
                    color={colorScheme.heading}
                    mr={2}
                    boxSize={5}
                  />
                  <Heading size="sm" color={colorScheme.heading}>
                    Learning Tips for{" "}
                    {recommendations.difficulty === "difficult"
                      ? "Challenging"
                      : recommendations.difficulty === "easy"
                      ? "Accelerated"
                      : "Standard"}{" "}
                    Content
                  </Heading>
                </Flex>

                <Divider
                  borderColor={colorScheme.border}
                  opacity={0.6}
                  my={3}
                />

                {recommendations.recommendations?.learningTips ? (
                  <List spacing={3}>
                    {recommendations.recommendations.learningTips.map(
                      (tip, index) => (
                        <ListItem
                          key={index}
                          display="flex"
                          alignItems="flex-start"
                        >
                          <ListIcon
                            as={FaCheckCircle}
                            color={colorScheme.heading}
                            mt={1}
                          />
                          <Text>{tip}</Text>
                        </ListItem>
                      )
                    )}
                  </List>
                ) : (
                  <Text color="gray.600">
                    No specific learning tips available for this content.
                  </Text>
                )}
              </Box>

              {interactionData &&
                interactionData.problematic_sections &&
                interactionData.problematic_sections.length > 0 && (
                  <Box mt={4}>
                    <Heading size="sm" mb={3}>
                      <Icon as={WarningIcon} mr={2} color="orange.500" />
                      Sections You Found Challenging
                    </Heading>

                    <VStack spacing={3} align="stretch">
                      {interactionData.problematic_sections.map(
                        (section, index) => (
                          <Box
                            key={index}
                            p={3}
                            borderRadius="md"
                            borderWidth="1px"
                            borderLeftWidth="4px"
                            borderLeftColor="orange.400"
                            bg={accentBg}
                          >
                            <Flex justify="space-between" align="center" mb={2}>
                              <Flex align="center">
                                <Icon as={FaClock} mr={2} color="orange.500" />
                                <Text fontWeight="medium">
                                  {formatTime(section.startTime)} -{" "}
                                  {formatTime(section.endTime)}
                                </Text>
                              </Flex>

                              <Button
                                size="xs"
                                colorScheme="blue"
                                leftIcon={<TimeIcon />}
                                onClick={() => {
                                  // Function to jump to this timestamp in the video
                                  const videoElement =
                                    document.querySelector("video");
                                  if (videoElement) {
                                    videoElement.currentTime =
                                      section.startTime;
                                    videoElement.play();
                                  }
                                }}
                              >
                                Review
                              </Button>
                            </Flex>

                            <Flex gap={3} fontSize="sm" color="gray.600">
                              {section.replayCount > 0 && (
                                <Flex align="center">
                                  <Icon as={TimeIcon} mr={1} />
                                  <Text>
                                    Replayed {section.replayCount} times
                                  </Text>
                                </Flex>
                              )}

                              {section.pauseCount > 0 && (
                                <Flex align="center">
                                  <Icon as={TimeIcon} mr={1} />
                                  <Text>Paused {section.pauseCount} times</Text>
                                </Flex>
                              )}
                            </Flex>
                          </Box>
                        )
                      )}
                    </VStack>
                  </Box>
                )}
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
