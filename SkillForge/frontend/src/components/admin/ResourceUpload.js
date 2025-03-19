import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Card,
  CardHeader,
  CardBody,
  Text,
  Badge,
  Alert,
  AlertIcon,
  FormHelperText,
  Divider,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";

const ResourceUpload = () => {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available videos
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videos");
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = async (e) => {
    const videoId = e.target.value;
    setSelectedVideo(videoId);

    if (videoId) {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/videos/resources/video/${videoId}`
        );
        setResources(response.data);
        console.log("Fetched resources:", response.data);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
      }
    } else {
      setResources([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("recommendedFor", difficulty);

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

      if (type === "text") {
        formData.append("content", content);
      } else if (type === "link") {
        formData.append("url", url);
      } else if (file) {
        formData.append("pdf", file);
      }

      console.log("Submitting resource with data:", {
        title,
        description,
        type,
        videoId: selectedVideo,
        sectionStart,
        sectionEnd,
        tags,
        difficulty,
      });

      // Submit resource
      const response = await axios.post(
        "http://localhost:5000/api/videos/resources",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Resource creation response:", response.data);
      setMessage("Resource added successfully!");

      setTitle("");
      setDescription("");
      setContent("");
      setUrl("");
      setDifficulty("");
      setFile(null);
      setSectionStart("");
      setSectionEnd("");
      setTags("");

      if (selectedVideo) {
        try {
          const resourceResponse = await axios.get(
            `http://localhost:5000/api/videos/resources/video/${selectedVideo}`
          );
          setResources(resourceResponse.data);
        } catch (error) {
          console.error("Error refreshing resources:", error);
        }
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      setMessage("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Box maxW="1200px" mx="auto" p={4} pt={20}>
      <Heading as="h2" mb={6}>
        Add Learning Resource
      </Heading>

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
        <Box borderWidth="1px" borderRadius="lg" p={6} mb={6}>
          <Heading as="h3" size="md" mb={2}>
            Resource Details
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Provide information about the learning resource
          </Text>
          <Divider mb={4} />

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Resource Title</FormLabel>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Resource Type</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="text">Text</option>
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
              </Select>
            </FormControl>

            {type === "text" && (
              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minH="200px"
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
                />
              </FormControl>
            )}

            {type === "pdf" && (
              <FormControl isRequired>
                <FormLabel>PDF File</FormLabel>
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
                    variant="outline"
                    cursor="pointer"
                  >
                    Upload PDF
                  </Button>
                  {file && (
                    <Text ml={4} fontSize="sm">
                      {file.name}
                    </Text>
                  )}
                </Flex>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>For Difficulty Level</FormLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">All Difficulty Levels</option>
                <option value="easy">Easy</option>
                <option value="justright">Just Right</option>
                <option value="difficult">Difficult</option>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={6} mb={6}>
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
              <Select value={selectedVideo} onChange={handleVideoSelect}>
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
              />
            </FormControl>
          </Stack>
        </Box>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={loading}
          loadingText="Adding..."
          mb={8}
        >
          Add Resource
        </Button>
      </form>

      {resources.length > 0 && (
        <Box mt={6}>
          <Heading as="h3" size="md" mb={4}>
            Existing Resources for Selected Video
          </Heading>
          <Stack spacing={4}>
            {resources.map((resource) => (
              <Card key={resource._id} variant="outline">
                <CardHeader pb={2}>
                  <Heading size="sm">{resource.title}</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    {resource.description}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    <Badge colorScheme="blue">
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
                      <Badge colorScheme="green">
                        {resource.recommendedFor.charAt(0).toUpperCase() +
                          resource.recommendedFor.slice(1)}
                      </Badge>
                    )}
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ResourceUpload;
