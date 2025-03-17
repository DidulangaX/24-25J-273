// src/components/admin/ModuleDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  HStack,
  Stack,
  Container,
  Spinner,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from "@chakra-ui/react";
import {
  HiDotsVertical,
  HiPlus,
  HiPencil,
  HiTrash,
  HiVideoCamera,
  HiDocument,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiCalendar,
  HiClock,
  HiTag,
  HiOutlineFilter,
} from "react-icons/hi";

const ModuleDashboard = () => {
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const toast = useToast();
  const navigate = useNavigate();

  // Delete confirmation dialog
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteItemId, setDeleteItemId] = useState("");
  const [deleteItemType, setDeleteItemType] = useState("");
  const cancelRef = React.useRef();

  // Filter visibility
  const { isOpen: isFilterOpen, onToggle: onFilterToggle } = useDisclosure({
    defaultIsOpen: true,
  });

  useEffect(() => {
    fetchVideos();
    fetchResources();
  }, []);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/videos");
      setVideos(response.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error fetching videos",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      setIsLoading(true);

      // Get all resources using the main endpoint
      const response = await axios.get("http://localhost:5000/api/resources");

      setResources(response.data);
      console.log("Resources loaded:", response.data.length);
    } catch (error) {
      console.error("Error fetching resources:", error);

      try {
        // Fallback: Get resources with "all" difficulty level
        const fallbackResponse = await axios.get(
          "http://localhost:5000/api/resources/all"
        );
        setResources(fallbackResponse.data);
        console.log(
          "Resources loaded via difficulty fallback:",
          fallbackResponse.data.length
        );
      } catch (fallbackError) {
        console.error("Fallback resource fetch failed:", fallbackError);
        toast({
          title: "Error fetching resources",
          description:
            "Could not load resources. Please ensure your API endpoints are configured correctly.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });

        // Set empty resources to prevent UI from showing loading indefinitely
        setResources([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteItemType === "video") {
        await axios.delete(`http://localhost:5000/api/videos/${deleteItemId}`);
        setVideos(videos.filter((video) => video._id !== deleteItemId));
        toast({
          title: "Video deleted",
          description: "The video has been successfully removed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (deleteItemType === "resource") {
        // Updated endpoint for resource deletion
        await axios.delete(
          `http://localhost:5000/api/resources/${deleteItemId}`
        );
        setResources(
          resources.filter((resource) => resource._id !== deleteItemId)
        );
        toast({
          title: "Resource deleted",
          description: "The resource has been successfully removed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error deleting item",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  const handleDelete = (id, type) => {
    setDeleteItemId(id);
    setDeleteItemType(type);
    onDeleteOpen();
  };

  const handleEdit = (id, type) => {
    if (type === "video") {
      // Navigate to VideoUpload with prefilled data for editing
      navigate(`/edit-video/${id}`);
    } else if (type === "resource") {
      // Navigate to ResourceUpload with prefilled data for editing
      navigate(`/edit-resource/${id}`);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter videos based on search term and filters
  const filteredVideos = videos.filter((video) => {
    return (
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" || video.category === categoryFilter) &&
      (difficultyFilter === "" || video.difficultyLevel === difficultyFilter)
    );
  });

  // Filter resources based on search term
  const filteredResources = resources.filter((resource) => {
    return (
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (difficultyFilter === "" || resource.recommendedFor === difficultyFilter)
    );
  });

  // Pagination for videos
  const indexOfLastVideo = currentPage * itemsPerPage;
  const indexOfFirstVideo = indexOfLastVideo - itemsPerPage;
  const currentVideos = filteredVideos.slice(
    indexOfFirstVideo,
    indexOfLastVideo
  );
  const totalVideoPages = Math.ceil(filteredVideos.length / itemsPerPage);

  // Pagination for resources
  const indexOfLastResource = currentPage * itemsPerPage;
  const indexOfFirstResource = indexOfLastResource - itemsPerPage;
  const currentResources = filteredResources.slice(
    indexOfFirstResource,
    indexOfLastResource
  );
  const totalResourcePages = Math.ceil(filteredResources.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render pagination controls
  const renderPagination = (totalPages) => {
    return (
      <Flex justify="center" mt={6} align="center">
        <Button
          size="sm"
          leftIcon={<HiChevronLeft />}
          onClick={() => paginate(currentPage - 1)}
          isDisabled={currentPage === 1}
          mr={2}
        >
          Prev
        </Button>

        <HStack spacing={1}>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              size="sm"
              colorScheme={currentPage === i + 1 ? "blue" : "gray"}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </HStack>

        <Button
          size="sm"
          rightIcon={<HiChevronRight />}
          onClick={() => paginate(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          ml={2}
        >
          Next
        </Button>
      </Flex>
    );
  };

  return (
    <Container maxW="1200px" mx="auto" p={4} pt={20}>
      <Box mb={8} borderRadius="lg" p={6} bg="white" boxShadow="sm">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "start", md: "center" }}
          mb={6}
        >
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Learning Content Dashboard
            </Heading>
            <Text color="gray.600">
              Manage your videos and resources in one place
            </Text>
          </Box>
        </Flex>
      </Box>

      <Tabs
        variant="enclosed"
        colorScheme="blue"
        mb={8}
        boxShadow="sm"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
      >
        <TabList bg="gray.50" borderTopRadius="lg" p={1}>
          <Tab
            _selected={{
              color: "blue.700",
              bg: "white",
              fontWeight: "semibold",
              boxShadow: "sm",
            }}
            px={6}
            py={3}
          >
            <HStack spacing={2}>
              <HiVideoCamera />
              <Text>Videos</Text>
            </HStack>
          </Tab>
          <Tab
            _selected={{
              color: "blue.700",
              bg: "white",
              fontWeight: "semibold",
              boxShadow: "sm",
            }}
            px={6}
            py={3}
          >
            <HStack spacing={2}>
              <HiDocument />
              <Text>Resources</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Videos Panel */}
          <TabPanel p={6}>
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              mb={6}
              gap={4}
            >
              <Button
                as={Link}
                to="/upload-video"
                leftIcon={<HiPlus />}
                colorScheme="blue"
                size="md"
                boxShadow="sm"
                px={6}
              >
                Add New Video
              </Button>

              <Flex flex={1} justify="flex-end" wrap="wrap" gap={3}>
                <InputGroup maxW="280px">
                  <InputLeftElement pointerEvents="none">
                    <HiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    boxShadow="sm"
                  />
                </InputGroup>

                <Tooltip label={isFilterOpen ? "Hide filters" : "Show filters"}>
                  <IconButton
                    icon={<HiOutlineFilter />}
                    aria-label="Toggle filters"
                    onClick={onFilterToggle}
                    variant="outline"
                    colorScheme="blue"
                  />
                </Tooltip>
              </Flex>
            </Flex>

            {isFilterOpen && (
              <Flex
                bg="gray.50"
                p={4}
                borderRadius="md"
                mb={6}
                align="center"
                wrap="wrap"
                gap={4}
              >
                <Text fontWeight="medium" minW="100px">
                  Filters:
                </Text>
                <Select
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  w={{ base: "full", sm: "auto" }}
                  minW="160px"
                  bg="white"
                  boxShadow="sm"
                >
                  <option value="">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="database">Database</option>
                  <option value="networking">Networking</option>
                  <option value="security">Security</option>
                </Select>
                <Select
                  placeholder="Difficulty"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  w={{ base: "full", sm: "auto" }}
                  minW="160px"
                  bg="white"
                  boxShadow="sm"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                {(categoryFilter || difficultyFilter || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter("");
                      setDifficultyFilter("");
                      setSearchTerm("");
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Flex>
            )}

            {isLoading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="blue.500" thickness="4px" />
              </Flex>
            ) : filteredVideos.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                bg="gray.50"
                borderRadius="lg"
                p={10}
                textAlign="center"
                h="300px"
              >
                <HiVideoCamera size={48} color="#CBD5E0" />
                <Heading size="md" mt={4} mb={2} color="gray.700">
                  No videos found
                </Heading>
                <Text color="gray.500" maxW="400px">
                  {searchTerm || categoryFilter || difficultyFilter
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Add your first video to get started with your learning content."}
                </Text>
                {(searchTerm || categoryFilter || difficultyFilter) && (
                  <Button
                    mt={4}
                    variant="outline"
                    onClick={() => {
                      setCategoryFilter("");
                      setDifficultyFilter("");
                      setSearchTerm("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Flex>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {currentVideos.map((video) => (
                    <Card
                      key={video._id}
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="md"
                      h="100%"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-4px)",
                        boxShadow: "lg",
                      }}
                    >
                      <Box bg="blue.50" h="120px" position="relative">
                        <Flex
                          position="absolute"
                          top={0}
                          left={0}
                          w="full"
                          h="full"
                          bg="blue.500"
                          opacity={0.1}
                          justify="center"
                          align="center"
                        >
                          <HiVideoCamera size={40} />
                        </Flex>
                        <Box position="absolute" top={2} right={2}>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<HiDotsVertical />}
                              variant="solid"
                              size="sm"
                              bg="white"
                              color="gray.700"
                              _hover={{ bg: "gray.100" }}
                              aria-label="Options"
                            />
                            <MenuList shadow="lg">
                              <MenuItem
                                icon={<HiPencil />}
                                onClick={() => handleEdit(video._id, "video")}
                              >
                                Edit
                              </MenuItem>
                              <MenuItem
                                icon={<HiTrash />}
                                onClick={() => handleDelete(video._id, "video")}
                                color="red.500"
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </Box>

                      <CardBody p={5}>
                        <Heading
                          size="md"
                          noOfLines={1}
                          title={video.title}
                          mb={3}
                          color="gray.800"
                        >
                          {video.title}
                        </Heading>

                        <Text
                          noOfLines={2}
                          color="gray.600"
                          fontSize="sm"
                          mb={3}
                          title={video.description}
                        >
                          {video.description || "No description provided"}
                        </Text>

                        <Stack spacing={3} mt={4}>
                          <Flex gap={2} wrap="wrap">
                            <Badge
                              colorScheme="blue"
                              borderRadius="full"
                              px={2}
                              py={0.5}
                            >
                              {video.category}
                            </Badge>
                            <Badge
                              colorScheme="purple"
                              borderRadius="full"
                              px={2}
                              py={0.5}
                            >
                              {video.difficultyLevel}
                            </Badge>
                            {video.level && (
                              <Badge
                                colorScheme="orange"
                                borderRadius="full"
                                px={2}
                                py={0.5}
                              >
                                Level {video.level}
                              </Badge>
                            )}
                          </Flex>

                          {video.sequenceId && (
                            <Text fontSize="xs" color="gray.500">
                              <HiTag
                                style={{
                                  display: "inline",
                                  marginRight: "4px",
                                }}
                              />
                              Sequence: {video.sequenceId} (Pos:{" "}
                              {video.sequencePosition})
                            </Text>
                          )}

                          <Text fontSize="xs" color="gray.500">
                            <HiCalendar
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            Added: {getFormattedDate(video.createdAt)}
                          </Text>
                        </Stack>
                      </CardBody>

                      <CardFooter p={0} borderTop="1px" borderColor="gray.100">
                        <SimpleGrid columns={2} width="100%">
                          <Button
                            width="100%"
                            variant="ghost"
                            colorScheme="blue"
                            leftIcon={<HiPencil />}
                            onClick={() => handleEdit(video._id, "video")}
                            borderRadius={0}
                            py={3}
                          >
                            Edit
                          </Button>

                          <Button
                            width="100%"
                            variant="ghost"
                            colorScheme="blue"
                            leftIcon={<HiVideoCamera />}
                            onClick={() =>
                              navigate(`/module-page/${video._id}`)
                            }
                            borderRadius={0}
                            py={3}
                            borderLeft="1px"
                            borderColor="gray.100"
                          >
                            View
                          </Button>
                        </SimpleGrid>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>

                {totalVideoPages > 1 && renderPagination(totalVideoPages)}
              </>
            )}
          </TabPanel>

          {/* Resources Panel */}
          <TabPanel p={6}>
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              mb={6}
              gap={4}
            >
              <Button
                as={Link}
                to="/upload-resource"
                leftIcon={<HiPlus />}
                colorScheme="green"
                size="md"
                boxShadow="sm"
                px={6}
              >
                Add New Resource
              </Button>

              <Flex flex={1} justify="flex-end" wrap="wrap" gap={3}>
                <InputGroup maxW="280px">
                  <InputLeftElement pointerEvents="none">
                    <HiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    boxShadow="sm"
                  />
                </InputGroup>

                <Tooltip label={isFilterOpen ? "Hide filters" : "Show filters"}>
                  <IconButton
                    icon={<HiOutlineFilter />}
                    aria-label="Toggle filters"
                    onClick={onFilterToggle}
                    variant="outline"
                    colorScheme="green"
                  />
                </Tooltip>
              </Flex>
            </Flex>

            {isFilterOpen && (
              <Flex
                bg="gray.50"
                p={4}
                borderRadius="md"
                mb={6}
                align="center"
                wrap="wrap"
                gap={4}
              >
                <Text fontWeight="medium" minW="100px">
                  Filters:
                </Text>
                <Select
                  placeholder="Difficulty"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  w={{ base: "full", sm: "auto" }}
                  minW="160px"
                  bg="white"
                  boxShadow="sm"
                >
                  <option value="">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="justright">Just Right</option>
                  <option value="difficult">Difficult</option>
                </Select>
                {(difficultyFilter || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDifficultyFilter("");
                      setSearchTerm("");
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Flex>
            )}

            {isLoading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" color="green.500" thickness="4px" />
              </Flex>
            ) : filteredResources.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                bg="gray.50"
                borderRadius="lg"
                p={10}
                textAlign="center"
                h="300px"
              >
                <HiDocument size={48} color="#CBD5E0" />
                <Heading size="md" mt={4} mb={2} color="gray.700">
                  No resources found
                </Heading>
                <Text color="gray.500" maxW="400px">
                  {searchTerm || difficultyFilter
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Add your first resource to get started with your learning materials."}
                </Text>
                {(searchTerm || difficultyFilter) && (
                  <Button
                    mt={4}
                    variant="outline"
                    onClick={() => {
                      setDifficultyFilter("");
                      setSearchTerm("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Flex>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {currentResources.map((resource) => (
                    <Card
                      key={resource._id}
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="md"
                      h="100%"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-4px)",
                        boxShadow: "lg",
                      }}
                    >
                      <Box
                        bg={
                          resource.type === "pdf"
                            ? "red.50"
                            : resource.type === "link"
                            ? "purple.50"
                            : "green.50"
                        }
                        h="120px"
                        position="relative"
                      >
                        <Flex
                          position="absolute"
                          top={0}
                          left={0}
                          w="full"
                          h="full"
                          bg={
                            resource.type === "pdf"
                              ? "red.500"
                              : resource.type === "link"
                              ? "purple.500"
                              : "green.500"
                          }
                          opacity={0.1}
                          justify="center"
                          align="center"
                        >
                          <HiDocument size={40} />
                        </Flex>
                        <Box position="absolute" top={2} right={2}>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<HiDotsVertical />}
                              variant="solid"
                              size="sm"
                              bg="white"
                              color="gray.700"
                              _hover={{ bg: "gray.100" }}
                              aria-label="Options"
                            />
                            <MenuList shadow="lg">
                              <MenuItem
                                icon={<HiPencil />}
                                onClick={() =>
                                  handleEdit(resource._id, "resource")
                                }
                              >
                                Edit
                              </MenuItem>
                              <MenuItem
                                icon={<HiTrash />}
                                onClick={() =>
                                  handleDelete(resource._id, "resource")
                                }
                                color="red.500"
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </Box>

                      <CardBody p={5}>
                        <Heading
                          size="md"
                          noOfLines={1}
                          title={resource.title}
                          mb={3}
                          color="gray.800"
                        >
                          {resource.title}
                        </Heading>

                        <Text
                          noOfLines={2}
                          color="gray.600"
                          fontSize="sm"
                          mb={3}
                          title={resource.description}
                        >
                          {resource.description || "No description provided"}
                        </Text>

                        <Stack spacing={3} mt={4}>
                          <Flex gap={2} wrap="wrap">
                            <Badge
                              colorScheme={
                                resource.type === "pdf"
                                  ? "red"
                                  : resource.type === "link"
                                  ? "purple"
                                  : "green"
                              }
                              borderRadius="full"
                              px={2}
                              py={0.5}
                            >
                              {resource.type?.charAt(0).toUpperCase() +
                                resource.type?.slice(1)}
                            </Badge>

                            {resource.recommendedFor && (
                              <Badge
                                colorScheme="blue"
                                borderRadius="full"
                                px={2}
                                py={0.5}
                              >
                                {resource.recommendedFor
                                  .charAt(0)
                                  .toUpperCase() +
                                  resource.recommendedFor.slice(1)}
                              </Badge>
                            )}

                            {resource.videoId && (
                              <Badge
                                colorScheme="teal"
                                borderRadius="full"
                                px={2}
                                py={0.5}
                              >
                                With Video
                              </Badge>
                            )}
                          </Flex>

                          {resource.sectionStart && resource.sectionEnd && (
                            <Text fontSize="xs" color="gray.500">
                              <HiClock
                                style={{
                                  display: "inline",
                                  marginRight: "4px",
                                }}
                              />
                              Section: {formatTime(resource.sectionStart)} -{" "}
                              {formatTime(resource.sectionEnd)}
                            </Text>
                          )}

                          <Text fontSize="xs" color="gray.500">
                            <HiCalendar
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            Added: {getFormattedDate(resource.createdAt)}
                          </Text>
                        </Stack>
                      </CardBody>

                      <CardFooter p={0} borderTop="1px" borderColor="gray.100">
                        <SimpleGrid columns={2} width="100%">
                          <Button
                            width="100%"
                            variant="ghost"
                            colorScheme="green"
                            leftIcon={<HiPencil />}
                            onClick={() => handleEdit(resource._id, "resource")}
                            borderRadius={0}
                            py={3}
                          >
                            Edit
                          </Button>

                          {resource.videoId ? (
                            <Button
                              width="100%"
                              variant="ghost"
                              colorScheme="teal"
                              leftIcon={<HiVideoCamera />}
                              onClick={() =>
                                navigate(`/module-page/${resource.videoId}`)
                              }
                              borderRadius={0}
                              py={3}
                              borderLeft="1px"
                              borderColor="gray.100"
                            >
                              View Video
                            </Button>
                          ) : (
                            <Button
                              width="100%"
                              variant="ghost"
                              colorScheme="green"
                              leftIcon={<HiDocument />}
                              onClick={() =>
                                handleEdit(resource._id, "resource")
                              }
                              borderRadius={0}
                              py={3}
                              borderLeft="1px"
                              borderColor="gray.100"
                            >
                              View Details
                            </Button>
                          )}
                        </SimpleGrid>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>

                {totalResourcePages > 1 && renderPagination(totalResourcePages)}
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="lg">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {deleteItemType === "video" ? "Video" : "Resource"}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this {deleteItemType}? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} variant="outline">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                leftIcon={<HiTrash />}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default ModuleDashboard;
