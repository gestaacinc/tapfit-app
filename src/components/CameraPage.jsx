// src/components/CameraPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    VStack,
    Button,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    Container,
    Heading,
    useToast,
    Progress,
    Circle, // For visual countdown circle
    ScaleFade // For countdown animation
} from '@chakra-ui/react';

// TensorFlow.js and Pose Detection imports
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl'; // Register WebGL backend
import * as poseDetection from '@tensorflow-models/pose-detection';

// Import measurement data
import measurementData from '../data/data.json';

// Keypoints mapping (using MoveNet indices)
const KeypointIndices = {
    NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
    LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
    LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
    LEFT_KNEE: 13, RIGHT_KNEE: 14, LEFT_ANKLE: 15, RIGHT_ANKLE: 16
};
const REQUIRED_KEYPOINTS = [
    KeypointIndices.NOSE, KeypointIndices.LEFT_SHOULDER, KeypointIndices.RIGHT_SHOULDER,
    KeypointIndices.LEFT_HIP, KeypointIndices.RIGHT_HIP, KeypointIndices.LEFT_KNEE,
    KeypointIndices.RIGHT_KNEE, KeypointIndices.LEFT_ANKLE, KeypointIndices.RIGHT_ANKLE
];
const MIN_KEYPOINT_SCORE = 0.3;
const COUNTDOWN_SECONDS = 5; // How long to hold the pose during countdown
const PRE_COUNTDOWN_DELAY = 1500; // Delay in ms after pose detected before countdown starts

