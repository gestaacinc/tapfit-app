// src/components/ResultsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Heading,
    Text,
    VStack,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Stat,
    StatLabel,
    StatNumber,
    Button,
    Icon,
    Spinner,
    Fade,
    Center
} from '@chakra-ui/react';
import { IoArrowBack, IoBodyOutline } from 'react-icons/io5';

const labelMap = {
    Shoulder: 'Shoulder Width',
    ApexHeight: 'Apex Height',
    ApexDistance: 'Apex Distance',
    FullLength: 'Full Length',
    SleeveLength: 'Sleeve Length',
    LowerArmGirth: 'Lower Arm Girth',
    Waist: 'Waist',
    Hip: 'Hip',
    Thigh: 'Thigh',
    BodyFigure: 'Body Figure',
    Knee: 'Knee',
    Crotch: 'Crotch',
    Bottomline: 'Bottom Line',
};

const iconMap = {
    Waist: IoBodyOutline,
    Hip: IoBodyOutline,
    Thigh: IoBodyOutline,
    // …any others you want to map…
    default: IoBodyOutline
};

function ResultsPage({ onNavigate, results }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleStartOver = () => onNavigate('HEIGHT_INPUT');

    const displayMeasurement = value => {
        const n = parseFloat(value);
        return !isNaN(n) ? `${n.toFixed(1)} in` : 'N/A';
    };

    return (
        <Container maxW="container.md" py={{ base: 8, md: 12 }}>
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl" textAlign="center" color="teal.600">
                    {isLoading ? "Calculating Measurements..." : "Your Estimated Measurements"}
                </Heading>

                {isLoading ? (
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
                            <Text fontSize="lg" color="gray.500">
                                Analyzing for best results confidence...
                            </Text>
                        </VStack>
                    </Center>
                ) : (
                    <Fade in={!isLoading}>
                        <VStack spacing={8} align="stretch">
                            <Text textAlign="center" fontSize="lg" color="gray.600">
                                Based on your height of {results?.height || 'N/A'} cm and captured pose.
                            </Text>

                            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                                {Object.entries(results)
                                    .filter(([key]) => key !== 'height')
                                    .map(([key, value]) => {
                                        const IconComp = iconMap[key] || iconMap.default;
                                        return (
                                            <Card key={key} variant="outline" textAlign="center">
                                                <CardHeader>
                                                    <Icon as={IconComp} w={8} h={8} color="teal.500" mb={2} />
                                                </CardHeader>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel fontSize="sm" color="gray.600">
                                                            {labelMap[key] || key}
                                                        </StatLabel>
                                                        <StatNumber fontSize="2xl">
                                                            {displayMeasurement(value)}
                                                        </StatNumber>
                                                    </Stat>
                                                </CardBody>
                                            </Card>
                                        );
                                    })}
                            </SimpleGrid>

                            <Text textAlign="center" fontSize="sm" color="gray.500" mt={4}>
                                Note: These are estimations based on general data and simulated pose capture.
                            </Text>

                            <Button colorScheme="teal" size="lg" onClick={handleStartOver} alignSelf="center" leftIcon={<IoArrowBack />}>
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
