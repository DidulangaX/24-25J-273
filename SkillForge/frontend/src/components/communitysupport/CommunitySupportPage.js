// frontend/src/components/communitysupport/CommunitySupportPage.js
import React from 'react';
import { Container, Heading } from '@chakra-ui/react';
import QuestionList from './QuestionList'; // Import QuestionList here

function CommunitySupportPage() {
    console.log("CommunitySupportPage is rendering!"); // ADD THIS LINE

    return (
        <Container maxW="container.xl" paddingY="8">
            <Heading as="h1" size="2xl" textAlign="center" marginBottom="6">
                Welcome to the Community Support Forum
            </Heading>
            <Heading as="h3" size="md" textAlign="center" color="gray.500" marginBottom="4">
                Explore questions and get help from the community.
            </Heading>
            {console.log("About to render QuestionList!")} {/* ADD THIS LINE */}
            <QuestionList /> {/* Include the QuestionList component */}
        </Container>
    );
}

export default CommunitySupportPage;