/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";

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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  AvatarGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
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
  ViewIcon,
  ViewOffIcon,
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
  FaExchangeAlt,
  FaSignOutAlt,
  FaRegEyeSlash,
  FaUserClock,
  FaTachometerAlt,
  FaBullseye, // This replaces FaTarget
  FaCrosshairs, // This replaces FaFocus - better alternative for focus concept
  FaMobile,
  FaDesktop,
  FaTablet,
  FaWifi,
  FaCalendarAlt,
  FaSun,
  FaMoon,
  FaCloudSun,
  FaRegMoon,
  FaTrophy,
  FaThumbsUp,
  FaThumbsDown,
  FaQuestionCircle,
  FaRocket,
  FaGraduationCap,
  FaFileDownload,
} from "react-icons/fa";

const EnhancedLearningAnalytics = ({ videoId, userId }) => {
  // Initialize toast
  const toast = useToast();

  // State management
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Section visibility states
  const [showDifficultySection, setShowDifficultySection] = useState(true);
  const [showEngagementSection, setShowEngagementSection] = useState(true);
  const [showBehavioralSection, setShowBehavioralSection] = useState(true);
  const [showInsightsSection, setShowInsightsSection] = useState(true);
  const [showRecommendationsSection, setShowRecommendationsSection] =
    useState(true);
  const [showProblematicSections, setShowProblematicSections] = useState(true);

  // Modal for detailed insights
  const {
    isOpen: isInsightModalOpen,
    onOpen: onInsightModalOpen,
    onClose: onInsightModalClose,
  } = useDisclosure();
  const [selectedInsight, setSelectedInsight] = useState(null);

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const difficultBg = useColorModeValue("red.50", "red.900");
  const easyBg = useColorModeValue("green.50", "green.900");
  const sectionBg = useColorModeValue("gray.50", "gray.700");
  const accentBg = useColorModeValue("blue.50", "blue.900");
  const accentColor = useColorModeValue("blue.500", "blue.200");
  const subtleTextColor = useColorModeValue("gray.600", "gray.400");

  // Enhanced analytics analysis
  const analyzeLearning = async () => {
    if (!videoId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/videos/detect-difficulty/${videoId}`,
        { userId }
      );

      console.log("Enhanced difficulty analysis response:", response.data);

      if (response.data && response.data.success) {
        setAnalytics(response.data);

        // Fetch section-specific resources if problematic sections exist
        if (response.data.interactionSummary?.problematic_sections) {
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
      console.error("Error analyzing enhanced learning:", err);
      if (err.response?.status === 404) {
        setError(
          "Not enough viewing data. Please watch more of the video to get detailed analytics."
        );
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
      const response = await axios.get(
        `http://localhost:5000/api/videos/resources/video/${videoId}`
      );

      if (response.data && Array.isArray(response.data)) {
        // Filter resources that match problematic sections
        const relevantResources = response.data.filter((resource) => {
          if (!resource.sectionStart && !resource.sectionEnd) return true;

          return sections.some((section) => {
            return (
              resource.sectionStart <= section.endTime &&
              resource.sectionEnd >= section.startTime
            );
          });
        });

        setResources(relevantResources);
      }
    } catch (error) {
      console.error("Error fetching section resources:", error);
    }
  };

  // Generate and download report
  const downloadReport = () => {
    if (!analytics) return;

    const report = {
      title: "Learning Analytics Report",
      generated: new Date().toLocaleString(),
      summary: {
        difficulty:
          analytics.prediction?.predicted_difficulty === 1
            ? "Challenging"
            : "Appropriate",
        confidence: `${(analytics.prediction?.confidence * 100 || 0).toFixed(
          1
        )}%`,
        engagementScore: `${Math.round(
          analytics.interactionSummary?.engagement_quality_score || 0
        )}%`,
        sessionDuration: formatDuration(
          analytics.interactionSummary?.session_duration || 0
        ),
        attentionQuality:
          analytics.interactionSummary?.attentionQuality || "Unknown",
        tabVisibility: `${Math.round(
          (analytics.interactionSummary?.tab_visibility_ratio || 1) * 100
        )}%`,
        pauseRate: `${(analytics.interactionSummary?.pause_rate || 0).toFixed(
          1
        )}/min`,
        replayCount: analytics.interactionSummary?.replay_frequency || 0,
      },
      insights: analytics.prediction?.insights || [],
      recommendations: analytics.recommendations || [],
      problematicSections:
        analytics.interactionSummary?.problematic_sections || [],
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `learning-report-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Report Downloaded",
      description: "Your learning analytics report has been saved.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Helper functions
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementColor = (score) => {
    if (score >= 90) return "green";
    if (score >= 75) return "blue";
    if (score >= 60) return "yellow";
    if (score >= 40) return "orange";
    return "red";
  };

  const getAttentionQualityIcon = (quality) => {
    switch (quality?.toLowerCase()) {
      case "excellent":
        return { icon: FaTrophy, color: "green.500" };
      case "good":
        return { icon: FaThumbsUp, color: "blue.500" };
      case "fair":
        return { icon: FaQuestionCircle, color: "yellow.500" };
      case "needs improvement":
      case "poor":
        return { icon: FaThumbsDown, color: "red.500" };
      default:
        return { icon: FaQuestionCircle, color: "gray.500" };
    }
  };

  const getDistractionLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "low":
        return "green";
      case "medium":
        return "yellow";
      case "high":
        return "red";
      default:
        return "gray";
    }
  };

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12)
      return { icon: FaSun, color: "yellow.500", label: "Morning" };
    if (hour >= 12 && hour < 17)
      return { icon: FaCloudSun, color: "orange.500", label: "Afternoon" };
    if (hour >= 17 && hour < 21)
      return { icon: FaRegMoon, color: "purple.500", label: "Evening" };
    return { icon: FaMoon, color: "blue.500", label: "Night" };
  };

  const getDeviceIcon = () => {
    const width = window.innerWidth;
    if (width < 768)
      return { icon: FaMobile, color: "purple.500", label: "Mobile" };
    if (width < 1024)
      return { icon: FaTablet, color: "blue.500", label: "Tablet" };
    return { icon: FaDesktop, color: "green.500", label: "Desktop" };
  };

  // Enhanced difficulty analysis component
  const DifficultyAnalysisCard = () => {
    const prediction = analytics?.prediction;
    const isDifficult = prediction?.predicted_difficulty === 1;
    const confidence = (prediction?.confidence || 0) * 100;

    return (
      <Card variant="outline" borderRadius="lg" overflow="hidden">
        <CardHeader
          bg={isDifficult ? difficultBg : easyBg}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Flex align="center" justify="space-between">
            <HStack>
              <Icon
                as={isDifficult ? FaExclamationTriangle : FaCheckCircle}
                color={isDifficult ? "red.600" : "green.600"}
                boxSize={6}
              />
              <Heading size="md">Enhanced Difficulty Analysis</Heading>
            </HStack>
            <Badge
              colorScheme={isDifficult ? "red" : "green"}
              fontSize="md"
              px={3}
              py={1}
              borderRadius="full"
            >
              {isDifficult ? "Challenging Content" : "Appropriate Difficulty"}
            </Badge>
          </Flex>
        </CardHeader>

        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* AI Prediction */}
            <Box>
              <Text fontWeight="bold" mb={3} fontSize="lg">
                AI Difficulty Prediction
              </Text>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Flex justify="space-between" mb={2}>
                    <Text>Prediction Confidence:</Text>
                    <Text
                      fontWeight="bold"
                      color={`${getEngagementColor(confidence)}.500`}
                    >
                      {confidence.toFixed(1)}%
                    </Text>
                  </Flex>
                  <Progress
                    value={confidence}
                    colorScheme={getEngagementColor(confidence)}
                    size="lg"
                    borderRadius="full"
                    bg="gray.100"
                  />
                </Box>

                <Stat>
                  <StatLabel>Content Assessment</StatLabel>
                  <StatNumber color={isDifficult ? "red.500" : "green.500"}>
                    {isDifficult ? "Too Challenging" : "Well Matched"}
                  </StatNumber>
                  <StatHelpText>
                    Based on{" "}
                    {analytics?.interactionSummary?.session_duration
                      ? formatDuration(
                          analytics.interactionSummary.session_duration
                        )
                      : "your session"}{" "}
                    of viewing data
                  </StatHelpText>
                </Stat>
              </VStack>
            </Box>

            {/* Key Metrics */}
            <Box>
              <Text fontWeight="bold" mb={3} fontSize="lg">
                Learning Indicators
              </Text>
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel fontSize="xs">Pause Rate</StatLabel>
                  <StatNumber fontSize="lg">
                    {analytics?.interactionSummary?.pause_rate?.toFixed(1) || 0}
                    /min
                  </StatNumber>
                  <StatHelpText fontSize="xs">
                    {(analytics?.interactionSummary?.pause_rate || 0) > 3 ? (
                      <>
                        <StatArrow type="increase" />
                        High
                      </>
                    ) : (
                      <>
                        <StatArrow type="decrease" />
                        Normal
                      </>
                    )}
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Replay Events</StatLabel>
                  <StatNumber fontSize="lg">
                    {analytics?.interactionSummary?.replay_frequency || 0}
                  </StatNumber>
                  <StatHelpText fontSize="xs">
                    {(analytics?.interactionSummary?.replay_frequency || 0) >
                    2 ? (
                      <>
                        <StatArrow type="increase" />
                        Many
                      </>
                    ) : (
                      <>
                        <StatArrow type="decrease" />
                        Few
                      </>
                    )}
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Skip Forward</StatLabel>
                  <StatNumber fontSize="lg">
                    {analytics?.interactionSummary?.seek_forward_frequency || 0}
                  </StatNumber>
                  <StatHelpText fontSize="xs">Navigation</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Session Time</StatLabel>
                  <StatNumber fontSize="lg">
                    {formatDuration(
                      analytics?.interactionSummary?.session_duration || 0
                    )}
                  </StatNumber>
                  <StatHelpText fontSize="xs">Total watched</StatHelpText>
                </Stat>
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
    );
  };

  // Enhanced engagement metrics component
  const EngagementMetricsCard = () => {
    const summary = analytics?.interactionSummary;
    const engagementScore = summary?.engagement_quality_score || 0;

    return (
      <Card variant="outline" borderRadius="lg">
        <CardHeader bg="purple.50" borderBottom="1px" borderColor={borderColor}>
          <Flex align="center" justify="space-between">
            <HStack>
              <Icon as={FaTachometerAlt} color="purple.600" boxSize={6} />
              <Heading size="md">Enhanced Engagement Metrics</Heading>
            </HStack>
            <CircularProgress
              value={engagementScore}
              color={`${getEngagementColor(engagementScore)}.500`}
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="sm" fontWeight="bold">
                {Math.round(engagementScore)}%
              </CircularProgressLabel>
            </CircularProgress>
          </Flex>
        </CardHeader>

        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {/* Attention Quality */}
            <Box textAlign="center">
              <VStack spacing={3}>
                <Icon
                  as={
                    getAttentionQualityIcon(summary?.attentionQuality || "fair")
                      .icon
                  }
                  color={
                    getAttentionQualityIcon(summary?.attentionQuality || "fair")
                      .color
                  }
                  boxSize={10}
                />
                <Text fontWeight="bold">Attention Quality</Text>
                <Badge
                  colorScheme={
                    summary?.attentionQuality === "Excellent"
                      ? "green"
                      : summary?.attentionQuality === "Good"
                      ? "blue"
                      : summary?.attentionQuality === "Fair"
                      ? "yellow"
                      : "red"
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                >
                  {summary?.attentionQuality || "Unknown"}
                </Badge>
              </VStack>
            </Box>

            {/* Tab Visibility */}
            <Box>
              <Text fontWeight="bold" mb={3} textAlign="center">
                Tab Visibility
              </Text>
              <VStack spacing={2}>
                <CircularProgress
                  value={(summary?.tab_visibility_ratio || 1) * 100}
                  color="blue.500"
                  size="80px"
                  thickness="10px"
                >
                  <CircularProgressLabel fontWeight="bold">
                    {Math.round((summary?.tab_visibility_ratio || 1) * 100)}%
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="sm" color={subtleTextColor} textAlign="center">
                  Time spent with tab visible and active
                </Text>
              </VStack>
            </Box>

            {/* Active Viewing */}
            <Box>
              <Text fontWeight="bold" mb={3} textAlign="center">
                Active Viewing
              </Text>
              <VStack spacing={2}>
                <CircularProgress
                  value={(summary?.active_viewing_ratio || 1) * 100}
                  color="green.500"
                  size="80px"
                  thickness="10px"
                >
                  <CircularProgressLabel fontWeight="bold">
                    {Math.round((summary?.active_viewing_ratio || 1) * 100)}%
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="sm" color={subtleTextColor} textAlign="center">
                  Time actively engaged with content
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>

          <Divider my={6} />

          {/* Detailed Metrics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat textAlign="center">
              <StatLabel fontSize="xs">
                <Icon as={FaExchangeAlt} mr={1} />
                Tab Switches
              </StatLabel>
              <StatNumber fontSize="lg">
                {summary?.tab_switch_frequency?.toFixed(1) || 0}
              </StatNumber>
              <StatHelpText fontSize="xs">per minute</StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="xs">
                <Icon as={FaClock} mr={1} />
                Inactive Time
              </StatLabel>
              <StatNumber fontSize="lg">
                {formatDuration(summary?.total_inactivity_time || 0)}
              </StatNumber>
              <StatHelpText fontSize="xs">
                {Math.round((summary?.inactivity_ratio || 0) * 100)}% of session
              </StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="xs">
                <Icon as={FaSignOutAlt} mr={1} />
                Exit Attempts
              </StatLabel>
              <StatNumber
                fontSize="lg"
                color={
                  (summary?.session_exit_attempts || 0) > 0
                    ? "red.500"
                    : "green.500"
                }
              >
                {summary?.session_exit_attempts || 0}
              </StatNumber>
              <StatHelpText fontSize="xs">interruptions</StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="xs">
                <Icon as={FaBullseye} mr={1} />
                Focus Score
              </StatLabel>
              <StatNumber
                fontSize="lg"
                color={`${getEngagementColor(
                  (summary?.tab_visibility_ratio || 1) * 100
                )}.500`}
              >
                {Math.round((summary?.tab_visibility_ratio || 1) * 100)}
              </StatNumber>
              <StatHelpText fontSize="xs">out of 100</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>
    );
  };

  // Behavioral insights component
  const BehavioralInsightsCard = () => {
    const timeOfDay = getTimeOfDayIcon();
    const device = getDeviceIcon();
    const summary = analytics?.interactionSummary;

    return (
      <Card variant="outline" borderRadius="lg">
        <CardHeader bg="orange.50" borderBottom="1px" borderColor={borderColor}>
          <Flex align="center">
            <Icon as={FaBrain} color="orange.600" mr={3} boxSize={6} />
            <Heading size="md">Behavioral Analysis</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Tabs variant="enclosed" colorScheme="orange">
            <TabList>
              <Tab>
                <Icon as={FaCrosshairs} mr={2} />
                Attention Patterns
              </Tab>
              <Tab>
                <Icon as={FaUserClock} mr={2} />
                Learning Context
              </Tab>
              <Tab>
                <Icon as={FaChartBar} mr={2} />
                Interaction Patterns
              </Tab>
            </TabList>

            <TabPanels>
              {/* Attention Patterns */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
                    <Text fontWeight="bold" mb={3}>
                      Distraction Analysis
                    </Text>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm">Distraction Level:</Text>
                        <Badge
                          colorScheme={getDistractionLevelColor(
                            summary?.distractionLevel
                          )}
                          variant="solid"
                          px={3}
                          py={1}
                        >
                          {summary?.distractionLevel || "Unknown"}
                        </Badge>
                      </Flex>

                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm">Tab Visibility:</Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {Math.round(
                              (summary?.tab_visibility_ratio || 1) * 100
                            )}
                            %
                          </Text>
                        </Flex>
                        <Progress
                          value={(summary?.tab_visibility_ratio || 1) * 100}
                          colorScheme="blue"
                          size="sm"
                          borderRadius="full"
                        />
                      </Box>

                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm">Active Engagement:</Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {Math.round(
                              (summary?.active_viewing_ratio || 1) * 100
                            )}
                            %
                          </Text>
                        </Flex>
                        <Progress
                          value={(summary?.active_viewing_ratio || 1) * 100}
                          colorScheme="green"
                          size="sm"
                          borderRadius="full"
                        />
                      </Box>
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={3}>
                      Focus Quality Indicators
                    </Text>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FaEye} color="blue.500" />
                          <Text fontSize="sm">Tab Switches:</Text>
                        </HStack>
                        <Badge
                          colorScheme={
                            (summary?.tab_switch_frequency || 0) > 3
                              ? "red"
                              : (summary?.tab_switch_frequency || 0) > 1
                              ? "yellow"
                              : "green"
                          }
                        >
                          {summary?.tab_switch_frequency?.toFixed(1) || 0}/min
                        </Badge>
                      </HStack>

                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FaPauseCircle} color="orange.500" />
                          <Text fontSize="sm">Pause Frequency:</Text>
                        </HStack>
                        <Badge
                          colorScheme={
                            (summary?.pause_rate || 0) > 5
                              ? "red"
                              : (summary?.pause_rate || 0) > 2
                              ? "yellow"
                              : "green"
                          }
                        >
                          {summary?.pause_rate?.toFixed(1) || 0}/min
                        </Badge>
                      </HStack>

                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FaRedoAlt} color="purple.500" />
                          <Text fontSize="sm">Replay Events:</Text>
                        </HStack>
                        <Badge
                          colorScheme={
                            (summary?.replay_frequency || 0) > 3
                              ? "orange"
                              : "blue"
                          }
                        >
                          {summary?.replay_frequency || 0} times
                        </Badge>
                      </HStack>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </TabPanel>

              {/* Learning Context */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Box textAlign="center">
                    <VStack spacing={3}>
                      <Icon
                        as={timeOfDay.icon}
                        color={timeOfDay.color}
                        boxSize={8}
                      />
                      <Text fontWeight="bold">Learning Time</Text>
                      <Badge colorScheme="blue" fontSize="md">
                        {timeOfDay.label} Session
                      </Badge>
                      <Text fontSize="sm" color={subtleTextColor}>
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </VStack>
                  </Box>

                  <Box textAlign="center">
                    <VStack spacing={3}>
                      <Icon as={device.icon} color={device.color} boxSize={8} />
                      <Text fontWeight="bold">Device Type</Text>
                      <Badge colorScheme="green" fontSize="md">
                        {device.label}
                      </Badge>
                      <Text fontSize="sm" color={subtleTextColor}>
                        {window.innerWidth} × {window.innerHeight}
                      </Text>
                    </VStack>
                  </Box>

                  <Box textAlign="center">
                    <VStack spacing={3}>
                      <Icon as={FaWifi} color="teal.500" boxSize={8} />
                      <Text fontWeight="bold">Connection</Text>
                      <Badge colorScheme="teal" fontSize="md">
                        {navigator.connection?.effectiveType?.toUpperCase() ||
                          "Unknown"}
                      </Badge>
                      <Text fontSize="sm" color={subtleTextColor}>
                        Network quality
                      </Text>
                    </VStack>
                  </Box>
                </SimpleGrid>

                <Divider my={6} />

                <Box>
                  <Text fontWeight="bold" mb={3}>
                    Session Overview
                  </Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Stat textAlign="center">
                      <StatLabel fontSize="xs">Duration</StatLabel>
                      <StatNumber fontSize="md">
                        {formatDuration(summary?.session_duration || 0)}
                      </StatNumber>
                    </Stat>

                    <Stat textAlign="center">
                      <StatLabel fontSize="xs">Interactions</StatLabel>
                      <StatNumber fontSize="md">
                        {(summary?.total_pauses || 0) +
                          (summary?.replay_frequency || 0) +
                          (summary?.seek_forward_frequency || 0)}
                      </StatNumber>
                    </Stat>

                    <Stat textAlign="center">
                      <StatLabel fontSize="xs">Hidden Time</StatLabel>
                      <StatNumber fontSize="md">
                        {formatDuration(summary?.total_inactivity_time || 0)}
                      </StatNumber>
                    </Stat>

                    <Stat textAlign="center">
                      <StatLabel fontSize="xs">Exit Attempts</StatLabel>
                      <StatNumber
                        fontSize="md"
                        color={
                          (summary?.session_exit_attempts || 0) > 0
                            ? "red.500"
                            : "green.500"
                        }
                      >
                        {summary?.session_exit_attempts || 0}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>
              </TabPanel>

              {/* Interaction Patterns */}
              <TabPanel>
                <Text fontWeight="bold" mb={4}>
                  Detailed Interaction Timeline
                </Text>

                {summary?.problematic_sections?.length > 0 ? (
                  <VStack align="stretch" spacing={4}>
                    {summary.problematic_sections.map((section, index) => (
                      <Card
                        key={index}
                        variant="outline"
                        borderLeftWidth="4px"
                        borderLeftColor="orange.400"
                      >
                        <CardBody py={3}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <HStack>
                              <Icon as={FaClock} color="orange.500" />
                              <Text fontWeight="medium">
                                {formatTime(section.startTime)} -{" "}
                                {formatTime(section.endTime)}
                              </Text>
                              <Badge colorScheme="orange" variant="subtle">
                                Difficulty Score:{" "}
                                {section.difficulty?.toFixed(1) || 0}
                              </Badge>
                            </HStack>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<Icon as={FaEye} />}
                              onClick={() => {
                                // Jump to timestamp functionality
                                const videoElement =
                                  document.querySelector("video");
                                if (videoElement) {
                                  videoElement.currentTime = section.startTime;
                                  videoElement.play();
                                }
                              }}
                            >
                              Review
                            </Button>
                          </Flex>

                          <HStack spacing={4} mt={3}>
                            {section.replayCount > 0 && (
                              <Badge colorScheme="purple" variant="subtle">
                                <Icon as={FaRedoAlt} mr={1} />
                                Replayed {section.replayCount} times
                              </Badge>
                            )}
                            {section.pauseCount > 0 && (
                              <Badge colorScheme="blue" variant="subtle">
                                <Icon as={FaPauseCircle} mr={1} />
                                Paused {section.pauseCount} times
                              </Badge>
                            )}
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
                    <Icon
                      as={FaCheckCircle}
                      boxSize={12}
                      color="green.500"
                      mb={4}
                    />
                    <Text fontSize="lg" fontWeight="medium" mb={2}>
                      Great Learning Pattern!
                    </Text>
                    <Text color="gray.600">
                      No problematic sections detected. You're engaging well
                      with the content.
                    </Text>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    );
  };

  // Enhanced insights component
  const AnalysisInsightsCard = () => {
    const insights = analytics?.prediction?.insights || [];
    const recommendations = analytics?.recommendations || [];

    return (
      <Card variant="outline" borderRadius="lg">
        <CardHeader bg="green.50" borderBottom="1px" borderColor={borderColor}>
          <Flex align="center" justify="space-between">
            <HStack>
              <Icon as={FaLightbulb} color="green.600" boxSize={6} />
              <Heading size="md">AI-Powered Analysis & Insights</Heading>
            </HStack>
            <Badge colorScheme="green" variant="solid" px={3} py={1}>
              {insights.length + recommendations.length} Insights
            </Badge>
          </Flex>
        </CardHeader>

        <CardBody>
          <Tabs variant="enclosed" colorScheme="green">
            <TabList>
              <Tab>
                <Icon as={FaBrain} mr={2} />
                AI Insights
              </Tab>
              <Tab>
                <Icon as={FaRocket} mr={2} />
                Recommendations
              </Tab>
              <Tab>
                <Icon as={FaGraduationCap} mr={2} />
                Learning Tips
              </Tab>
            </TabList>

            <TabPanels>
              {/* AI Insights */}
              <TabPanel>
                {insights.length > 0 ? (
                  <VStack align="stretch" spacing={4}>
                    {insights.map((insight, index) => (
                      <Card key={index} variant="outline" bg="blue.50">
                        <CardBody>
                          <Flex align="flex-start">
                            <Icon
                              as={InfoIcon}
                              color="blue.500"
                              mt={1}
                              mr={3}
                            />
                            <Box flex="1">
                              <Text>{insight}</Text>
                              <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                mt={2}
                                onClick={() => {
                                  setSelectedInsight({
                                    title: "AI Insight Details",
                                    content: insight,
                                    type: "insight",
                                  });
                                  onInsightModalOpen();
                                }}
                              >
                                Learn More
                              </Button>
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Icon as={FaBrain} boxSize={12} color="gray.400" mb={4} />
                    <Text fontSize="lg" color="gray.600">
                      No specific insights available yet
                    </Text>
                    <Text color="gray.500">
                      Continue watching to generate more detailed insights
                    </Text>
                  </Box>
                )}
              </TabPanel>

              {/* Recommendations */}
              <TabPanel>
                {recommendations.length > 0 ? (
                  <VStack align="stretch" spacing={4}>
                    {recommendations.map((recommendation, index) => (
                      <Card
                        key={index}
                        variant="outline"
                        bg={
                          recommendation.priority === "high"
                            ? "red.50"
                            : recommendation.priority === "medium"
                            ? "yellow.50"
                            : "green.50"
                        }
                        borderLeftWidth="4px"
                        borderLeftColor={
                          recommendation.priority === "high"
                            ? "red.400"
                            : recommendation.priority === "medium"
                            ? "yellow.400"
                            : "green.400"
                        }
                      >
                        <CardBody>
                          <Flex align="flex-start" justify="space-between">
                            <Box flex="1">
                              <HStack mb={2}>
                                <Badge
                                  colorScheme={
                                    recommendation.priority === "high"
                                      ? "red"
                                      : recommendation.priority === "medium"
                                      ? "yellow"
                                      : "green"
                                  }
                                  variant="solid"
                                >
                                  {recommendation.priority?.toUpperCase() ||
                                    "MEDIUM"}{" "}
                                  PRIORITY
                                </Badge>
                                <Badge variant="outline">
                                  {recommendation.category?.toUpperCase() ||
                                    "GENERAL"}
                                </Badge>
                              </HStack>
                              <Text fontWeight="medium" mb={2}>
                                {recommendation.message || recommendation}
                              </Text>
                              {recommendation.actions && (
                                <List spacing={1} mt={2}>
                                  {recommendation.actions.map(
                                    (action, actionIndex) => (
                                      <ListItem key={actionIndex} fontSize="sm">
                                        <ListIcon
                                          as={CheckCircleIcon}
                                          color="green.500"
                                        />
                                        {action}
                                      </ListItem>
                                    )
                                  )}
                                </List>
                              )}
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Icon as={FaRocket} boxSize={12} color="gray.400" mb={4} />
                    <Text fontSize="lg" color="gray.600">
                      No specific recommendations yet
                    </Text>
                    <Text color="gray.500">
                      Keep learning to receive personalized suggestions
                    </Text>
                  </Box>
                )}
              </TabPanel>

              {/* Learning Tips */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card variant="outline" bg="purple.50">
                    <CardHeader>
                      <Heading size="sm">
                        <Icon as={FaBullseye} mr={2} color="purple.500" />
                        Focus Enhancement
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="purple.500" />
                          Close unnecessary browser tabs
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="purple.500" />
                          Use focus mode or website blockers
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="purple.500" />
                          Set specific learning time blocks
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="purple.500" />
                          Create a distraction-free environment
                        </ListItem>
                      </List>
                    </CardBody>
                  </Card>

                  <Card variant="outline" bg="teal.50">
                    <CardHeader>
                      <Heading size="sm">
                        <Icon as={FaBookOpen} mr={2} color="teal.500" />
                        Learning Techniques
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="teal.500" />
                          Take notes during pauses
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="teal.500" />
                          Use the Pomodoro technique (25min focus)
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="teal.500" />
                          Review difficult sections multiple times
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="teal.500" />
                          Practice concepts immediately after learning
                        </ListItem>
                      </List>
                    </CardBody>
                  </Card>

                  <Card variant="outline" bg="orange.50">
                    <CardHeader>
                      <Heading size="sm">
                        <Icon as={FaClock} mr={2} color="orange.500" />
                        Time Management
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="orange.500" />
                          Break content into smaller segments
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="orange.500" />
                          Schedule regular learning sessions
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="orange.500" />
                          Take breaks between difficult topics
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="orange.500" />
                          Set achievable daily learning goals
                        </ListItem>
                      </List>
                    </CardBody>
                  </Card>

                  <Card variant="outline" bg="pink.50">
                    <CardHeader>
                      <Heading size="sm">
                        <Icon as={FaBrain} mr={2} color="pink.500" />
                        Retention Strategies
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="pink.500" />
                          Summarize key points after each section
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="pink.500" />
                          Teach concepts to others
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="pink.500" />
                          Create visual mind maps
                        </ListItem>
                        <ListItem fontSize="sm">
                          <ListIcon as={CheckCircleIcon} color="pink.500" />
                          Review content within 24 hours
                        </ListItem>
                      </List>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    );
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
          size="lg"
          boxShadow="lg"
          _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
          transition="all 0.2s"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          border="none"
        >
          🧠 Analyze My Enhanced Learning Pattern
        </Button>
      ) : (
        <Box
          borderRadius="xl"
          overflow="hidden"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor={borderColor}
          bg={cardBg}
        >
          {/* Enhanced Header */}
          <Box
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            p={6}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={4}>
                <Icon as={FaBrain} fontSize="2xl" />
                <Box>
                  <Heading size="lg">Enhanced Learning Analytics</Heading>
                  <Text opacity={0.9}>
                    Comprehensive behavioral analysis and AI insights
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2}>
                {analytics && (
                  <>
                    <Badge
                      bg="whiteAlpha.200"
                      color="white"
                      fontSize="lg"
                      px={4}
                      py={2}
                      borderRadius="full"
                    >
                      {analytics.prediction?.predicted_difficulty === 1
                        ? "🔥 Challenging"
                        : "✅ Appropriate"}
                    </Badge>
                    <Badge
                      bg="whiteAlpha.200"
                      color="white"
                      fontSize="md"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {Math.round(
                        (analytics.prediction?.confidence || 0) * 100
                      )}
                      % confidence
                    </Badge>
                  </>
                )}
              </HStack>
            </Flex>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              p={20}
              bg={cardBg}
            >
              <Spinner size="xl" color="blue.500" thickness="4px" mb={6} />
              <Text fontSize="xl" fontWeight="medium" mb={2}>
                🔍 Analyzing your learning patterns...
              </Text>
              <Text color={subtleTextColor} textAlign="center" maxW="md">
                Our AI is processing your behavioral data, interaction patterns,
                and engagement metrics to provide comprehensive insights.
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
                  Close Analytics
                </Button>
              </Box>
            </Alert>
          ) : analytics ? (
            <Box bg={cardBg}>
              {/* Main Analytics Content */}
              <VStack spacing={8} p={6} align="stretch">
                {/* Difficulty Analysis Section */}
                <Box>
                  <Flex
                    justify="space-between"
                    align="center"
                    onClick={() =>
                      setShowDifficultySection(!showDifficultySection)
                    }
                    cursor="pointer"
                    mb={showDifficultySection ? 6 : 0}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: sectionBg }}
                    transition="all 0.2s"
                  >
                    <Heading size="lg">
                      🎯 Enhanced Content Difficulty Analysis
                    </Heading>
                    <Icon
                      as={
                        showDifficultySection ? ChevronUpIcon : ChevronDownIcon
                      }
                      boxSize={6}
                      color="gray.500"
                    />
                  </Flex>
                  <Collapse in={showDifficultySection}>
                    <DifficultyAnalysisCard />
                  </Collapse>
                </Box>

                {/* Engagement Metrics Section */}
                <Box>
                  <Flex
                    justify="space-between"
                    align="center"
                    onClick={() =>
                      setShowEngagementSection(!showEngagementSection)
                    }
                    cursor="pointer"
                    mb={showEngagementSection ? 6 : 0}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: sectionBg }}
                    transition="all 0.2s"
                  >
                    <Heading size="lg">📊 Enhanced Engagement Metrics</Heading>
                    <Icon
                      as={
                        showEngagementSection ? ChevronUpIcon : ChevronDownIcon
                      }
                      boxSize={6}
                      color="gray.500"
                    />
                  </Flex>
                  <Collapse in={showEngagementSection}>
                    <EngagementMetricsCard />
                  </Collapse>
                </Box>

                {/* Behavioral Analysis Section */}
                <Box>
                  <Flex
                    justify="space-between"
                    align="center"
                    onClick={() =>
                      setShowBehavioralSection(!showBehavioralSection)
                    }
                    cursor="pointer"
                    mb={showBehavioralSection ? 6 : 0}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: sectionBg }}
                    transition="all 0.2s"
                  >
                    <Heading size="lg">
                      🧠 Behavioral Analysis & Context
                    </Heading>
                    <Icon
                      as={
                        showBehavioralSection ? ChevronUpIcon : ChevronDownIcon
                      }
                      boxSize={6}
                      color="gray.500"
                    />
                  </Flex>
                  <Collapse in={showBehavioralSection}>
                    <BehavioralInsightsCard />
                  </Collapse>
                </Box>

                {/* AI Insights Section */}
                <Box>
                  <Flex
                    justify="space-between"
                    align="center"
                    onClick={() => setShowInsightsSection(!showInsightsSection)}
                    cursor="pointer"
                    mb={showInsightsSection ? 6 : 0}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: sectionBg }}
                    transition="all 0.2s"
                  >
                    <Heading size="lg">
                      💡 AI-Powered Analysis & Insights
                    </Heading>
                    <Icon
                      as={showInsightsSection ? ChevronUpIcon : ChevronDownIcon}
                      boxSize={6}
                      color="gray.500"
                    />
                  </Flex>
                  <Collapse in={showInsightsSection}>
                    <AnalysisInsightsCard />
                  </Collapse>
                </Box>

                {/* Resources Section */}
                {resources.length > 0 && (
                  <Box>
                    <Flex
                      justify="space-between"
                      align="center"
                      onClick={() =>
                        setShowRecommendationsSection(
                          !showRecommendationsSection
                        )
                      }
                      cursor="pointer"
                      mb={showRecommendationsSection ? 6 : 0}
                      p={3}
                      borderRadius="md"
                      _hover={{ bg: sectionBg }}
                      transition="all 0.2s"
                    >
                      <Heading size="lg">
                        📚 Recommended Learning Resources
                      </Heading>
                      <Icon
                        as={
                          showRecommendationsSection
                            ? ChevronUpIcon
                            : ChevronDownIcon
                        }
                        boxSize={6}
                        color="gray.500"
                      />
                    </Flex>
                    <Collapse in={showRecommendationsSection}>
                      <Card variant="outline" borderRadius="lg">
                        <CardBody>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {resources.map((resource, index) => (
                              <Card key={index} variant="outline" bg="blue.50">
                                <CardBody>
                                  <HStack mb={2}>
                                    <Icon
                                      as={
                                        resource.type === "pdf"
                                          ? FaFileAlt
                                          : FaBookOpen
                                      }
                                      color="blue.500"
                                    />
                                    <Heading size="sm">
                                      {resource.title}
                                    </Heading>
                                  </HStack>
                                  <Text fontSize="sm" noOfLines={2} mb={3}>
                                    {resource.description}
                                  </Text>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => {
                                      if (
                                        resource.type === "pdf" &&
                                        resource.filePath
                                      ) {
                                        const filename = resource.filePath
                                          .split("/")
                                          .pop();
                                        window.open(
                                          `http://localhost:5000/uploads/pdfs/${filename}`,
                                          "_blank"
                                        );
                                      } else if (resource.url) {
                                        window.open(resource.url, "_blank");
                                      }
                                    }}
                                  >
                                    View Resource
                                  </Button>
                                </CardBody>
                              </Card>
                            ))}
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    </Collapse>
                  </Box>
                )}
              </VStack>

              {/* Footer Actions */}
              <Flex
                justify="space-between"
                align="center"
                p={6}
                borderTopWidth="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack spacing={4}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    onClick={analyzeLearning}
                    colorScheme="blue"
                    variant="outline"
                    isLoading={loading}
                  >
                    Refresh Analysis
                  </Button>
                  <Button
                    leftIcon={<Icon as={FaFileDownload} />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={downloadReport}
                    isDisabled={!analytics}
                  >
                    Export Report
                  </Button>
                </HStack>

                <Button
                  variant="ghost"
                  onClick={() => setShowAnalytics(false)}
                  color="gray.600"
                >
                  Close Analytics
                </Button>
              </Flex>
            </Box>
          ) : null}
        </Box>
      )}

      {/* Detailed Insight Modal */}
      <Modal
        isOpen={isInsightModalOpen}
        onClose={onInsightModalClose}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedInsight?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text>{selectedInsight?.content}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EnhancedLearningAnalytics;
