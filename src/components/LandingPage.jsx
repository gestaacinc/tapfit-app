import React from 'react';
import logoImage from '../assets/body_measurement.png';

// Import Chakra UI components
import {
    Box,
    VStack, // Vertical stack layout component
    Heading,
    Text,
    Button,
    Image // Chakra's Image component
} from '@chakra-ui/react';

// src/components/LandingPage.jsx
// ... (imports remain as above) ...

function LandingPage({ onNavigate }) {
    const handleStartClick = () => {
        console.log("Start button clicked! Navigating...");
        onNavigate('INSTRUCTIONS');
    };

    // Use Chakra components and style props
    return (
        // Box is a generic div container
        <Box textAlign="center" p={8} minHeight="80vh" display="flex" alignItems="center" justifyContent="center">
            {/* VStack stacks elements vertically with spacing */}
            <VStack spacing={6} /* Adds space between child elements */ >
                <Image src={logoImage} alt="TapFit Logo" boxSize="100px" /* Sets width and height */ />

                {/* Heading component with size prop */}
                <Heading as="h1" size="2xl">
                    Welcome to TapFit!
                </Heading>

                {/* Text component */}
                <Text fontSize="lg" maxWidth="450px" color="gray.600">
                    Get ready to capture your pose and see relevant measurements.
                </Text>

                {/* Button component with color scheme and size */}
                <Button colorScheme="blue" size="lg" onClick={handleStartClick}>
                    Start
                </Button>
            </VStack>
        </Box>
    );
}

export default LandingPage;