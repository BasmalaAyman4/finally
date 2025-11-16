/* "use client";

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
 *
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
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [faceDetected, setFaceDetected] = useState(false);

  // References to DOM elements and MediaPipe objects
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Lip landmark indices for MediaPipe Face Mesh
  const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  const LOWER_LIP_OUTER = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  const LOWER_LIP_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

  /**
   * FUNCTION 1: Start the camera with optimized settings
   *
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          aspectRatio: { ideal: 1.777 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsCameraActive(true);
        await initializeFaceMesh();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, []);

  /**
   * FUNCTION 2: Initialize MediaPipe with improved settings
   *
  const initializeFaceMesh = useCallback(async () => {
    try {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { Camera } = await import("@mediapipe/camera_utils");

      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      // Improved settings for better detection in various lighting
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      faceMesh.onResults(onFaceMeshResults);
      faceMeshRef.current = faceMesh;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
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
   * FUNCTION 3: Process Face Mesh results with brightness enhancement
   *
  const onFaceMeshResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced brightness and contrast
      ctx.filter = "brightness(1.1) contrast(1.05)";

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.filter = "none";

      // Draw lipstick if face detected
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        drawLipstick(ctx, landmarks, canvas.width, canvas.height, localOpacity);
      } else {
        setFaceDetected(false);
      }
    },
    [currentColor, localOpacity]
  );

  /**
   * FUNCTION 4: Draw lipstick with smooth curves and realistic effects
   *
  const drawLipstick = (ctx, landmarks, width, height, opacityValue) => {
    const getLandmark = (index) => {
      const landmark = landmarks[index];
      return {
        x: width - landmark.x * width,
        y: landmark.y * height,
      };
    };

    const color = currentColor.startsWith("#")
      ? currentColor
      : `#${currentColor}`;

    // Better color blending
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = color;
    ctx.globalAlpha = opacityValue;
    ctx.filter = "blur(1px)";

    // Helper for smooth curves
    const drawSmoothCurve = (points) => {
      if (points.length < 2) return;

      ctx.beginPath();
      const firstPoint = getLandmark(points[0]);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < points.length - 1; i++) {
        const current = getLandmark(points[i]);
        const next = getLandmark(points[i + 1]);
        const xMid = (current.x + next.x) / 2;
        const yMid = (current.y + next.y) / 2;
        ctx.quadraticCurveTo(current.x, current.y, xMid, yMid);
      }

      const lastPoint = getLandmark(points[points.length - 1]);
      ctx.lineTo(lastPoint.x, lastPoint.y);
    };

    // Draw upper lip
    drawSmoothCurve(UPPER_LIP_OUTER);
    const upperInnerReversed = [...UPPER_LIP_INNER].reverse();
    for (let i = 0; i < upperInnerReversed.length; i++) {
      const point = getLandmark(upperInnerReversed[i]);
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const next = getLandmark(
          upperInnerReversed[Math.min(i + 1, upperInnerReversed.length - 1)]
        );
        const xMid = (point.x + next.x) / 2;
        const yMid = (point.y + next.y) / 2;
        ctx.quadraticCurveTo(point.x, point.y, xMid, yMid);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw lower lip
    drawSmoothCurve(LOWER_LIP_OUTER);
    const lowerInnerReversed = [...LOWER_LIP_INNER].reverse();
    for (let i = 0; i < lowerInnerReversed.length; i++) {
      const point = getLandmark(lowerInnerReversed[i]);
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const next = getLandmark(
          lowerInnerReversed[Math.min(i + 1, lowerInnerReversed.length - 1)]
        );
        const xMid = (point.x + next.x) / 2;
        const yMid = (point.y + next.y) / 2;
        ctx.quadraticCurveTo(point.x, point.y, xMid, yMid);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = "none";

    // Glossy effect
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = opacityValue * 0.4;

    // Upper lip highlight
    const upperMid = getLandmark(0);
    const gradient = ctx.createRadialGradient(
      upperMid.x,
      upperMid.y - 3,
      2,
      upperMid.x,
      upperMid.y - 3,
      25
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(upperMid.x, upperMid.y - 3, 20, 0, Math.PI * 2);
    ctx.fill();

    // Lower lip highlight
    const lowerMid = getLandmark(17);
    const lowerGradient = ctx.createRadialGradient(
      lowerMid.x,
      lowerMid.y + 2,
      2,
      lowerMid.x,
      lowerMid.y + 2,
      15
    );
    lowerGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    lowerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = lowerGradient;
    ctx.beginPath();
    ctx.arc(lowerMid.x, lowerMid.y + 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  /**
   * FUNCTION 5: Stop camera and cleanup
   *
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsCameraActive(false);
    setFaceDetected(false);
  }, []);

  /**
   * Update color when prop changes
   *
  useEffect(() => {
    setCurrentColor(colorHex);
  }, [colorHex]);

  /**
   * Update opacity when prop changes
   *
  useEffect(() => {
    setLocalOpacity(opacity);
  }, [opacity]);

  /**
   * Start/stop camera with modal
   *
  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  if (!isActive) return null;

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
      {/* Header *
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

      {/* Camera Container *
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
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />

        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Loading *
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

        {/* Error *
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

        {/* Lighting Tip *
        {isCameraActive && !isLoading && !faceDetected && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)",
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: "16px" }}>💡</span>
            <span>Face the camera directly with good lighting</span>
          </div>
        )}
      </div>

      {/* Opacity Slider *
      {isCameraActive && !isLoading && (
        <div
          style={{
            position: "absolute",
            bottom: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "16px 24px",
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            width: "90%",
            maxWidth: "300px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
              minWidth: "60px",
            }}
          >
            Intensity
          </span>
          <input
            type="range"
            min="30"
            max="85"
            value={localOpacity * 100}
            onChange={(e) => setLocalOpacity(e.target.value / 100)}
            style={{
              flex: 1,
              height: "6px",
              borderRadius: "3px",
              outline: "none",
              cursor: "pointer",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#666",
              minWidth: "35px",
            }}
          >
            {Math.round(localOpacity * 100)}%
          </span>
        </div>
      )}

      {/* Color Indicator *
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
 */

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
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [faceDetected, setFaceDetected] = useState(false);

  // References to DOM elements and MediaPipe objects
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const opacityRef = useRef(opacity); // Store opacity in ref for real-time updates

  // Lip landmark indices for MediaPipe Face Mesh
  const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  const LOWER_LIP_OUTER = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  const LOWER_LIP_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

  /**
   * FUNCTION 1: Start the camera with optimized settings
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          aspectRatio: { ideal: 1.777 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsCameraActive(true);
        await initializeFaceMesh();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, []);

  /**
   * FUNCTION 2: Initialize MediaPipe with improved settings
   */
  const initializeFaceMesh = useCallback(async () => {
    try {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { Camera } = await import("@mediapipe/camera_utils");

      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      // Improved settings for better detection in various lighting
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      faceMesh.onResults(onFaceMeshResults);
      faceMeshRef.current = faceMesh;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
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
   * FUNCTION 3: Process Face Mesh results with brightness enhancement
   */
  const onFaceMeshResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced brightness and contrast
      ctx.filter = "brightness(1.1) contrast(1.05)";

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.filter = "none";

      // Draw lipstick if face detected
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        // Use ref to get latest opacity value
        drawLipstick(ctx, landmarks, canvas.width, canvas.height);
      } else {
        setFaceDetected(false);
      }
    },
    [currentColor] // Remove localOpacity from dependencies
  );

  /**
   * FUNCTION 4: Draw lipstick with smooth curves and realistic effects
   */
  const drawLipstick = (ctx, landmarks, width, height) => {
    const getLandmark = (index) => {
      const landmark = landmarks[index];
      return {
        x: width - landmark.x * width,
        y: landmark.y * height,
      };
    };

    const color = currentColor.startsWith("#")
      ? currentColor
      : `#${currentColor}`;

    // Get current opacity from ref
    const opacityValue = opacityRef.current;

    // Better color blending
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = color;
    ctx.globalAlpha = opacityValue;
    ctx.filter = "blur(1px)";

    // Helper for smooth curves
    const drawSmoothCurve = (points) => {
      if (points.length < 2) return;

      ctx.beginPath();
      const firstPoint = getLandmark(points[0]);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < points.length - 1; i++) {
        const current = getLandmark(points[i]);
        const next = getLandmark(points[i + 1]);
        const xMid = (current.x + next.x) / 2;
        const yMid = (current.y + next.y) / 2;
        ctx.quadraticCurveTo(current.x, current.y, xMid, yMid);
      }

      const lastPoint = getLandmark(points[points.length - 1]);
      ctx.lineTo(lastPoint.x, lastPoint.y);
    };

    // Draw upper lip
    drawSmoothCurve(UPPER_LIP_OUTER);
    const upperInnerReversed = [...UPPER_LIP_INNER].reverse();
    for (let i = 0; i < upperInnerReversed.length; i++) {
      const point = getLandmark(upperInnerReversed[i]);
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const next = getLandmark(
          upperInnerReversed[Math.min(i + 1, upperInnerReversed.length - 1)]
        );
        const xMid = (point.x + next.x) / 2;
        const yMid = (point.y + next.y) / 2;
        ctx.quadraticCurveTo(point.x, point.y, xMid, yMid);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw lower lip
    drawSmoothCurve(LOWER_LIP_OUTER);
    const lowerInnerReversed = [...LOWER_LIP_INNER].reverse();
    for (let i = 0; i < lowerInnerReversed.length; i++) {
      const point = getLandmark(lowerInnerReversed[i]);
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const next = getLandmark(
          lowerInnerReversed[Math.min(i + 1, lowerInnerReversed.length - 1)]
        );
        const xMid = (point.x + next.x) / 2;
        const yMid = (point.y + next.y) / 2;
        ctx.quadraticCurveTo(point.x, point.y, xMid, yMid);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = "none";

    // Glossy effect
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = opacityValue * 0.4;

    // Upper lip highlight
    const upperMid = getLandmark(0);
    const gradient = ctx.createRadialGradient(
      upperMid.x,
      upperMid.y - 3,
      2,
      upperMid.x,
      upperMid.y - 3,
      25
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(upperMid.x, upperMid.y - 3, 20, 0, Math.PI * 2);
    ctx.fill();

    // Lower lip highlight
    const lowerMid = getLandmark(17);
    const lowerGradient = ctx.createRadialGradient(
      lowerMid.x,
      lowerMid.y + 2,
      2,
      lowerMid.x,
      lowerMid.y + 2,
      15
    );
    lowerGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    lowerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = lowerGradient;
    ctx.beginPath();
    ctx.arc(lowerMid.x, lowerMid.y + 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  /**
   * FUNCTION 5: Stop camera and cleanup
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsCameraActive(false);
    setFaceDetected(false);
  }, []);

  /**
   * Update color when prop changes
   */
  useEffect(() => {
    setCurrentColor(colorHex);
  }, [colorHex]);

  /**
   * Update opacity ref when slider changes
   */
  useEffect(() => {
    opacityRef.current = localOpacity;
  }, [localOpacity]);

  /**
   * Start/stop camera with modal
   */
  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  if (!isActive) return null;

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
      {/* Header */}
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

      {/* Camera Container */}
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
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />

        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Loading */}
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

        {/* Error */}
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

        {/* Lighting Tip */}
        {isCameraActive && !isLoading && !faceDetected && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)",
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: "16px" }}>💡</span>
            <span>Face the camera directly with good lighting</span>
          </div>
        )}
      </div>

      {/* Opacity Slider */}
      {isCameraActive && !isLoading && (
        <div
          style={{
            position: "absolute",
            bottom: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "16px 24px",
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            width: "90%",
            maxWidth: "300px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
              minWidth: "60px",
            }}
          >
            Intensity
          </span>
          <input
            type="range"
            min="30"
            max="85"
            value={localOpacity * 100}
            onChange={(e) => setLocalOpacity(e.target.value / 100)}
            style={{
              flex: 1,
              height: "6px",
              borderRadius: "3px",
              outline: "none",
              cursor: "pointer",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#666",
              minWidth: "35px",
            }}
          >
            {Math.round(localOpacity * 100)}%
          </span>
        </div>
      )}

      {/* Color Indicator */}
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