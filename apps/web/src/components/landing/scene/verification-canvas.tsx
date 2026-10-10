"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function Crate() {
  return (
    <group>
      <RoundedBox args={[1.5, 1.25, 1.5]} radius={0.055} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#c9a97c" roughness={0.86} metalness={0.02} />
      </RoundedBox>

      <mesh position={[0, 0.635, 0]}>
        <boxGeometry args={[1.5, 0.03, 1.5]} />
        <meshStandardMaterial color="#b08f63" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.16, 1.29, 1.52]} />
        <meshStandardMaterial color="#176b52" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.52, 1.29, 0.16]} />
        <meshStandardMaterial color="#176b52" roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.06, 0.762]}>
        <boxGeometry args={[0.62, 0.42, 0.02]} />
        <meshStandardMaterial color="#f5f7f5" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.12, 0.774]}>
        <boxGeometry args={[0.44, 0.05, 0.006]} />
        <meshStandardMaterial color="#176b52" />
      </mesh>
      <mesh position={[0, 0.0, 0.774]}>
        <boxGeometry args={[0.44, 0.05, 0.006]} />
        <meshStandardMaterial color="#d6f36a" />
      </mesh>
    </group>
  );
}

function ScanBeam() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const period = 6.5;
    const p = (state.clock.elapsedTime % period) / period;
    ref.current.position.y = THREE.MathUtils.lerp(-1.15, 1.15, p);
    const edge = Math.min(p / 0.16, (1 - p) / 0.16, 1);
    ref.current.scale.setScalar(0.9 + edge * 0.1);
  });
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 3.1]} />
        <meshBasicMaterial
          color="#d6f36a"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.57, 72]} />
        <meshBasicMaterial
          color="#176b52"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Marker({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.14;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const d = Math.min(delta, 0.05);
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, state.pointer.x * 0.34, 2.4, d);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -state.pointer.y * 0.16, 2.4, d);
  });
  return <group ref={ref}>{children}</group>;
}

export default function VerificationCanvas({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.4, 5.2], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#eef4ef", "#104b3b", 0.35]} />
      <directionalLight
        position={[3.2, 5, 4]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#e8f4ee" />
      <pointLight position={[0, -1.6, 2.2]} intensity={0.5} color="#d6f36a" />

      <Rig>
        <Float speed={1.05} rotationIntensity={0.22} floatIntensity={0.55}>
          <Crate />
        </Float>
        <ScanBeam />
        <Marker position={[-1.0, 0.42, 0.5]} color="#a85d10" />
        <Marker position={[1.0, -0.16, 0.42]} color="#d6f36a" />
      </Rig>

      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.32}
        scale={8}
        blur={2.6}
        far={3.2}
        color="#104b3b"
      />
    </Canvas>
  );
}
