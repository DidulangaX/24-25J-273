// src/components/admin/VideoUpload.js
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
  Text,
  Badge,
  Alert,
  AlertIcon,
  FormHelperText,
  Divider,
  Progress,
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
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import { FaStar } from "react-icons/fa";

const VideoUpload = () => {
  // Original state variables
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // New state variables for enhanced learning path
  const [sequenceId, setSequenceId] = useState("");
  const [sequencePosition, setSequencePosition] = useState(1);
  const [level, setLevel] = useState(3); // Numeric difficulty level (1-5)
  const [tags, setTags] = useState("");
  const [tagArray, setTagArray] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [prerequisites, setPrerequisites] = useState([]);
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);

  const toast = useToast();

  // Fetch existing videos for prerequisites selection
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videos");
        setExistingVideos(response.data || []);
      } catch (err) {
        console.error("Error fetching videos for prerequisites:", err);
      }
    };
    fetchVideos();
  }, []);

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

    if (!file || !title) {
      setMessage("Error: Please select a file and enter a title");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();

      // Add basic video info
      formData.append("video", file);
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

      const response = await axios.post(
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

      console.log("Upload successful:", response.data);
      setMessage("Video uploaded successfully!");
      setUploadSuccess(true);

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setDifficultyLevel("intermediate");
      setSequenceId("");
      setSequencePosition(1);
      setLevel(3);
      setTags("");
      setTagArray([]);
      setPrerequisites([]);
      setSelectedPrereqs([]);

      toast({
        title: "Video uploaded successfully",
        description: "Your video has been added to the learning library",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("Error: " + (err.response?.data?.message || err.message));

      toast({
        title: "Upload failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box maxW="1200px" mx="auto" p={4} pt={20}>
      <Heading as="h2" mb={6}>
        Upload Learning Video
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
            Video Details
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Provide information about the learning video
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
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what students will learn from this video"
                minH="100px"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select category"
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

            <FormControl isRequired>
              <FormLabel>Video File</FormLabel>
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
                  variant="outline"
                  cursor="pointer"
                >
                  Upload Video
                </Button>
                {file && (
                  <Text ml={4} fontSize="sm">
                    {file.name}
                  </Text>
                )}
              </Flex>
              <FormHelperText>
                Supported formats: MP4, WebM, MOV (max 500MB)
              </FormHelperText>
            </FormControl>

            {isUploading && (
              <Box mt={2}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm">Uploading video...</Text>
                  <Text fontSize="sm">{uploadProgress}%</Text>
                </Flex>
                <Progress
                  value={uploadProgress}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="md"
                />
              </Box>
            )}
          </Stack>
        </Box>

        {/* New Learning Path Section */}
        <Box borderWidth="1px" borderRadius="lg" p={6} mb={6}>
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
              <Slider
                value={level}
                min={1}
                max={5}
                step={1}
                onChange={(value) => setLevel(value)}
                mb={2}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={6}>
                  <Box color="blue.500" as={FaStar} />
                </SliderThumb>
              </Slider>
              <Flex justify="space-between">
                <Text fontSize="sm">Beginner (1)</Text>
                <Text fontSize="sm">Advanced (5)</Text>
              </Flex>
              <Text fontSize="md" fontWeight="medium" textAlign="center" mt={1}>
                Level: {level}
              </Text>
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
                />
                <Button ml={2} onClick={handleAddTag}>
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
                    >
                      <Text fontSize="sm">{prereq.title}</Text>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleRemovePrereq(prereq.id)}
                      >
                        Remove
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </FormControl>
          </Stack>
        </Box>

        <Flex justify="space-between" alignItems="center">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isUploading}
            loadingText="Uploading..."
            mb={8}
            disabled={!file}
          >
            Upload Video
          </Button>

          {file && !isUploading && (
            <Flex alignItems="center" mb={8}>
              <Badge colorScheme="blue" mr={2}>
                Selected:
              </Badge>
              <Text fontSize="sm" color="gray.600">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </Text>
            </Flex>
          )}
        </Flex>
      </form>

      {uploadSuccess && (
        <Box borderWidth="1px" borderRadius="lg" p={6} bg="green.50">
          <Heading as="h3" size="md" mb={2}>
            Upload Complete
          </Heading>
          <Text>
            Your video has been uploaded successfully and added to the learning
            path system. Students will now receive personalized recommendations
            based on their interactions.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default VideoUpload;
