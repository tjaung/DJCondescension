import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { fragmentshader, vertexshader } from './shaders';
import { getImageColors, getThreeColors, quantization } from '../utils/utils';

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioContext: React.RefObject<AudioContext | null>;
  isPlaying: boolean;
  albumImageUrl: string | null; // Add album image URL as a prop
  audioFeatures: {
    tempo: number; // BPM of the current track
    energy: number; // Energy level of the track
  };
}

const Visualizer: React.FC<VisualizerProps> = ({ audioRef, audioContext, isPlaying, albumImageUrl, audioFeatures }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bloomComposerRef = useRef<EffectComposer | null>(null);
  const hazeMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const hazeRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  
  const [visColors, setVisColors] = useState({
    primary: { r: 0, g: 0, b: 0 },
    secondary: { r: 0, g: 0, b: 0 },
    tertiary: { r: 0.3, g: 0.9, b: 0.3 }
  });

  const uniformsRef = useRef({
    u_time: { type: 'f', value: 0.8 },
    u_frequency: { type: 'f', value: 0.8 },
    u_red: { type: 'f', value: visColors.tertiary.r },
    u_green: { type: 'f', value: visColors.tertiary.g },
    u_blue: { type: 'f', value: visColors.tertiary.b },
  });

  // Extract colors from album art
  useEffect(() => {
    if (albumImageUrl) {
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = albumImageUrl;

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = getImageColors(imageData);
          const palette = getThreeColors(quantization(colors, 1));
          const colorTheme = { primary: palette[0], secondary: palette[1], tertiary: palette[2] };
          setVisColors(colorTheme);
        }
      };
    }
  }, [albumImageUrl]);

  useEffect(() => {
    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -4, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const geometry = new THREE.IcosahedronGeometry(2.6, 30);

    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: vertexshader,
      fragmentShader: fragmentshader,
      wireframe: true,
    });

    const ball = new THREE.Mesh(geometry, material);
    group.add(ball);
    scene.add(group);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Particle System for Haze
    const hazeGeometry = new THREE.BufferGeometry();
    const hazeParticles = 500;
    const positions = new Float32Array(hazeParticles * 3);
    for (let i = 0; i < hazeParticles; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    hazeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const hazeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(visColors.tertiary.r, visColors.tertiary.g, visColors.tertiary.b),
      size: 0.3,
      transparent: true,
      opacity: 0.1,
    });

    hazeMaterialRef.current = hazeMaterial; // Save reference to the material
    const hazeParticlesMesh = new THREE.Points(hazeGeometry, hazeMaterial);
    scene.add(hazeParticlesMesh);
    hazeRef.current = hazeParticlesMesh;

    // Bloom Effect
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.8, 0.7);
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    bloomComposer.addPass(new OutputPass());

    bloomComposerRef.current = bloomComposer;

    // Animation Function
    const clock = new THREE.Clock();
    const beatInterval = 60 / audioFeatures.tempo; // Time between beats in seconds
    let lastBeatTime = clock.getElapsedTime(); // Track time of the last beat

    function animate() {
      const elapsedTime = clock.getElapsedTime();

      // Check if it's time to trigger a beat-based animation
      if (elapsedTime - lastBeatTime >= beatInterval) {
        lastBeatTime = elapsedTime;

        // Trigger beat-based animation
        uniformsRef.current.u_frequency.value = Math.random() * 50 + 50; // Example: randomize frequency on each beat

        // Optional: use energy to determine how strong the effect should be
        const energyEffect = audioFeatures.energy * 2; // Scale the energy for visual impact
        uniformsRef.current.u_frequency.value *= energyEffect;
      }

      // Rotate the particle system for the haze effect
      hazeParticlesMesh.rotation.y += 0.001;

      // Update uniforms for continuous animation
      uniformsRef.current.u_time.value = elapsedTime;

      // Render the scene
      bloomComposer.render();
      requestAnimationFrame(animate);
    }
    animate();

    // Handle Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener('resize', onResize);
    };
  }, [audioRef, isPlaying, audioContext, visColors]); // Added `visColors` to dependencies

  // Update colors smoothly whenever the `colors` prop changes
  useEffect(() => {
    if (sceneRef.current) {
      const { primary } = visColors;
      const backgroundColor = new THREE.Color(primary.r, primary.g, primary.b);
      sceneRef.current.background = backgroundColor;
    }

    if (uniformsRef.current) {
      const { tertiary } = visColors;
      const duration = 0.75; // duration of the transition in seconds
      const start = {
        r: uniformsRef.current.u_red.value,
        g: uniformsRef.current.u_green.value,
        b: uniformsRef.current.u_blue.value,
      };
      const end = { r: tertiary.r, g: tertiary.g, b: tertiary.b };
      let startTime: number | null = null;

      const smoothTransition = (time: number) => {
        if (startTime === null) startTime = time;
        const elapsed = (time - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);

        uniformsRef.current.u_red.value = start.r + t * (end.r - start.r);
        uniformsRef.current.u_green.value = start.g + t * (end.g - start.g);
        uniformsRef.current.u_blue.value = start.b + t * (end.b - start.b);

        if (t < 1) {
          requestAnimationFrame(smoothTransition);
        }
      };
      requestAnimationFrame(smoothTransition);
    }

    if (hazeMaterialRef.current) {
      // Update the particle system color to the tertiary color
      const { secondary } = visColors;
      hazeMaterialRef.current.color = new THREE.Color(secondary.r, secondary.g, secondary.b);
    }
  }, [visColors]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        backgroundColor: 'black',
      }}
    />
  );
};

export default Visualizer;
