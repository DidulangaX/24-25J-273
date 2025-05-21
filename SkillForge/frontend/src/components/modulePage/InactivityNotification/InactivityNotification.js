// src/components/modulePage/InactivityNotification/InactivityNotification.js
import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Slide,
  Button,
  Box,
} from "@chakra-ui/react";

const InactivityNotification = ({ onResume, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 15 seconds if no action taken
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Allow animation to complete
    }, 15000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleResume = () => {
    setIsVisible(false);
    setTimeout(() => {
      onResume();
      onClose();
    }, 300);
  };

  return (
    <Slide direction="top" in={isVisible} style={{ zIndex: 1000 }}>
      <Alert
        status="warning"
        variant="solid"
        borderRadius="md"
        boxShadow="lg"
        maxW="600px"
        mx="auto"
        mt={4}
      >
        <AlertIcon />
        <Box flex="1">
          <AlertTitle fontSize="lg">Are you still there?</AlertTitle>
          <AlertDescription>
            We noticed you haven't interacted with the video in a while. Would
            you like to continue watching?
          </AlertDescription>
        </Box>
        <Box>
          <Button
            colorScheme="white"
            variant="outline"
            mr={3}
            onClick={handleResume}
          >
            Resume Learning
          </Button>
          <CloseButton
            size="md"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          />
        </Box>
      </Alert>
    </Slide>
  );
};

export default InactivityNotification;
