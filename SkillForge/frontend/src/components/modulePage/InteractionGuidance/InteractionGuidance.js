//src/components/modulePage/InteractionGuidance/InteractionGuidance.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  RadioGroup,
  Radio,
  Stack,
  Textarea,
  Badge,
  Icon,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  Flex,
  Progress,
  Circle,
} from "@chakra-ui/react";
import {
  FaExchangeAlt,
  FaPause,
  FaRedo,
  FaQuestion,
  FaSearch,
  FaBookOpen,
  FaClock,
  FaLightbulb,
  FaCoffee,
  FaPhone,
  FaThumbsUp,
  FaVolumeUp, // Using FaVolumeUp instead of FaEar
  FaBrain,
  FaPlay,
  FaTimes,
} from "react-icons/fa";

const InteractionGuidance = ({
  interactionData,
  videoPosition,
  onAction,
  // 🆕 Props from enhanced behavioral tracking
  interventionTriggers,
  handleInterventionResponse,
  closeInterventionPrompt,
  videoTitle,
}) => {
  const [activePrompt, setActivePrompt] = useState(null);
  const [formData, setFormData] = useState({
    reason: "",
    needsHelp: "",
    comment: "",
    difficulty: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Monitor intervention triggers from behavioral tracking hook
  useEffect(() => {
    if (!interventionTriggers) return;

    if (interventionTriggers.shouldShowTabSwitchPrompt) {
      setActivePrompt("tabSwitch");
    } else if (interventionTriggers.shouldShowPausePrompt) {
      setActivePrompt("pause");
    } else if (interventionTriggers.shouldShowReplayPrompt) {
      setActivePrompt("replay");
    } else {
      setActivePrompt(null);
    }
  }, [interventionTriggers]);

  // Reset form when prompt changes
  useEffect(() => {
    if (activePrompt) {
      setFormData({
        reason: "",
        needsHelp: "",
        comment: "",
        difficulty: "",
      });
    }
  }, [activePrompt]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.reason) {
      toast({
        title: "Please select a reason",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = {
        type: activePrompt,
        reason: formData.reason,
        needsHelp: formData.needsHelp === "yes",
        comment: formData.comment,
        difficulty: formData.difficulty,
        helpType: getHelpType(
          activePrompt,
          formData.reason,
          formData.needsHelp
        ),
        metadata: interventionTriggers?.currentInterventionData?.data || {},
      };

      await handleInterventionResponse(response);
      setActivePrompt(null);
    } catch (error) {
      console.error("Error submitting intervention response:", error);
      toast({
        title: "Response saved locally",
        status: "info",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle prompt closure
  const handleClose = () => {
    if (activePrompt && closeInterventionPrompt) {
      closeInterventionPrompt(activePrompt);
    }
    setActivePrompt(null);
  };

  // Determine help type based on user response
  const getHelpType = (promptType, reason, needsHelp) => {
    if (needsHelp !== "yes") return null;

    const helpMap = {
      tabSwitch: {
        search_help: "show_summary",
        confused: "replay_section",
        too_fast: "slow_down",
        technical_terms: "show_summary",
        need_examples: "replay_section",
      },
      pause: {
        too_fast: "slow_down",
        confused: "replay_section",
        taking_notes: "pause_and_notes",
      },
      replay: {
        missed_audio: "slow_down",
        complex_concept: "show_summary",
        confused: "replay_section",
      },
    };

    return helpMap[promptType]?.[reason] || "get_help";
  };

  // Get prompt configuration based on type
  const getPromptConfig = (type) => {
    const configs = {
      tabSwitch: {
        title: "We noticed you switched tabs 🔄",
        subtitle: "What were you looking for?",
        color: "blue",
        icon: FaExchangeAlt,
        showDifficultyQuestion: true,
        reasons: [
          {
            value: "search_help",
            label: "Looking for additional help",
            description: "Searching for explanations or tutorials",
            icon: FaSearch,
            color: "orange",
          },
          {
            value: "confused",
            label: "Content seems confusing",
            description: "Need clarification on concepts",
            icon: FaQuestion,
            color: "red",
          },
          {
            value: "too_fast",
            label: "Video is too fast",
            description: "Hard to keep up with the pace",
            icon: FaClock,
            color: "yellow",
          },
          {
            value: "technical_terms",
            label: "Technical terms unclear",
            description: "Looking up definitions",
            icon: FaBookOpen,
            color: "purple",
          },
          {
            value: "need_examples",
            label: "Need more examples",
            description: "Want practical demonstrations",
            icon: FaLightbulb,
            color: "blue",
          },
          {
            value: "distracted",
            label: "Got distracted",
            description: "Notifications or other interruptions",
            icon: FaPhone,
            color: "gray",
          },
          {
            value: "taking_notes",
            label: "Taking notes",
            description: "Writing down important points",
            icon: FaBookOpen,
            color: "green",
          },
          {
            value: "break",
            label: "Taking a break",
            description: "Needed a moment to rest",
            icon: FaCoffee,
            color: "teal",
          },
        ],
      },
      pause: {
        title: "Pausing frequently? 🤔",
        subtitle: "Let us know what's happening",
        color: "purple",
        icon: FaPause,
        showDifficultyQuestion: true,
        reasons: [
          {
            value: "taking_notes",
            label: "Taking detailed notes",
            description: "Writing down important information",
            icon: FaBookOpen,
            color: "green",
          },
          {
            value: "too_fast",
            label: "Video is too fast",
            description: "Need time to process information",
            icon: FaClock,
            color: "orange",
          },
          {
            value: "confused",
            label: "Content is confusing",
            description: "Need to think about what was said",
            icon: FaBrain,
            color: "red",
          },
          {
            value: "distracted",
            label: "Got distracted",
            description: "Phone call, notification, etc.",
            icon: FaPhone,
            color: "purple",
          },
          {
            value: "break",
            label: "Taking a break",
            description: "Just needed a moment to rest",
            icon: FaCoffee,
            color: "blue",
          },
        ],
      },
      replay: {
        title: "Replaying sections? 🔄",
        subtitle: "What's prompting the reviews?",
        color: "teal",
        icon: FaRedo,
        showDifficultyQuestion: false,
        reasons: [
          {
            value: "missed_audio",
            label: "Missed what was said",
            description: "Audio unclear or got distracted",
            icon: FaVolumeUp, // Changed from FaEar to FaVolumeUp
            color: "blue",
          },
          {
            value: "complex_concept",
            label: "Complex concept",
            description: "Need to hear explanation again",
            icon: FaBrain,
            color: "red",
          },
          {
            value: "taking_notes",
            label: "Taking detailed notes",
            description: "Want to capture everything accurately",
            icon: FaBookOpen,
            color: "green",
          },
          {
            value: "confused",
            label: "Got confused",
            description: "Something doesn't make sense",
            icon: FaQuestion,
            color: "orange",
          },
          {
            value: "double_check",
            label: "Double-checking understanding",
            description: "Making sure I got it right",
            icon: FaThumbsUp,
            color: "purple",
          },
        ],
      },
    };

    return configs[type];
  };

  // Render nothing if no active prompt
  if (!activePrompt) return null;

  const config = getPromptConfig(activePrompt);
  if (!config) return null;

  const showDifficultyStep =
    config.showDifficultyQuestion &&
    formData.reason &&
    !["taking_notes", "break", "distracted", "double_check"].includes(
      formData.reason
    );

  const showHelpStep = showDifficultyStep && formData.difficulty;

  return (
    <Box
      position="fixed"
      bottom="30px"
      right="30px"
      bg="white"
      boxShadow="2xl"
      borderRadius="xl"
      p={6}
      zIndex={999}
      maxW="450px"
      borderLeftWidth="6px"
      borderLeftColor={`${config.color}.500`}
      animation="slideInUp 0.3s ease-out"
    >
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack>
            <Icon as={config.icon} color={`${config.color}.600`} boxSize={6} />
            <VStack align="start" spacing={0}>
              <Heading size="md" color={`${config.color}.700`}>
                {config.title}
              </Heading>
              {interventionTriggers?.currentInterventionData?.data && (
                <Badge
                  colorScheme={config.color}
                  variant="subtle"
                  fontSize="xs"
                >
                  {activePrompt === "tabSwitch" &&
                    `Away for ${Math.round(
                      interventionTriggers.currentInterventionData.data
                        .hiddenDuration || 0
                    )}s`}
                  {activePrompt === "pause" &&
                    `${
                      interventionTriggers.currentInterventionData.data
                        .recentPauseCount || 0
                    } recent pauses`}
                  {activePrompt === "replay" &&
                    `${
                      interventionTriggers.currentInterventionData.data
                        .recentReplayCount || 0
                    } recent replays`}
                </Badge>
              )}
            </VStack>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            leftIcon={<FaTimes />}
            color="gray.500"
          >
            Skip
          </Button>
        </HStack>

        {/* Step 1: Reason Selection */}
        {!showDifficultyStep && !showHelpStep && (
          <>
            <Text fontSize="sm" color="gray.600">
              {config.subtitle}
            </Text>

            <RadioGroup
              value={formData.reason}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, reason: value }))
              }
            >
              <Stack spacing={3}>
                {config.reasons.map((reason) => (
                  <Radio
                    key={reason.value}
                    value={reason.value}
                    colorScheme={reason.color}
                  >
                    <HStack spacing={2}>
                      <Icon as={reason.icon} color={`${reason.color}.500`} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {reason.label}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {reason.description}
                        </Text>
                      </VStack>
                    </HStack>
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>

            <HStack justify="space-between" pt={2}>
              <Button size="sm" variant="ghost" onClick={handleClose}>
                Skip
              </Button>
              <Button
                size="sm"
                colorScheme={config.color}
                isDisabled={!formData.reason}
                onClick={() => {
                  if (
                    config.showDifficultyQuestion &&
                    ![
                      "taking_notes",
                      "break",
                      "distracted",
                      "double_check",
                    ].includes(formData.reason)
                  ) {
                    // Continue to difficulty step
                  } else {
                    // Submit directly
                    handleSubmit();
                  }
                }}
              >
                {config.showDifficultyQuestion &&
                ![
                  "taking_notes",
                  "break",
                  "distracted",
                  "double_check",
                ].includes(formData.reason)
                  ? "Continue"
                  : "Submit"}
              </Button>
            </HStack>
          </>
        )}

        {/* Step 2: Difficulty Assessment (for tab switch and pause) */}
        {showDifficultyStep && !showHelpStep && (
          <>
            <Text fontSize="sm" color="gray.600">
              How challenging is this content for you right now?
            </Text>

            <RadioGroup
              value={formData.difficulty}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, difficulty: value }))
              }
            >
              <Stack spacing={3}>
                <Radio value="easy" colorScheme="green">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      Easy - I understand it
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Just wanted more info or examples
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="medium" colorScheme="yellow">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      Medium - Some parts unclear
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Could use some clarification
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="hard" colorScheme="red">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      Hard - I'm struggling
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Need help to understand this
                    </Text>
                  </VStack>
                </Radio>
              </Stack>
            </RadioGroup>

            <HStack justify="space-between">
              <Button size="sm" variant="ghost" onClick={handleClose}>
                Skip
              </Button>
              <Button
                size="sm"
                colorScheme={config.color}
                isDisabled={!formData.difficulty}
                onClick={() => {
                  // Continue to help step
                }}
              >
                Continue
              </Button>
            </HStack>
          </>
        )}

        {/* Step 3: Help Request */}
        {showHelpStep && (
          <>
            <Text fontSize="sm" color="gray.600">
              Do you need help right now?
            </Text>

            <RadioGroup
              value={formData.needsHelp}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, needsHelp: value }))
              }
            >
              <HStack spacing={6}>
                <Radio value="yes" colorScheme={config.color}>
                  <Text fontSize="sm">Yes, please help me</Text>
                </Radio>
                <Radio value="no" colorScheme="green">
                  <Text fontSize="sm">No, I'm okay</Text>
                </Radio>
              </HStack>
            </RadioGroup>

            <Collapse in={formData.needsHelp === "yes"}>
              <Textarea
                placeholder="What specific part is confusing? (optional)"
                value={formData.comment}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comment: e.target.value }))
                }
                size="sm"
                rows={2}
                bg="gray.50"
              />
            </Collapse>

            <HStack justify="space-between">
              <Button size="sm" variant="ghost" onClick={handleClose}>
                Skip
              </Button>
              <Button
                size="sm"
                colorScheme={config.color}
                onClick={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!formData.needsHelp}
                leftIcon={
                  formData.needsHelp === "yes" ? <FaPlay /> : <FaThumbsUp />
                }
              >
                {formData.needsHelp === "yes" ? "Get Help" : "Continue"}
              </Button>
            </HStack>
          </>
        )}

        {/* Progress indicator for multi-step prompts */}
        {config.showDifficultyQuestion &&
          !["taking_notes", "break", "distracted", "double_check"].includes(
            formData.reason
          ) && (
            <Box mt={2}>
              <HStack spacing={2} justify="center">
                <Circle
                  size="8px"
                  bg={formData.reason ? `${config.color}.500` : "gray.300"}
                />
                <Circle
                  size="8px"
                  bg={showDifficultyStep ? `${config.color}.500` : "gray.300"}
                />
                <Circle
                  size="8px"
                  bg={showHelpStep ? `${config.color}.500` : "gray.300"}
                />
              </HStack>
            </Box>
          )}
      </VStack>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default InteractionGuidance;
