"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Canvas, useThree } from "@react-three/fiber"
import { PointMaterial, Points } from "@react-three/drei"
import type * as THREE from "three"
import { inSphere } from "maath/random"

// Particle system component
function ParticleSystem({ count = 1000 }) {
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width

  // Generate random points in a sphere
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3)
    inSphere(temp, { radius: 1.5 })
    return temp
  }, [count])

  // Reference to the points
  const pointsRef = useRef<THREE.Points>(null!)

  // Animation frame
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += delta * 0.01
      pointsRef.current.rotation.y += delta * 0.01
    }
  })

  return (
    <Points ref={pointsRef} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.005 * aspect}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}

// Main component that renders the canvas
export function Particles() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleSystem />
      </Canvas>
    </div>
  )
}
