// src/components/modulePage/PDFReader/EnhancedPDFReader.js
import React, { useState, useRef, useCallback } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";

// Import the styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";

import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Flex,
  IconButton,
  useColorModeValue,
  useToast,
  Tooltip,
  Badge,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";

import {
  ArrowBackIcon,
  ArrowForwardIcon,
  SearchIcon,
  AddIcon,
  DeleteIcon,
  DownloadIcon,
} from "@chakra-ui/icons";

const EnhancedPDFReader = ({ url, title }) => {
  const toast = useToast();
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#FFFF00"); // Yellow default
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [highlightNotes, setHighlightNotes] = useState({});
  const [currentHighlight, setCurrentHighlight] = useState(null);

  // PDF background color
  const bgColor = useColorModeValue("white", "gray.800");

  // References
  const viewerRef = useRef(null);

  // Highlight plugin setup
  const highlightPluginInstance = highlightPlugin({
    onHighlightClick: (highlight) => {
      setCurrentHighlight(highlight);
      onOpen();
    },
  });

  // Toolbar plugin
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  // Handle document load success
  const handleDocumentLoad = useCallback((e) => {
    setNumPages(e.numPages);
  }, []);

  // Page navigation
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Zoom controls
  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    if (scale > 0.6) {
      setScale(scale - 0.2);
    }
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchText.trim()) {
      return;
    }

    // Using the search API from the plugin
    const result = highlightPluginInstance.search(searchText);

    if (result.length === 0) {
      toast({
        title: "No results found",
        status: "info",
        duration: 2000,
      });
    } else {
      // Go to the first result
      const firstResult = result[0];
      setCurrentPage(firstResult.pageIndex + 1);

      toast({
        title: `Found ${result.length} matches`,
        status: "success",
        duration: 2000,
      });
    }
  };

  // Highlighting functionality
  const addHighlight = (highlightArea) => {
    const newHighlight = {
      id: `highlight-${Date.now()}`,
      pageIndex: currentPage - 1,
      position: highlightArea,
      color: selectedColor,
    };

    setHighlights([...highlights, newHighlight]);

    toast({
      title: "Highlight added",
      status: "success",
      duration: 2000,
    });
  };

  const removeHighlight = (id) => {
    setHighlights(highlights.filter((h) => h.id !== id));
    setHighlightNotes({ ...highlightNotes, [id]: undefined });

    toast({
      title: "Highlight removed",
      status: "info",
      duration: 2000,
    });

    onClose();
  };

  const handleHighlightNote = (note) => {
    if (currentHighlight) {
      setHighlightNotes({
        ...highlightNotes,
        [currentHighlight.id]: note,
      });

      toast({
        title: "Note saved",
        status: "success",
        duration: 2000,
      });
    }
  };

  // Save highlights to localStorage
  const saveHighlights = () => {
    try {
      const docKey = `pdf-highlights-${url.split("/").pop()}`;
      localStorage.setItem(
        docKey,
        JSON.stringify({
          highlights,
          notes: highlightNotes,
        })
      );

      toast({
        title: "Highlights saved",
        description: "Your highlights have been saved to this browser",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Error saving highlights",
        description: err.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  // Load highlights from localStorage
  const loadHighlights = useCallback(() => {
    try {
      const docKey = `pdf-highlights-${url.split("/").pop()}`;
      const saved = localStorage.getItem(docKey);

      if (saved) {
        const parsed = JSON.parse(saved);
        setHighlights(parsed.highlights || []);
        setHighlightNotes(parsed.notes || {});

        toast({
          title: "Highlights loaded",
          description: `Loaded ${parsed.highlights.length} highlights`,
          status: "info",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("Error loading highlights:", err);
    }
  }, [url, toast]);

  // Load highlights on mount
  React.useEffect(() => {
    if (url) {
      loadHighlights();
    }
  }, [url, loadHighlights]);

  // In your EnhancedPDFReader.js or wherever you're attempting to load the PDF
  const fixResourceUrl = (url) => {
    // Handle relative URLs
    if (url && url.startsWith("/uploads")) {
      // Make sure the URL points to the correct location based on your server structure
      return `http://localhost:5000${url}`;
    }

    // If the URL is the full path (which might be causing the issue)
    // Extract just the filename and reconstruct the URL correctly
    if (url) {
      // Extract just the filename regardless of the path format
      const filename = url.split(/[\/\\]/).pop();
      return `http://localhost:5000/get-pdf/${filename}`;
    }
    return url;
  };
  // Then use this function when setting the URL for the PDF viewer
  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
    <Viewer
      fileUrl={fixResourceUrl(url)}
      // other props
    />
  </Worker>;

  return (
    <Box width="100%" borderWidth="1px" borderRadius="lg" overflow="hidden">
      {/* Title bar */}
      <Flex
        bg="blue.600"
        color="white"
        p={3}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontWeight="bold" isTruncated maxW="60%">
          {title || "PDF Document"}
        </Text>
        <HStack spacing={2}>
          <Tooltip label="Download PDF">
            <IconButton
              icon={<DownloadIcon />}
              size="sm"
              onClick={() => window.open(url, "_blank")}
              aria-label="Download PDF"
            />
          </Tooltip>
          <Tooltip label="Save highlights">
            <Button size="sm" onClick={saveHighlights}>
              Save Highlights
            </Button>
          </Tooltip>
        </HStack>
      </Flex>

      {/* Toolbar */}
      <Flex
        bg={useColorModeValue("gray.100", "gray.700")}
        p={2}
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <HStack>
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={goToPrevPage}
            isDisabled={currentPage === 1}
            aria-label="Previous page"
          />
          <Text>
            Page {currentPage} of {numPages || "-"}
          </Text>
          <IconButton
            icon={<ArrowForwardIcon />}
            onClick={goToNextPage}
            isDisabled={currentPage === numPages}
            aria-label="Next page"
          />
        </HStack>

        <HStack ml={{ base: 0, md: 4 }}>
          <Button onClick={zoomOut} size="sm">
            -
          </Button>
          <Text>{Math.round(scale * 100)}%</Text>
          <Button onClick={zoomIn} size="sm">
            +
          </Button>
        </HStack>

        <HStack ml={{ base: 0, md: 4 }}>
          <Input
            placeholder="Search text..."
            size="sm"
            width={{ base: "full", md: "200px" }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <IconButton
            icon={<SearchIcon />}
            onClick={handleSearch}
            aria-label="Search"
            size="sm"
          />
        </HStack>

        <HStack ml={{ base: 0, md: "auto" }}>
          <Text fontSize="sm">Highlight color:</Text>
          <Select
            size="sm"
            width="120px"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="#FFFF00">Yellow</option>
            <option value="#FF9999">Red</option>
            <option value="#90EE90">Green</option>
            <option value="#ADD8E6">Blue</option>
          </Select>
        </HStack>
      </Flex>

      {/* PDF Viewer */}
      <Box height="70vh" bg={bgColor} overflow="auto">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={url}
            plugins={[highlightPluginInstance, toolbarPluginInstance]}
            defaultScale={scale}
            onDocumentLoad={handleDocumentLoad}
            renderLoader={(percentages) => (
              <Box textAlign="center" py={10}>
                <Text>Loading document: {Math.round(percentages)}%</Text>
              </Box>
            )}
            initialPage={currentPage - 1}
            onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
            transformToolbar={(Toolbar) => <></>}
            ref={viewerRef}
          />
        </Worker>
      </Box>

      {/* Highlight notes modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Highlight Notes</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {currentHighlight && (
              <VStack spacing={4} align="stretch">
                <Box p={3} bg={currentHighlight.color + "50"} borderRadius="md">
                  <Text fontWeight="bold">Highlighted Text:</Text>
                  <Text>
                    {/* This would be the extracted text if available */}
                    {currentHighlight.text || "Text extraction not available"}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Notes:
                  </Text>
                  <Input
                    placeholder="Add notes about this highlight..."
                    value={highlightNotes[currentHighlight.id] || ""}
                    onChange={(e) => handleHighlightNote(e.target.value)}
                  />
                </Box>

                <Flex justifyContent="space-between">
                  <Button
                    colorScheme="red"
                    leftIcon={<DeleteIcon />}
                    onClick={() => removeHighlight(currentHighlight.id)}
                  >
                    Remove Highlight
                  </Button>
                  <Button colorScheme="blue" onClick={onClose}>
                    Close
                  </Button>
                </Flex>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Highlight summary */}
      <Box p={3} borderTopWidth="1px">
        <Text fontWeight="bold" mb={2}>
          Highlights ({highlights.length})
        </Text>
        {highlights.length > 0 ? (
          <Flex flexWrap="wrap" gap={2}>
            {highlights.map((highlight) => (
              <Badge
                key={highlight.id}
                p={2}
                bg={highlight.color + "50"}
                borderRadius="md"
                cursor="pointer"
                onClick={() => {
                  setCurrentPage(highlight.pageIndex + 1);
                  setCurrentHighlight(highlight);
                  onOpen();
                }}
              >
                Page {highlight.pageIndex + 1}
                {highlightNotes[highlight.id] ? " 📝" : ""}
              </Badge>
            ))}
          </Flex>
        ) : (
          <Text fontSize="sm" color="gray.500">
            No highlights yet. Select text in the document to highlight it.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedPDFReader;
