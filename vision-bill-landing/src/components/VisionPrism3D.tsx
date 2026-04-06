import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  ContactShadows, 
  MeshTransmissionMaterial,
  useTexture,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';

const Prism = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useTexture('./receipt_texture.png');
  
  // Custom glass config
  const config = useMemo(() => ({
    backside: true,
    backsideThickness: 0.3,
    transmission: 0.95,
    thickness: 0.1,
    roughness: 0.02,
    chromaticAberration: 0.05,
    anisotropy: 0.1,
    distortion: 0.1,
    distortionScale: 0.5,
    temporalDistortion: 0.1,
    clearcoat: 1,
    attenuationDistance: 1.0,
    attenuationColor: "#ffffff",
    color: "#ffffff",
    bg: "#050505"
  }), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle float and tilt
    mesh.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    mesh.current.rotation.y = Math.cos(t * 0.3) * 0.2;
    mesh.current.position.y = Math.sin(t * 0.5) * 0.05;
    
    // Mouse following
    const targetX = (state.mouse.x * Math.PI) / 10;
    const targetY = (state.mouse.y * Math.PI) / 10;
    mesh.current.rotation.y += (targetX - mesh.current.rotation.y) * 0.1;
    mesh.current.rotation.x += (-targetY - mesh.current.rotation.x) * 0.1;
  });

  return (
    <group>
      {/* The Refractive Glass Layer */}
      <mesh ref={mesh} scale={[2, 3, 0.05]}>
        <boxGeometry />
        <MeshTransmissionMaterial {...config} />
      </mesh>
      
      {/* The Actual Receipt Content Layer (slightly offset) */}
      <mesh scale={[1.9, 2.9, 0.01]} position={[0, 0, 0.03]} rotation={mesh.current?.rotation}>
        <planeGeometry />
        <meshBasicMaterial map={texture} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

const VisionPrism3D = memo(() => {
  return (
    <div className="w-full h-full">
      <Canvas 
        dpr={[1, 2]}
        gl={{ 
             alpha: true, 
             antialias: true, 
             powerPreference: "high-performance",
           }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#4ade80" />
        <pointLight position={[-10, -10, -10]} color="#38bdf8" intensity={1.5} />
        <directionalLight position={[0, 5, 5]} intensity={0.5} />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Prism />
        </Float>
        
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.3} 
          scale={10} 
          blur={3} 
          far={5} 
        />
      </Canvas>
    </div>
  );
});

export default VisionPrism3D;
