"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

interface ParticleSystemProps {
  count?: number;
  progress: number; // 0 to 1 scroll
  vCenter?: [number, number, number]; // Vortex center (phone)
}

export default function ReceiptParticles({ count = 200, progress, vCenter = [0, 0, 0] }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const texture = useTexture("/receipt_texture.png"); // From the vision-bill-landing project

  // Initialize random data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const t = Math.random() * 100;
        const factor = 20 + Math.random() * 100;
        const speed = 0.01 + Math.random() / 200;
        const xFactor = -50 + Math.random() * 100;
        const yFactor = -50 + Math.random() * 100;
        const zFactor = -50 + Math.random() * 100;
        temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state: any) => {
    // Logic for Sequence 1 (Chaotic Orbit) vs Sequence 2 (Vortex)

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;

      // Update time
      t = particle.t += speed / 2;

      // Calculate base position (Chaotic Orbit - Sequence 1)
      const x = Math.cos(t) + Math.sin(t * 1) / 10 + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10;
      const y = Math.sin(t) + Math.cos(t * 2) / 10 + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10;
      const z = Math.cos(t) + Math.sin(t * 3) / 10 + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10;

      // Apply Vortex pull for Sequence 2 (20% - 40%)
      const vortexProgress = Math.min(Math.max((progress - 0.2) * 5, 0), 1); // Normalize to 0-1 between 20-40%
      
      const targetX = vCenter[0];
      const targetY = vCenter[1];
      const targetZ = vCenter[2];

      const currentX = THREE.MathUtils.lerp(x / 5, targetX, vortexProgress);
      const currentY = THREE.MathUtils.lerp(y / 5, targetY, vortexProgress);
      const currentZ = THREE.MathUtils.lerp(z / 5, targetZ, vortexProgress);

      const s = 1 - vortexProgress; // Fade scale out as it reaches the vortex

      dummy.position.set(currentX, currentY, currentZ);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.scale.set(0.5 * s, 0.5 * s, 0.5 * s);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1.5]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        alphaTest={0.1}
        color="#888" 
        side={THREE.DoubleSide} 
      />
    </instancedMesh>
  );
}
