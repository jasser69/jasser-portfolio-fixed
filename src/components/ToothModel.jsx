import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * 3D Mandible Model Component
 * Loads a realistic human mandible model from a GLB file.
 */
export default function ToothModel() {
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 5);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.8);
    fillLight.position.set(-5, 2, 2);
    scene.add(fillLight);
    
    const rimLight = new THREE.PointLight(0x0071e3, 2, 10);
    rimLight.position.set(-2, 4, -3);
    scene.add(rimLight);

    // --- Load Model ---
    const loader = new GLTFLoader();
    const modelUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663630931414/KQqRejFwkCRZLtas.glb";

    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      
      // Center and scale model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.5 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      
      // Apply premium materials to all meshes
      model.traverse((child) => {
        if (child.isMesh) {
          const isTeeth = child.name.toLowerCase().includes('teeth') || child.name.toLowerCase().includes('tooth');
          
          child.material = new THREE.MeshPhysicalMaterial({
            color: isTeeth ? 0xffffff : 0xf5f5f0,
            metalness: 0.05,
            roughness: isTeeth ? 0.15 : 0.4,
            clearcoat: isTeeth ? 1.0 : 0.2,
            clearcoatRoughness: 0.1,
            ior: 1.45,
            sheen: 0.5,
          });
          
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelRef.current = model;
      scene.add(model);
    }, undefined, (error) => {
      console.error('Error loading 3D model:', error);
    });

    // --- Interactions ---
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    let spinVelocity = 0;
    const onMouseDown = () => { spinVelocity = 0.4; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);

    // --- Animation ---
    let t = 0;
    let autoRotation = 0;
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      t += 0.005;

      if (modelRef.current) {
        // Floating
        modelRef.current.position.y = Math.sin(t) * 0.1;
        
        // Rotation
        targetRotationRef.current.x += (mouseRef.current.y * 0.2 - targetRotationRef.current.x) * 0.05;
        targetRotationRef.current.y += (mouseRef.current.x * 0.4 - targetRotationRef.current.y) * 0.05;
        
        autoRotation += 0.003 + spinVelocity;
        spinVelocity *= 0.96;
        
        modelRef.current.rotation.x = targetRotationRef.current.x;
        modelRef.current.rotation.y = targetRotationRef.current.y + autoRotation;
        modelRef.current.rotation.z = Math.cos(t * 0.5) * 0.05;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', onResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[450px] cursor-grab active:cursor-grabbing"
      style={{ 
        background: 'radial-gradient(circle at center, rgba(0,113,227,0.1) 0%, transparent 70%)',
        filter: 'drop-shadow(0 0 30px rgba(0,113,227,0.15))'
      }}
    />
  );
}
