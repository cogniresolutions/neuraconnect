import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface Avatar3DProps {
  modelUrl?: string;
  isAnimating?: boolean;
  emotions?: {
    happiness?: number;
    sadness?: number;
    surprise?: number;
    anger?: number;
  };
}

const Avatar3D = ({ modelUrl, isAnimating = false, emotions = {} }: Avatar3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Load 3D model if URL is provided
    if (modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (modelRef.current) {
            scene.remove(modelRef.current);
          }

          const model = gltf.scene;
          model.scale.set(2, 2, 2);
          scene.add(model);
          modelRef.current = model;

          // Set up animations
          if (gltf.animations.length) {
            mixerRef.current = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              mixerRef.current?.clipAction(clip).play();
            });
          }

          setIsLoading(false);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          setIsLoading(false);
        }
      );
    } else {
      // Fallback to basic geometry
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      modelRef.current = sphere;
      setIsLoading(false);
    }

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      controls.update();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      if (modelRef.current && isAnimating) {
        modelRef.current.rotation.y += 0.01;
      }

      // Apply emotion-based animations
      if (modelRef.current && emotions) {
        // Example of emotion-based animation
        const emotionStrength = emotions.happiness || 0;
        if (modelRef.current.morphTargetInfluences) {
          modelRef.current.morphTargetInfluences[0] = emotionStrength;
        }
      }

      renderer.render(scene, camera);
    };
    animate(0);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelUrl, isAnimating, emotions]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-lg">
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default Avatar3D;