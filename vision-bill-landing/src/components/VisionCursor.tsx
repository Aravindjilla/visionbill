import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const VisionCursor = () => {
  const [isPointer, setIsPointer] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // High-performance spring for zero-latency feel
  const springConfig = { damping: 40, stiffness: 450, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A'
      );
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Outer Follower Beam - Stays subtly behind the system cursor */}
      <motion.div
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          translateY: "-50%",
          translateX: "-50%",
        }}
        animate={{
          width: isPointer ? 80 : 32,
          height: isPointer ? 80 : 32,
          opacity: isPointer ? 0.6 : 0.3,
          borderColor: isPointer ? "rgba(74, 222, 128, 0.5)" : "rgba(56, 189, 248, 0.3)",
        }}
        className="fixed pointer-events-none z-[9999] rounded-full border-2 border-dashed mix-blend-screen"
      />
      
      {/* Soft Light Core - Provides the "Scanner" illumination */}
      <motion.div
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          translateY: "-50%",
          translateX: "-50%",
        }}
        animate={{
          width: isPointer ? 120 : 60,
          height: isPointer ? 120 : 60,
          backgroundColor: isPointer ? "rgba(74, 222, 128, 0.1)" : "rgba(56, 189, 248, 0.05)",
        }}
        className="fixed pointer-events-none z-[9998] rounded-full blur-3xl opacity-50"
      />
    </>
  );
};

export default VisionCursor;
