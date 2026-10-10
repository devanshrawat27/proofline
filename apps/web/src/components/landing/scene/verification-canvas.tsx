"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function ShippingLabel() {
  return (
    <group position={[0, -0.02, 0.762]}>
      <mesh>
        <boxGeometry args={[0.64, 0.44, 0.012]} />
        <meshStandardMaterial color="#f6f8f6" roughness={0.65} />
      </mesh>
      {/* header stripe */}
      <mesh position={[0, 0.16, 0.008]}>
        <boxGeometry args={[0.46, 0.045, 0.006]} />
        <meshStandardMaterial color="#176b52" roughness={0.5} />
      </mesh>
      {/* barcode */}
      {[-0.17, -0.13, -0.08, -0.04, 0.0, 0.05, 0.09, 0.14].map((x, i) => (
        <mesh key={x} position={[x, -0.06, 0.008]}>
          <boxGeometry args={[i % 2 === 0 ? 0.014 : 0.008, 0.14, 0.004]} />
          <meshStandardMaterial color="#17211d" roughness={0.6} />
        </mesh>
      ))}
      {/* lime accent */}
      <mesh position={[-0.1, 0.06, 0.008]}>
        <boxGeometry args={[0.26, 0.03, 0.005]} />
        <meshStandardMaterial color="#d6f36a" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Crate() {
  return (
    <group rotation={[0, -0.32, 0]}>
      {/* body */}
      <RoundedBox args={[1.5, 1.16, 1.5]} radius={0.045} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color="#cfa97a" roughness={0.82} metalness={0.02} />
      </RoundedBox>

      {/* vertical edge highlight (corrugated definition) */}
      {(
        [
          [-0.74, 0.74],
          [0.74, 0.74],
          [-0.74, -0.74],
          [0.74, -0.74],
        ] as const
      ).map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0, z]}>
          <boxGeometry args={[0.04, 1.16, 0.04]} />
          <meshStandardMaterial color="#b8915f" roughness={0.9} />
        </mesh>
      ))}

      {/* top flaps + packing seam (single line, no cross) */}
      <mesh position={[-0.38, 0.6, 0]} rotation={[0, 0, -0.015]}>
        <boxGeometry args={[0.74, 0.025, 1.48]} />
        <meshStandardMaterial color="#dcc199" roughness={0.88} />
      </mesh>
      <mesh position={[0.38, 0.6, 0]} rotation={[0, 0, 0.015]}>
        <boxGeometry args={[0.74, 0.025, 1.48]} />
        <meshStandardMaterial color="#d3b68c" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.616, 0]}>
        <boxGeometry args={[0.11, 0.01, 1.52]} />
        <meshStandardMaterial color="#c3a072" roughness={0.7} />
      </mesh>

      {/* top edge trim */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.52, 0.016, 1.52]} />
        <meshStandardMaterial color="#bd9767" roughness={0.95} />
      </mesh>

      <ShippingLabel />
    </group>
  );
}

function GlassPlatform() {
  return (
    <group position={[0, -0.62, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.42, 1.5, 0.05, 72]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.38}
          roughness={0.15}
          metalness={0.06}
        />
      </mesh>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.36, 1.42, 80]} />
        <meshStandardMaterial color="#176b52" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.29, 1.315, 80]} />
        <meshStandardMaterial color="#d6f36a" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ScanBeam() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const period = 9;
    const p = (state.clock.elapsedTime % period) / period;
    ref.current.position.y = THREE.MathUtils.lerp(-0.85, 0.95, Math.min(p * 1.12, 1));
    const edge = Math.min(p / 0.2, (1 - p) / 0.2, 1);
    ref.current.visible = edge > 0.02;
    ref.current.scale.setScalar(0.92 + edge * 0.08);
  });
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial
          color="#d6f36a"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.24, 1.29, 72]} />
        <meshBasicMaterial
          color="#176b52"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Rig({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const d = Math.min(delta, 0.05);
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, state.pointer.x * 0.2, 2, d);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -state.pointer.y * 0.08, 2, d);
  });
  return <group ref={ref}>{children}</group>;
}

export default function VerificationCanvas({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.75, 5.9], fov: 33 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMappingExposure: 1.15 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#eef4ef", "#104b3b", 0.45]} />
      <directionalLight position={[3.4, 5.2, 3.6]} intensity={1.75} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2.6, -1.6]} intensity={0.35} color="#e8f4ee" />
      <pointLight position={[0, 1.6, -3]} intensity={0.55} color="#d6f36a" />
      <pointLight position={[0, 3, 1.5]} intensity={0.25} color="#ffffff" />

      <group position={[0, 0.1, 0]}>
        <Rig>
          <Float speed={0.85} rotationIntensity={0.1} floatIntensity={0.28}>
            <Crate />
          </Float>
          <ScanBeam />
          <GlassPlatform />
        </Rig>
      </group>

      <ContactShadows position={[0, -0.56, 0]} opacity={0.3} scale={7} blur={2.8} far={3} color="#104b3b" />
    </Canvas>
  );
}
