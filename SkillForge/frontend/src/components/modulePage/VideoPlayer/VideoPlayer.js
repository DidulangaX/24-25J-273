import React, { useRef, useState, useEffect } from "react";
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
} from "react-icons/fa";

const VideoPlayer = ({ videoId, videoUrl, userId, onInteractionUpdate }) => {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlTimeout, setControlTimeout] = useState(null);
  const [interactionTooltip, setInteractionTooltip] = useState(false);

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
        difficultSections: interactionMetrics.difficultSections,
      });
    }
  }, [interactionMetrics, interactionCount, currentTime, onInteractionUpdate]);

  const controlsBg = useColorModeValue("blackAlpha.700", "blackAlpha.800");
  const sliderColor = useColorModeValue("blue.500", "blue.300");
  const timeColor = useColorModeValue("white", "gray.100");
  const tooltipBg = useColorModeValue("gray.700", "gray.900");

  useEffect(() => {
    if (videoId) {
      clearPreviousSession();
    }

    return () => {
      endSession();
    };
  }, [videoId]);

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
    }

    return () => {
      if (video) {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", updateTime);
        video.removeEventListener("durationchange", updateTime);
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlTimeout) {
        clearTimeout(controlTimeout);
      }

      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);

      setControlTimeout(timeout);
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlTimeout) {
        clearTimeout(controlTimeout);
      }
    };
  }, [isPlaying, controlTimeout]);

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
      setIsPlaying(!isPlaying);
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
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.currentTime + 10,
        duration
      );
      trackInteraction("seek");
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        videoRef.current.currentTime - 10,
        0
      );
      trackInteraction("seek");
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

  const trackInteraction = async (type, data = {}) => {
    try {
      setInteractionTooltip(true);
      setTimeout(() => setInteractionTooltip(false), 1500);

      const position = videoRef.current ? videoRef.current.currentTime : 0;
      const payload = {
        videoId,
        userId,
        interactionType: type,
        position,
        timestamp: new Date().toISOString(),
        ...data,
      };

      setInteractionMetrics((prev) => {
        const newMetrics = {
          ...prev,
          interactionCount: prev.interactionCount + 1,
        };

        if (type === "pause") {
          newMetrics.totalPauses = prev.totalPauses + 1;
          newMetrics.lastPauseTime = Date.now();
        } else if (type === "seek" && data.direction === "backward") {
          newMetrics.replayEvents = prev.replayEvents + 1;
          newMetrics.lastReplayTime = Date.now();

          const section = Math.floor(position / 10) * 10;
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
        } else if (type === "seek" && data.direction === "forward") {
          newMetrics.seekForwardEvents = prev.seekForwardEvents + 1;
          newMetrics.lastSkipTime = Date.now();
        }

        return newMetrics;
      });

      console.log(`Sending ${type} interaction:`, payload);
      const response = await axios.post(
        "http://localhost:5000/api/videos/interaction",
        payload
      );
      setInteractionCount((prev) => prev + 1);
      return response.data;
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
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
        onSeeked={() => trackInteraction("seek")}
        onRateChange={() => {
          const speed = videoRef.current ? videoRef.current.playbackRate : 1;
          trackInteraction("speed", { speed });
        }}
        onEnded={() => {
          setIsPlaying(false);
          trackInteraction("end");
          endSession();
        }}
        style={{ display: "block" }}
      />

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

      {/* Interaction tooltip */}
      <Tooltip
        label={`Interaction recorded (${interactionCount})`}
        isOpen={interactionTooltip}
        placement="top"
        hasArrow
        bg={tooltipBg}
      >
        <Badge
          position="absolute"
          top={4}
          right={4}
          colorScheme="blue"
          variant="solid"
          px={2}
          borderRadius="md"
          opacity={interactionTooltip ? 0.8 : 0}
          transition="opacity 0.3s ease"
        >
          {interactionCount}
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default VideoPlayer;
