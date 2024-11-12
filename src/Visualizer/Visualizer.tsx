import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { fragmentshader, vertexshader } from './shaders';
import { getDominantColors } from '../utils/utils';


interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioContext: React.RefObject<AudioContext | null>;
  isPlaying: boolean;
  albumImageUrl: string | null;
  audioFeatures: {
    tempo: number;
    energy: number;
  };
  isCurrentTrackAvailable: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({
  audioRef,
  audioContext,
  isPlaying,
  albumImageUrl,
  audioFeatures,
  isCurrentTrackAvailable
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bloomComposerRef = useRef<EffectComposer | null>(null);
  const hazeRef = useRef<THREE.Mesh[] | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const [visColors, setVisColors] = useState({
    primary: { r: 0, g: 0, b: 0 },
    secondary: { r: 0, g: 0, b: 0 },
    tertiary: { r: 0.3, g: 0.9, b: 0.3 },
  });
  const isCurrentTrackAvailableRef = useRef(!!isCurrentTrackAvailable);

  useEffect(() => {
    isCurrentTrackAvailableRef.current = !!isCurrentTrackAvailable;
  }, [isCurrentTrackAvailable]);

  const uniformsRef = useRef({
    u_time: { type: 'f', value: 0.8 },
    u_frequency: { type: 'f', value: 0.8 },
    u_red: { type: 'f', value: visColors.tertiary.r },
    u_green: { type: 'f', value: visColors.tertiary.g },
    u_blue: { type: 'f', value: visColors.tertiary.b },
  });

  const baseFrequency = 5; // Base frequency value for default animation

  // Extract colors from album art or set default colors
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
          const palette = getDominantColors(imageData, 3)
          const colorTheme = { primary: palette[0], secondary: palette[1], tertiary: palette[2] };
          setVisColors(colorTheme);
        }
      };
    } else {
      const defaultColors = {
        primary: { r: 0, g: 0, b: 0 },
        secondary: { r: 0, g: 0, b: 0 },
        tertiary: { r: 0.3, g: 0.9, b: 0.3 },
      };
      setVisColors(defaultColors);
    }
  }, [albumImageUrl]);

  useEffect(() => {
    // Setup Analyser when audioContext and audioRef are ready
    const setupAnalyser = () => {
      try {
        if (audioContext.current && audioRef.current && !analyserRef.current) {
          const analyser = audioContext.current.createAnalyser();
          analyser.fftSize = 256;
          const source = audioContext.current.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          source.connect(audioContext.current.destination);
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (error) {
        console.error('Error setting up analyser', error);
        // Reset analyser if audioRef or audioContext becomes unavailable
        analyserRef.current = null;
        dataArrayRef.current = null;
      }
    };

    setupAnalyser();

    // Monitor changes in audioRef and audioContext
    const intervalId = setInterval(() => {
      setupAnalyser();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [audioContext, audioRef]);

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

    // Visualizer Ball
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

    // Particle System for Haze as Spheres
    const hazeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const hazeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(1, 1, 1),
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color(visColors.secondary.r, visColors.secondary.g, visColors.secondary.b),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
    });

    const hazeParticles = 200;
    const hazeMeshes: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < hazeParticles; i++) {
      const sphere = new THREE.Mesh(hazeGeometry, hazeMaterial);
      sphere.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );

      // Random velocity for each particle
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );

      hazeMeshes.push(sphere);
      velocities.push(velocity);
      scene.add(sphere);
    }
    hazeRef.current = hazeMeshes;

    // Bloom Effect
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.4, 0.4);
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    bloomComposer.addPass(new OutputPass());

    bloomComposerRef.current = bloomComposer;

    // Animation Function
    const clock = new THREE.Clock();
    const beatInterval = 60 / audioFeatures.tempo;
    let lastBeatTime = clock.getElapsedTime();

    function updateFrequencyData() {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avgFrequency = dataArrayRef.current.reduce((sum, val) => sum + val, 0) / dataArrayRef.current.length;

        if (avgFrequency > 0) {
          uniformsRef.current.u_frequency.value = avgFrequency;
        } else {
          uniformsRef.current.u_frequency.value = baseFrequency;
        }
      }
    }

    function handleBeatAnimation(elapsedTime: number) {
      if (elapsedTime - lastBeatTime >= beatInterval) {
        lastBeatTime = elapsedTime;
        uniformsRef.current.u_frequency.value = Math.random() * 50 + 50;
        uniformsRef.current.u_frequency.value *= audioFeatures.energy * 2;
      }
    }

    function moveHazeParticles() {
      if (hazeRef.current) {
        hazeRef.current.forEach((sphere, i) => {
          sphere.position.add(velocities[i]);

          // Boundary check: bounce back if the sphere reaches scene bounds
          if (Math.abs(sphere.position.x) > 10) velocities[i].x = -velocities[i].x;
          if (Math.abs(sphere.position.y) > 10) velocities[i].y = -velocities[i].y;
          if (Math.abs(sphere.position.z) > 10) velocities[i].z = -velocities[i].z;
        });
      }
    }

    function updateAnimationTime(elapsedTime: number) {
      uniformsRef.current.u_time.value = elapsedTime;
    }

    function animate() {
      const elapsedTime = clock.getElapsedTime();

      if (analyserRef.current && dataArrayRef.current && !isCurrentTrackAvailableRef.current) {
        // If frequency data is available, use frequency-based animation
        updateFrequencyData();
      } else if (isCurrentTrackAvailableRef.current) {
        // If no frequency data but there is a current track, use beat-based animation
        handleBeatAnimation(elapsedTime);
      } else {
        // Default to base frequency if no current track or analyser
        uniformsRef.current.u_frequency.value = baseFrequency;
      }

      // Move the haze particles
      moveHazeParticles();

      // Update the animation time
      updateAnimationTime(elapsedTime);

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
      // Cleanup logic to stop animations and dispose of the renderer
      window.removeEventListener('resize', onResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, [audioRef, isPlaying, audioContext, visColors, isCurrentTrackAvailable]);

  useEffect(() => {
    if (sceneRef.current) {
      const { primary } = visColors;
      const backgroundColor = new THREE.Color(primary.r, primary.g, primary.b);
      sceneRef.current.background = backgroundColor;
    }

    if (uniformsRef.current) {
      const { tertiary } = visColors;
      const duration = 0.75;
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

    if (hazeRef.current) {
      const { secondary } = visColors;
      hazeRef.current.forEach((sphere) => {
        sphere.material.color = new THREE.Color(
          secondary.r + 0.1,
          secondary.g + 0.1,
          secondary.b + 0.1
        );
      });
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
