// src/components/modulePage/VideoPlayer/VideoPlayer.js
import React, { useRef, useState, useEffect } from "react";
import InactivityNotification from "../InactivityNotification/InactivityNotification";
import InactiveSessionNotification from "../InactivityNotification/InactiveSessionNotification";
import ExitModal from "../ExitModal/ExitModal";
import useBehavioralTracking from "../../../hooks/useBehavioralTracking";
import axios from "axios";
import {
  Box,
  Flex,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  useToast,
  Fade,
  Circle,
  Spinner,
  VStack,
  Progress,
  Divider,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCog,
  FaRedo,
  FaUndo,
  FaRegEye,
  FaRegEyeSlash,
  FaUserClock,
  FaSignOutAlt,
  FaExchangeAlt,
  FaChartBar,
  FaPauseCircle,
  FaRedoAlt,
  FaAngleDoubleRight,
  FaEye,
  FaClock,
  FaBookOpen,
  FaLock,
} from "react-icons/fa";

const VideoPlayer = ({ videoId, videoUrl, userId, onInteractionUpdate }) => {
  const videoRef = useRef(null);
  const toast = useToast();

  // Add ref to track if seek is programmatic (to prevent double tracking)
  const seekTrackingRef = useRef({
    isProgrammaticSeek: false,
    lastSeekTime: 0,
    lastTrackedPosition: 0,
  });

  // 🆕 Use the enhanced behavioral tracking hook with exit detection
  const {
    // State from hook
    behavioralData,
    isTabVisible,
    isUserActive,
    tabSwitchCount,
    browserSwitchCount,
    totalHiddenTime,
    totalInactiveTime,
    // Computed values from hook
    engagementScore,
    attentionQuality,
    distractionLevel,
    // Actions from hook
    recordTabSwitchReason,
    sendTrackingData,
    closeTabSwitchModal,
    // Inactivity actions
    handleInactivityResponse,
    handleInactivityTimeout,
    closeInactivityNotification,
    // Modal flags from hook
    shouldShowTabSwitchModal,
    // Inactivity notification flag
    shouldShowInactivityNotification,
    isAwaitingInactivityResponse,
    // 🆕 EXIT DETECTION from hook
    showExitModal,
    exitReason,
    exitComment,
    exitAttempts,
    isSubmittingExit,
    setExitReason,
    setExitComment,
    handleContinueLearning,
    handleExitWithFeedback,
    handleForceExit,
    formatDuration,
    getSessionDuration,
  } = useBehavioralTracking(videoId, userId, videoRef);

  // Video-specific state (only what's needed for video controls)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlTimeout, setControlTimeout] = useState(null);
  const [loadingState, setLoadingState] = useState("initial");

  // Video interaction tracking (separate from behavioral tracking)
  const [interactionCount, setInteractionCount] = useState(0);
  const [interactionTooltip, setInteractionTooltip] = useState(false);
  const [showMetricsTooltip, setShowMetricsTooltip] = useState(false);
  const [videoMetrics, setVideoMetrics] = useState({
    totalPauses: 0,
    replayEvents: 0,
    seekForwardEvents: 0,
    sessionStartTime: Date.now(),
  });

  // Form states for feedback
  const [tabSwitchReason, setTabSwitchReason] = useState("");
  const [tabSwitchComment, setTabSwitchComment] = useState("");

  const cancelRef = useRef();

  // UI colors
  const controlsBg = useColorModeValue("blackAlpha.700", "blackAlpha.800");
  const sliderColor = useColorModeValue("blue.500", "blue.300");
  const timeColor = useColorModeValue("white", "gray.100");
  const tooltipBg = useColorModeValue("gray.700", "gray.900");
  const metricsTooltipBg = useColorModeValue("white", "gray.800");
  const metricsTooltipBorder = useColorModeValue("gray.200", "gray.600");

  // Initial setup when videoId changes
  useEffect(() => {
    if (videoId) {
      clearPreviousSession();
      resetVideoMetrics();
      // Reset seek tracking when video changes
      seekTrackingRef.current = {
        isProgrammaticSeek: false,
        lastSeekTime: 0,
        lastTrackedPosition: 0,
      };
    }
    return () => {
      endSession();
    };
  }, [videoId]);

  // Update parent component with combined metrics
  useEffect(() => {
    if (onInteractionUpdate) {
      const combinedData = {
        // Video-specific metrics
        interactionCount,
        totalPauses: videoMetrics.totalPauses,
        replayEvents: videoMetrics.replayEvents,
        seekForwardEvents: videoMetrics.seekForwardEvents,
        lastPosition: currentTime,
        // Behavioral metrics from hook
        tabSwitchCount,
        browserSwitchCount,
        totalHiddenTime,
        totalInactiveTime,
        tabVisible: isTabVisible,
        isUserActive,
        engagementScore,
        attentionQuality,
        distractionLevel,
        // Combined behavioral data
        behavioralData,
      };
      onInteractionUpdate(combinedData);
    }
  }, [
    interactionCount,
    videoMetrics,
    currentTime,
    tabSwitchCount,
    browserSwitchCount,
    totalHiddenTime,
    totalInactiveTime,
    isTabVisible,
    isUserActive,
    engagementScore,
    attentionQuality,
    distractionLevel,
    behavioralData,
    onInteractionUpdate,
  ]);

  // Helper functions
  const resetVideoMetrics = () => {
    setVideoMetrics({
      totalPauses: 0,
      replayEvents: 0,
      seekForwardEvents: 0,
      sessionStartTime: Date.now(),
    });
    setInteractionCount(0);
  };

  const clearPreviousSession = async () => {
    try {
      await axios.post("http://localhost:5000/api/videos/clear-session", {
        userId,
        videoId,
      });
      console.log(`Session cleared for video ${videoId}`);
    } catch (error) {
      console.error("Error clearing previous session:", error);
    }
  };

  const endSession = async () => {
    try {
      if (videoId && userId) {
        await axios.post("http://localhost:5000/api/videos/end-session", {
          userId,
          videoId,
          combinedMetrics: {
            // Video metrics
            totalPauses: videoMetrics.totalPauses,
            replayEvents: videoMetrics.replayEvents,
            seekForwardEvents: videoMetrics.seekForwardEvents,
            // Behavioral metrics
            totalHiddenTime,
            totalInactiveTime,
            tabSwitchCount,
            browserSwitchCount,
            finalEngagementScore: engagementScore,
            behavioralData,
          },
        });
        console.log(`Session ended for video ${videoId}`);
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Video interaction tracking with seek deduplication
  const trackVideoInteraction = async (type, data = {}) => {
    try {
      // Skip if this is a duplicate seek event
      if (type === "seek") {
        const now = Date.now();
        const position = videoRef.current ? videoRef.current.currentTime : 0;

        // Check if this is a duplicate seek event (within 100ms and same position)
        if (
          now - seekTrackingRef.current.lastSeekTime < 100 &&
          Math.abs(position - seekTrackingRef.current.lastTrackedPosition) < 0.1
        ) {
          console.log("Skipping duplicate seek event");
          return;
        }

        // Update tracking reference
        seekTrackingRef.current.lastSeekTime = now;
        seekTrackingRef.current.lastTrackedPosition = position;
      }

      setInteractionTooltip(true);
      setTimeout(() => setInteractionTooltip(false), 1500);

      const position = videoRef.current ? videoRef.current.currentTime : 0;

      // Update local video metrics
      setVideoMetrics((prev) => {
        const newMetrics = { ...prev };
        if (type === "pause") {
          newMetrics.totalPauses = prev.totalPauses + 1;
        } else if (type === "seek") {
          if (data.direction === "backward") {
            newMetrics.replayEvents = prev.replayEvents + 1;
          } else if (data.direction === "forward") {
            newMetrics.seekForwardEvents = prev.seekForwardEvents + 1;
          }
        }
        return newMetrics;
      });

      // Use the sendTrackingData from the behavioral hook
      await sendTrackingData(type, {
        position,
        timestamp: new Date().toISOString(),
        ...data,
      });

      setInteractionCount((prev) => prev + 1);
    } catch (error) {
      console.error(`Error tracking ${type} interaction:`, error);
    }
  };

  // Submit tab switch feedback using hook
  const handleTabSwitchSubmit = async () => {
    if (!tabSwitchReason) {
      toast({
        title: "Please select a reason",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    try {
      await recordTabSwitchReason(tabSwitchReason, tabSwitchComment);
      toast({
        title: "Thank you for your feedback!",
        description: "This helps us understand your learning behavior better.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Reset form
      setTabSwitchReason("");
      setTabSwitchComment("");
    } catch (error) {
      console.error("Error submitting tab switch feedback:", error);
      toast({
        title: "Error recording feedback",
        description: "Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle inactivity resume using hook data
  const handleResumeFromInactivity = () => {
    console.log("🎵 Manual resume from inactivity notification");

    // Resume video playback
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
      console.log("🎵 Video manually resumed");
    }

    // Trigger activity to reset the inactivity system
    if (document.dispatchEvent) {
      document.dispatchEvent(new Event("mousemove"));
    }
  };

  // Video control functions
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  // Handle seek with programmatic flag to prevent double tracking
  const handleSeek = (value) => {
    if (videoRef.current) {
      const prevPosition = videoRef.current.currentTime;

      // Set flag to indicate this is a programmatic seek
      seekTrackingRef.current.isProgrammaticSeek = true;

      videoRef.current.currentTime = value;
      setCurrentTime(value);

      // Only track if the seek is significant (> 1 second difference)
      if (Math.abs(value - prevPosition) > 1) {
        trackVideoInteraction("seek", {
          direction: value > prevPosition ? "forward" : "backward",
          prevPosition,
          skipAmount: Math.abs(value - prevPosition),
          source: "slider",
        });
      }

      // Reset flag after a short delay
      setTimeout(() => {
        seekTrackingRef.current.isProgrammaticSeek = false;
      }, 50);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newPosition = Math.min(videoRef.current.currentTime + 10, duration);

      // Set flag to indicate this is a programmatic seek
      seekTrackingRef.current.isProgrammaticSeek = true;

      videoRef.current.currentTime = newPosition;
      trackVideoInteraction("seek", {
        direction: "forward",
        skipAmount: 10,
        source: "skip_button",
      });

      // Reset flag after a short delay
      setTimeout(() => {
        seekTrackingRef.current.isProgrammaticSeek = false;
      }, 50);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newPosition = Math.max(videoRef.current.currentTime - 10, 0);

      // Set flag to indicate this is a programmatic seek
      seekTrackingRef.current.isProgrammaticSeek = true;

      videoRef.current.currentTime = newPosition;
      trackVideoInteraction("seek", {
        direction: "backward",
        skipAmount: 10,
        source: "skip_button",
      });

      // Reset flag after a short delay
      setTimeout(() => {
        seekTrackingRef.current.isProgrammaticSeek = false;
      }, 50);
    }
  };

  const toggleFullscreen = () => {
    const player = document.querySelector(".video-player-container");
    if (!document.fullscreenElement) {
      if (player.requestFullscreen) {
        player.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      trackVideoInteraction("speed", { speed });
    }
  };

  // Time update tracking
  useEffect(() => {
    const updateTime = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || 0);
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", updateTime);
      video.addEventListener("durationchange", updateTime);
      video.addEventListener("waiting", () => setLoadingState("loading"));
      video.addEventListener("canplay", () => setLoadingState("ready"));
      video.addEventListener("error", () => setLoadingState("error"));
    }

    return () => {
      if (video) {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", updateTime);
        video.removeEventListener("durationchange", updateTime);
        video.removeEventListener("waiting", () => setLoadingState("loading"));
        video.removeEventListener("canplay", () => setLoadingState("ready"));
        video.removeEventListener("error", () => setLoadingState("error"));
      }
    };
  }, []);

  // Controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlTimeout) {
        clearTimeout(controlTimeout);
      }
      if (isPlaying) {
        const timeout = setTimeout(() => {
          setShowControls(false);
        }, 3000);
        setControlTimeout(timeout);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlTimeout) {
        clearTimeout(controlTimeout);
      }
    };
  }, [isPlaying, controlTimeout]);

  return (
    <>
      {/* 🆕 Debug info - shows exit detection status */}
      {process.env.NODE_ENV === "development" && (
        <Box
          position="fixed"
          bottom="10px"
          left="10px"
          bg="blackAlpha.700"
          color="white"
          p={2}
          borderRadius="md"
          fontSize="xs"
          zIndex={9999}
        >
          Exit Detection: ✅ Active | Attempts: {exitAttempts} | Duration:{" "}
          {formatDuration(getSessionDuration())}
        </Box>
      )}

      <Box
        className="video-player-container"
        position="relative"
        borderRadius="md"
        overflow="hidden"
        boxShadow="lg"
        bg="black"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          width="100%"
          height="auto"
          onClick={togglePlay}
          onPlay={() => {
            setIsPlaying(true);
            trackVideoInteraction("play");
          }}
          onPause={() => {
            setIsPlaying(false);
            trackVideoInteraction("pause");
          }}
          onRateChange={() => {
            const speed = videoRef.current ? videoRef.current.playbackRate : 1;
            trackVideoInteraction("speed", { speed });
          }}
          onEnded={() => {
            setIsPlaying(false);
            trackVideoInteraction("end");
            endSession();
            toast({
              title: "Video completed!",
              description: "Great job finishing this learning session.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          }}
          style={{ display: "block" }}
        />

        {/* Loading overlay */}
        {loadingState === "loading" && (
          <Flex
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            zIndex={3}
            bg="blackAlpha.300"
          >
            <Spinner size="xl" color="white" thickness="4px" />
          </Flex>
        )}

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <Flex
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            bg="blackAlpha.300"
            zIndex="1"
          >
            <IconButton
              aria-label="Play video"
              icon={<FaPlay />}
              size="lg"
              fontSize="2xl"
              colorScheme="whiteAlpha"
              variant="solid"
              rounded="full"
              onClick={togglePlay}
              opacity="0.8"
              _hover={{ opacity: 1 }}
            />
          </Flex>
        )}

        {/* Inactivity Pause Overlay */}
        {!isUserActive && (
          <Flex
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            bg="blackAlpha.600"
            zIndex="4"
            backdropFilter="blur(4px)"
          >
            <VStack spacing={4} color="white" textAlign="center">
              <Circle
                size="80px"
                bg="whiteAlpha.200"
                border="2px solid"
                borderColor="whiteAlpha.400"
              >
                <Icon as={FaPause} boxSize={8} />
              </Circle>
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold">
                  Video Paused
                </Text>
                <Text fontSize="md" opacity={0.9}>
                  Due to inactivity
                </Text>
                <Text fontSize="sm" opacity={0.7}>
                  Move your mouse or click to resume
                </Text>
              </VStack>
              <Button
                leftIcon={<Icon as={FaPlay} />}
                colorScheme="blue"
                size="lg"
                onClick={handleResumeFromInactivity}
                boxShadow="lg"
              >
                Resume Learning
              </Button>
            </VStack>
          </Flex>
        )}

        {/* Status Indicators - using hook data */}
        {!isTabVisible && (
          <Badge
            position="absolute"
            top={4}
            left={4}
            colorScheme="red"
            variant="solid"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            animation="pulse 2s infinite"
          >
            Tab Unfocused - Learning Paused
          </Badge>
        )}

        {!isUserActive && isTabVisible && (
          <Badge
            position="absolute"
            top={4}
            left={4}
            colorScheme="orange"
            variant="solid"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
          >
            User Inactive
          </Badge>
        )}

        {/* Engagement Score Display - using hook data */}
        <Circle
          size="60px"
          position="absolute"
          top="60px"
          right="10px"
          bg="rgba(0,0,0,0.7)"
          color="white"
          fontSize="sm"
          display="flex"
          alignItems="center"
          justifyContent="center"
          opacity={0.8}
          flexDirection="column"
        >
          <Text fontSize="xs" mb={1}>
            Engagement
          </Text>
          <Text
            fontWeight="bold"
            color={
              engagementScore >= 80
                ? "green.300"
                : engagementScore >= 60
                ? "yellow.300"
                : "red.300"
            }
          >
            {engagementScore}%
          </Text>
        </Circle>

        {/* Video controls - same as before */}
        <Flex
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          bg={controlsBg}
          p={2}
          flexDir="column"
          transition="opacity 0.3s ease"
          opacity={showControls ? 1 : 0}
          pointerEvents={showControls ? "auto" : "none"}
          zIndex="2"
        >
          {/* Progress bar */}
          <Slider
            aria-label="Video progress"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            focusThumbOnChange={false}
            mb={2}
          >
            <SliderTrack h="3px">
              <SliderFilledTrack bg={sliderColor} />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>

          {/* Controls row */}
          <Flex justify="space-between" align="center">
            <HStack spacing={1}>
              {/* Play/Pause button */}
              <IconButton
                aria-label={isPlaying ? "Pause" : "Play"}
                icon={isPlaying ? <FaPause /> : <FaPlay />}
                size="sm"
                variant="ghost"
                color="white"
                onClick={togglePlay}
              />

              {/* Skip backward 10s */}
              <IconButton
                aria-label="Skip backward 10 seconds"
                icon={<FaUndo />}
                size="sm"
                variant="ghost"
                color="white"
                onClick={skipBackward}
              />

              {/* Skip forward 10s */}
              <IconButton
                aria-label="Skip forward 10 seconds"
                icon={<FaRedo />}
                size="sm"
                variant="ghost"
                color="white"
                onClick={skipForward}
              />

              {/* Volume control */}
              <Popover trigger="hover" placement="top" gutter={10}>
                <PopoverTrigger>
                  <IconButton
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    size="sm"
                    variant="ghost"
                    color="white"
                    onClick={toggleMute}
                  />
                </PopoverTrigger>
                <PopoverContent
                  width="120px"
                  bg={tooltipBg}
                  borderColor={tooltipBg}
                >
                  <PopoverArrow bg={tooltipBg} />
                  <PopoverBody p={3}>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      orientation="horizontal"
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg={sliderColor} />
                      </SliderTrack>
                      <SliderThumb boxSize={3} />
                    </Slider>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              {/* Time display */}
              <Text color={timeColor} fontSize="xs" fontFamily="monospace">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </HStack>

            <HStack spacing={1}>
              {/* Learning Metrics Button - using hook data */}
              <Popover
                trigger="hover"
                placement="top"
                isOpen={showMetricsTooltip}
                onOpen={() => setShowMetricsTooltip(true)}
                onClose={() => setShowMetricsTooltip(false)}
              >
                <PopoverTrigger>
                  <IconButton
                    icon={isTabVisible ? <FaRegEye /> : <FaRegEyeSlash />}
                    aria-label="Learning metrics"
                    size="sm"
                    variant="ghost"
                    color={isTabVisible ? "white" : "red.300"}
                    onClick={() => setShowMetricsTooltip(!showMetricsTooltip)}
                  />
                </PopoverTrigger>
                <PopoverContent
                  width="320px"
                  bg={metricsTooltipBg}
                  borderColor={metricsTooltipBorder}
                  boxShadow="lg"
                >
                  <PopoverArrow bg={metricsTooltipBg} />
                  <PopoverBody p={4}>
                    <Text fontWeight="bold" mb={3}>
                      Learning Analytics
                    </Text>
                    {/* Engagement Score */}
                    <Box mb={3}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm">Engagement Score:</Text>
                        <Badge
                          colorScheme={
                            engagementScore >= 80
                              ? "green"
                              : engagementScore >= 60
                              ? "blue"
                              : "red"
                          }
                        >
                          {engagementScore}%
                        </Badge>
                      </Flex>
                      <Progress
                        value={engagementScore}
                        size="xs"
                        colorScheme={
                          engagementScore >= 80
                            ? "green"
                            : engagementScore >= 60
                            ? "blue"
                            : "red"
                        }
                        borderRadius="full"
                      />
                    </Box>
                    <Divider my={2} />
                    {/* Attention Metrics */}
                    <VStack align="stretch" spacing={2} fontSize="sm">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon
                            as={FaRegEye}
                            color={isTabVisible ? "green.500" : "red.500"}
                          />
                          <Text>Tab Visible:</Text>
                        </HStack>
                        <Badge colorScheme={isTabVisible ? "green" : "red"}>
                          {isTabVisible ? "Yes" : "No"}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FaExchangeAlt} color="blue.500" />
                          <Text>Tab Switches:</Text>
                        </HStack>
                        <Badge
                          colorScheme={tabSwitchCount > 5 ? "orange" : "blue"}
                        >
                          {tabSwitchCount}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Attention Quality:</Text>
                        <Badge
                          colorScheme={
                            attentionQuality === "excellent"
                              ? "green"
                              : attentionQuality === "good"
                              ? "blue"
                              : attentionQuality === "fair"
                              ? "yellow"
                              : "red"
                          }
                        >
                          {attentionQuality}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Distraction Level:</Text>
                        <Badge
                          colorScheme={
                            distractionLevel === "low"
                              ? "green"
                              : distractionLevel === "medium"
                              ? "yellow"
                              : "red"
                          }
                        >
                          {distractionLevel}
                        </Badge>
                      </HStack>
                    </VStack>
                    <Divider my={2} />
                    {/* Time Analytics */}
                    <Text fontSize="xs" color="gray.500">
                      Hidden Time: {Math.round(totalHiddenTime)}s | Inactive
                      Time: {Math.round(totalInactiveTime)}s
                    </Text>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              {/* Playback speed */}
              <Menu placement="top">
                <MenuButton
                  as={IconButton}
                  aria-label="Playback speed"
                  icon={<FaCog />}
                  size="sm"
                  variant="ghost"
                  color="white"
                />
                <MenuList minW="120px" fontSize="sm">
                  <MenuItem onClick={() => changePlaybackSpeed(0.5)}>
                    0.5x
                  </MenuItem>
                  <MenuItem onClick={() => changePlaybackSpeed(0.75)}>
                    0.75x
                  </MenuItem>
                  <MenuItem onClick={() => changePlaybackSpeed(1)}>
                    1x (Normal)
                  </MenuItem>
                  <MenuItem onClick={() => changePlaybackSpeed(1.25)}>
                    1.25x
                  </MenuItem>
                  <MenuItem onClick={() => changePlaybackSpeed(1.5)}>
                    1.5x
                  </MenuItem>
                  <MenuItem onClick={() => changePlaybackSpeed(2)}>2x</MenuItem>
                </MenuList>
              </Menu>

              {/* Fullscreen toggle */}
              <IconButton
                aria-label="Toggle fullscreen"
                icon={<FaExpand />}
                size="sm"
                variant="ghost"
                color="white"
                onClick={toggleFullscreen}
              />
            </HStack>
          </Flex>
        </Flex>

        {/* Interaction feedback tooltip */}
        <Fade in={interactionTooltip}>
          <Badge
            position="absolute"
            top={4}
            right={4}
            colorScheme="blue"
            variant="solid"
            px={2}
            py={1}
            borderRadius="md"
            opacity={interactionTooltip ? 0.8 : 0}
            transition="opacity 0.3s ease"
            zIndex={2}
          >
            {interactionCount} video interactions tracked
          </Badge>
        </Fade>
      </Box>

      {/* Tab Switch Modal */}
      <Modal
        isOpen={shouldShowTabSwitchModal}
        onClose={() => {
          closeTabSwitchModal();
          setTabSwitchReason("");
          setTabSwitchComment("");
        }}
        isCentered
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent borderRadius="lg" boxShadow="xl">
          <ModalHeader>
            <Flex align="center">
              <Icon as={FaExchangeAlt} mr={2} color="blue.500" />
              We noticed you switched tabs
            </Flex>
          </ModalHeader>
          <ModalBody>
            <Text mb={4} color="gray.600">
              Understanding your learning behavior helps us provide better
              recommendations. Why did you switch tabs just now?
            </Text>
            <RadioGroup
              value={tabSwitchReason}
              onChange={setTabSwitchReason}
              mb={4}
            >
              <Stack spacing={3}>
                <Radio value="search_help" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Looking for additional help</Text>
                    <Text fontSize="sm" color="gray.500">
                      Searching for explanations, tutorials, or documentation
                    </Text>
                  </Box>
                </Radio>
                <Radio value="distracted" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Got distracted</Text>
                    <Text fontSize="sm" color="gray.500">
                      Notifications, social media, or other distractions
                    </Text>
                  </Box>
                </Radio>
                <Radio value="taking_notes" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Taking notes</Text>
                    <Text fontSize="sm" color="gray.500">
                      Writing notes in another app or document
                    </Text>
                  </Box>
                </Radio>
                <Radio value="checking_reference" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Checking reference material</Text>
                    <Text fontSize="sm" color="gray.500">
                      Looking at documentation, code examples, or related
                      content
                    </Text>
                  </Box>
                </Radio>
                <Radio value="pause_break" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Taking a short break</Text>
                    <Text fontSize="sm" color="gray.500">
                      Needed a moment to process or rest
                    </Text>
                  </Box>
                </Radio>
                <Radio value="technical_issue" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Technical issue</Text>
                    <Text fontSize="sm" color="gray.500">
                      Video playback, audio, or other technical problems
                    </Text>
                  </Box>
                </Radio>
                <Radio value="other" colorScheme="blue">
                  <Box>
                    <Text fontWeight="medium">Other reason</Text>
                    <Text fontSize="sm" color="gray.500">
                      Something else not listed above
                    </Text>
                  </Box>
                </Radio>
              </Stack>
            </RadioGroup>
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Additional details (optional):
              </Text>
              <Textarea
                value={tabSwitchComment}
                onChange={(e) => setTabSwitchComment(e.target.value)}
                placeholder="Any specific details about what you were looking for or doing..."
                size="sm"
                rows={3}
                resize="vertical"
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                closeTabSwitchModal();
                setTabSwitchReason("");
                setTabSwitchComment("");
              }}
            >
              Skip
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleTabSwitchSubmit}
              isDisabled={!tabSwitchReason}
              leftIcon={<Icon as={FaChartBar} />}
            >
              Submit Feedback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Enhanced Inactivity Warning (shows first - center screen) */}
      {shouldShowInactivityNotification && (
        <InactivityNotification
          onResume={handleInactivityResponse}
          onClose={closeInactivityNotification}
          onTimeout={handleInactivityTimeout}
          responseTimeSeconds={15}
        />
      )}

      {/* Inactive Session Notification (shows after timeout - bottom right) */}
      {!isUserActive && !shouldShowInactivityNotification && isTabVisible && (
        <InactiveSessionNotification
          onResume={handleResumeFromInactivity}
          onClose={() => {}}
        />
      )}

      {/* 🆕 SIMPLE EXIT MODAL - Integrated directly with hook */}
      <ExitModal
        isOpen={showExitModal}
        onClose={handleContinueLearning}
        exitReason={exitReason}
        setExitReason={setExitReason}
        exitComment={exitComment}
        setExitComment={setExitComment}
        onContinue={handleContinueLearning}
        onSubmitAndExit={handleExitWithFeedback}
        onForceExit={handleForceExit}
        isSubmitting={isSubmittingExit}
        sessionDuration={getSessionDuration()}
        formatDuration={formatDuration}
        engagementScore={engagementScore}
        exitAttempts={exitAttempts}
      />
    </>
  );
};

export default VideoPlayer;
