import { useRef, useState, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  ContactShadows, 
  Environment,
  MeshTransmissionMaterial
} from '@react-three/drei';
import * as THREE from 'three';

const Sphere = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.1;
    mesh.current.rotation.y = t * 0.15;
    mesh.current.position.y = Math.sin(t * 0.5) * 0.1;
  });

  const config = useMemo(() => ({
    backside: true,
    backsideThickness: 0.3,
    transmission: 1,
    thickness: 0.6,
    roughness: 0.05,
    chromaticAberration: 0.05,
    anisotropy: 0.1,
    distortion: 0.2,
    distortionScale: 0.5,
    temporalDistortion: 0.1,
    clearcoat: 1,
    attenuationDistance: 0.5,
    attenuationColor: "#ffffff",
    color: "#38bdf8",
    bg: "#050505"
  }), []);

  return (
    <mesh
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      scale={hovered ? 1.1 : 1}
    >
      <sphereGeometry args={[1.5, 64, 64]} />
      <MeshTransmissionMaterial 
        {...config} 
        color={hovered ? "#4ade80" : "#38bdf8"} 
        emissive={hovered ? "#4ade80" : "#1e40af"}
        emissiveIntensity={hovered ? 0.8 : 0.4}
      />
    </mesh>
  );
};

const VisionSphere3D = memo(() => {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 40 }} 
        dpr={[1, 1.2]}
        gl={{ 
             alpha: true, 
             antialias: false, 
             powerPreference: "high-performance",
             preserveDrawingBuffer: true
           }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={3} color="#4ade80" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={3} color="#38bdf8" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
           <Sphere />
        </Float>
        
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.4} 
          scale={8} 
          blur={2} 
          far={4} 
        />
      </Canvas>
    </div>
  );
});

export default VisionSphere3D;
