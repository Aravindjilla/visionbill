"use client";

import React, { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows, OrbitControls, useHelper } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import * as THREE from "three";
import Phone from "./3d/Phone";
import ReceiptParticles from "./3d/ReceiptParticles";

gsap.registerPlugin(ScrollTrigger);

export default function VisionBillImmersiveScene() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById("main-section");
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self: any) => {
        setScrollProgress(self.progress);
      },
    });
  }, []);

  return (
    <div ref={canvasContainerRef} className="fixed inset-0 pointer-events-none z-0 bg-[#F8F9FA]">
      <Canvas shadows gl={{ antialias: true, alpha: true, depth: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#1A73E8" />
        <spotLight position={[-10, 10, 10]} intensity={1} color="#34A853" />

        <Suspense fallback={null}>
            {/* The Smartphone Model */}
            <Phone 
                progress={scrollProgress} 
                scale={phoneScale(scrollProgress)} 
                position={phonePosition(scrollProgress)}
                rotation={phoneRotation(scrollProgress)}
            />

            {/* Sequence 1 & 2 Particles */}
            <ReceiptParticles progress={scrollProgress} vCenter={[0, 0, 0]} />

            {/* Sequence 3: Product Icons */}
            <ProductIcons progress={scrollProgress} />

            {/* Sequence 4: Social Avatars */}
            <UserAvatars progress={scrollProgress} />


            {/* Polished Shadows */}
            <ContactShadows 
                position={[0, -4.5, 0]} 
                opacity={0.4} 
                scale={20} 
                blur={2} 
                far={4.5} 
            />
        </Suspense>

        {/* Parallax Cam movement */}
        <SceneCam parallaxIntensity={0.1} />
      </Canvas>
    </div>
  );
}

// Scaffolding for GSAP-like dynamic transforms based on 0-1 progress
const phonePosition = (p: number): [number, number, number] => {
  if (p < 0.2) return [0, 0, 0]; // Sequence 1
  if (p < 0.4) return [0, 0.5, 2]; // Sequence 2: Bring forward for vortex
  if (p < 0.6) return [0, 0, 0]; // Sequence 3
  if (p < 0.8) return [0, 0, 0]; // Sequence 4
  return [4, -3, 0]; // Sequence 5: Move to bottom right
};

const phoneRotation = (p: number): [number, number, number] => {
  if (p < 0.2) return [0, Math.sin(p * 2) * 0.1, 0];
  if (p < 0.4) return [-0.5, 0, 0]; // Tilt down for vortex pull
  if (p < 0.6) return [0, p * Math.PI, 0]; // Rotate for inventory list
  if (p < 0.8) return [0, Math.sin(p * 10) * 0.2, 0]; // Social Wiggle
  return [0, Math.PI * 2, 0]; // CTA
};

const phoneScale = (p: number) => {
  if (p > 0.8) return 0.7; // Shrink for CTA
  if (p > 0.3) return 1.1; // Pop for detail
  return 1;
};

function ProductIcons({ progress }: { progress: number }) {
  const p = Math.min(Math.max((progress - 0.4) * 5, 0), 1); // 40-60%
  const dummy = new THREE.Object3D();
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  useFrame((state: any) => {
    if (!meshRef.current) return;
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + state.clock.getElapsedTime();
        const r = 2 * p;
        dummy.position.set(Math.cos(angle) * r, Math.sin(angle) * r + (1 - p) * 2, 0);
        dummy.scale.set(p * 0.4, p * 0.4, p * 0.4);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 5]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#1A73E8" emissive="#1A73E8" emissiveIntensity={2} />
    </instancedMesh>
  );
}

function UserAvatars({ progress }: { progress: number }) {
    const p = Math.min(Math.max((progress - 0.6) * 5, 0), 1); // 60-80%
    return (
        <group opacity={p}>
            <mesh position={[-3, 1, -2]} scale={p}>
                <sphereGeometry args={[0.8]} />
                <meshStandardMaterial color="#0A0A0A" />
            </mesh>
            <mesh position={[3, 1, -2]} scale={p}>
                <sphereGeometry args={[0.8]} />
                <meshStandardMaterial color="#0A0A0A" />
            </mesh>
            <mesh position={[0, 4, -5]} scale={p}>
                <sphereGeometry args={[0.8]} />
                <meshStandardMaterial color="#0A0A0A" />
            </mesh>
        </group>
    )
}


// Camera parallax Logic
function SceneCam({ parallaxIntensity = 0.2 }) {
    const { camera, mouse } = useThree();
    useFrame(() => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * parallaxIntensity, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * parallaxIntensity, 0.1);
        camera.lookAt(0, 0, 0);
    });
    return null;
}
