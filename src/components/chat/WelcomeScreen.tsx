"use client";

import { useState, useEffect, useRef } from "react";

export function WelcomeScreen() {
  const [currentTime, setCurrentTime] = useState("");
  const [ampm, setAmpm] = useState("");
  const mascotRef = useRef<HTMLDivElement>(null);
  const [pupils, setPupils] = useState({ leftX: 42, leftY: 51, rightX: 78, rightY: 51 });
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const period = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${displayHours}:${minutes}`);
      setAmpm(period);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cursor following eyes logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      // Distance and angle from mascot center to mouse
      const dx = e.clientX - mascotCenterX;
      const dy = e.clientY - mascotCenterY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);

      // Max travel radius for pupil inside the white sclera ellipse (rx=12, ry=13, pupil r=3.6)
      const intensity = Math.min(1, dist / 250);
      const maxOffsetX = 5.6;
      const maxOffsetY = 6.4;

      const offsetX = Math.cos(angle) * maxOffsetX * intensity;
      const offsetY = Math.sin(angle) * maxOffsetY * intensity;

      setPupils({
        leftX: 42 + offsetX,
        leftY: 51 + offsetY,
        rightX: 78 + offsetX,
        rightY: 51 + offsetY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Natural occasional blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Official Magica Mascot with cursor-following eyes */}
      <div
        ref={mascotRef}
        className="mx-auto block size-10 mb-3 select-none transition-transform hover:scale-105 duration-200"
        role="img"
        aria-label="Magica mascot"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-full h-full block"
        >
          {/* M-shaped mascot body */}
          <path
            d="M16 95V44C16 31 27 23 39 27C43 17 57 14 65 22C75 14 91 20 91 33C101 34 107 42 105 52C104 59 100 63 96 66V95C96 104 90 108 84 108C77 108 72 103 72 95V72L67 80C63 87 56 87 52 80L47 72V95C47 104 41 108 32 108C23 108 16 103 16 95Z"
            fill="#4f46e5"
          />

          {/* Eye sockets & cursor-following pupils */}
          <g
            style={{
              transformOrigin: "60px 51px",
              transform: isBlinking ? "scaleY(0.1)" : "scaleY(1)",
              transition: isBlinking ? "transform 0.08s ease-in" : "transform 0.12s ease-out",
            }}
          >
            {/* Left & right white eye sclera */}
            <ellipse cx="42" cy="51" rx="12" ry="13" fill="white" />
            <ellipse cx="78" cy="51" rx="12" ry="13" fill="white" />

            {/* Pupils tracking mouse */}
            {!isBlinking && (
              <>
                <circle cx={pupils.leftX} cy={pupils.leftY} r="3.6" fill="#202024" />
                <circle cx={pupils.rightX} cy={pupils.rightY} r="3.6" fill="#202024" />
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Time */}
      <div className="mb-2 text-sm text-muted-foreground flex items-baseline justify-center gap-1 font-medium">
        <span>{currentTime}</span>
        <span className="text-xs">{ampm}</span>
      </div>

      {/* Heading */}
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
        Your AI worker
      </h1>

      {/* Subheading */}
      <p className="text-sm text-muted-foreground">
        Work at the speed of thought.
      </p>
    </div>
  );
}
