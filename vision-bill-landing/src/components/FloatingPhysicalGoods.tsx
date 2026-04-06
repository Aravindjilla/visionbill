import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const MilkCarton = ({ position }: any) => {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += 0.01;
    mesh.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
  });

  return (
    <mesh ref={mesh} position={position} scale={[0.4, 0.8, 0.4]}>
       <boxGeometry />
       <MeshWobbleMaterial factor={0.1} speed={1} color="#ffffff" opacity={0.6} transparent />
    </mesh>
  );
};

const GroceryCard = ({ position, rotation }: any) => {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.position.y += Math.cos(state.clock.elapsedTime + position[1]) * 0.003;
  });

  return (
    <mesh ref={mesh} position={position} rotation={rotation} scale={[0.6, 0.4, 0.02]}>
       <boxGeometry />
       <meshStandardMaterial color="#4ade80" emissive="#10b981" emissiveIntensity={0.5} />
    </mesh>
  );
};

const FloatingPhysicalGoods = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={30} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#4ade80" />
        
        <Float speed={5} rotationIntensity={2} floatIntensity={2}>
           <MilkCarton position={[-3, 2, -5]} />
           <MilkCarton position={[4, -1, -3]} />
           <GroceryCard position={[-2, -3, -2]} rotation={[Math.PI / 4, 0, Math.PI / 6]} />
           <GroceryCard position={[3, 3, -4]} rotation={[-Math.PI / 4, Math.PI / 4, 0]} />
        </Float>
      </Canvas>
    </div>
  );
};

export default FloatingPhysicalGoods;
