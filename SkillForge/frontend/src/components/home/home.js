import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Button, SimpleGrid, Card, CardBody, CardFooter, Image, Stack, Heading, Text, Spinner } from '@chakra-ui/react'
import { API_GET_ALL_COURSES, API_GET_USERS_BY_USERID, baseUrl_auth, baseUrl_course } from '../../constant/apiConstant';
import { COURSE_CARD_IMAGE, COURSE_CARD_LOGO } from '../../constant/imageConstant';
import { Link } from 'react-router-dom';
import { NAVIGATE_TO_REGISTER } from '../../constant/routeConstant';
import { PAGE_SPINNER_LOADING } from '../../constant/timeConstant';
import LoadingSpinner from '../spinner/spinner';

export default function Home() {
  const [courseDetails, setCourseDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const authToken = Cookies.get('authToken');
        const response = await axios.get(`${baseUrl_course}${API_GET_ALL_COURSES}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json',
          },
        });

        const coursesWithInstructors = await Promise.all(
          response.data.map(async course => {
            const instructorResponse = await axios.get(`${baseUrl_auth}${API_GET_USERS_BY_USERID}/${course.instructor}`, {
              headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json',
              },
            });
            const instructorName = instructorResponse.data.username;
            return { ...course, instructorName };
          })
        );
        setCourseDetails(coursesWithInstructors);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course details:', error.response.data);
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, []);

  return (
    <div>
      <div className='home-container'>
        <div className='content'>
          <div className='text'>
            <h1 style={{ fontSize: '75px', fontWeight: 'bold' }}>Learn without limits</h1>
            <p>Start, switch, or advance your career with more than 6,900 courses, Professional Certificates, and degrees from world-class universities and companies.</p>
            <div className="buttons">
              <Link to={NAVIGATE_TO_REGISTER}>
                <Button bg='#0056d2' color='white' variant='solid' borderRadius='4px' size='lg' style={{ marginRight: '10px', marginTop: '10px' }}>
                  Join for free
                </Button>
              </Link>
              <Button bg='white' color='#0056d2' borderColor='#0056d2' variant='outline' borderRadius='4px' size='lg' style={{ marginRight: '10px', marginTop: '10px' }}>
                Try Learnopia for Business
              </Button>
            </div>
          </div>
          <div className='image'>
            <img src='images/Home-image.png' alt='Your Image' width='420' />
          </div>
        </div>
      </div>

      <div className='heading-container' style={{ paddingBottom: '40px' }}>
        {/* Explore More Section */}
      <div className='extra-tiles' style={{ marginTop: '50px', textAlign: 'center' }}>
        <Heading size='lg' color='#0056d2' mb='6'>Explore More</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {[{
            title: 'Game-Based Learning',
            description: 'Engage in interactive learning with fun challenges.',
            image: 'images/Game.jpg',
            link: '/game-learning'
          }, {
            title: 'Module Page',
            description: 'Explore structured learning modules.',
            image: 'images/module-page.jpg',
            link: '/modules'
          }, {
            title: 'Interview Practice',
            description: 'Prepare for real-world interviews with AI feedback.',
            image: 'images/interview-practice.jpg',
            link: '/interview'
          }].map(tile => (
            <Card key={tile.title} boxShadow="xl" borderRadius="20px"
              _hover={{ transform: 'scale(1.05)', transition: '0.3s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              <CardBody>
                <Image src={tile.image} alt={tile.title} borderRadius="lg" />
                <Stack mt="4" spacing="3">
                  <Heading size="md">{tile.title}</Heading>
                  <Text color='gray.600'>{tile.description}</Text>
                </Stack>
              </CardBody>
              <CardFooter>
                <Button as={Link} to={tile.link} colorScheme="blue">Explore</Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </div>
      </div>

      <div className='card-container'>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <Spinner size="xl" color="blue.500" />
          </div>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {courseDetails.map(course => (
              <Card key={course.id} maxW="sm" borderRadius="20px" boxShadow="0 0 0 1px #c7c7c7"
                _hover={{ boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", transform: 'scale(1.05)', transition: '0.3s' }}>
                <CardBody>
                  <Image src={COURSE_CARD_IMAGE} alt={course.name} borderRadius="lg" />
                  <Stack mt="6" spacing="3">
                    <div className="card-body d-flex align-items-center">
                      <img src={COURSE_CARD_LOGO} className="card-logo-top img-with-border" alt="..." />
                      <h6 style={{ color: "gray", fontWeight: 400, fontSize: 15, marginLeft: "10px" }}>{course.instructorName}</h6>
                    </div>
                    <Heading size="md">{course.title}</Heading>
                    <Text noOfLines={3} overflow="hidden" textOverflow="ellipsis" color='grey'>{course.description}</Text>
                  </Stack>
                </CardBody>
                <CardFooter>
                  <Button as={Link} to={`/coursepage?id=${course._id}`} colorScheme="blue">
                    Explore
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </div>
    </div>
  );
}
