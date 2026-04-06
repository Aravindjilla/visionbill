"use client";

import React, { useRef } from "react";
import { useGLTF, Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface PhoneProps {
  screenTexture?: string;
  rotation?: [number, number, number];
  position?: [number, number, number];
  scale?: number;
  progress?: number; // 0 to 1 scroll progress
}

const PHONE_URL = "https://vazxmixjsiawhamurptp.supabase.co/storage/v1/object/public/models/iphone-x/model.gltf";

export default function Phone({ progress = 0, ...props }: PhoneProps) {
  const { scene } = useGLTF(PHONE_URL);
  const phoneRef = useRef<THREE.Group>(null);

  // Animation logic based on progress can be added here or handled by the parent
  // using GSAP to drive the props.

  return (
    <group ref={phoneRef} {...props} dispose={null}>
      <primitive object={scene} />
      
      {/* Screen Overlay (Simulated via Html or a Plane) */}
      {/* In a real high-fidelity app, we'd replace the screen material in the GLTF */}
    </group>
  );
}

useGLTF.preload(PHONE_URL);
