"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";

export const VirtualFoundationTryOn = ({
  colorHex = "#F5D7C3",
  coverage = 0.5,
  isActive = false,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [localCoverage, setLocalCoverage] = useState(coverage);
  const [faceDetected, setFaceDetected] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const colorRef = useRef(colorHex);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const coverageRef = useRef(coverage);
  const cameraUtilRef = useRef(null);

  useEffect(() => {
    colorRef.current = colorHex;
  }, [colorHex]);
  useEffect(() => {
    coverageRef.current = localCoverage;
  }, [localCoverage]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 245, g: 215, b: 195 };
  };

  const getAverageSkinColor = (ctx, landmarks, width, height) => {
    const samplePoints = [234, 93, 132, 58, 172, 454, 323, 361, 288, 397];
    let totalR = 0,
      totalG = 0,
      totalB = 0,
      samples = 0;

    samplePoints.forEach((index) => {
      const landmark = landmarks[index];
      const x = Math.floor((1 - landmark.x) * width);
      const y = Math.floor(landmark.y * height);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        totalR += pixel[0];
        totalG += pixel[1];
        totalB += pixel[2];
        samples++;
      }
    });

    if (samples === 0) return { r: 245, g: 215, b: 195 };
    return {
      r: Math.floor(totalR / samples),
      g: Math.floor(totalG / samples),
      b: Math.floor(totalB / samples),
    };
  };

  const mixColors = (skinColor, foundationColor, coverage) => {
    return {
      r: Math.floor(
        skinColor.r * (1 - coverage) + foundationColor.r * coverage
      ),
      g: Math.floor(
        skinColor.g * (1 - coverage) + foundationColor.g * coverage
      ),
      b: Math.floor(
        skinColor.b * (1 - coverage) + foundationColor.b * coverage
      ),
    };
  };

  const onFaceMeshResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;

    if (!canvas || !overlayCanvas || !video) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];
      applyFoundation(overlayCtx, ctx, landmarks, canvas.width, canvas.height);
    } else {
      setFaceDetected(false);
    }
  }, []);

  const applyFoundation = (overlayCtx, sourceCtx, landmarks, width, height) => {
    const getLandmark = (index) => {
      const landmark = landmarks[index];
      return {
        x: width - landmark.x * width,
        y: landmark.y * height,
      };
    };

    const currentColor = colorRef.current;
    const foundationRgb = hexToRgb(currentColor);
    const coverage = coverageRef.current;
    const skinColor = getAverageSkinColor(sourceCtx, landmarks, width, height);
    const blendedColor = mixColors(skinColor, foundationRgb, coverage * 0.38);

    overlayCtx.save();

    // MAIN FACE SILHOUETTE - Complete outline
    const faceSilhouette = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ];

    overlayCtx.beginPath();
    faceSilhouette.forEach((index, i) => {
      const point = getLandmark(index);
      if (i === 0) {
        overlayCtx.moveTo(point.x, point.y);
      } else {
        overlayCtx.lineTo(point.x, point.y);
      }
    });
    overlayCtx.closePath();

    // EXCLUDE LIPS - Both outer and inner
    const lipsOuter = [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17,
      84, 181, 91, 146,
    ];
    const lipsInner = [
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13,
      82, 81, 80, 191,
    ];

    [lipsOuter, lipsInner].forEach((lipRegion) => {
      overlayCtx.moveTo(
        getLandmark(lipRegion[0]).x,
        getLandmark(lipRegion[0]).y
      );
      lipRegion.forEach((index, i) => {
        if (i > 0) {
          const point = getLandmark(index);
          overlayCtx.lineTo(point.x, point.y);
        }
      });
      overlayCtx.closePath();
    });

    // EXCLUDE LEFT EYE AND EYEBROW - MASSIVE AREA
    const leftEyeFull = [
      // Eyebrow area - very wide
      70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 156, 124, 35, 111, 117, 118,
      119, 120, 121, 128,
      // Upper eyelid - expanded
      226, 247, 30, 29, 27, 28, 56, 190, 243, 25, 110, 24, 23, 22, 26, 112, 113,
      // Eye contour
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246,
      // Lower area
      130, 226, 113, 225, 224, 223, 222, 221, 189, 244, 233, 232, 231, 230, 229,
      228, 31,
      // Back to eyebrow
      46, 53, 52, 65, 55, 107, 66, 105, 63, 70,
    ];

    overlayCtx.moveTo(
      getLandmark(leftEyeFull[0]).x,
      getLandmark(leftEyeFull[0]).y
    );
    leftEyeFull.forEach((index, i) => {
      if (i > 0) {
        overlayCtx.lineTo(getLandmark(index).x, getLandmark(index).y);
      }
    });
    overlayCtx.closePath();

    // EXCLUDE RIGHT EYE AND EYEBROW - MASSIVE AREA
    const rightEyeFull = [
      // Eyebrow area - very wide
      300, 293, 334, 296, 336, 285, 295, 282, 283, 276, 383, 353, 265, 340, 346,
      347, 348, 349, 350, 357,
      // Upper eyelid - expanded
      446, 467, 260, 259, 257, 258, 286, 414, 463, 255, 339, 254, 253, 252, 256,
      341, 342,
      // Eye contour
      263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
      466,
      // Lower area
      359, 446, 342, 445, 444, 443, 442, 441, 413, 464, 453, 452, 451, 450, 449,
      448, 261,
      // Back to eyebrow
      276, 283, 282, 295, 285, 336, 296, 334, 293, 300,
    ];

    overlayCtx.moveTo(
      getLandmark(rightEyeFull[0]).x,
      getLandmark(rightEyeFull[0]).y
    );
    rightEyeFull.forEach((index, i) => {
      if (i > 0) {
        overlayCtx.lineTo(getLandmark(index).x, getLandmark(index).y);
      }
    });
    overlayCtx.closePath();

    overlayCtx.clip("evenodd");

    // ULTRA-SOFT APPLICATION - Multiple blur layers
    const centerX = width / 2;
    const centerY = height / 2.3;
    const radius = Math.max(width, height) / 1.15;

    // Layer 1: Maximum softness
    overlayCtx.filter = "blur(30px)";
    overlayCtx.globalCompositeOperation = "source-over";
    overlayCtx.globalAlpha = 0.45;

    const grad1 = overlayCtx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.05,
      centerX,
      centerY,
      radius * 1.1
    );
    grad1.addColorStop(
      0,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, ${
        coverage * 0.65
      })`
    );
    grad1.addColorStop(
      0.4,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, ${
        coverage * 0.5
      })`
    );
    grad1.addColorStop(
      0.7,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, ${
        coverage * 0.3
      })`
    );
    grad1.addColorStop(
      1,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, 0)`
    );
    overlayCtx.fillStyle = grad1;
    overlayCtx.fillRect(0, 0, width, height);

    // Layer 2: Color depth
    overlayCtx.filter = "blur(20px)";
    overlayCtx.globalCompositeOperation = "multiply";
    overlayCtx.globalAlpha = 0.28 * coverage;

    const grad2 = overlayCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 0.85
    );
    grad2.addColorStop(
      0,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, 0.75)`
    );
    grad2.addColorStop(
      0.6,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, 0.4)`
    );
    grad2.addColorStop(
      1,
      `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, 0)`
    );
    overlayCtx.fillStyle = grad2;
    overlayCtx.fillRect(0, 0, width, height);

    // Layer 3: Soft overlay
    overlayCtx.filter = "blur(18px)";
    overlayCtx.globalCompositeOperation = "overlay";
    overlayCtx.globalAlpha = 0.2 * coverage;
    overlayCtx.fillStyle = `rgba(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b}, 0.55)`;
    overlayCtx.fillRect(0, 0, width, height);

    // Layer 4: Subtle glow
    overlayCtx.filter = "blur(35px)";
    overlayCtx.globalCompositeOperation = "screen";
    overlayCtx.globalAlpha = 0.06 * coverage;

    const glowGrad = overlayCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 1.05
    );
    glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
    glowGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.12)");
    glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    overlayCtx.fillStyle = glowGrad;
    overlayCtx.fillRect(0, 0, width, height);

    // Minimal highlights
    overlayCtx.filter = "blur(14px)";
    overlayCtx.globalCompositeOperation = "screen";
    overlayCtx.globalAlpha = 0.09 * coverage;

    const highlights = [
      { point: getLandmark(168), size: 28 },
      { point: getLandmark(10), size: 38 },
      { point: getLandmark(152), size: 32 },
    ];

    highlights.forEach(({ point, size }) => {
      const hGrad = overlayCtx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        size
      );
      hGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      hGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
      hGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      overlayCtx.fillStyle = hGrad;
      overlayCtx.beginPath();
      overlayCtx.arc(point.x, point.y, size, 0, Math.PI * 2);
      overlayCtx.fill();
    });

    overlayCtx.restore();
    overlayCtx.globalCompositeOperation = "source-over";
    overlayCtx.globalAlpha = 1;
    overlayCtx.filter = "none";
  };

  const initializeFaceMesh = useCallback(async () => {
    try {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { Camera: CameraUtil } = await import("@mediapipe/camera_utils");

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onFaceMeshResults);
      faceMeshRef.current = faceMesh;

      if (videoRef.current) {
        const camera = new CameraUtil(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });

        cameraUtilRef.current = camera;
        await camera.start();
        setIsLoading(false);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Face Mesh error:", err);
      setError("Failed to load face detection. Please refresh.");
      setIsLoading(false);
    }
  }, [onFaceMeshResults]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(reject);
          };
        });
        await initializeFaceMesh();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, [initializeFaceMesh]);

  const stopCamera = useCallback(() => {
    if (cameraUtilRef.current) {
      cameraUtilRef.current.stop();
      cameraUtilRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    setIsCameraActive(false);
    setFaceDetected(false);
  }, []);

  useEffect(() => {
    if (isActive) startCamera();
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSplitPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      setSplitPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

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
          Foundation Try-On
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
          }}
        >
          ×
        </button>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          aspectRatio: "4/3",
          backgroundColor: "#000",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          cursor: isDragging ? "grabbing" : "default",
          touchAction: "none",
        }}
      >
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0,
          }}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `${splitPosition}%`,
            top: 0,
            bottom: 0,
            width: "4px",
            backgroundColor: "white",
            cursor: "ew-resize",
            transform: "translateX(-50%)",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "48px",
              height: "48px",
              backgroundColor: "white",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              cursor: "grab",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              <div
                style={{
                  width: "2px",
                  height: "20px",
                  backgroundColor: "#666",
                }}
              />
              <div
                style={{
                  width: "2px",
                  height: "20px",
                  backgroundColor: "#666",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            backdropFilter: "blur(10px)",
            opacity: splitPosition > 20 ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          AFTER
        </div>
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            backdropFilter: "blur(10px)",
            opacity: splitPosition < 80 ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          BEFORE
        </div>

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
              minWidth: "70px",
            }}
          >
            Coverage
          </span>
          <input
            type="range"
            min="20"
            max="90"
            value={localCoverage * 100}
            onChange={(e) => setLocalCoverage(e.target.value / 100)}
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
            {Math.round(localCoverage * 100)}%
          </span>
        </div>
      )}

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
            backgroundColor: colorRef.current,
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
          {colorRef.current.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
