// src/components/modulePage/ResourceViewer/ResourceViewer.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Link,
} from "@chakra-ui/react";
import {
  ExternalLinkIcon,
  ArrowBackIcon,
  DownloadIcon,
} from "@chakra-ui/icons";

const ResourceViewer = ({ resource, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceUrl, setResourceUrl] = useState("");
  const toast = useToast();

  useEffect(() => {
    // Process and set the resource URL when the component mounts or resource changes
    if (resource) {
      const url = fixResourceUrl(resource.url || resource.filePath);
      setResourceUrl(url);
      console.log("Processed resource URL:", url);
    }
  }, [resource]);

  const handleResourceError = () => {
    setError("Failed to load resource. Please try again later.");
    setLoading(false);
    toast({
      title: "Resource Error",
      description: "The resource could not be loaded. Please try again later.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const fixResourceUrl = (url) => {
    console.log("Resource URL to fix:", url);

    if (!url) {
      // Try to use filePath if url is not available
      if (resource.filePath) {
        const filename = resource.filePath.split(/[\/\\]/).pop();
        console.log("Using filePath instead:", filename);
        return `http://localhost:5000/direct-pdf/${filename}`;
      }
      return "#"; // Fallback
    }

    // If it's already a direct-pdf URL
    if (url.startsWith("/direct-pdf/")) {
      return `http://localhost:5000${url}`;
    }

    // If it's a relative URL that starts with /uploads/ or /api/
    if (url.startsWith("/uploads/") || url.startsWith("/api/")) {
      return `http://localhost:5000${url}`;
    }

    // If it's a full path with backslashes (Windows) or forward slashes (Unix)
    if (
      url.includes("\\") ||
      (url.includes("/") && !url.startsWith("/") && !url.startsWith("http"))
    ) {
      const filename = url.split(/[\/\\]/).pop();
      return `http://localhost:5000/direct-pdf/${filename}`;
    }

    // If it's already a full URL
    return url;
  };

  // Determine resource type and render appropriate viewer
  const renderResourceContent = () => {
    if (!resource) {
      return (
        <Alert status="warning">
          <AlertIcon />
          No resource selected or resource information is missing.
        </Alert>
      );
    }

    switch (resource.type) {
      case "pdf":
        return (
          <Box width="100%" textAlign="center" p={4}>
            <Heading size="md" mb={4}>
              {resource.title || "PDF Document"}
            </Heading>
            <Text mb={4}>{resource.description}</Text>

            {loading && (
              <Flex justify="center" align="center" mb={4}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            )}

            <Box borderWidth="1px" p={3} mb={4} bg="gray.50" borderRadius="md">
              <Text mb={2}>
                If the PDF doesn't display correctly below, you can:
              </Text>
              <Flex justify="center" gap={4} mb={4}>
                <Button
                  as="a"
                  href={resourceUrl}
                  target="_blank"
                  colorScheme="blue"
                  leftIcon={<ExternalLinkIcon />}
                >
                  Open in New Tab
                </Button>

                <Button
                  as="a"
                  href={resourceUrl}
                  download
                  colorScheme="green"
                  leftIcon={<DownloadIcon />}
                >
                  Download PDF
                </Button>
              </Flex>
            </Box>

            <Box display={loading ? "none" : "block"}>
              <iframe
                src={resourceUrl}
                width="100%"
                height="600px"
                title={resource.title || "PDF Document"}
                style={{ border: "1px solid #ccc", borderRadius: "4px" }}
                onLoad={() => setLoading(false)}
                onError={handleResourceError}
              />
            </Box>
          </Box>
        );

      case "link":
        return (
          <Box p={5} borderWidth="1px" borderRadius="lg">
            <Heading size="md" mb={3}>
              {resource.title}
            </Heading>
            <Text mb={4}>{resource.description}</Text>
            <Button
              as="a"
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="blue"
              rightIcon={<ExternalLinkIcon />}
            >
              Open External Resource
            </Button>
          </Box>
        );

      case "text":
        return (
          <Box p={5} borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={3}>
              {resource.title}
            </Heading>
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              whiteSpace="pre-wrap"
              dangerouslySetInnerHTML={{ __html: resource.content }}
            />
          </Box>
        );

      default:
        return (
          <Alert status="warning">
            <AlertIcon />
            Unsupported resource type: {resource.type || "unknown"}
          </Alert>
        );
    }
  };

  return (
    <Box width="100%">
      <Flex justify="space-between" align="center" mb={4}>
        <Button leftIcon={<ArrowBackIcon />} onClick={onBack} variant="outline">
          Back to Recommendations
        </Button>

        {resource && (
          <Text fontWeight="semibold" color="gray.600">
            {resource.type === "pdf"
              ? "PDF Document"
              : resource.type === "link"
              ? "External Link"
              : "Text Content"}
          </Text>
        )}
      </Flex>

      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        renderResourceContent()
      )}
    </Box>
  );
};

export default ResourceViewer;
