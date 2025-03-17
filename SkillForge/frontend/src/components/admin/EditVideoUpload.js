// src/components/admin/EditVideoUpload.js
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  VStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  Spinner,
  Container,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { HiUpload, HiArrowLeft, HiStar, HiTrash } from "react-icons/hi";

const EditVideoUpload = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const location = useLocation();
  const toast = useToast();
  const queryParams = new URLSearchParams(location.search);
  const editId = videoId || queryParams.get("edit");

  // State for video data
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalFileName, setOriginalFileName] = useState("");

  // New state variables for enhanced learning path
  const [sequenceId, setSequenceId] = useState("");
  const [sequencePosition, setSequencePosition] = useState(1);
  const [level, setLevel] = useState(3); // Numeric difficulty level (1-5)
  const [tags, setTags] = useState("");
  const [tagArray, setTagArray] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [prerequisites, setPrerequisites] = useState([]);
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);

  useEffect(() => {
    // Fetch existing videos for prerequisites selection
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videos");
        // Filter out the current video being edited
        const filteredVideos =
          response.data.filter((video) => video._id !== editId) || [];
        setExistingVideos(filteredVideos);
      } catch (err) {
        console.error("Error fetching videos for prerequisites:", err);
        toast({
          title: "Error",
          description: "Failed to fetch videos for prerequisites",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchVideos();

    // If editing an existing video, fetch its data
    if (editId) {
      fetchVideoData();
    } else {
      setIsLoading(false);
    }
  }, [editId]);

  const fetchVideoData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/videos/${editId}`
      );
      const videoData = response.data;

      // Set form fields with video data
      setTitle(videoData.title || "");
      setDescription(videoData.description || "");
      setCategory(videoData.category || "");
      setDifficultyLevel(videoData.difficultyLevel || "intermediate");
      setSequenceId(videoData.sequenceId || "");
      setSequencePosition(videoData.sequencePosition || 1);
      setLevel(videoData.level || 3);

      // Set original filename
      if (videoData.filePath) {
        const filename = videoData.filePath.split("/").pop();
        setOriginalFileName(filename);
      }

      // Set tags
      if (videoData.tags && videoData.tags.length > 0) {
        setTagArray(videoData.tags);
      }

      // Set prerequisites
      if (videoData.prerequisites && videoData.prerequisites.length > 0) {
        setPrerequisites(videoData.prerequisites);

        // Fetch prerequisite video details
        const prereqsDetails = [];
        for (const prereqId of videoData.prerequisites) {
          try {
            const prereqResponse = await axios.get(
              `http://localhost:5000/api/videos/${prereqId}`
            );
            prereqsDetails.push({
              id: prereqId,
              title: prereqResponse.data.title || "Unknown video",
            });
          } catch (error) {
            console.error(`Error fetching prerequisite ${prereqId}:`, error);
          }
        }

        setSelectedPrereqs(prereqsDetails);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching video data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch video data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTagsChange = (e) => {
    setTags(e.target.value);
  };

  const handleAddTag = () => {
    if (tags.trim()) {
      const newTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag && !tagArray.includes(tag));

      if (newTags.length > 0) {
        setTagArray([...tagArray, ...newTags]);
        setTags("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTagArray(tagArray.filter((tag) => tag !== tagToRemove));
  };

  const handlePrereqChange = (e) => {
    const videoId = e.target.value;
    if (videoId && !prerequisites.includes(videoId)) {
      const video = existingVideos.find((v) => v._id === videoId);
      if (video) {
        setPrerequisites([...prerequisites, videoId]);
        setSelectedPrereqs([
          ...selectedPrereqs,
          { id: videoId, title: video.title },
        ]);
      }
    }
  };

  const handleRemovePrereq = (prereqId) => {
    setPrerequisites(prerequisites.filter((id) => id !== prereqId));
    setSelectedPrereqs(selectedPrereqs.filter((p) => p.id !== prereqId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add basic video info
      if (file) {
        formData.append("video", file);
      }
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category || "general");
      formData.append("difficultyLevel", difficultyLevel);
      formData.append("isRecommendation", "false");

      // Add learning path info
      formData.append("sequenceId", sequenceId);
      formData.append("sequencePosition", sequencePosition);
      formData.append("level", level);
      formData.append("tags", tagArray.join(","));
      formData.append("prerequisites", JSON.stringify(prerequisites));

      let response;

      if (editId) {
        // Update existing video
        response = await axios.put(
          `http://localhost:5000/api/videos/${editId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          }
        );
        setMessage("Video updated successfully!");
      } else {
        // Create new video
        response = await axios.post(
          "http://localhost:5000/api/videos",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          }
        );
        setMessage("Video uploaded successfully!");
      }

      console.log(
        editId ? "Update successful:" : "Upload successful:",
        response.data
      );
      setUploadSuccess(true);

      toast({
        title: editId ? "Video updated" : "Video uploaded",
        description: editId
          ? "Your video has been updated successfully"
          : "Your video has been added to the learning library",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Navigate back to dashboard after short delay
      setTimeout(() => {
        navigate("/module-dashboard");
      }, 2000);
    } catch (err) {
      console.error(editId ? "Update failed:" : "Upload failed:", err);
      setMessage("Error: " + (err.response?.data?.message || err.message));

      toast({
        title: editId ? "Update failed" : "Upload failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="xl">
          Loading video data...
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
              {editId ? "Edit Video" : "Upload Video"}
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
        <Heading>{editId ? "Edit Video" : "Upload Learning Video"}</Heading>
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
            Video Details
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            {editId
              ? "Update information about this learning video"
              : "Provide information about the learning video"}
          </Text>

          <Divider mb={4} />

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Video Title</FormLabel>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                bg="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what students will learn from this video"
                minH="100px"
                bg="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select category"
                bg="white"
              >
                <option value="programming">Programming</option>
                <option value="database">Database</option>
                <option value="networking">Networking</option>
                <option value="security">Security</option>
              </Select>
              <FormHelperText>
                Choose the most relevant category for this video
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Video File</FormLabel>
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
                    <Badge>Original file</Badge>
                  </Flex>
                )}

                <Flex alignItems="center">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    display="none"
                    id="video-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="video-upload"
                    leftIcon={<HiUpload />}
                    colorScheme="blue"
                    variant="outline"
                    cursor="pointer"
                  >
                    {editId ? "Replace Video" : "Upload Video"}
                  </Button>
                  {file && (
                    <Text ml={4} fontSize="sm">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </Text>
                  )}
                </Flex>

                <FormHelperText>
                  {editId
                    ? "Upload a new file only if you want to replace the existing video"
                    : "Supported formats: MP4, WebM, MOV (max 500MB)"}
                </FormHelperText>
              </Flex>
            </FormControl>

            {isUploading && (
              <Box mt={2}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm">
                    {editId ? "Updating video..." : "Uploading video..."}
                  </Text>
                  <Text fontSize="sm">{uploadProgress}%</Text>
                </Flex>
                <Slider value={uploadProgress} isReadOnly colorScheme="blue">
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                </Slider>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Learning Path Section */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={6}
          mb={6}
          bg="white"
          boxShadow="sm"
        >
          <Heading as="h3" size="md" mb={2}>
            Learning Path Configuration
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            These settings help create personalized learning paths for students
          </Text>

          <Divider mb={4} />

          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Difficulty Level</FormLabel>
              <Select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                bg="white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Course/Sequence ID</FormLabel>
              <Input
                value={sequenceId}
                onChange={(e) => setSequenceId(e.target.value)}
                placeholder="E.g., 'javascript-basics' or 'network-security'"
                bg="white"
              />
              <FormHelperText>
                Group related videos together in a sequence
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Position in Sequence</FormLabel>
              <NumberInput
                value={sequencePosition}
                onChange={(valueString) =>
                  setSequencePosition(Number(valueString))
                }
                min={1}
                bg="white"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Order in which this video should be watched (1, 2, 3, etc.)
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Difficulty Level (1-5)</FormLabel>
              <Flex align="center">
                <Text mr={4} fontSize="sm">
                  1
                </Text>
                <Slider
                  value={level}
                  min={1}
                  max={5}
                  step={1}
                  onChange={(value) => setLevel(value)}
                  flex="1"
                  colorScheme="blue"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6}>
                    <Box color="blue.500" as={HiStar} />
                  </SliderThumb>
                </Slider>
                <Text ml={4} fontSize="sm">
                  5
                </Text>
              </Flex>
              <Flex justify="center" mt={2}>
                <Badge colorScheme="blue" fontSize="md">
                  Level {level}
                </Badge>
              </Flex>
              <FormHelperText textAlign="center">
                1: Beginner, 3: Intermediate, 5: Advanced
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Flex>
                <Input
                  value={tags}
                  onChange={handleTagsChange}
                  placeholder="E.g., algorithms, sorting (press Enter to add)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  bg="white"
                />
                <Button ml={2} onClick={handleAddTag} colorScheme="blue">
                  Add
                </Button>
              </Flex>
              <FormHelperText>
                Add topics and concepts covered in this video
              </FormHelperText>

              {tagArray.length > 0 && (
                <Flex mt={2} wrap="wrap" gap={2}>
                  {tagArray.map((tag, index) => (
                    <Tag
                      key={index}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </Flex>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Prerequisites</FormLabel>
              <Select
                placeholder="Select prerequisite videos"
                onChange={handlePrereqChange}
                value=""
                bg="white"
              >
                <option value="" disabled>
                  Select a video
                </option>
                {existingVideos
                  .filter((video) => !prerequisites.includes(video._id))
                  .map((video) => (
                    <option key={video._id} value={video._id}>
                      {video.title}
                    </option>
                  ))}
              </Select>
              <FormHelperText>
                Videos that should be watched before this one
              </FormHelperText>

              {selectedPrereqs.length > 0 && (
                <Stack mt={2} spacing={2}>
                  {selectedPrereqs.map((prereq, index) => (
                    <Flex
                      key={index}
                      p={2}
                      borderWidth="1px"
                      borderRadius="md"
                      justify="space-between"
                      align="center"
                      bg="gray.50"
                    >
                      <Text fontSize="sm">{prereq.title}</Text>
                      <IconButton
                        size="xs"
                        icon={<HiTrash />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleRemovePrereq(prereq.id)}
                        aria-label="Remove prerequisite"
                      />
                    </Flex>
                  ))}
                </Stack>
              )}
            </FormControl>
          </Stack>
        </Box>

        <Flex justify="space-between" alignItems="center" mb={8}>
          <Button
            onClick={() => navigate("/module-dashboard")}
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isUploading}
            loadingText={editId ? "Updating..." : "Uploading..."}
            disabled={isUploading}
            rightIcon={<HiUpload />}
            px={8}
          >
            {editId ? "Update Video" : "Upload Video"}
          </Button>
        </Flex>
      </form>

      {uploadSuccess && (
        <Box borderWidth="1px" borderRadius="lg" p={6} bg="green.50" mb={8}>
          <Heading as="h3" size="md" mb={2}>
            {editId ? "Update Complete" : "Upload Complete"}
          </Heading>
          <Text>
            {editId
              ? "Your video has been updated successfully and your changes have been saved."
              : "Your video has been uploaded successfully and added to the learning path system."}{" "}
            Students will now receive personalized recommendations based on
            their interactions.
          </Text>
        </Box>
      )}
    </Container>
  );
};

export default EditVideoUpload;