// Accept onNavigate as a prop
function CameraPage({ onNavigate }) {
    // Refs
    const videoElementRef = useRef(null);
    const requestRef = useRef(null);
    const detectorRef = useRef(null);
    const countdownIntervalRef = useRef(null); // Ref for countdown interval
    const preCountdownTimeoutRef = useRef(null); // Ref for pre-countdown delay timeout

    // State variables
    const [isCameraLoading, setIsCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const [stream, setStream] = useState(null);
    const [isVideoElementReady, setIsVideoElementReady] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("Initializing camera...");
    const [captureStage, setCaptureStage] = useState('INITIALIZING');
    const [isPoseValid, setIsPoseValid] = useState(false); // Tracks if current pose meets criteria
    const [countdown, setCountdown] = useState(null); // State for countdown number (null when inactive)
    const toast = useToast();
    const [poseModel, setPoseModel] = useState(null); // Using boolean placeholder for loaded model

    // --- Utility Functions ---
    const stopCountdown = useCallback(() => {
        // Clear the main countdown interval
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            console.log("Countdown interval cleared.");
        }
        // Clear the pre-countdown delay timeout
        if (preCountdownTimeoutRef.current) {
            clearTimeout(preCountdownTimeoutRef.current);
            preCountdownTimeoutRef.current = null;
            console.log("Pre-countdown timeout cleared.");
        }
        // Reset countdown state
        setCountdown(null);
    }, []);

    // --- Camera Handling ---
    const requestCamera = useCallback(async () => {
        setIsCameraLoading(true); setCameraError(null);
        setFeedbackMessage("Requesting camera access...");
        setCaptureStage('INITIALIZING'); setIsPoseValid(false);
        stopCountdown(); // Stop any countdowns

        setStream(currentStream => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                console.log("Stopped previous stream inside requestCamera.");
            }
            return null;
        });

        try {
            console.log("Requesting getUserMedia...");
            const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            console.log("getUserMedia successful.");
            setStream(newStream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            let errorMsg = "Could not access camera. Please ensure permission is granted.";
            if (err.name === "NotAllowedError") { errorMsg = "Camera permission denied."; }
            else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") { errorMsg = "No suitable camera found."; }
            else if (err.name === "NotReadableError" || err.name === "TrackStartError") { errorMsg = "Camera is already in use."; }
            else if (err instanceof TypeError && err.message.includes("getUserMedia")) { errorMsg = "Camera requires secure connection (HTTPS)."; }
            else { errorMsg = `Unexpected camera error: ${err.message}`; }
            setCameraError(errorMsg); setFeedbackMessage("Error initializing camera.");
            setIsCameraLoading(false); setCaptureStage('ERROR');
        }
    }, [stopCountdown]);

    useEffect(() => {
        requestCamera();
        return () => {
            console.log("Cleanup: Unmounting, stopping stream");
            setStream(currentStream => {
                if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); }
                return null;
            });
            cancelAnimationFrame(requestRef.current);
            stopCountdown(); // Use the cleanup utility
            if (detectorRef.current) { detectorRef.current.dispose(); detectorRef.current = null; }
        };
    }, [requestCamera, stopCountdown]);

    const videoCallbackRef = useCallback((node) => {
        if (node !== null) {
            console.log("Video element mounted.");
            videoElementRef.current = node;
            setIsVideoElementReady(true);
        } else {
            console.log("Video element unmounted.");
            setIsVideoElementReady(false);
            videoElementRef.current = null;
        }
    }, []);

    // --- Pose Detection Setup ---
    const loadPoseDetectionModel = useCallback(async () => {
        if (detectorRef.current || cameraError || captureStage === 'ERROR' || isModelLoading) return;
        setIsModelLoading(true);
        setFeedbackMessage("Loading pose detection model...");
        console.log("Loading MoveNet model...");
        try {
            await tf.setBackend('webgl'); await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const modelUrl = 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';
            const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, modelUrl: modelUrl };
            const detector = await poseDetection.createDetector(model, detectorConfig);
            detectorRef.current = detector;
            console.log("MoveNet model loaded successfully.");
            setIsModelLoading(false); setFeedbackMessage("Model loaded. Position for FRONT pose.");
            setCaptureStage('DETECTING_FRONT');
        } catch (error) {
            console.error("Error loading pose model:", error);
            if (error instanceof TypeError && error.message.includes('fetch')) { setCameraError("Failed to load pose model due to network/CORS issue."); }
            else { setCameraError("Failed to load pose detection model."); }
            setFeedbackMessage("Error loading model."); setIsModelLoading(false); setCaptureStage('ERROR');
        }
    }, [cameraError, captureStage, isModelLoading]);

    useEffect(() => {
        if (stream && isVideoElementReady && videoElementRef.current && !detectorRef.current && !isModelLoading) {
            console.log("Attaching stream to video element.");
            videoElementRef.current.srcObject = stream;
            videoElementRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded.");
                setIsCameraLoading(false); setFeedbackMessage("Camera ready. Prepare for FRONT pose.");
                setCaptureStage('FRONT_PROMPT'); loadPoseDetectionModel();
            };
            videoElementRef.current.onerror = (e) => { console.error("Video element error:", e); setCameraError("Video display error."); setCaptureStage('ERROR'); }
        }
    }, [stream, isVideoElementReady, loadPoseDetectionModel, isModelLoading]);


    // --- Pose Processing & Validation ---

    // Function to handle final processing and navigation
    const handleProcessing = useCallback(() => {
        console.log("Processing results...");
        cancelAnimationFrame(requestRef.current);
        stopCountdown();

        const storedHeight = localStorage.getItem('userHeight');
        if (!storedHeight) {
            console.error("Height not found in storage!");
            toast({ title: "Error", description: "Could not retrieve height.", status: "error", duration: 3000, isClosable: true });
            onNavigate('HEIGHT_INPUT'); return;
        }
        const heightKey = storedHeight;
        let results = { height: storedHeight };
        if (measurementData[heightKey]) {
            const dataForHeight = measurementData[heightKey];
            for (const measurementType in dataForHeight) {
                const valuesArray = dataForHeight[measurementType];
                if (valuesArray && valuesArray.length > 0) {
                    const randomIndex = Math.floor(Math.random() * valuesArray.length);
                    results[measurementType] = parseFloat(valuesArray[randomIndex].toFixed(2));
                } else { results[measurementType] = 'N/A'; }
            }
        } else {
            console.warn(`No measurement data found for height: ${heightKey}`);
            results.Waist = 'N/A'; results.Hip = 'N/A';
            results.Thigh = 'N/A'; results.BustChest = 'N/A';
        }
        console.log("Generated results:", results);
        toast({ title: "Success!", description: "Poses captured successfully!", status: "success", duration: 2000, isClosable: true });
        setTimeout(() => onNavigate('RESULTS', results), 1500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onNavigate, toast, stopCountdown]);

    // Function to start the main countdown timer
    const startCountdown = useCallback((nextStage) => {
        // Ensure pre-countdown timeout is cleared
        if (preCountdownTimeoutRef.current) {
            clearTimeout(preCountdownTimeoutRef.current);
            preCountdownTimeoutRef.current = null;
        }
        // Ensure previous interval is cleared
        stopCountdown();

        // Start the countdown state and message
        setCountdown(COUNTDOWN_SECONDS);
        setFeedbackMessage(`Hold Pose: ${COUNTDOWN_SECONDS}`); // Initial message for countdown

        // Start the interval timer
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prevCountdown => {
                if (prevCountdown === null) { stopCountdown(); return null; } // Safety check
                const newCountdown = prevCountdown - 1;
                if (newCountdown > 0) {
                    setFeedbackMessage(`Hold Pose: ${newCountdown}`); // Update message
                    return newCountdown; // Continue countdown
                } else {
                    // Countdown finished
                    stopCountdown(); // Clear interval
                    const poseType = captureStage === 'DETECTING_FRONT' ? 'FRONT' : 'SIDE';
                    console.log(`${poseType} POSE CONFIRMED`);
                    if (nextStage === 'SIDE_PROMPT') {
                        setFeedbackMessage("Front pose captured! Prepare for SIDE pose.");
                    } else {
                        setFeedbackMessage("Side pose captured! Processing...");
                        handleProcessing(); // Trigger final processing only after side pose
                    }
                    setCaptureStage(nextStage); // Move to the next stage
                    setIsPoseValid(false); // Reset valid state for the next stage
                    return null; // Reset countdown state
                }
            });
        }, 1000); // Update every second
    }, [stopCountdown, handleProcessing, captureStage]); // Dependencies

    // Function to process the pose results from the detector
    const processPoseResults = useCallback((poses) => {
        // Don't process if countdown is active or pre-countdown is running
        if (countdown !== null || preCountdownTimeoutRef.current !== null) return;

        // Reset valid state if no longer valid, clear any timers
        const resetPoseState = (message) => {
            setIsPoseValid(false);
            stopCountdown(); // Clears both countdown interval and pre-countdown timeout
            setFeedbackMessage(message);
        };

        // 1. Check if a pose exists
        if (!poses || poses.length === 0) {
            setFeedbackMessage(prev => {
                const newMsg = "No person detected. Ensure you are fully visible.";
                if (prev !== newMsg) { resetPoseState(newMsg); }
                return newMsg;
            });
            return;
        }

        // If we reach here, a pose was detected. Reset validity for this frame check.
        setIsPoseValid(false); // Assume invalid for this frame until checks pass

        const pose = poses[0];
        const keypoints = pose.keypoints;
        let visibleRequiredCount = 0;
        for (const index of REQUIRED_KEYPOINTS) {
            if (keypoints[index] && keypoints[index].score > MIN_KEYPOINT_SCORE) {
                visibleRequiredCount++;
            }
        }

        // 2. Check visibility
        if (visibleRequiredCount < REQUIRED_KEYPOINTS.length) {
            resetPoseState("Full body not visible or low confidence. Adjust position.");
            return;
        }

        // 3. Check orientation
        const leftShoulder = keypoints[KeypointIndices.LEFT_SHOULDER];
        const rightShoulder = keypoints[KeypointIndices.RIGHT_SHOULDER];
        const leftHip = keypoints[KeypointIndices.LEFT_HIP];
        const rightHip = keypoints[KeypointIndices.RIGHT_HIP];
        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
            resetPoseState("Cannot determine orientation. Adjust position.");
            return;
        }
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
        const hipWidth = Math.abs(leftHip.x - rightHip.x);
        console.log(`ShoulderW: ${shoulderWidth.toFixed(1)}, HipW: ${hipWidth.toFixed(1)}`);
        const isLikelyFront = shoulderWidth > hipWidth * 0.8 && shoulderWidth > 50;
        const isLikelySide = shoulderWidth < hipWidth * 0.7 || shoulderWidth < 50;

        let poseMatchesStage = false;
        let requiredPoseFeedback = "";
        if (captureStage === 'DETECTING_FRONT') {
            poseMatchesStage = isLikelyFront;
            requiredPoseFeedback = "Please face the camera directly.";
        } else if (captureStage === 'DETECTING_SIDE') {
            poseMatchesStage = isLikelySide;
            requiredPoseFeedback = "Please turn 90 degrees (side view).";
        }

        // 4. Handle matching pose
        if (poseMatchesStage) {
            // Only start pre-countdown if pose wasn't already considered valid
            if (!isPoseValid) {
                console.log("Valid pose detected, starting pre-countdown delay...");
                setIsPoseValid(true); // Mark as valid (for visual feedback)
                setFeedbackMessage("Good Pose! Hold Still..."); // Set intermediate message

                // Start the pre-countdown delay timer
                preCountdownTimeoutRef.current = setTimeout(() => {
                    console.log("Pre-countdown finished, starting main countdown.");
                    preCountdownTimeoutRef.current = null; // Clear the ref
                    // Determine next stage *after* the delay
                    const nextStage = captureStage === 'DETECTING_FRONT' ? 'SIDE_PROMPT' : 'DONE';
                    startCountdown(nextStage); // Start the main visual countdown
                }, PRE_COUNTDOWN_DELAY); // Wait for the specified delay
            }
            // If isPoseValid is already true, it means a timer (pre-countdown or main countdown) is active, do nothing here.
        } else {
            // Pose doesn't match the required stage or became invalid
            resetPoseState(requiredPoseFeedback || "Detecting pose...");
        }
    }, [captureStage, countdown, isPoseValid, startCountdown, stopCountdown]); // Dependencies


    // --- Detection Loop ---
    const runPoseDetection = useCallback(async () => {
        // Only run estimation if actively detecting and no countdowns are active
        if (
            (captureStage === 'DETECTING_FRONT' || captureStage === 'DETECTING_SIDE') &&
            countdown === null && preCountdownTimeoutRef.current === null // Check both timers
        ) {
            if (detectorRef.current && videoElementRef.current && videoElementRef.current.readyState >= 2) {
                try {
                    const poses = await detectorRef.current.estimatePoses(videoElementRef.current, { maxPoses: 1, flipHorizontal: false });
                    processPoseResults(poses); // Process results
                } catch (error) { console.error("Error during pose estimation:", error); }
            }
        }
        // Continue the loop regardless of stage to allow state changes
        requestRef.current = requestAnimationFrame(runPoseDetection);
    }, [captureStage, processPoseResults, countdown]); // Added countdown dependency

    // Effect to start/stop the detection loop
    useEffect(() => {
        if (detectorRef.current && videoElementRef.current && !isCameraLoading && !isModelLoading && captureStage !== 'ERROR' && captureStage !== 'DONE') {
            console.log(`Starting/Managing detection loop for stage: ${captureStage}`);
            cancelAnimationFrame(requestRef.current); // Clear previous frame
            requestRef.current = requestAnimationFrame(runPoseDetection); // Start loop
        } else {
            cancelAnimationFrame(requestRef.current); // Stop loop if conditions not met
        }
        return () => { cancelAnimationFrame(requestRef.current); } // Cleanup on unmount/dependency change
    }, [captureStage, runPoseDetection, isCameraLoading, isModelLoading]);

    // --- Effect to handle pause during SIDE_PROMPT ---
    useEffect(() => {
        let sidePromptTimeoutId = null;
        if (captureStage === 'SIDE_PROMPT') {
            console.log("In SIDE_PROMPT stage, waiting before detection...");
            // Stop detection loop while prompting
            cancelAnimationFrame(requestRef.current);
            sidePromptTimeoutId = setTimeout(() => {
                console.log("SIDE_PROMPT timeout finished, moving to DETECTING_SIDE.");
                setCaptureStage('DETECTING_SIDE'); // Trigger side detection
            }, 1500); // Wait 1.5 seconds before starting side detection
        }
        // Cleanup timeout if stage changes or component unmounts
        return () => clearTimeout(sidePromptTimeoutId);
    }, [captureStage]); // Run when captureStage changes

    // --- Retake ---
    const handleRetake = useCallback(() => {
        console.log("Retake requested");
        cancelAnimationFrame(requestRef.current); // Stop detection loop
        stopCountdown(); // Stop countdowns
        setIsPoseValid(false); setCameraError(null);
        if (detectorRef.current) { detectorRef.current.dispose(); detectorRef.current = null; }
        setIsModelLoading(false);
        requestCamera(); // Re-request the camera stream
    }, [requestCamera, stopCountdown]);

    // --- Render JSX ---
    return (
        <Container maxW="container.xl" py={4}>
            <VStack spacing={4} w="100%">
                <Heading size="lg">Pose Capture</Heading>

                {(isCameraLoading || isModelLoading) && captureStage !== 'ERROR' && (
                    <VStack>
                        <Spinner size="xl" color="blue.500" />
                        <Text>{feedbackMessage}</Text>
                        {isModelLoading && <Progress size="xs" isIndeterminate width="80%" mt={2} />}
                    </VStack>
                )}

                {cameraError && (
                    <Alert status='error' variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md">
                        <AlertIcon boxSize="40px" mr={0} />
                        <Text mt={2}>{cameraError}</Text>
                    </Alert>
                )}

                {!cameraError && (
                    <Box
                        position="relative" width="100%" mx="auto"
                        bg="gray.200" borderRadius="lg" overflow="hidden" boxShadow="lg"
                        display={stream ? 'block' : 'none'}
                    >
                        <video
                            ref={videoCallbackRef} autoPlay playsInline muted
                            style={{ width: '100%', height: 'auto', display: 'block' }} // Removed transform flip
                        />

                        {/* Countdown Overlay */}
                        <ScaleFade initialScale={0.9} in={countdown !== null}>
                            <Circle
                                position="absolute" top="50%" left="50%"
                                transform="translate(-50%, -50%)" size="100px"
                                bg="rgba(46, 204, 113, 0.8)" color="white"
                                fontSize="4xl" fontWeight="bold" zIndex="20"
                            >
                                {countdown}
                            </Circle>
                        </ScaleFade>

                        {/* Feedback text overlay */}
                        {!isCameraLoading && stream && (
                            <Text
                                position="absolute" bottom={{ base: "5px", md: "10px" }}
                                left={{ base: "5px", md: "10px" }} right={{ base: "5px", md: "10px" }}
                                // Green background only when pose is valid AND no countdowns are active
                                bg={(isPoseValid && countdown === null && preCountdownTimeoutRef.current === null) ? "rgba(46, 204, 113, 0.8)" : "rgba(0,0,0,0.7)"}
                                color="white" p={{ base: 1, md: 2 }} borderRadius="md"
                                fontSize={{ base: "sm", md: "lg" }} textAlign="center" zIndex="10"
                                transition="background-color 0.3s ease"
                            >
                                {feedbackMessage}
                            </Text>
                        )}
                    </Box>
                )}

                {/* Retake Button */}
                {(captureStage !== 'INITIALIZING' && captureStage !== 'ERROR' && !isCameraLoading && !isModelLoading) && (
                    <Button onClick={handleRetake} colorScheme="orange" size="lg" mt={4}>
                        Retake Poses
                    </Button>
                )}

            </VStack>
        </Container>
    );
}

export default CameraPage;
