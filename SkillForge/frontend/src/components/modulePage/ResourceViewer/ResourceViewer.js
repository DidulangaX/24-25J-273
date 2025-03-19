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
  Badge,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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

    // Handle PDFs specially
    if (resource.type === "pdf") {
      // Extract filename regardless of path format
      let filename;
      if (url) {
        filename = url.split(/[\/\\]/).pop();
      } else if (resource.filePath) {
        filename = resource.filePath.split(/[\/\\]/).pop();
      } else {
        return "#"; // Fallback if no URL
      }

      // Return the PDF viewer URL
      return `http://localhost:5000/pdf-viewer/${filename}`;
    }

    // For non-PDF resources
    if (!url) {
      return "#"; // Fallback
    }

    // If it's a relative URL that starts with /uploads/ or /api/
    if (url.startsWith("/uploads/") || url.startsWith("/api/")) {
      return `http://localhost:5000${url}`;
    }

    // If it's already a full URL
    return url;
  };

  // Get PDF related URLs based on filename
  const getPdfUrls = (filename) => {
    if (!filename) return {};

    return {
      directPdf: `http://localhost:5000/direct-pdf/${filename}`,
      pdfViewer: `http://localhost:5000/pdf-viewer/${filename}`,
      viewPdf: `http://localhost:5000/view-pdf/${filename}`,
    };
  };

  // Extract filename from resource
  const getFilename = () => {
    if (resource.filePath) {
      return resource.filePath.split(/[\/\\]/).pop();
    }
    if (resource.url) {
      return resource.url.split(/[\/\\]/).pop();
    }
    return null;
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
        const filename = getFilename();
        const pdfUrls = getPdfUrls(filename);

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

            <Tabs isFitted colorScheme="blue" mb={4}>
              <TabList>
                <Tab>PDF.js Viewer</Tab>
                <Tab>Direct View</Tab>
                {resource.driveId && <Tab>Google Drive</Tab>}
              </TabList>

              <TabPanels>
                {/* PDF.js Viewer Tab */}
                <TabPanel>
                  <Box
                    borderWidth="1px"
                    p={3}
                    mb={4}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Text mb={2}>
                      PDF.js viewer provides the best compatibility across
                      browsers:
                    </Text>
                    <Flex justify="center" gap={4} mb={4}>
                      <Button
                        as="a"
                        href={pdfUrls.pdfViewer}
                        target="_blank"
                        colorScheme="blue"
                        leftIcon={<ExternalLinkIcon />}
                      >
                        Open in New Tab
                      </Button>
                      <Button
                        as="a"
                        href={pdfUrls.directPdf}
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
                      src={pdfUrls.pdfViewer}
                      width="100%"
                      height="600px"
                      title={resource.title || "PDF Document"}
                      style={{ border: "1px solid #ccc", borderRadius: "4px" }}
                      onLoad={() => setLoading(false)}
                      onError={handleResourceError}
                    />
                  </Box>
                </TabPanel>

                {/* Direct View Tab */}
                <TabPanel>
                  <Box
                    borderWidth="1px"
                    p={3}
                    mb={4}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Text mb={2}>
                      Direct PDF view using browser's built-in viewer:
                    </Text>
                    <Flex justify="center" gap={4} mb={4}>
                      <Button
                        as="a"
                        href={pdfUrls.viewPdf}
                        target="_blank"
                        colorScheme="blue"
                        leftIcon={<ExternalLinkIcon />}
                      >
                        Open in New Tab
                      </Button>
                      <Button
                        as="a"
                        href={pdfUrls.directPdf}
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
                      src={pdfUrls.viewPdf}
                      width="100%"
                      height="600px"
                      title={resource.title || "PDF Document"}
                      style={{ border: "1px solid #ccc", borderRadius: "4px" }}
                      onLoad={() => setLoading(false)}
                      onError={handleResourceError}
                    />
                  </Box>
                </TabPanel>

                {/* Google Drive Tab (only if driveId exists) */}
                {resource.driveId && (
                  <TabPanel>
                    <Box
                      borderWidth="1px"
                      p={3}
                      mb={4}
                      bg="gray.50"
                      borderRadius="md"
                    >
                      <Text mb={2}>
                        View from Google Drive (most reliable):
                      </Text>
                      <Flex justify="center" gap={4} mb={4}>
                        <Button
                          as="a"
                          href={`https://drive.google.com/file/d/${resource.driveId}/view`}
                          target="_blank"
                          colorScheme="blue"
                          leftIcon={<ExternalLinkIcon />}
                        >
                          Open in Drive
                        </Button>
                        <Button
                          as="a"
                          href={`https://drive.google.com/uc?export=download&id=${resource.driveId}`}
                          download
                          colorScheme="green"
                          leftIcon={<DownloadIcon />}
                        >
                          Download from Drive
                        </Button>
                      </Flex>
                    </Box>

                    <Box display={loading ? "none" : "block"}>
                      <iframe
                        src={`https://drive.google.com/file/d/${resource.driveId}/preview`}
                        width="100%"
                        height="600px"
                        title={resource.title || "PDF Document"}
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                        onLoad={() => setLoading(false)}
                        onError={handleResourceError}
                        allowFullScreen
                      />
                    </Box>
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
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
          <HStack>
            <Badge
              colorScheme={
                resource.type === "pdf"
                  ? "red"
                  : resource.type === "link"
                  ? "blue"
                  : "green"
              }
            >
              {resource.type === "pdf"
                ? "PDF Document"
                : resource.type === "link"
                ? "External Link"
                : "Text Content"}
            </Badge>
            {resource.driveId && (
              <Badge colorScheme="purple">Google Drive</Badge>
            )}
          </HStack>
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
