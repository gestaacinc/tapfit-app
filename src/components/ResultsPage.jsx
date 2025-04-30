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
// Import more icons if needed, or use defaults
import {
    IoArrowBack, IoBodyOutline, IoSquareOutline, IoEllipseOutline, IoTriangleOutline,
    IoScanOutline, // Generic icon for placeholders
    IoPersonOutline, IoResizeOutline, IoCutOutline, IoShirtOutline, IoHandLeftOutline, IoWalkOutline, IoManOutline
} from 'react-icons/io5';

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
        // Check for undefined, null, 'N/A', or NaN before formatting
        return value !== undefined && value !== null && value !== 'N/A' && !isNaN(numValue)
            ? `${numValue.toFixed(1)} in` // Display with one decimal place
            : 'N/A';
    };

    // --- Define ALL measurement types to display ---
    const measurementTypes = [
        'Waist', 'Hip', 'Thigh',
        'Shoulder', 'ApexHeight', 'ApexDistance', 'FullLength',
        'SleeveLength', 'LowerArmGirth', 'BodyFigure', // Assuming BodyFigure replaced BustChest
        'Knee', 'Crotch', 'Bottomline'
        // Add 'BustChest' here if it still exists alongside BodyFigure
    ];

    // --- Update icons for new types (using placeholders) ---
    const measurementIcons = {
        Waist: IoEllipseOutline,
        Hip: IoSquareOutline,
        Thigh: IoTriangleOutline,
        BustChest: IoBodyOutline, // Keep if needed
        // New Icons (replace IoScanOutline with better ones if available)
        Shoulder: IoPersonOutline,
        ApexHeight: IoResizeOutline,
        ApexDistance: IoResizeOutline,
        FullLength: IoManOutline,
        SleeveLength: IoShirtOutline,
        LowerArmGirth: IoHandLeftOutline,
        BodyFigure: IoBodyOutline, // Use same as BustChest or different
        Knee: IoWalkOutline,
        Crotch: IoWalkOutline, // Reuse or find better
        Bottomline: IoCutOutline, // Example
    };

    return (
        <Container maxW="container.lg" py={{ base: 8, md: 12 }}> {/* Wider container */}
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl" textAlign="center" color="teal.600">
                    {isLoading ? "Calculating Measurements..." : "Your Estimated Measurements"}
                </Heading>

                {isLoading ? (
                    // Loading State UI
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Spinner thickness='4px' speed='0.65s' emptyColor='gray.200' color='teal.500' size='xl' />
                            <Text fontSize="lg" color="gray.500">Analyzing for best results confidence...</Text>
                        </VStack>
                    </Center>
                ) : (
                    // Results Display UI
                    <Fade in={!isLoading}>
                        <VStack spacing={8} align="stretch">
                            <Text textAlign="center" fontSize="lg" color="gray.600">
                                Based on your height of {results?.height || 'N/A'} cm and captured pose.
                            </Text>

                            {/* Update grid columns for more items */}
                            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={5}> {/* Adjust columns */}
                                {/* Map over the UPDATED list of measurement types */}
                                {measurementTypes.map((measurementType) => (
                                    <Card key={measurementType} variant="outline" size="md" textAlign="center"> {/* Slightly smaller card */}
                                        <CardHeader pb={0}>
                                            <Icon
                                                // Use placeholder if specific icon not found
                                                as={measurementIcons[measurementType] || IoScanOutline}
                                                w={8} h={8} // Adjust icon size if needed
                                                color="teal.500"
                                            />
                                        </CardHeader>
                                        <CardBody pt={2}> {/* Adjust padding */}
                                            <Stat>
                                                <StatLabel fontSize="sm" color="gray.500" mb={1}>{measurementType}</StatLabel>
                                                <StatNumber fontSize="lg"> {/* Adjust font size */}
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
                                colorScheme="teal" size="lg" onClick={handleStartOver}
                                alignSelf="center" mt={6} leftIcon={<IoArrowBack />}
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
