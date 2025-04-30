// src/components/ResultsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    SimpleGrid, // For layout
    Stat,       // For displaying stats (can be used inside Card)
    StatLabel,
    StatNumber,
    Button,
    Icon,
    Spinner,    // For loading indicator
    Fade,       // For animation
    Card,       // Card component for better structure
    CardHeader,
    CardBody,
    Center      // Utility for centering
} from '@chakra-ui/react';
// Using generic icons as placeholders, replace if needed
import { IoArrowBack, IoBodyOutline, IoSquareOutline, IoEllipseOutline, IoTriangleOutline } from 'react-icons/io5';

// Accept onNavigate and results data as props
function ResultsPage({ onNavigate, results }) {
    // State to manage loading indicator
    const [isLoading, setIsLoading] = useState(true);

    // Simulate calculation delay when the component mounts
    useEffect(() => {
        console.log("ResultsPage mounted, starting calculation simulation...");
        const timer = setTimeout(() => {
            console.log("Calculation simulation finished.");
            setIsLoading(false); // Hide loader, show results
        }, 1500); // Simulate 1.5 seconds delay

        // Cleanup function to clear the timer if the component unmounts early
        return () => clearTimeout(timer);
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function to go back to the HEIGHT INPUT page
    const handleStartOver = () => {
        console.log("Start Over clicked, navigating to HEIGHT_INPUT");
        onNavigate('HEIGHT_INPUT');
    };

    // Helper to display measurements or 'N/A'
    const displayMeasurement = (value) => {
        const numValue = parseFloat(value);
        return value !== undefined && value !== null && value !== 'N/A' && !isNaN(numValue)
            ? `${numValue.toFixed(1)} in` // Display with one decimal place
            : 'N/A';
    };

    // Simple mapping for icons (example)
    const measurementIcons = {
        Waist: IoEllipseOutline,
        Hip: IoSquareOutline,
        Thigh: IoTriangleOutline,
        BustChest: IoBodyOutline,
    };

    return (
        <Container maxW="container.md" py={{ base: 8, md: 12 }}>
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl" textAlign="center" color="teal.600">
                    {/* Change heading based on loading state */}
                    {isLoading ? "Calculating Measurements..." : "Your Estimated Measurements"}
                </Heading>

                {/* Conditional Rendering: Show Loader or Results */}
                {isLoading ? (
                    // Loading State UI
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Spinner
                                thickness='4px'
                                speed='0.65s'
                                emptyColor='gray.200'
                                color='teal.500'
                                size='xl'
                            />
                            <Text fontSize="lg" color="gray.500">
                                Analyzing for best results confidence...
                            </Text>
                        </VStack>
                    </Center>
                ) : (
                    // Results Display UI (wrapped in Fade for animation)
                    <Fade in={!isLoading}>
                        <VStack spacing={8} align="stretch">
                            <Text textAlign="center" fontSize="lg" color="gray.600">
                                Based on your height of {results?.height || 'N/A'} cm and captured pose.
                            </Text>

                            {/* Use SimpleGrid for responsive layout of stats */}
                            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                                {/* Map over the measurement types we expect */}
                                {['Waist', 'Hip', 'Thigh', 'BustChest'].map((measurementType) => (
                                    // Use Card for better visual grouping
                                    <Card key={measurementType} variant="outline" size="lg" textAlign="center">
                                        <CardHeader pb={0}> {/* Remove bottom padding from header */}
                                            <Icon
                                                as={measurementIcons[measurementType] || IoBodyOutline}
                                                w={10} h={10} // Slightly larger icon
                                                color="teal.500"
                                            />
                                        </CardHeader>
                                        <CardBody>
                                            <Stat>
                                                <StatLabel fontSize="md" color="gray.500" mb={1}>{measurementType}</StatLabel>
                                                <StatNumber fontSize="2xl">
                                                    {displayMeasurement(results?.[measurementType])}
                                                </StatNumber>
                                            </Stat>
                                        </CardBody>
                                    </Card>
                                ))}
                            </SimpleGrid>

                            <Text textAlign="center" fontSize="sm" color="gray.500" mt={4}>
                                Note: These are estimations based on general data and simulated pose capture.
                            </Text>

                            <Button
                                colorScheme="teal"
                                size="lg"
                                onClick={handleStartOver}
                                alignSelf="center"
                                mt={6}
                                leftIcon={<IoArrowBack />}
                            >
                                Start Over (Enter Height)
                            </Button>
                        </VStack>
                    </Fade>
                )}
            </VStack>
        </Container>
    );
}

export default ResultsPage;
