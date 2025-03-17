// src/components/admin/EditResourceUpload.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Button,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Stack,
  Flex,
  Grid,
  GridItem,
  Text,
  Badge,
  Alert,
  AlertIcon,
  FormHelperText,
  Divider,
  Spinner,
  Container,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Link,
} from "@chakra-ui/react";
import {
  HiUpload,
  HiArrowLeft,
  HiDownload,
  HiExternalLink,
  HiDocumentText,
} from "react-icons/hi";

const EditResourceUpload = () => {
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const location = useLocation();
  const toast = useToast();
  const queryParams = new URLSearchParams(location.search);
  const editId = resourceId || queryParams.get("edit");

  // State for resource data
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [sectionStart, setSectionStart] = useState("");
  const [sectionEnd, setSectionEnd] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalFileName, setOriginalFileName] = useState("");
  const [originalFilePath, setOriginalFilePath] = useState("");
  const [originalType, setOriginalType] = useState("");

  useEffect(() => {
    // Fetch videos for dropdown
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videos");
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast({
          title: "Error",
          description: "Failed to fetch videos",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchVideos();

    // If editing an existing resource, fetch its data
    if (editId) {
      fetchResourceData();
    } else {
      setLoading(false);
    }
  }, [editId]);

  const fetchResourceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/resources/id/${editId}`
      );
      const resourceData = response.data;

      // Set form fields with resource data
      setTitle(resourceData.title || "");
      setDescription(resourceData.description || "");
      setType(resourceData.type || "text");
      setContent(resourceData.content || "");
      setUrl(resourceData.url || "");
      setSectionStart(resourceData.sectionStart || "");
      setSectionEnd(resourceData.sectionEnd || "");
      setDifficulty(resourceData.recommendedFor || "");
      setSelectedVideo(resourceData.videoId || "");
      setOriginalType(resourceData.type || "");

      // Set tags
      if (resourceData.tags && resourceData.tags.length > 0) {
        setTags(resourceData.tags.join(", "));
      }

      // Set file information if it's a PDF
      if (resourceData.type === "pdf" && resourceData.filePath) {
        const filename = resourceData.filePath.split("/").pop();
        setOriginalFileName(filename);
        setOriginalFilePath(resourceData.filePath);
      }

      // If resource is linked to a video, fetch existing resources for that video
      if (resourceData.videoId) {
        try {
          const resourcesResponse = await axios.get(
            `http://localhost:5000/api/resources/video/${resourceData.videoId}`
          );
          setResources(resourcesResponse.data);
        } catch (error) {
          console.error("Error fetching resources for video:", error);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching resource data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch resource data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleVideoSelect = async (e) => {
    const videoId = e.target.value;
    setSelectedVideo(videoId);

    if (videoId) {
      try {
        // Fetch existing resources for this video
        const response = await axios.get(
          `http://localhost:5000/api/resources/video/${videoId}`
        );
        setResources(response.data);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
      }
    } else {
      setResources([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      // Add basic resource data
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("recommendedFor", difficulty);

      // Add section data if provided
      if (selectedVideo) {
        formData.append("videoId", selectedVideo);
      }

      if (sectionStart) {
        formData.append("sectionStart", sectionStart);
      }

      if (sectionEnd) {
        formData.append("sectionEnd", sectionEnd);
      }

      if (tags) {
        formData.append("tags", tags);
      }

      // Add content based on type
      if (type === "text") {
        formData.append("content", content);
      } else if (type === "link") {
        formData.append("url", url);
      } else if (file) {
        formData.append("pdf", file); // For PDF uploads
      }

      let response;

      if (editId) {
        // Update existing resource
        response = await axios.put(
          `http://localhost:5000/api/resources/${editId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setMessage("Resource updated successfully!");
      } else {
        // Create new resource
        response = await axios.post(
          "http://localhost:5000/api/resources",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setMessage("Resource added successfully!");
      }

      console.log(
        editId ? "Resource update response:" : "Resource creation response:",
        response.data
      );

      toast({
        title: editId ? "Resource updated" : "Resource added",
        description: editId
          ? "The resource has been updated successfully"
          : "The resource has been added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Navigate back to dashboard after short delay
      setTimeout(() => {
        navigate("/module-dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error with resource:", error);
      setMessage("Error: " + (error.response?.data?.message || error.message));

      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="green.500" thickness="4px" />
        <Text ml={4} fontSize="xl">
          Loading resource data...
        </Text>
      </Flex>
    );
  }

  return (
    <Container maxW="1200px" px={8} py={10}>
      <Box mb={4}>
        <Breadcrumb separator=">" fontSize="sm">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/module-dashboard")}>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>
              {editId ? "Edit Resource" : "Add Resource"}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>

      <Flex align="center" mb={6}>
        <IconButton
          icon={<HiArrowLeft />}
          aria-label="Back to dashboard"
          onClick={() => navigate("/module-dashboard")}
          mr={4}
          variant="ghost"
        />
        <Heading>
          {editId ? "Edit Learning Resource" : "Add Learning Resource"}
        </Heading>
      </Flex>

      {message && (
        <Alert
          status={message.includes("Error") ? "error" : "success"}
          mb={6}
          borderRadius="md"
        >
          <AlertIcon />
          {message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={6}
          mb={6}
          bg="white"
          boxShadow="sm"
        >
          <Heading as="h3" size="md" mb={2}>
            Resource Details
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            {editId
              ? "Update information about this learning resource"
              : "Provide information about the learning resource"}
          </Text>
          <Divider mb={4} />

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Resource Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                bg="white"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                bg="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Resource Type</FormLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                isDisabled={editId && originalType !== ""}
                bg="white"
              >
                <option value="text">Text</option>
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
              </Select>
              {editId && originalType !== "" && (
                <FormHelperText>
                  Resource type cannot be changed after creation.
                </FormHelperText>
              )}
            </FormControl>

            {type === "text" && (
              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minH="200px"
                  bg="white"
                />
              </FormControl>
            )}

            {type === "link" && (
              <FormControl isRequired>
                <FormLabel>URL</FormLabel>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  bg="white"
                />
              </FormControl>
            )}

            {type === "pdf" && (
              <FormControl>
                <FormLabel>PDF File</FormLabel>
                <Flex direction="column">
                  {originalFileName && (
                    <Flex
                      mb={4}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="gray.50"
                      align="center"
                      justify="space-between"
                    >
                      <Text fontSize="sm">
                        Current file:{" "}
                        <Text as="span" fontWeight="medium">
                          {originalFileName}
                        </Text>
                      </Text>
                      <Flex>
                        {originalFilePath && (
                          <Link
                            href={`http://localhost:5000${originalFilePath}`}
                            isExternal
                            mr={3}
                          >
                            <Button
                              size="sm"
                              leftIcon={<HiDownload />}
                              colorScheme="green"
                              variant="outline"
                            >
                              Download
                            </Button>
                          </Link>
                        )}
                        <Badge>Original file</Badge>
                      </Flex>
                    </Flex>
                  )}

                  <Flex alignItems="center">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      display="none"
                      id="file-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="file-upload"
                      leftIcon={<HiUpload />}
                      colorScheme="green"
                      variant="outline"
                      cursor="pointer"
                    >
                      {editId ? "Replace PDF" : "Upload PDF"}
                    </Button>
                    {file && (
                      <Text ml={4} fontSize="sm">
                        {file.name}
                      </Text>
                    )}
                  </Flex>

                  <FormHelperText>
                    {editId
                      ? "Upload a new file only if you want to replace the existing PDF"
                      : "Upload a PDF file for the resource"}
                  </FormHelperText>
                </Flex>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>For Difficulty Level</FormLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                bg="white"
              >
                <option value="">All Difficulty Levels</option>
                <option value="easy">Easy</option>
                <option value="justright">Just Right</option>
                <option value="difficult">Difficult</option>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={6}
          mb={6}
          bg="white"
          boxShadow="sm"
        >
          <Heading as="h3" size="md" mb={2}>
            Section Specific Resource (Optional)
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Link this resource to a specific video section
          </Text>
          <Divider mb={4} />

          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Video</FormLabel>
              <Select
                value={selectedVideo}
                onChange={handleVideoSelect}
                bg="white"
              >
                <option value="">Select a video (optional)</option>
                {videos.map((video) => (
                  <option key={video._id} value={video._id}>
                    {video.title}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Section Start (seconds)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={sectionStart}
                    onChange={(e) => setSectionStart(e.target.value)}
                    bg="white"
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Section End (seconds)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={sectionEnd}
                    onChange={(e) => setSectionEnd(e.target.value)}
                    bg="white"
                  />
                </FormControl>
              </GridItem>
            </Grid>

            <FormControl>
              <FormLabel>Tags (comma separated)</FormLabel>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., functions, loops, basics"
                bg="white"
              />
            </FormControl>
          </Stack>
        </Box>

        <Flex justify="space-between" mb={8}>
          <Button
            onClick={() => navigate("/module-dashboard")}
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            colorScheme="green"
            isLoading={isSaving}
            loadingText={editId ? "Updating..." : "Adding..."}
            px={8}
          >
            {editId ? "Update Resource" : "Add Resource"}
          </Button>
        </Flex>
      </form>

      {resources.length > 0 && (
        <Box
          mt={6}
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          boxShadow="sm"
        >
          <Heading as="h3" size="md" mb={4}>
            Existing Resources for Selected Video
          </Heading>
          <Stack spacing={4}>
            {resources.map((resource) => (
              <Box
                key={resource._id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg={resource._id === editId ? "blue.50" : "white"}
                borderColor={resource._id === editId ? "blue.300" : "gray.200"}
              >
                <Flex justify="space-between" align="flex-start">
                  <Box>
                    <Heading size="sm">{resource.title}</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1} noOfLines={2}>
                      {resource.description}
                    </Text>
                    <Flex gap={2} mt={2} wrap="wrap">
                      <Badge colorScheme="green">
                        {resource.type.charAt(0).toUpperCase() +
                          resource.type.slice(1)}
                      </Badge>
                      {resource.sectionStart && resource.sectionEnd && (
                        <Badge colorScheme="purple">
                          {formatTime(resource.sectionStart)} -{" "}
                          {formatTime(resource.sectionEnd)}
                        </Badge>
                      )}
                      {resource.recommendedFor && (
                        <Badge colorScheme="blue">
                          {resource.recommendedFor.charAt(0).toUpperCase() +
                            resource.recommendedFor.slice(1)}
                        </Badge>
                      )}
                      {resource._id === editId && (
                        <Badge colorScheme="orange">Editing</Badge>
                      )}
                    </Flex>
                  </Box>

                  {resource._id !== editId && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() =>
                        navigate(`/upload-resource?edit=${resource._id}`)
                      }
                    >
                      Edit
                    </Button>
                  )}
                </Flex>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Container>
  );
};

export default EditResourceUpload;
