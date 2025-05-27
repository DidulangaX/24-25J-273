// CircularProgress.js
import React, { useEffect, useRef } from "react";

const CircularProgress = ({
  percentage = 0,
  strokeWidth = 10,
  size = 120,
  color = "#3a7bd5",
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e6e6e6";
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // Calculate end angle based on percentage
    const endAngle = (percentage / 100) * 2 * Math.PI;

    // Animation variables
    let currentAngle = 0;
    const animationSpeed = endAngle / 60; // Adjust for animation speed

    // Animation function
    const drawProgress = () => {
      // Increment current angle
      currentAngle += animationSpeed;

      // Cap at target angle
      if (currentAngle > endAngle) {
        currentAngle = endAngle;
      }

      // Clear progress arc area
      ctx.clearRect(0, 0, size, size);

      // Redraw background
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#e6e6e6";
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      // Draw progress arc
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + currentAngle
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // Continue animation if not complete
      if (currentAngle < endAngle) {
        requestAnimationFrame(drawProgress);
      }
    };

    // Start animation
    drawProgress();
  }, [percentage, size, strokeWidth, color]);

  return <canvas ref={canvasRef} width={size} height={size} />;
};

export default CircularProgress;
