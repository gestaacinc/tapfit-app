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
    Circle,
    ScaleFade
} from '@chakra-ui/react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import measurementData from '../data/data.json';

const KeypointIndices = {
    NOSE: 0, LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
    LEFT_HIP: 11, RIGHT_HIP: 12,
    LEFT_KNEE: 13, RIGHT_KNEE: 14,
    LEFT_ANKLE: 15, RIGHT_ANKLE: 16
};
const REQUIRED_KEYPOINTS = [
    KeypointIndices.NOSE,
    KeypointIndices.LEFT_SHOULDER, KeypointIndices.RIGHT_SHOULDER,
    KeypointIndices.LEFT_HIP, KeypointIndices.RIGHT_HIP,
    KeypointIndices.LEFT_KNEE, KeypointIndices.RIGHT_KNEE,
    KeypointIndices.LEFT_ANKLE, KeypointIndices.RIGHT_ANKLE
];
const MIN_KEYPOINT_SCORE = 0.3;
const COUNTDOWN_SECONDS = 5;
const PRE_COUNTDOWN_DELAY = 1500;

function CameraPage({ onNavigate }) {
    const videoRef = useRef(null);
    const requestRef = useRef(null);
    const detectorRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const preCountdownTimeoutRef = useRef(null);

    const [isCameraLoading, setIsCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const [stream, setStream] = useState(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("Initializing camera...");
    const [captureStage, setCaptureStage] = useState('INITIALIZING');
    const [isPoseValid, setIsPoseValid] = useState(false);
    const [countdown, setCountdown] = useState(null);

    const toast = useToast();

    const stopCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (preCountdownTimeoutRef.current) {
            clearTimeout(preCountdownTimeoutRef.current);
            preCountdownTimeoutRef.current = null;
        }
        setCountdown(null);
    }, []);

    const requestCamera = useCallback(async () => {
        setIsCameraLoading(true);
        setCameraError(null);
        setFeedbackMessage("Requesting camera access...");
        setCaptureStage('INITIALIZING');
        setIsPoseValid(false);
        stopCountdown();

        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(newStream);
        } catch (err) {
            console.error(err);
            let msg = "Could not access camera.";
            if (err.name === "NotAllowedError") msg = "Camera permission denied.";
            else if (err.name === "NotFoundError") msg = "No suitable camera found.";
            else if (err.name === "NotReadableError") msg = "Camera already in use.";
            else if (err instanceof TypeError) msg = "Secure connection required (HTTPS).";
            setCameraError(msg);
            setFeedbackMessage("Error initializing camera.");
            setIsCameraLoading(false);
            setCaptureStage('ERROR');
        }
    }, [stream, stopCountdown]);

    useEffect(() => {
        requestCamera();
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            cancelAnimationFrame(requestRef.current);
            stopCountdown();
            if (detectorRef.current) {
                detectorRef.current.dispose();
                detectorRef.current = null;
            }
        };
    }, [requestCamera, stopCountdown, stream]);

    const videoCallbackRef = useCallback(node => {
        if (node) {
            videoRef.current = node;
            setIsVideoReady(true);
        } else {
            setIsVideoReady(false);
        }
    }, []);

    const loadPoseDetectionModel = useCallback(async () => {
        if (detectorRef.current || cameraError || captureStage === 'ERROR' || isModelLoading) return;
        setIsModelLoading(true);
        setFeedbackMessage("Loading pose detection model...");
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detector = await poseDetection.createDetector(model, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                modelUrl: 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4'
            });
            detectorRef.current = detector;
            setIsModelLoading(false);
            setFeedbackMessage("Model loaded. Position for FRONT pose.");
            setCaptureStage('DETECTING_FRONT');
        } catch (err) {
            console.error(err);
            setCameraError("Failed to load pose detection model.");
            setFeedbackMessage("Error loading model.");
            setIsModelLoading(false);
            setCaptureStage('ERROR');
        }
    }, [cameraError, captureStage, isModelLoading]);

    useEffect(() => {
        if (stream && isVideoReady && videoRef.current && !detectorRef.current && !isModelLoading) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                setIsCameraLoading(false);
                setFeedbackMessage("Camera ready. Prepare for FRONT pose.");
                setCaptureStage('FRONT_PROMPT');
                loadPoseDetectionModel();
            };
            videoRef.current.onerror = e => {
                console.error(e);
                setCameraError("Video display error.");
                setCaptureStage('ERROR');
            };
        }
    }, [stream, isVideoReady, isModelLoading, loadPoseDetectionModel]);

    const handleProcessing = useCallback(() => {
        cancelAnimationFrame(requestRef.current);
        stopCountdown();

        // clamp to nearest key
        const stored = parseInt(localStorage.getItem('userHeight'), 10);
        if (isNaN(stored)) {
            toast({
                title: "Error",
                description: "Could not retrieve height.",
                status: "error",
                duration: 3000,
                isClosable: true
            });
            onNavigate('HEIGHT_INPUT');
            return;
        }

        const available = Object.keys(measurementData)
            .map(h => parseInt(h, 10))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        const closest = available.reduce((prev, curr) =>
            Math.abs(curr - stored) < Math.abs(prev - stored) ? curr : prev
        );
        const setForHeight = measurementData[closest.toString()] || {};

        // build results object
        const results = { height: stored };
        for (const [type, arr] of Object.entries(setForHeight)) {
            if (Array.isArray(arr)) {
                const choices = arr.filter(v => v != null);
                if (choices.length) {
                    const pick = choices[Math.floor(Math.random() * choices.length)];
                    results[type] = parseFloat(pick.toFixed(2));
                    continue;
                }
            }
            results[type] = 'N/A';
        }

        toast({
            title: "Success!",
            description: "Poses captured successfully!",
            status: "success",
            duration: 2000,
            isClosable: true
        });

        setTimeout(() => onNavigate('RESULTS', results), 1500);
    }, [onNavigate, stopCountdown, toast]);

    const startCountdown = useCallback((nextStage) => {
        if (preCountdownTimeoutRef.current) {
            clearTimeout(preCountdownTimeoutRef.current);
            preCountdownTimeoutRef.current = null;
        }
        stopCountdown();
        setCountdown(COUNTDOWN_SECONDS);
        setFeedbackMessage(`Hold Pose: ${COUNTDOWN_SECONDS}`);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null) return null;
                const next = prev - 1;
                if (next > 0) {
                    setFeedbackMessage(`Hold Pose: ${next}`);
                    return next;
                }
                stopCountdown();
                if (nextStage === 'SIDE_PROMPT') {
                    setFeedbackMessage("Front pose captured! Prepare for SIDE pose.");
                } else {
                    setFeedbackMessage("Side pose captured! Processing...");
                    handleProcessing();
                }
                setCaptureStage(nextStage);
                setIsPoseValid(false);
                return null;
            });
        }, 1000);
    }, [handleProcessing, stopCountdown]);

    const processPoseResults = useCallback((poses) => {
        if (countdown !== null || preCountdownTimeoutRef.current !== null) return;

        const resetPose = msg => {
            setIsPoseValid(false);
            stopCountdown();
            setFeedbackMessage(msg);
        };

        if (!poses || !poses.length) {
            resetPose("No person detected. Ensure you are fully visible.");
            return;
        }

        const keypoints = poses[0].keypoints;
        const visibleCount = REQUIRED_KEYPOINTS.filter(i =>
            keypoints[i]?.score > MIN_KEYPOINT_SCORE
        ).length;
        if (visibleCount < REQUIRED_KEYPOINTS.length) {
            resetPose("Full body not visible or low confidence. Adjust position.");
            return;
        }

        const Ls = keypoints[KeypointIndices.LEFT_SHOULDER];
        const Rs = keypoints[KeypointIndices.RIGHT_SHOULDER];
        const Lh = keypoints[KeypointIndices.LEFT_HIP];
        const Rh = keypoints[KeypointIndices.RIGHT_HIP];
        if (!Ls || !Rs || !Lh || !Rh) {
            resetPose("Cannot determine orientation. Adjust position.");
            return;
        }

        const shoulderWidth = Math.abs(Ls.x - Rs.x);
        const hipWidth = Math.abs(Lh.x - Rh.x);
        const isFront = shoulderWidth > hipWidth * 0.8 && shoulderWidth > 50;
        const isSide = shoulderWidth < hipWidth * 0.7 || shoulderWidth < 50;

        let match = false, msg = "Detecting pose...";
        if (captureStage === 'DETECTING_FRONT') {
            match = isFront;
            msg = "Please face the camera directly.";
        } else if (captureStage === 'DETECTING_SIDE') {
            match = isSide;
            msg = "Please turn 90 degrees (side view).";
        }

        if (match) {
            if (!isPoseValid) {
                setIsPoseValid(true);
                setFeedbackMessage("Good Pose! Hold Still...");
                preCountdownTimeoutRef.current = setTimeout(() => {
                    preCountdownTimeoutRef.current = null;
                    const nextStage = captureStage === 'DETECTING_FRONT' ? 'SIDE_PROMPT' : 'DONE';
                    startCountdown(nextStage);
                }, PRE_COUNTDOWN_DELAY);
            }
        } else {
            resetPose(msg);
        }
    }, [captureStage, countdown, isPoseValid, startCountdown, stopCountdown]);

    const runPoseDetection = useCallback(async () => {
        if (
            (captureStage === 'DETECTING_FRONT' || captureStage === 'DETECTING_SIDE') &&
            countdown === null && preCountdownTimeoutRef.current === null
        ) {
            if (detectorRef.current && videoRef.current.readyState >= 2) {
                try {
                    const poses = await detectorRef.current.estimatePoses(videoRef.current, { maxPoses: 1 });
                    processPoseResults(poses);
                } catch (err) {
                    console.error(err);
                }
            }
        }
        requestRef.current = requestAnimationFrame(runPoseDetection);
    }, [captureStage, processPoseResults, countdown]);

    useEffect(() => {
        if (detectorRef.current && videoRef.current && !isCameraLoading && !isModelLoading && captureStage !== 'ERROR' && captureStage !== 'DONE') {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(runPoseDetection);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [captureStage, isCameraLoading, isModelLoading, runPoseDetection]);

    useEffect(() => {
        let timeout;
        if (captureStage === 'SIDE_PROMPT') {
            cancelAnimationFrame(requestRef.current);
            timeout = setTimeout(() => {
                setCaptureStage('DETECTING_SIDE');
            }, 1500);
        }
        return () => clearTimeout(timeout);
    }, [captureStage]);

    const handleRetake = useCallback(() => {
        cancelAnimationFrame(requestRef.current);
        stopCountdown();
        setIsPoseValid(false);
        setCameraError(null);
        if (detectorRef.current) {
            detectorRef.current.dispose();
            detectorRef.current = null;
        }
        setIsModelLoading(false);
        requestCamera();
    }, [requestCamera, stopCountdown]);

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
                    <Box position="relative" width="100%" mx="auto" bg="gray.200" borderRadius="lg" overflow="hidden" boxShadow="lg" display={stream ? 'block' : 'none'}>
                        <video ref={videoCallbackRef} autoPlay playsInline muted style={{ width: '100%', height: 'auto', display: 'block' }} />

                        <ScaleFade initialScale={0.9} in={countdown !== null}>
                            <Circle position="absolute" top="50%" left="50%" transform="translate(-50%,-50%)" size="100px" bg="rgba(46,204,113,0.8)" color="white" fontSize="4xl" fontWeight="bold" zIndex="20">
                                {countdown}
                            </Circle>
                        </ScaleFade>

                        {!isCameraLoading && stream && (
                            <Text
                                position="absolute"
                                bottom={{ base: "5px", md: "10px" }}
                                left={{ base: "5px", md: "10px" }}
                                right={{ base: "5px", md: "10px" }}
                                bg={(isPoseValid && countdown === null && preCountdownTimeoutRef.current === null) ? "rgba(46,204,113,0.8)" : "rgba(0,0,0,0.7)"}
                                color="white" p={{ base: 1, md: 2 }} borderRadius="md"
                                fontSize={{ base: "sm", md: "lg" }} textAlign="center" zIndex="10"
                                transition="background-color 0.3s ease"
                            >
                                {feedbackMessage}
                            </Text>
                        )}
                    </Box>
                )}

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
