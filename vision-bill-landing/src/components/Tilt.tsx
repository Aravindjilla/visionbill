import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tilt = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [gloss, setGloss] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width - 0.5) * 20; // max 20deg
    const yPct = (mouseY / height - 0.5) * -20; // max 20deg

    setRotation({ x: yPct, y: xPct });
    setGloss({ x: (mouseX / width - 0.5) * 40, y: (mouseY / height - 0.5) * 40 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      style={{
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      <div 
        style={{ transform: "translateZ(50px)" }} 
        className="w-full h-full"
      >
        {children}
      </div>
      
      {/* Glossy Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
              x: `${gloss.x}%`,
              y: `${gloss.y}%`,
            }}
            className="absolute inset-0 pointer-events-none z-10"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tilt;
