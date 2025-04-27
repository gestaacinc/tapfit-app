// src/components/InstructionsPage.jsx
import React from 'react';
// Import motion component from framer-motion
import { motion } from 'framer-motion';
// Import Chakra UI components
import {
    Box,
    Container,
    Heading,
    Text,
    List,
    ListItem,
    ListIcon, // Import ListIcon
    Button,
    VStack
} from '@chakra-ui/react';
// Import specific icons from react-icons
import { IoShirtOutline, IoPhonePortraitOutline, IoResizeOutline, IoBodyOutline, IoSwapHorizontalOutline, IoCameraOutline } from 'react-icons/io5'; // Using Ionicons 5

// Create a motion-enhanced ListItem
const MotionListItem = motion(ListItem);

function InstructionsPage({ onNavigate }) {

    const handleNextClick = () => {
        console.log("Next button clicked! Navigating to Height Input...");
        onNavigate('HEIGHT_INPUT');
    };

    // Animation variants for list items
    const listItemVariants = {
        hidden: { opacity: 0, y: 10 }, // Start slightly down and transparent
        visible: { opacity: 1, y: 0 }   // Fade and slide up to final position
    };

    return (
        // Add bg color, shadow, slightly more padding
        <Container maxW="container.md" py={{ base: 8, md: 12 }} bg="gray.50" borderRadius="md" boxShadow="sm">
            <VStack spacing={6} align="stretch">
                <Heading as="h1" size="xl" textAlign="center" color="teal.600">
                    How to Use TapFit
                </Heading>

                <Text textAlign="center" fontSize="lg" color="gray.700">
                    Follow these steps for accurate results:
                </Text>

                {/* List with custom styling and animation */}
                <List spacing={5} px={{ base: 2, md: 4 }}> {/* Increased spacing */}
                    {/* Apply animation variants to each item */}
                    <MotionListItem
                        display="flex" // Use flex to align icon and text
                        alignItems="start" // Align items to the start (top)
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.3, delay: 0.1 }} // Add slight delay
                    >
                        <ListIcon as={IoShirtOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box> {/* Wrap text in Box for better control if needed */}
                            <Text as="span" fontWeight="bold" color="teal.700">Preparation: </Text>
                            Wear form-fitting clothing. Ensure good, even lighting without strong shadows. Find a clear space with a plain background if possible.
                        </Box>
                    </MotionListItem>

                    <MotionListItem display="flex" alignItems="start" variants={listItemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.2 }}>
                        <ListIcon as={IoPhonePortraitOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box>
                            <Text as="span" fontWeight="bold" color="teal.700">Phone Placement: </Text>
                            Place your phone upright on a stable surface (like a table or tripod) around waist height. Ensure the camera lens is clean.
                        </Box>
                    </MotionListItem>

                    <MotionListItem display="flex" alignItems="start" variants={listItemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.3 }}>
                        <ListIcon as={IoResizeOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box>
                            <Text as="span" fontWeight="bold" color="teal.700">Distance: </Text>
                            Stand far enough back so your entire body, from head to toe, is clearly visible within the camera frame.
                        </Box>
                    </MotionListItem>

                    <MotionListItem display="flex" alignItems="start" variants={listItemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.4 }}>
                        <ListIcon as={IoBodyOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box>
                            <Text as="span" fontWeight="bold" color="teal.700">Front Pose: </Text>
                            Stand facing the camera directly. Keep your feet shoulder-width apart, arms relaxed at your sides (not touching your body), and look straight ahead. Hold still.
                        </Box>
                    </MotionListItem>

                    <MotionListItem display="flex" alignItems="start" variants={listItemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.5 }}>
                        <ListIcon as={IoSwapHorizontalOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box>
                            <Text as="span" fontWeight="bold" color="teal.700">Side Pose: </Text>
                            Turn 90 degrees (either left or right, but be consistent if asked again). Stand straight with your feet together, arms relaxed at your sides, and look straight ahead. Hold still.
                        </Box>
                    </MotionListItem>

                    <MotionListItem display="flex" alignItems="start" variants={listItemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.6 }}>
                        <ListIcon as={IoCameraOutline} color='teal.500' w={6} h={6} mt={1} mr={2} />
                        <Box>
                            <Text as="span" fontWeight="bold" color="teal.700">Capture: </Text>
                            The app will guide you to capture both poses. You may need to retake if the pose isn't clear or your full body isn't visible.
                        </Box>
                    </MotionListItem>
                </List>

                <Button
                    colorScheme="green"
                    size="lg"
                    onClick={handleNextClick}
                    alignSelf="center"
                    mt={4}
                    // Add hover effect easily with Chakra props
                    _hover={{ bg: 'green.600', transform: 'translateY(-2px)', boxShadow: 'lg' }}
                >
                    Next
                </Button>
            </VStack>
        </Container>
    );
}

export default InstructionsPage;