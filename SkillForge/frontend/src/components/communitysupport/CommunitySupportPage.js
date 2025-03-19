// frontend/src/components/communitysupport/CommunitySupportPage.js
import React from 'react';
import { Container, Heading, Box } from '@chakra-ui/react';
import QuestionList from './QuestionList';

function CommunitySupportPage() {
    return (
        <Container
            maxW="container.xl"
            paddingY="8"
            bg="gray.50"
            minHeight="calc(100vh - 80px)"
            paddingTop="100px"  // ADD paddingTop HERE to push content below navbar
        >
            <Box
                textAlign="center"
                mb="8"
            >
                <Heading
                    as="h1"
                    size="2xl"
                    fontWeight="bold"
                    color="blue.600"
                    marginBottom="2"
                >
                    Community Support Page
                </Heading>
                <Heading
                    as="h3"
                    size="md"
                    fontWeight="medium"
                    color="gray.500"
                >
                    Explore questions and get help from the community.
                </Heading>
            </Box>

            <QuestionList />
        </Container>
    );
}

export default CommunitySupportPage;