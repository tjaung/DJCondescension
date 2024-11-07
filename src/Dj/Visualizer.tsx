// Visualizer.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioContext: React.RefObject<AudioContext | null>;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioRef, audioContext, isPlaying }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (!mountRef.current || !audioRef.current || !audioContext.current) return;

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create Wave Geometry in a Circle
    const numPoints = 128;
    const radius = 5;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      positions[i * 3] = radius * Math.cos(angle);  // x position in a circle
      positions[i * 3 + 1] = 0;                     // y position (updated by audio data)
      positions[i * 3 + 2] = radius * Math.sin(angle); // z position in a circle
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create Gradient Material
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 2,
    });
    const line = new THREE.Line(geometry, material);
    lineRef.current = line;
    scene.add(line);

    // Add glow effect with emissive light
    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    // Initialize Audio Analyser
    if (!audioSourceRef.current) {
      audioSourceRef.current = audioContext.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioContext.current.createAnalyser();
      audioSourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.current.destination);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    // Base animation speed for non-audio movement
    let baseRotationSpeed = 0.002;
    let basePulseHeight = 0.5;

    // Animation Function
    const animate = () => {
      // Base rotation effect (always rotating)
      line.rotation.z += baseRotationSpeed;

      if (lineRef.current && dataArrayRef.current) {
        const positions = lineRef.current.geometry.attributes.position.array as Float32Array;

        if (isPlaying && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Adjust heights based on audio data
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const y = (dataArrayRef.current[i] / 255) * 5 - 2.5; // Scale for wave height
            positions[i * 3 + 1] = y; // Set y position based on audio data
          }
        } else {
          // If not playing, use a base pulsing effect
          for (let i = 0; i < numPoints; i++) {
            const pulse = Math.sin(Date.now() * 0.001 + i * 0.1) * basePulseHeight; // Sine wave pulse
            positions[i * 3 + 1] = pulse; // Set y position with pulsing effect
          }
        }

        lineRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [audioRef, isPlaying, audioContext]);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundColor: 'black' }} />;
};

export default Visualizer;
