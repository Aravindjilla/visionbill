import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  Environment, 
  ContactShadows,
  MeshDistortMaterial
} from '@react-three/drei';
import * as THREE from 'three';

const Shape = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.2;
    mesh.current.rotation.y = t * 0.3;
    mesh.current.scale.setScalar(hovered ? 1.2 : 1);
  });

  return (
    <mesh
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <MeshDistortMaterial
        color={hovered ? "#4ade80" : "#22c55e"}
        speed={2}
        distort={0.4}
        radius={1}
        roughness={0}
        metalness={1}
        emissive="#000000"
      />
    </mesh>
  );
};

const SavingsPulse3D = () => {
  return (
    <div className="w-full h-full min-h-[400px]" style={{ background: 'transparent' }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 40 }} 
        dpr={[1, 1.5]}
        gl={{ 
          alpha: true, 
          antialias: true,
          clearColor: 0x000000,
          clearAlpha: 0
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color="#4ade80" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#38bdf8" />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" />
        
        <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
           <Shape />
        </Float>
        
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.4} 
          scale={8} 
          blur={1.5} 
          far={4} 
        />
      </Canvas>
    </div>
  );
};

export default SavingsPulse3D;
