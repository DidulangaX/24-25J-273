// src/components/modulePage/VideoPlayer/InteractionBadge.js
import React, { useEffect, useState } from "react";
import {
  Badge,
  Flex,
  Icon,
  Text,
  Box,
  keyframes,
  useColorModeValue,
} from "@chakra-ui/react";

// Animation keyframes
const pulseAnimation = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(66, 153, 225, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
`;

const InteractionBadge = ({
  isVisible,
  interactionType,
  interactionCount,
  colorScheme = "blue",
  icon,
}) => {
  const [animation, setAnimation] = useState(fadeIn);
  const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const textColor = useColorModeValue(
    `${colorScheme}.800`,
    `${colorScheme}.200`
  );
  const borderColor = useColorModeValue(
    `${colorScheme}.200`,
    `${colorScheme}.700`
  );

  useEffect(() => {
    let timer;
    if (isVisible) {
      setAnimation(fadeIn);
    } else {
      timer = setTimeout(() => {
        setAnimation(fadeOut);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!interactionType) return null;

  const getInteractionLabel = (type) => {
    switch (type) {
      case "play":
        return "Play";
      case "pause":
        return "Pause";
      case "seek":
        return "Seek";
      case "speed":
        return "Speed Change";
      case "tab_unfocused":
        return "Tab Left";
      case "tab_focused":
        return "Tab Returned";
      case "user_inactive":
        return "Inactive";
      case "activity_resumed":
        return "Activity Resumed";
      case "exit_attempt":
        return "Exit Attempt";
      default:
        return "Interaction";
    }
  };

  return (
    <Box
      position="absolute"
      top={4}
      right={4}
      zIndex={3}
      opacity={isVisible ? 1 : 0}
      animation={`${animation} 0.3s ease-in-out forwards`}
    >
      <Flex
        alignItems="center"
        bg={bgColor}
        color={textColor}
        px={3}
        py={2}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="md"
        animation={`${pulseAnimation} 2s infinite`}
      >
        {icon && <Icon as={icon} mr={2} />}
        <Text fontWeight="medium" fontSize="sm" mr={2}>
          {getInteractionLabel(interactionType)}
        </Text>
        <Badge
          colorScheme={colorScheme}
          variant="solid"
          borderRadius="full"
          minW="24px"
          textAlign="center"
        >
          {interactionCount}
        </Badge>
      </Flex>
    </Box>
  );
};

export default InteractionBadge;
