"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";

/**
 * Virtual Lipstick Try-On Component
 * This component opens your camera and overlays lipstick color on your lips in real-time
 *
 * Props:
 * @param {string} colorHex - The lipstick color in hex format (e.g., "#FF0000")
 * @param {number} opacity - How transparent the color is (0-1, default 0.6)
 * @param {boolean} isActive - Whether the try-on modal is open
 * @param {function} onClose - Function to call when closing the modal
 */
export const VirtualLipstickTryOn = ({
  colorHex = "#DC143C",
  opacity = 0.6,
  isActive = false,
  onClose,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentColor, setCurrentColor] = useState(colorHex);

  // References to DOM elements and MediaPipe objects
  const videoRef = useRef(null); // Hidden video element that captures camera
  const canvasRef = useRef(null); // Canvas where we draw the lipstick
  const streamRef = useRef(null); // Camera stream reference
  const faceMeshRef = useRef(null); // MediaPipe Face Mesh instance
  const animationFrameRef = useRef(null); // Animation frame ID for cleanup

  // Lip landmark indices - these are specific points that define the lip shape in MediaPipe
  // MediaPipe provides 478 facial landmarks, these are the ones for lips
  const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  const LOWER_LIP_OUTER = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  const LOWER_LIP_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

  /**
   * FUNCTION 1: Start the camera
   * This requests permission to use the camera and starts the video stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Ask browser for camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Front camera on mobile
        },
        audio: false, // We don't need audio
      });

      if (videoRef.current) {
        // Connect camera stream to video element
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready before proceeding
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsCameraActive(true);
        // Once camera is ready, initialize face detection
        await initializeFaceMesh();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, []);

  /**
   * FUNCTION 2: Initialize MediaPipe Face Mesh
   * This loads the AI model that detects faces and lip landmarks
   */
  const initializeFaceMesh = useCallback(async () => {
    try {
      // Import MediaPipe libraries (they load on-demand)
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { Camera } = await import("@mediapipe/camera_utils");

      // Create Face Mesh instance
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          // Load model files from CDN
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      // Configure Face Mesh settings
      faceMesh.setOptions({
        maxNumFaces: 1, // Only detect one face (better performance)
        refineLandmarks: true, // More accurate lip detection
        minDetectionConfidence: 0.5, // How confident the model should be
        minTrackingConfidence: 0.5, // How well to track across frames
      });

      // Tell Face Mesh what to do when it detects a face
      faceMesh.onResults(onFaceMeshResults);

      faceMeshRef.current = faceMesh;

      // Start processing video frames
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            // Send each video frame to Face Mesh for processing
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });

        camera.start();
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Face Mesh initialization error:", err);
      setError("Failed to load face detection. Please refresh.");
      setIsLoading(false);
    }
  }, []);

  /**
   * FUNCTION 3: Process Face Mesh results
   * This is called every frame when Face Mesh detects landmarks
   */
  const onFaceMeshResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");

      // Make canvas match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the video frame (mirrored like a selfie)
      ctx.save();
      ctx.scale(-1, 1); // Flip horizontally
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // If a face is detected, draw the lipstick
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0]; // Get first face
        drawLipstick(ctx, landmarks, canvas.width, canvas.height);
      }
    },
    [currentColor, opacity]
  );

  /**
   * FUNCTION 4: Draw the lipstick overlay
   * This draws a colored polygon over the detected lips
   */
  const drawLipstick = (ctx, landmarks, width, height) => {
    // Helper function: Convert normalized coordinates (0-1) to pixel coordinates
    const getLandmark = (index) => {
      const landmark = landmarks[index];
      return {
        x: width - landmark.x * width, // Mirror x for selfie effect
        y: landmark.y * height,
      };
    };

    // Ensure color is in proper format
    const color = currentColor.startsWith("#")
      ? currentColor
      : `#${currentColor}`;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    // DRAW UPPER LIP
    ctx.beginPath();
    UPPER_LIP_OUTER.forEach((index, i) => {
      const point = getLandmark(index);
      if (i === 0) {
        ctx.moveTo(point.x, point.y); // Start point
      } else {
        ctx.lineTo(point.x, point.y); // Draw line to next point
      }
    });

    // Connect inner lip points in reverse to close the shape
    UPPER_LIP_INNER.slice()
      .reverse()
      .forEach((index) => {
        const point = getLandmark(index);
        ctx.lineTo(point.x, point.y);
      });

    ctx.closePath();
    ctx.fill(); // Fill the polygon with color

    // DRAW LOWER LIP (same process)
    ctx.beginPath();
    LOWER_LIP_OUTER.forEach((index, i) => {
      const point = getLandmark(index);
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    LOWER_LIP_INNER.slice()
      .reverse()
      .forEach((index) => {
        const point = getLandmark(index);
        ctx.lineTo(point.x, point.y);
      });

    ctx.closePath();
    ctx.fill();

    // ADD GLOSSY EFFECT (optional, makes it look more realistic)
    ctx.globalAlpha = opacity * 0.3;
    ctx.fillStyle = "white";

    const upperMid = getLandmark(0); // Middle of upper lip
    const gradient = ctx.createRadialGradient(
      upperMid.x,
      upperMid.y - 5,
      5,
      upperMid.x,
      upperMid.y - 5,
      20
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(upperMid.x, upperMid.y - 5, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1; // Reset transparency
  };

  /**
   * FUNCTION 5: Stop camera and cleanup
   * Important for releasing camera access when done
   */
  const stopCamera = useCallback(() => {
    // Stop all camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close Face Mesh
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }

    // Cancel any pending animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsCameraActive(false);
  }, []);

  /**
   * EFFECT 1: Update color when prop changes
   * This allows changing the lipstick color in real-time
   */
  useEffect(() => {
    setCurrentColor(colorHex);
  }, [colorHex]);

  /**
   * EFFECT 2: Start/stop camera when modal opens/closes
   */
  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    // Cleanup when component unmounts or modal closes
    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  /**
   * Handle close button click
   */
  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  // Don't render anything if not active
  if (!isActive) return null;

  // RENDER THE UI
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Header with title and close button */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
          zIndex: 10,
        }}
      >
        <h2
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          Virtual Try-On
        </h2>
        <button
          onClick={handleClose}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "white",
            fontSize: "24px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.3)")
          }
          onMouseLeave={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.2)")
          }
        >
          ×
        </button>
      </div>

      {/* Camera view container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          aspectRatio: "4/3",
          backgroundColor: "#000",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Hidden video element (shows camera feed) */}
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />

        {/* Canvas where we draw everything */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "white",
            }}
          >
            <Camera size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "18px", margin: 0 }}>
              Initializing camera...
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "white",
              padding: "20px",
            }}
          >
            <p style={{ fontSize: "16px", color: "#ff6b6b" }}>{error}</p>
            <button
              onClick={startCamera}
              style={{
                marginTop: "16px",
                padding: "12px 24px",
                background: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Color indicator at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "12px 24px",
          borderRadius: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: currentColor,
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#333",
          }}
        >
          {currentColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
