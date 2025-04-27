// src/components/HeightInputPage.jsx
import React, { useState } from 'react';

import { motion } from 'framer-motion'; // Import motion
import {
    Box,
    Container,
    FormControl,
    FormLabel,
    Input,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Button,
    FormErrorMessage,
    VStack,
    Heading,
    Text,
    useToast, // Import useToast for feedback (optional)
    InputGroup,      // <-- Add InputGroup
    InputRightAddon,  // <-- Add InputRightAddon
    Icon // <-- ADD THIS!
} from '@chakra-ui/react';
// Import an icon for the button (make sure you ran: npm install react-icons)
import { IoArrowForward, IoScaleOutline } from 'react-icons/io5';

// Create a motion-enhanced Box (Optional, but needed for the variant animation)
const MotionBox = motion(Box);

// Accept onNavigate as a prop
function HeightInputPage({ onNavigate }) {
    // State for the height input value (start empty or with a default)
    const [height, setHeight] = useState('');
    // State for validation error message
    const [error, setError] = useState('');
    // Optional: Chakra's toast hook for success messages
    const toast = useToast();

    // Handle changes in the NumberInput
    // valueAsString is useful to keep the input controlled even when empty
    // valueAsNumber is useful for validation
    const handleHeightChange = (event) => { // Get event object
        setHeight(event.target.value); // Get value from event
        if (error) {
            setError('');
        }
    };

    // Validate and submit the height
    const handleSubmit = () => {
        const heightNum = parseFloat(height); // Convert string state to number

        // Validation logic
        if (!height || isNaN(heightNum)) {
            setError('Please enter your height.');
            return;
        }
        if (heightNum < 140 || heightNum > 180) {
            console.log(`Validation failed: ${heightNum} is out of range (140-180)`); // Log failure
            setError('Height must be between 140 cm and 180 cm.');
            return;
        }
        // If valid
        setError(''); // Clear any previous error
        console.log('Height submitted:', heightNum);

        // Store height in localStorage for the next step
        localStorage.setItem('userHeight', heightNum.toString());

        // Optional: Show a success message
        toast({
            title: 'Height Saved.',
            description: `Your height is set to ${heightNum} cm.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });

        // Navigate to the next page (Camera)
        onNavigate('CAMERA');
    };

    // Animation variants for the container
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        // Use Container to center and constrain width, and flex to vertically center
        <Container maxW="container.sm" py={{ base: 8, md: 12 }} display="flex" alignItems="center" minHeight="80vh">
            {/* Use MotionBox for animation and visual grouping */}
            <MotionBox
                bg="white"
                p={{ base: 6, md: 8 }} // Responsive padding
                boxShadow="md"
                borderRadius="lg"
                width="100%" // Take full width of container
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <VStack spacing={5} align="stretch"> {/* Adjust spacing */}
                    <Icon
                        as={IoScaleOutline} // Use the imported icon
                        boxSize={{ base: "40px", md: "50px" }} // Responsive size
                        color="blue.500"     // Use theme color
                        alignSelf="center"   // Center the icon
                        mb={-1}             // Reduce margin-bottom slightly if needed
                    />
                    <Heading as="h1" size="lg" textAlign="center">
                        Enter Your Height
                    </Heading>
                    <Text textAlign="center" color="gray.600">
                        Please enter your height in centimeters (cm). This is required for measurement analysis.
                    </Text>

                    {/* Use FormControl to link label, input, and error message */}
                    {/* isInvalid prop controls the error styling */}
                    {/* Move id here for better accessibility linkage */}
                    <FormControl isInvalid={!!error} id='height-input'>
                        <FormLabel>Height</FormLabel>
                        <InputGroup>
                            <Input
                                type="number" // Use type="number"
                                placeholder="e.g., 165"
                                value={height}
                                onChange={handleHeightChange}
                                // You can add pattern="[0-9]*" for better mobile keyboards if needed
                                // min/max attributes here are for browser validation hints,
                                // but our JS validation is the main gatekeeper
                                min="140"
                                max="180"
                            />
                            <InputRightAddon>cm</InputRightAddon>
                        </InputGroup>
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>

                    <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={handleSubmit}
                        mt={4}
                        // Add icon to the right
                        rightIcon={<IoArrowForward />}
                    >
                        Next: Capture Pose
                    </Button>
                </VStack>
            </MotionBox>
        </Container>
    );
}

export default HeightInputPage;