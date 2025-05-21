import React, { useRef, useState, useEffect, useCallback } from "react";
import InactivityNotification from "../InactivityNotification/InactivityNotification";
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
  Tooltip,
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
  Portal,
  VStack,
  Progress,
  Divider,
  Icon, // Added this import
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
  FaBell,
  FaExchangeAlt,
  FaChartBar,
} from "react-icons/fa";

const VideoPlayer = ({ videoId, videoUrl, userId, onInteractionUpdate }) => {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const toast = useToast();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlTimeout, setControlTimeout] = useState(null);
  const [loadingState, setLoadingState] = useState("initial"); // "initial", "loading", "ready", "error"

  // Interaction tracking state
  const [interactionCount, setInteractionCount] = useState(0);
  const [interactionTooltip, setInteractionTooltip] = useState(false);
  const [showMetricsTooltip, setShowMetricsTooltip] = useState(false);

  const [interactionMetrics, setInteractionMetrics] = useState({
    totalPauses: 0,
    replayEvents: 0,
    seekForwardEvents: 0,
    interactionCount: 0,
    lastPauseTime: null,
    lastReplayTime: null,
    lastSkipTime: null,
    difficultSections: [],
  });

  // Tab visibility tracking
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [totalHiddenTime, setTotalHiddenTime] = useState(0);
  const [lastHiddenTime, setLastHiddenTime] = useState(null);

  // User activity tracking
  const [isUserActive, setIsUserActive] = useState(true);
  const [totalInactiveTime, setTotalInactiveTime] = useState(0);
  const [lastInactiveTime, setLastInactiveTime] = useState(null);
  const inactivityTimeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Exit attempt tracking
  const [exitAttempts, setExitAttempts] = useState(0);
  const [showInactivityNotification, setShowInactivityNotification] =
    useState(false);
  const inactivityTimerRef = useRef(null);

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
      setInteractionMetrics({
        totalPauses: 0,
        replayEvents: 0,
        seekForwardEvents: 0,
        interactionCount: 0,
        lastPauseTime: null,
        lastReplayTime: null,
        lastSkipTime: null,
        difficultSections: [],
      });
      setTabSwitchCount(0);
      setTotalHiddenTime(0);
      setTotalInactiveTime(0);
      setExitAttempts(0);
    }

    // Clean up on unmount
    return () => {
      endSession();
    };
  }, [videoId]);

  // Update notification when metrics change
  useEffect(() => {
    if (onInteractionUpdate) {
      onInteractionUpdate({
        interactionCount,
        totalPauses: interactionMetrics.totalPauses,
        replayEvents: interactionMetrics.replayEvents,
        seekForwardEvents: interactionMetrics.seekForwardEvents,
        lastPauseTime: interactionMetrics.lastPauseTime,
        lastReplayTime: interactionMetrics.lastReplayTime,
        lastSkipTime: interactionMetrics.lastSkipTime,
        lastPosition: currentTime,
        tabSwitchCount,
        totalHiddenTime,
        totalInactiveTime,
        exitAttempts,
        tabVisible: isTabVisible,
        isUserActive,
        difficultSections: interactionMetrics.difficultSections,
      });
    }
  }, [
    interactionMetrics,
    interactionCount,
    currentTime,
    tabSwitchCount,
    totalHiddenTime,
    totalInactiveTime,
    exitAttempts,
    isTabVisible,
    isUserActive,
    onInteractionUpdate,
  ]);

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

  // Tab visibility tracking - improved version
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden/unfocused
        console.log("Tab unfocused");
        setIsTabVisible(false);
        setLastHiddenTime(Date.now());
        setTabSwitchCount((prev) => prev + 1);
        // Track interaction with backend
        trackInteraction("tab_unfocused", {
          position: videoRef.current?.currentTime || 0,
        });

        // Optionally pause video when tab unfocused
        // if (videoRef.current && isPlaying) {
        //   videoRef.current.pause();
        // }
      } else {
        // Tab became visible/focused
        console.log("Tab focused");
        setIsTabVisible(true);
        if (lastHiddenTime) {
          const hiddenDuration = (Date.now() - lastHiddenTime) / 1000; // in seconds
          setTotalHiddenTime((prev) => prev + hiddenDuration);
          // Track interaction with backend
          trackInteraction("tab_focused", {
            position: videoRef.current?.currentTime || 0,
            hiddenDuration,
          });

          // If the tab was hidden for a significant time, show a toast
          if (hiddenDuration > 5) {
            toast({
              title: "Welcome back!",
              description: `You were away for ${Math.round(
                hiddenDuration
              )} seconds.`,
              status: "info",
              duration: 3000,
              isClosable: true,
              position: "top",
            });
          }
        }
      }
    };

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [lastHiddenTime, isPlaying, toast]);

  // User activity tracking - enhanced version
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 60000; // 60 seconds of inactivity

    const startInactivityTimer = () => {
      // Clear any existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Only start timer if video is playing
      if (isPlaying) {
        inactivityTimerRef.current = setTimeout(() => {
          console.log("User inactive while video playing");
          setIsUserActive(false);
          setLastInactiveTime(Date.now());

          // Track interaction
          trackInteraction("user_inactive", {
            position: videoRef.current?.currentTime || 0,
          });

          // Show notification and pause video
          setShowInactivityNotification(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Reset timer on user activity
    const resetActivityTimer = () => {
      // Clear existing timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // If user was inactive, track return to activity
      if (!isUserActive) {
        setIsUserActive(true);
        if (lastInactiveTime) {
          const inactiveDuration = (Date.now() - lastInactiveTime) / 1000; // in seconds
          setTotalInactiveTime((prev) => prev + inactiveDuration);

          // Track interaction
          trackInteraction("activity_resumed", {
            position: videoRef.current?.currentTime || 0,
            inactiveDuration,
          });
        }
      }

      // Start inactivity timer
      startInactivityTimer();
    };

    // Start the timer when playing
    if (isPlaying) {
      startInactivityTimer();
    }

    // Add event listeners for user activity
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart"];
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetActivityTimer);
    });

    // Clean up
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [isPlaying, isUserActive, lastInactiveTime]);

  // Exit attempt tracking - enhanced version
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Increment exit attempt counter
      setExitAttempts((prev) => prev + 1);

      // Track the exit attempt
      trackInteraction("exit_attempt", {
        position: videoRef.current?.currentTime || 0,
        isVideoComplete:
          videoRef.current?.currentTime >= videoRef.current?.duration * 0.9,
      });

      // If video is not nearly complete, show a confirmation dialog
      if (
        videoRef.current &&
        videoRef.current.currentTime < videoRef.current.duration * 0.9
      ) {
        const message =
          "You haven't finished watching this video. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const clearPreviousSession = async () => {
    try {
      setInteractionCount(0);

      await axios.post("http://localhost:5000/api/videos/clear-session", {
        userId,
        videoId,
      });

      console.log(`Cleared previous session data for video ${videoId}`);
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
        });
        console.log(`Ended session for video ${videoId}`);
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

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

  const handleSeek = (value) => {
    if (videoRef.current) {
      const prevPosition = videoRef.current.currentTime;
      videoRef.current.currentTime = value;
      setCurrentTime(value);

      // Track seek if significant change
      if (Math.abs(value - prevPosition) > 1) {
        trackInteraction("seek", {
          direction: value > prevPosition ? "forward" : "backward",
          prevPosition,
          skipAmount: Math.abs(value - prevPosition),
        });
      }
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newPosition = Math.min(videoRef.current.currentTime + 10, duration);
      videoRef.current.currentTime = newPosition;
      trackInteraction("seek", { direction: "forward", skipAmount: 10 });
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newPosition = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newPosition;
      trackInteraction("seek", { direction: "backward", skipAmount: 10 });
    }
  };

  const toggleFullscreen = () => {
    const player = document.querySelector(".video-player-container");

    if (!document.fullscreenElement) {
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (player.msRequestFullscreen) {
        player.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleResumeFromInactivity = () => {
    setShowInactivityNotification(false);
    setIsUserActive(true);

    if (lastInactiveTime) {
      const inactiveDuration = (Date.now() - lastInactiveTime) / 1000;
      setTotalInactiveTime((prev) => prev + inactiveDuration);

      trackInteraction("activity_resumed", {
        position: videoRef.current?.currentTime || 0,
        inactiveDuration,
      });
    }

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Enhanced tracking function
  const trackInteraction = async (type, data = {}) => {
    try {
      setInteractionTooltip(true);
      setTimeout(() => setInteractionTooltip(false), 1500);

      const position = videoRef.current ? videoRef.current.currentTime : 0;
      const timestamp = new Date().toISOString();

      // Prepare the payload with all metrics
      const payload = {
        videoId,
        userId,
        interactionType: type,
        position,
        timestamp,

        // Include existing metrics
        ...data,

        // Include new metrics for tab state
        tabVisible: isTabVisible,
        tabSwitchCount: tabSwitchCount,
        totalHiddenTime: totalHiddenTime,

        // Include activity metrics
        isUserActive: isUserActive,
        totalInactiveTime: totalInactiveTime,

        // Include exit metrics
        exitAttempts: exitAttempts,
      };

      // Update local state based on interaction type
      setInteractionMetrics((prev) => {
        const newMetrics = {
          ...prev,
          interactionCount: prev.interactionCount + 1,
        };

        if (type === "pause") {
          newMetrics.totalPauses = prev.totalPauses + 1;
          newMetrics.lastPauseTime = Date.now();
        } else if (type === "seek") {
          if (data.direction === "backward") {
            newMetrics.replayEvents = prev.replayEvents + 1;
            newMetrics.lastReplayTime = Date.now();

            // Track difficult section
            const section = Math.floor(position / 10) * 10; // 10-second sections
            const difficultSections = [...prev.difficultSections];
            const existingIndex = difficultSections.findIndex(
              (s) => s.start === section
            );

            if (existingIndex >= 0) {
              difficultSections[existingIndex].replayCount++;
            } else {
              difficultSections.push({
                start: section,
                end: section + 10,
                replayCount: 1,
                pauseCount: 0,
              });
            }

            newMetrics.difficultSections = difficultSections;
          } else if (data.direction === "forward") {
            newMetrics.seekForwardEvents = prev.seekForwardEvents + 1;
            newMetrics.lastSkipTime = Date.now();
          }
        }

        return newMetrics;
      });

      // Send to backend API
      const response = await axios.post(
        "http://localhost:5000/api/videos/interaction",
        payload
      );

      // Update local state
      setInteractionCount((prev) => prev + 1);

      return response.data;
    } catch (error) {
      console.error(`Error tracking ${type} interaction:`, error);
    }
  };

  // Utility functions for metrics display
  const calculatePauseRate = () => {
    const minutesWatched = duration > 0 ? currentTime / 60 : 0;
    return minutesWatched > 0
      ? (interactionMetrics.totalPauses / minutesWatched).toFixed(1)
      : "0.0";
  };

  const calculateTabVisibilityRatio = () => {
    return currentTime > 0
      ? Math.max(0, (currentTime - totalHiddenTime) / currentTime).toFixed(2)
      : "1.00";
  };

  const calculateActiveViewingRatio = () => {
    return currentTime > 0
      ? Math.max(0, (currentTime - totalInactiveTime) / currentTime).toFixed(2)
      : "1.00";
  };

  return (
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
          trackInteraction("play");
        }}
        onPause={() => {
          setIsPlaying(false);
          trackInteraction("pause");
        }}
        onSeeked={() => {
          // Determine seek direction and amount is now handled in handleSeek
          // This is just a fallback for native seeking
          const prevPosition = currentTime;
          const newPosition = videoRef.current?.currentTime || 0;
          const diff = newPosition - prevPosition;

          // Only track if it's a significant seek
          if (Math.abs(diff) > 1) {
            trackInteraction("seek", {
              direction: diff > 0 ? "forward" : "backward",
              prevPosition,
              skipAmount: Math.abs(diff),
            });
          }
        }}
        onRateChange={() => {
          const speed = videoRef.current ? videoRef.current.playbackRate : 1;
          trackInteraction("speed", { speed });
        }}
        onEnded={() => {
          setIsPlaying(false);
          trackInteraction("end");
          endSession();

          // Show completion toast
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

      {/* Video controls */}
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
          ref={progressBarRef}
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
            {/* Learning metrics button - NEW */}
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
                width="250px"
                bg={metricsTooltipBg}
                borderColor={metricsTooltipBorder}
                boxShadow="lg"
              >
                <PopoverArrow bg={metricsTooltipBg} />
                <PopoverBody p={4}>
                  <Text fontWeight="bold" mb={2}>
                    Live Learning Metrics
                  </Text>

                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Icon
                        as={FaRegEye}
                        color={isTabVisible ? "green.500" : "red.500"}
                      />
                      <Text fontSize="sm">Tab Visible:</Text>
                    </HStack>
                    <Badge colorScheme={isTabVisible ? "green" : "red"}>
                      {isTabVisible ? "Yes" : "No"}
                    </Badge>
                  </HStack>

                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Icon as={FaExchangeAlt} color="blue.500" />
                      <Text fontSize="sm">Tab Switches:</Text>
                    </HStack>
                    <Badge>{tabSwitchCount}</Badge>
                  </HStack>

                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm">Tab Visibility:</Text>
                    <Badge colorScheme="blue">
                      {Math.round(calculateTabVisibilityRatio() * 100)}%
                    </Badge>
                  </HStack>

                  <Box mb={2}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs">Learning Focus</Text>
                      <Badge colorScheme="blue">
                        {Math.round(calculateTabVisibilityRatio() * 100)}%
                      </Badge>
                    </Flex>

                    <Progress
                      value={Math.round(calculateTabVisibilityRatio() * 100)}
                      size="xs"
                      colorScheme="blue"
                      borderRadius="full"
                    />
                  </Box>

                  <Divider my={2} />

                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm">Pause Rate:</Text>
                    <Badge>{calculatePauseRate()}/min</Badge>
                  </HStack>

                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Icon as={FaUserClock} color="blue.500" />
                      <Text fontSize="sm">Active Viewing:</Text>
                    </HStack>
                    <Badge colorScheme="blue">
                      {Math.round(calculateActiveViewingRatio() * 100)}%
                    </Badge>
                  </HStack>

                  <Box mb={1}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs">Engagement</Text>
                      <Badge colorScheme="blue">
                        {Math.round(calculateActiveViewingRatio() * 100)}%
                      </Badge>
                    </Flex>
                    <Progress
                      value={Math.round(calculateActiveViewingRatio() * 100)}
                      size="xs"
                      colorScheme="green"
                      borderRadius="full"
                    />
                  </Box>

                  {interactionMetrics.difficultSections.length > 0 && (
                    <>
                      <Divider my={2} />
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Challenging Sections:
                      </Text>
                      <VStack align="start" spacing={1}>
                        {interactionMetrics.difficultSections
                          .slice(0, 2)
                          .map((section, index) => (
                            <Text key={index} fontSize="xs">
                              {formatTime(section.start)} -{" "}
                              {formatTime(section.end)}
                              <Badge ml={1} colorScheme="orange">
                                {section.replayCount}x replayed
                              </Badge>
                            </Text>
                          ))}
                      </VStack>
                    </>
                  )}
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {/* Learning Stats Icon - NEW */}
            <IconButton
              aria-label="Learning Statistics"
              icon={<FaChartBar />}
              size="sm"
              variant="ghost"
              color="white"
              onClick={() => {
                // This could open a more detailed analytics modal in the future
                toast({
                  title: "Learning stats",
                  description: `You've paused ${interactionMetrics.totalPauses} times and replayed content ${interactionMetrics.replayEvents} times.`,
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                });
              }}
            />

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

      {/* Tab visibility indicator - NEW */}
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
        >
          Tab Unfocused
        </Badge>
      )}

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
          {interactionCount} interactions
        </Badge>
      </Fade>

      {/* Inactive user notification */}
      {showInactivityNotification && (
        <InactivityNotification
          onResume={handleResumeFromInactivity}
          onClose={() => setShowInactivityNotification(false)}
        />
      )}

      {/* Tab visibility stat marker - NEW */}
      {tabSwitchCount > 0 && (
        <Circle
          size="40px"
          position="absolute"
          top="50px"
          right="10px"
          bg="rgba(0,0,0,0.7)"
          color="white"
          fontSize="sm"
          display="flex"
          alignItems="center"
          justifyContent="center"
          opacity={0.7}
          flexDirection="column"
        >
          <Icon as={FaExchangeAlt} mb="2px" />
          <Text fontSize="xs">{tabSwitchCount}</Text>
        </Circle>
      )}
    </Box>
  );
};

export default VideoPlayer;
