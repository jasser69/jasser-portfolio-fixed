import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 3D Tooth Model Component - Premium Version
 * Uses MeshPhysicalMaterial for realistic enamel/ceramic look.
 * Includes advanced lighting and smooth animations.
 */
export default function ToothModel() {
  const containerRef = useRef(null);
  const toothGroupRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Tone mapping for more realistic colors
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    containerRef.current.appendChild(renderer.domElement);

    // --- Tooth geometry via LatheGeometry ---
    const toothGroup = new THREE.Group();
    toothGroupRef.current = toothGroup;
    scene.add(toothGroup);

    // Premium Enamel Material
    const toothMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.15,
      transmission: 0.1, // Subtle translucency
      thickness: 0.5,
      ior: 1.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      sheen: 0.5,
      sheenRoughness: 0.2,
      sheenColor: new THREE.Color(0xffffff),
      specularIntensity: 0.8,
    });

    // Crown profile (right-side silhouette, y goes up) - Refined for more anatomical look
    const crownPts = [
      new THREE.Vector2(0.0,  1.05),
      new THREE.Vector2(0.28, 1.02),
      new THREE.Vector2(0.52, 0.88),
      new THREE.Vector2(0.62, 0.60),
      new THREE.Vector2(0.64, 0.30),
      new THREE.Vector2(0.58, 0.08),
      new THREE.Vector2(0.54, 0.0),
    ];
    const crownGeo = new THREE.LatheGeometry(crownPts, 72);
    const crownMesh = new THREE.Mesh(crownGeo, toothMat);
    toothGroup.add(crownMesh);

    // Root profile - Slightly more tapered
    const rootPts = [
      new THREE.Vector2(0.54,  0.0),
      new THREE.Vector2(0.48, -0.35),
      new THREE.Vector2(0.36, -0.75),
      new THREE.Vector2(0.22, -1.10),
      new THREE.Vector2(0.08, -1.40),
      new THREE.Vector2(0.0,  -1.50),
    ];
    const rootGeo = new THREE.LatheGeometry(rootPts, 72);
    const rootMesh = new THREE.Mesh(rootGeo, toothMat);
    toothGroup.add(rootMesh);

    // Subtle enamel ridge - refined
    const ridgeMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xf0f0f0, 
      roughness: 0.3,
      clearcoat: 0.5 
    });
    const ridgeGeo = new THREE.TorusGeometry(0.52, 0.02, 16, 64);
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.y = 0.05;
    ridge.rotation.x = Math.PI / 2;
    toothGroup.add(ridge);

    toothGroup.position.y = 0.15;

    // --- Advanced Lighting ---
    // Ambient light for base visibility
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    
    // Main Key Light (Warm)
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    
    // Fill Light (Cool)
    const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.6);
    fillLight.position.set(-5, 0, 2);
    scene.add(fillLight);
    
    // Rim Light (Accent Blue)
    const rimLight = new THREE.PointLight(0x0071e3, 1.5, 10);
    rimLight.position.set(-2, 3, -3);
    scene.add(rimLight);

    // Top Highlight
    const topLight = new THREE.SpotLight(0xffffff, 1);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // Click Interaction - Spin effect
    let spinVelocity = 0;
    const onMouseDown = () => {
      spinVelocity = 0.5;
    };
    window.addEventListener('mousedown', onMouseDown);

    // Mouse Interaction
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let t = 0;
    let autoRotation = 0;
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      t += 0.008; // Slower, more elegant floating

      if (toothGroupRef.current) {
        // Floating effect
        toothGroupRef.current.position.y = 0.15 + Math.sin(t) * 0.15;
        
        // Smooth rotation following mouse
        targetRotationRef.current.x += (mouseRef.current.y * 0.3 - targetRotationRef.current.x) * 0.04;
        targetRotationRef.current.y += (mouseRef.current.x * 0.5 - targetRotationRef.current.y) * 0.04;
        
        toothGroupRef.current.rotation.x = targetRotationRef.current.x;
        
        // Base rotation + mouse influence + spin effect
        autoRotation += 0.005 + spinVelocity;
        spinVelocity *= 0.95; // Friction
        
        toothGroupRef.current.rotation.y = targetRotationRef.current.y + autoRotation;
        
        // Subtle tilt
        toothGroupRef.current.rotation.z = Math.cos(t * 0.3) * 0.08;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      [crownGeo, rootGeo, ridgeGeo, toothMat, ridgeMat].forEach(o => o.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[450px] relative z-10"
      style={{ 
        background: 'radial-gradient(circle at center, rgba(0,113,227,0.15) 0%, transparent 75%)',
        filter: 'drop-shadow(0 0 20px rgba(0,113,227,0.2))'
      }}
    />
  );
}
