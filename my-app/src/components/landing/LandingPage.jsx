import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';
import {
  User, Menu, X, ArrowRight, Shield, Globe, Users, Play, Building2,
  BarChart3, Calculator, FileText, PieChart, Star, Check, ChevronDown, Award, TrendingUp
} from 'lucide-react';
import { ref, runTransaction, onValue } from "firebase/database";
import { db } from "../Visister/firebase";

gsap.registerPlugin(ScrollTrigger, TextPlugin, useGSAP);

/* --- 1. Custom Scramble Text Component --- */
const CustomScrambleText = ({ text, className, timeline, position = "<" }) => {
  const textRef = useRef(null);

  useGSAP(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    const targetText = text;
    const el = textRef.current;

    const startScramble = () => {
      let iterations = 0;
      const interval = setInterval(() => {
        if (!el) {
          clearInterval(interval);
          return;
        }
        el.innerText = targetText.split("")
          .map((letter, index) => {
            if (index < iterations) {
              return targetText[index];
            }
            if (targetText[index] === " ") return " ";
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join("");
        if (iterations >= targetText.length) {
          clearInterval(interval);
        }
        iterations += 1 / 3;
      }, 30);
    };

    if (timeline) {
      // Add a clean zero-duration animation to the timeline that triggers the scramble
      timeline.add(() => startScramble(), position);
    } else {
      // Fallback to basic scroll trigger if no timeline provided
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: startScramble
      });
    }
  }, [text, timeline, position]);

  return <span ref={textRef} className={className}>{"\u00A0"}</span>;
};

/* --- 2. Three.js Background Component --- */
const Background3D = ({ mainContentRef }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimized pixel ratio

    // Main grouping
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    const bookGroup = new THREE.Group();
    floatingGroup.add(bookGroup);

    // --- Procedural Textures ---
    const createLeatherTexture = (text, isFront, isBack) => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1024;
      const ctx = cvs.getContext('2d');

      // Rich blue gradient for realism (Navy to Midnight Blue)
      const grad = ctx.createRadialGradient(512, 512, 200, 512, 512, 800);
      grad.addColorStop(0, '#1e3a8a'); // Lighter navy center
      grad.addColorStop(1, '#0f172a'); // Darker edges (vignette)

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Noise for leather bump/roughness and color variation
      for (let i = 0; i < 40000; i++) {
        // Add subtle dark and light spots for leather grain
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
      }
      for (let i = 0; i < 15000; i++) {
        // Deep pores
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text
      if (text) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isFront) {
          // Premium Cyan/Silver gradient for text
          const textGrad = ctx.createLinearGradient(200, 350, 800, 550);
          textGrad.addColorStop(0, '#00e5ff');
          textGrad.addColorStop(0.5, '#4facfe');
          textGrad.addColorStop(1, '#00f2fe');

          ctx.fillStyle = textGrad;
          ctx.font = 'bold 85px sans-serif';
          // Realistic engraved inner shadow effect
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText("Smart Financial", 512, 400);
          ctx.fillText("System", 512, 500);
        } else {
          ctx.font = '40px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText("Developed by", 512, 450);
          ctx.font = 'bold 50px sans-serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText("Usama Nadeem", 512, 520);
        }
        ctx.restore();
      }
      return new THREE.CanvasTexture(cvs);
    };

    const createPagesTexture = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 512;
      const ctx = cvs.getContext('2d');

      // Realistic paper stack edge with shading
      const paperGrad = ctx.createLinearGradient(0, 0, 64, 0);
      paperGrad.addColorStop(0, '#e2e0c8'); // Darker near cover
      paperGrad.addColorStop(0.5, '#fdfcf0'); // Lighter center
      paperGrad.addColorStop(1, '#e2e0c8'); // Darker near cover

      ctx.fillStyle = paperGrad;
      ctx.fillRect(0, 0, 64, 512);

      // Subtle page lines
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 512; i += 4) {
        ctx.fillRect(0, i, 64, 1);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 10);
      return tex;
    };

    const baseLeatherTexture = createLeatherTexture('', false, false);
    const frontLeatherTexture = createLeatherTexture('Smart Financial\nSystem', true, false);
    const backLeatherTexture = createLeatherTexture('Developed by Usama Nadeem', false, true);
    const pagesTexture = createPagesTexture();

    const leatherMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White color so the texture map dictates the final color
      map: baseLeatherTexture,
      roughness: 0.7,
      metalness: 0.15,
      bumpMap: baseLeatherTexture,
      bumpScale: 0.008,
      transparent: true,
      opacity: 1
    });

    const frontLeatherMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: frontLeatherTexture,
      roughness: 0.6, // Slightly smoother for premium feel
      metalness: 0.2,
      bumpMap: frontLeatherTexture,
      bumpScale: 0.008,
      transparent: true,
      opacity: 1
    });

    const backLeatherMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: backLeatherTexture,
      roughness: 0.6,
      metalness: 0.2,
      bumpMap: backLeatherTexture,
      bumpScale: 0.008,
      transparent: true,
      opacity: 1
    });

    const pagesMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      map: pagesTexture,
      transparent: true,
      opacity: 1
    });

    const frontCoverMaterials = [
      leatherMaterial, leatherMaterial, leatherMaterial, leatherMaterial, frontLeatherMaterial, leatherMaterial
    ];
    const backCoverMaterials = [
      leatherMaterial, leatherMaterial, leatherMaterial, leatherMaterial, leatherMaterial, backLeatherMaterial
    ];

    // --- Book Geometry Construction ---
    const coverWidth = 2.2;
    const coverHeight = 3.0;
    const coverThick = 0.06;
    const pagesThick = 0.35;
    const pagesWidth = 2.0;
    const pagesHeight = 2.85;

    // Spine
    const spineGeo = new THREE.BoxGeometry(coverThick * 2, coverHeight, pagesThick + coverThick * 2);
    const spineMesh = new THREE.Mesh(spineGeo, leatherMaterial);
    spineMesh.position.set(-coverWidth / 2 - coverThick / 2, 0, 0);
    bookGroup.add(spineMesh);

    // Back Cover
    const backCoverGeo = new THREE.BoxGeometry(coverWidth, coverHeight, coverThick);
    const backCoverMesh = new THREE.Mesh(backCoverGeo, backCoverMaterials);
    backCoverMesh.position.set(0, 0, -pagesThick / 2 - coverThick / 2);
    bookGroup.add(backCoverMesh);

    // Pages Block
    const pagesGeo = new THREE.BoxGeometry(pagesWidth, pagesHeight, pagesThick);
    const pagesMesh = new THREE.Mesh(pagesGeo, pagesMaterial);
    pagesMesh.position.set(0.1, 0, 0); // slightly right to avoid clipping spine
    bookGroup.add(pagesMesh);

    // Front Cover (with pivot)
    const frontCoverGroup = new THREE.Group();
    // Position the pivot at the front-left edge of the spine
    frontCoverGroup.position.set(-coverWidth / 2, 0, pagesThick / 2 + coverThick / 2);

    const frontCoverGeo = new THREE.BoxGeometry(coverWidth, coverHeight, coverThick);
    const frontCoverMesh = new THREE.Mesh(frontCoverGeo, frontCoverMaterials);
    // Shift mesh so its left edge aligns with the pivot
    frontCoverMesh.position.set(coverWidth / 2, 0, 0);
    frontCoverGroup.add(frontCoverMesh);

    bookGroup.add(frontCoverGroup);

    // --- Ambient Particles ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500; // Optimized limit
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const getParticleMaterial = () => {
      const particleCanvas = document.createElement('canvas');
      particleCanvas.width = 32;
      particleCanvas.height = 32;
      const ctx = particleCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(0, 183, 255, 1)');
      grad.addColorStop(1, 'rgba(0, 183, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      const particleTexture = new THREE.CanvasTexture(particleCanvas);
      return new THREE.PointsMaterial({
        size: 0.08,
        map: particleTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    }
    const particlesMaterial = getParticleMaterial();
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 3, 10);
    pointLight.position.set(-2, 2, 2);
    floatingGroup.add(pointLight);

    // --- Interaction & Animation Loop ---
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };
    document.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let animationFrameId;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating effect
      bookGroup.position.y = Math.sin(elapsedTime * 2) * 0.1;

      // Mouse tilt effect (smooth interpolation)
      targetX = mouseX * 0.0005;
      targetY = mouseY * 0.0005;
      bookGroup.rotation.x = gsap.utils.interpolate(bookGroup.rotation.x, targetY, 0.05);
      bookGroup.rotation.z = gsap.utils.interpolate(bookGroup.rotation.z, targetX, 0.05);

      particlesMesh.rotation.y = -0.05 * elapsedTime;
      particlesMesh.position.y = -window.scrollY * 0.0015;

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(tick);
    };
    tick();

    // --- GSAP SCROLL ANIMATIONS FOR THE 3D BOOK ---
    const allMaterials = [
      leatherMaterial, frontLeatherMaterial, backLeatherMaterial, pagesMaterial
    ];

    let mm = gsap.matchMedia();
    let timer;

    timer = setTimeout(() => {
    // --- DESKTOP / TABLET TIMELINE ---
    mm.add("(min-width: 992px)", () => {
      // Initial State (Hero)
      floatingGroup.position.set(3.5, 0, 0);
      floatingGroup.scale.set(1.4, 1.4, 1.4);
      floatingGroup.rotation.y = 0;
      frontCoverGroup.rotation.y = 0;

      const masterBookTl = gsap.timeline({
        scrollTrigger: {
          trigger: mainContentRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 4.2}`,
          scrub: 1.5,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
        }
      });

      // 1. Journey to Insights Section (Left/Top)
      masterBookTl.to(floatingGroup.position, { x: -3.5, y: 0, z: 0, ease: "power1.inOut", duration: 1 }, 0);
      masterBookTl.to(floatingGroup.scale, { x: 1.4, y: 1.4, z: 1.4, ease: "power1.inOut", duration: 1 }, 0);

      // 2. Journey to Workflow Section (Center) & Flip 180
      masterBookTl.to(floatingGroup.position, { x: 0, y: 0, z: -0.5, ease: "power1.inOut", duration: 1 }, 1);
      masterBookTl.to(floatingGroup.rotation, { y: Math.PI, ease: "power1.inOut", duration: 0.5 }, 1.5);
      masterBookTl.to(floatingGroup.scale, { x: 1.1, y: 1.1, z: 1.1, ease: "power1.inOut", duration: 1 }, 1);

      // 3. Journey to Dashboard Section (Center) & Flip back to front
      masterBookTl.to(floatingGroup.position, { x: 0, y: -0.5, z: 0.5, ease: "power1.inOut", duration: 1 }, 2);
      masterBookTl.to(floatingGroup.rotation, { y: 0, ease: "power1.inOut", duration: 1 }, 2);
      masterBookTl.to(floatingGroup.scale, { x: 1.2, y: 1.2, z: 1.2, ease: "power1.inOut", duration: 1 }, 2);

      // 4. Open the Book Cover naturally AND Expand
      masterBookTl.to(frontCoverGroup.rotation, { y: Math.PI * 0.8, ease: "power3.inOut", duration: 1.5 }, 3);
      masterBookTl.to(floatingGroup.position, { x: 1.5, y: 0, z: 1.5, ease: "power3.inOut", duration: 1.5 }, 3);
      masterBookTl.to(floatingGroup.scale, { x: 3.5, y: 3.5, z: 3.5, ease: "power3.inOut", duration: 1.5 }, 3);

      // 5. Fade out
      masterBookTl.to(allMaterials, { opacity: 0, ease: "power2.inOut", duration: 0.5 }, 4.2);
      masterBookTl.to(particlesMaterial, { opacity: 0, ease: "power2.inOut", duration: 0.5 }, 4.2);
    });

    // --- MOBILE TIMELINE ---
    mm.add("(max-width: 991px)", () => {
      // Initial State (Hero)
      floatingGroup.position.set(0, 0, 0); // Bilkul center main
      floatingGroup.scale.set(1.15, 1.15, 1.15);
      floatingGroup.rotation.y = 0;
      frontCoverGroup.rotation.y = 0;

      const masterBookTl = gsap.timeline({
        scrollTrigger: {
          trigger: mainContentRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3.2}`, // Mobile scroll distance matches the actual page height
          scrub: 1.5,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
        }
      });

      // Time 0 to 0.5: As user scrolls, book moves up until it reaches just below navbar
      masterBookTl.to(floatingGroup.position, {
        y: 1.5,
        ease: "none",
        duration: 0.5
      }, 0);

      // Time 0.5 to 1.0: Scroll animation triggers, book rotates 180 and drops completely under Section 2 box
      masterBookTl.to(floatingGroup.position, {
        y: -7.0,
        z: -0.5,
        ease: "power2.inOut",
        duration: 0.5
      }, 0.5);

      masterBookTl.to(floatingGroup.rotation, {
        y: Math.PI,
        ease: "power2.inOut",
        duration: 0.5
      }, 0.5);

      // Time 1.0 to 2.0: Wait under box, naturally scroll up with the page until it reaches just below navbar again
      masterBookTl.to(floatingGroup.position, {
        y: 1.5,
        ease: "none",
        duration: 1.0
      }, 1.0);

      // Time 2.0 to 2.5: Next animation triggers, book drops into final position and straightens
      masterBookTl.to(floatingGroup.position, {
        y: -1.0,
        z: 0.5,
        ease: "power2.inOut",
        duration: 0.5
      }, 2.0);

      masterBookTl.to(floatingGroup.rotation, {
        y: 0,
        ease: "power2.inOut",
        duration: 0.5
      }, 2.0);

      masterBookTl.to(floatingGroup.scale, {
        x: 1.1, y: 1.1, z: 1.1,
        ease: "power1.inOut",
        duration: 0.5
      }, 2.0);

      // Time 2.5 to 3.2: Book stays closed and expands at the bottom
      masterBookTl.to(floatingGroup.position, {
        x: 0,
        y: 0,
        z: 1.5,
        ease: "power3.inOut",
        duration: 0.7
      }, 2.5);

      masterBookTl.to(floatingGroup.scale, {
        x: 2.9, y: 2.9, z: 2.9,
        ease: "power3.inOut",
        duration: 0.7
      }, 2.5);
    });
    }, 100);


    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
      renderer.dispose();

      baseLeatherTexture.dispose();
      frontLeatherTexture.dispose();
      backLeatherTexture.dispose();
      pagesTexture.dispose();

      leatherMaterial.dispose();
      frontLeatherMaterial.dispose();
      backLeatherMaterial.dispose();
      pagesMaterial.dispose();

      spineGeo.dispose();
      backCoverGeo.dispose();
      pagesGeo.dispose();
      frontCoverGeo.dispose();

      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-blue-600/10 via-transparent to-purple-600/10"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-cyan-500/10 via-transparent to-pink-500/10"></div>
      <canvas ref={canvasRef} id="webgl-canvas" className="w-full h-full relative z-10 pointer-events-auto" />
    </div>
  );
};

/* --- 3. Main Landing Page Component --- */
export default function LandingPage() {
  const container = useRef(null);
  const mainContentRef = useRef(null);
  const heroTitleRef = useRef(null);
  const dashboardContainerRef = useRef(null);
  const dashboardElementRef = useRef(null);
  const dashboardTitleRef = useRef(null);
  const marqueeContainerRef = useRef(null);
  const marqueeTextRef = useRef(null);
  const testimonialsRef = useRef(null);
  const testimonialsContainerRef = useRef(null);
  const ctaRef = useRef(null);
  const ctaContentRef = useRef(null);

  const [ctaTimeline, setCtaTimeline] = useState(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ visitors: 0, clicks: 0 });

  const features = [
    { icon: Building2, title: "Multi-Business Management", description: "Manage multiple businesses from one dashboard with ease and precision" },
    { icon: BarChart3, title: "Chart of Accounts", description: "Organize your finances with a comprehensive chart of accounts system" },
    { icon: Calculator, title: "Double-Entry Accounting", description: "Professional accounting with automatic balance validation and accuracy" },
    { icon: FileText, title: "Transaction Management", description: "Track all your financial transactions with detailed records and insights" },
    { icon: PieChart, title: "Financial Reports", description: "Generate insightful reports to understand your business performance" },
    { icon: Shield, title: "Secure & Reliable", description: "Your financial data is protected with enterprise-grade security protocols" },
  ];

  const testimonials = [
    { name: "Sarah Johnson", role: "CEO, Tech Startup", content: "FinanceFlow transformed how we handle our accounting. The interface is intuitive and the features are exactly what we needed.", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=64&h=64&fit=crop&crop=face", rating: 5 },
    { name: "Michael Chen", role: "Small Business Owner", content: "The multi-business management feature is a game-changer. I can handle all my ventures from one place effortlessly.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face", rating: 5 },
    { name: "Emily Rodriguez", role: "Freelance Consultant", content: "Simple, powerful, and reliable. FinanceFlow handles everything I need without the complexity of enterprise software.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face", rating: 5 }
  ];

  // Auth & Tracking
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true });
        setUser(res.data.username);
      } catch { setUser(null); }
    };
    fetchUser();

    // Visitor tracking logic preserved
    const visitorsRef = ref(db, 'site_stats/visitors');
    runTransaction(visitorsRef, (currentCount) => (currentCount || 0) + 1).catch(console.error);

    const statsRef = ref(db, 'site_stats');
    const unsub = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setStats({ visitors: data.visitors || 0, clicks: data.clicks || 0 });
    });

    let lastClickTime = 0;
    const handleGlobalClick = () => {
      const now = Date.now();
      if (now - lastClickTime > 1000) { // Sirf tab count karo jab pichle click ko 1 sec ho chuka ho
        lastClickTime = now;
        const clicksRef = ref(db, 'site_stats/clicks');
        runTransaction(clicksRef, (currentCount) => (currentCount || 0) + 1).catch(console.error);
      }
    };
    window.addEventListener('click', handleGlobalClick);

    return () => {
      unsub();
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, { withCredentials: true });
      localStorage.clear();
      setUser(null);
      navigate("/login");
    } catch {
      setUser(null);
      window.location.href = "/login";
    }
  };

  // Main GSAP Animations
  useGSAP(() => {
    // 1. Hero Typewriter
    gsap.to(heroTitleRef.current, {
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      text: { value: " simple & powerful", delimiter: "" },
      ease: "none",
      delay: 0.5
    });

    // 2. Pinned Dashboard Element (Only on desktop/tablet)
    let mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      ScrollTrigger.create({
        trigger: dashboardContainerRef.current,
        start: "top top",
        end: "+=150%", // pin for 150% of viewport height scroll
        pin: dashboardElementRef.current,
        scrub: 1,
      });
    });

    // 2.5 Dashboard Title Animation
    gsap.fromTo(dashboardTitleRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: dashboardContainerRef.current,
          start: "top 60%", // Start animating in when the dashboard container is 60% down the screen
          end: "top 20%",
          scrub: 1
        }
      }
    );

    // 3. Pinned Left-to-Right Scrolling Marquee
    const getMarqueeScroll = () => {
      if (!marqueeTextRef.current) return 0;
      return -(marqueeTextRef.current.scrollWidth - window.innerWidth);
    };

    gsap.fromTo(marqueeTextRef.current,
      { x: 0 },
      {
        x: getMarqueeScroll,
        ease: "none",
        scrollTrigger: {
          trigger: marqueeContainerRef.current,
          start: "center center",
          end: () => `+=${Math.abs(getMarqueeScroll())}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      }
    );

    // 4. Features Flip Cards
    gsap.utils.toArray('.feature-flip-card').forEach((card) => {
      const inner = card.querySelector('.flip-inner');

      card.addEventListener('mouseenter', () => gsap.to(inner, { rotateY: 180, duration: 0.6, ease: 'power2.out', overwrite: "auto" }));
      card.addEventListener('mouseleave', () => gsap.to(inner, { rotateY: 0, duration: 0.6, ease: 'power2.out', overwrite: "auto" }));

      ScrollTrigger.create({
        trigger: card,
        start: "top 75%",
        onEnter: () => {
          gsap.to(inner, { rotateY: 180, duration: 0.6, ease: 'power2.out' });
          gsap.delayedCall(1.2, () => gsap.to(inner, { rotateY: 0, duration: 0.6, ease: 'power2.out' }));
        }
      });
    });

    // 5. Testimonials Animations
    // 5a. Entrance Animation (Fade Up)
    gsap.from('.testimonial-card', {
      y: 50,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      stagger: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: testimonialsRef.current,
        start: "top 70%", // Start animating when the section is 70% into view
      }
    });

    // 5b. Horizontal Scroll (Pinned)
    const totalTestimonialsWidth = testimonialsContainerRef.current.scrollWidth - window.innerWidth + 80; // slight offset
    if (totalTestimonialsWidth > 0) {
      gsap.to(testimonialsContainerRef.current, {
        x: -totalTestimonialsWidth,
        ease: "none",
        scrollTrigger: {
          trigger: testimonialsRef.current,
          start: "center center",
          end: () => `+=${totalTestimonialsWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });
    }

    // 6. CTA Banner Timeline
    // We create the state timeline in a ref so we can pass it to the Scramble text component
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: ctaRef.current,
        start: "top 75%",
      }
    });

    // Save to state so the Scramble component can react and attach to it
    setCtaTimeline(ctaTl);

    ctaTl.from(ctaContentRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    }, 0); // start immediately on trigger

  }, { scope: container });

  return (
    <div ref={container} className="relative min-h-screen text-white overflow-x-hidden font-sans">
      <Background3D mainContentRef={mainContentRef} />

      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 shadow-lg border-b border-slate-800 backdrop-blur-xl bg-gradient-to-br from-slate-900 via-blue-950/80 to-indigo-950/80 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <img src="/final.png" alt="Logo" className="h-14 w-auto drop-shadow-lg" />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                <>
                  <button onClick={() => navigate("/list")} className="text-slate-200 hover:text-white font-medium transition-all">Dashboard</button>
                  <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium transition-all">Logout</button>
                  <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Welcome, {user}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">Sign In</Link>
                  <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/30">Get Started</Link>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 focus:outline-none">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu Output */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 w-full p-4 absolute top-full left-0 z-50">
            {user ? (
              <div className="flex flex-col space-y-4">
                <span className="text-cyan-400 font-bold block mb-2 px-2">Hi, {user}</span>
                <button onClick={() => navigate("/list")} className="text-left px-2 py-1 text-white text-lg">Dashboard</button>
                <button onClick={handleLogout} className="text-left px-2 py-1 text-red-400 text-lg">Logout</button>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <Link to="/login" className="text-white text-lg block px-2 py-1 border-b border-slate-700">Sign In</Link>
                <Link to="/register" className="text-white text-lg block px-2 py-1 font-bold text-cyan-400">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Content Container ensures pointer events apply accurately above 3D context */}
      <div ref={mainContentRef} id="main-content" className="relative z-10 mt-10">

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <div className="inline-flex items-center px-4 py-2 bg-slate-800/80 border border-slate-700 backdrop-blur text-cyan-400 text-sm font-semibold rounded-full mb-8 shadow-2xl">
                <Award className="w-4 h-4 mr-2" />
                Premium Financial OS
              </div>
              {/* Typewriter target */}
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-4 sm:mb-6 min-h-[2.5em] lg:min-h-[2.2em]">Accounting made
                <span ref={heroTitleRef} className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400"></span>
              </h1>
              <p className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-10 leading-relaxed max-w-xl">
                Manage your business finances with professional-grade software. From startups to enterprises, experience intelligent automation natively designed for the future.
              </p>
              <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
                <Link to={user ? "/list" : "/register"} className="px-6 py-3 sm:px-8 sm:py-4 bg-white text-slate-900 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl hover:bg-slate-200 hover:scale-105 transition-all shadow-xl hover:shadow-cyan-400/20 flex items-center gap-2 group">
                  {user ? "Go to Dashboard" : "Start Free Today"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="flex items-center gap-3 text-slate-300 font-semibold hover:text-white transition-colors group">
                  <div className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:border-cyan-500 transition-all shadow-xl">
                    <Play className="w-5 h-5 text-cyan-400 ml-1" />
                  </div>
                  Watch Promo
                </button>
              </div>
              <div className="flex gap-8 mt-12 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-2"><Check className="text-cyan-400 w-4 h-4" /> No credit card</span>
                <span className="flex items-center gap-2"><Check className="text-cyan-400 w-4 h-4" /> Setup in 5 mins</span>
              </div>
            </div>
          </div>
        </section>

        {/* New Section 1: AI-Powered Financial Intelligence */}
        <section id="insights-section" className="relative min-h-screen flex items-center py-24 px-4 overflow-hidden border-t border-slate-800/30">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side is intentionally empty for the 3D Object */}
            <div className="hidden lg:block relative z-0 h-full w-full"></div>

            {/* Right side content */}
            <div className="z-10 group relative mb-[45vh] lg:mb-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-5 md:p-12 rounded-3xl md:rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2 md:mb-3 tracking-tight">AI-Powered Financial Intelligence</h2>
                <p className="text-base md:text-xl text-cyan-400 font-semibold mb-4 md:mb-8">Ask your financial data in plain English.</p>

                <ul className="space-y-2 md:space-y-4 mb-4 md:mb-8">
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-sm md:text-lg">Natural Language Queries</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-sm md:text-lg">Real-Time Ledger Analysis</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-sm md:text-lg">Automatic Debit & Credit Validation</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-sm md:text-lg">Intelligent Expense Tracking</span>
                  </li>
                </ul>

                <div className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
                    The system converts user queries into SQL and instantly generates accurate financial insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New Section 2: Financial Management & Reports */}
        <section id="workflow-section" className="relative min-h-screen flex items-center py-24 px-4 overflow-hidden border-t border-slate-800/30">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row justify-between items-center relative z-10 gap-8">

            {/* Left Column: Transaction Management */}
            <div className="group relative w-full lg:w-[450px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-[2rem] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-5 md:p-10 rounded-3xl md:rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-800 rounded-xl md:rounded-2xl border border-slate-700 flex items-center justify-center mb-4 md:mb-8 shadow-inner">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 tracking-tight">Transaction Management</h3>
                <ul className="space-y-2 md:space-y-4 mb-4 md:mb-8">
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Double Entry Accounting</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Multi-Ledger Support</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Real-Time Balance Updates</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Automatic Validation</span></li>
                </ul>
                <p className="text-xs md:text-sm text-slate-400 mt-auto pt-4 md:pt-6 border-t border-slate-800">
                  Every transaction updates financial records instantly and accurately.
                </p>
              </div>
            </div>

            {/* Right Column: Reports & Insights */}
            <div className="group relative w-full lg:w-[450px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-[2rem] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-5 md:p-10 rounded-3xl md:rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-800 rounded-xl md:rounded-2xl border border-slate-700 flex items-center justify-center mb-4 md:mb-8 shadow-inner">
                  <PieChart className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 tracking-tight">Financial Reports & Insights</h3>
                <ul className="space-y-2 md:space-y-4 mb-4 md:mb-8">
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Trial Balance</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Income Statement</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Balance Sheet</span></li>
                  <li className="flex items-center gap-2 md:gap-3"><Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-sm md:text-base">Export & Print Reports</span></li>
                </ul>
                <p className="text-xs md:text-sm text-slate-400 mt-auto pt-4 md:pt-6 border-t border-slate-800">
                  Generate professional financial statements anytime with one click.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Dashboard Pinned Section */}
        <section id="dashboard-section" ref={dashboardContainerRef} className="relative md:h-[250vh] border-t border-slate-800/30">
          <div ref={dashboardElementRef} className="min-h-screen py-24 md:py-0 md:h-screen md:sticky top-0 flex flex-col items-center justify-center overflow-hidden px-4">
            <h2 ref={dashboardTitleRef} className="text-2xl md:text-5xl font-extrabold mb-4 md:mb-10 text-white text-center">Real-time Business Insights</h2>

            <div className="w-full max-w-5xl bg-slate-900/40 backdrop-blur-2xl border border-slate-700 rounded-2xl md:rounded-3xl shadow-[0_0_80px_rgba(0,183,255,0.15)] p-3 sm:p-10 transform-gpu relative z-20 mx-auto">
              {/* Dashboard mockup header */}
              <div className="flex justify-between items-center mb-4 md:mb-10 border-b border-slate-700/50 pb-4 md:pb-6">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-slate-700"></div>
                </div>
                <div className="text-slate-400 font-semibold uppercase tracking-widest text-[10px] md:text-xs">FinFlow Analytics</div>
              </div>

              {/* Dashboard grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl md:rounded-2xl p-3 md:p-6 hover:bg-slate-800/80 transition-all pointer-events-auto">
                  <div className="text-[11px] md:text-sm text-slate-400 mb-1 md:mb-2 font-medium">Active Ledger Syncs</div>
                  <div className="text-2xl md:text-4xl font-extrabold text-white mb-1 md:mb-2">24,103</div>
                  <div className="flex items-center text-emerald-400 text-[10px] md:text-sm font-semibold bg-emerald-400/10 w-fit px-2 py-0.5 md:py-1 rounded-md">
                    <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Real-time validation
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl md:rounded-2xl p-3 md:p-6 pointer-events-auto">
                  <div className="text-[11px] md:text-sm text-slate-400 mb-1 md:mb-2 font-medium">Total Visitors</div>
                  <div className="text-2xl md:text-4xl font-extrabold text-white mb-1 md:mb-2">{stats.visitors.toLocaleString()}</div>
                  <div className="flex items-center text-cyan-400 text-[10px] md:text-sm font-semibold bg-cyan-400/10 w-fit px-2 py-0.5 md:py-1 rounded-md">
                    Live traffic count
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl md:rounded-2xl p-3 md:p-6 pointer-events-auto">
                  <div className="text-[11px] md:text-sm text-slate-400 mb-1 md:mb-2 font-medium">Total Interactions</div>
                  <div className="text-2xl md:text-4xl font-extrabold text-white mb-1 md:mb-2">{stats.clicks.toLocaleString()}</div>
                  <div className="flex items-center text-cyan-400 text-[10px] md:text-sm font-semibold bg-cyan-400/10 w-fit px-2 py-0.5 md:py-1 rounded-md">
                    Live interaction tracking
                  </div>
                </div>
              </div>

              {/* Dashboard graph mockup */}
              <div className="mt-3 md:mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl md:rounded-2xl h-16 md:h-40 flex items-end overflow-hidden p-3 md:p-6 gap-1 md:gap-2">
                {[30, 45, 25, 60, 45, 80, 50, 95, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="relative py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20">The Core Engine</span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mt-8">Powerful Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pointer-events-none">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="feature-flip-card h-[22rem] cursor-pointer pointer-events-auto group" style={{ perspective: '1200px' }}>
                    <div className="flip-inner relative w-full h-full transition-transform duration-700" style={{ transformStyle: 'preserve-3d' }}>
                      {/* Front Side */}
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl border border-slate-700 hover:border-cyan-500/50 rounded-3xl p-8 flex flex-col justify-center items-center shadow-lg transition-colors" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 shadow-inner group-hover:bg-cyan-900/50 transition-colors">
                          <Icon className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white text-center">{feature.title}</h3>
                      </div>
                      {/* Back Side */}
                      <div className="absolute inset-0 bg-cyan-900/80 backdrop-blur-xl border border-cyan-400 rounded-3xl p-8 flex items-center justify-center text-center shadow-[0_0_30px_rgba(0,183,255,0.3)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-gray-100 text-xl font-medium leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Interactive Marquee */}
        <section ref={marqueeContainerRef} className="relative py-20 overflow-hidden bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent border-y border-slate-800/50 my-20">
          <div className="w-max pr-[5vw] whitespace-nowrap opacity-50 select-none pointer-events-none" ref={marqueeTextRef}>
            <h1 className="text-[12vw] font-black italic text-white uppercase tracking-tighter mix-blend-screen">
              SMART FINANCIAL SYSTEM • NEXT GEN ACCOUNTING • AUTOMATED REPORT GENERATION
            </h1>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials-section" className="relative py-32 overflow-hidden bg-slate-900/50 backdrop-blur-sm border-t border-slate-800" ref={testimonialsRef}>
          <h2 className="text-4xl md:text-5xl text-center font-extrabold text-white mb-20 px-8 lg:px-20">What our clients say</h2>
          <div className="flex w-max px-8 lg:px-20 gap-8 pb-10" ref={testimonialsContainerRef}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card w-[85vw] md:w-[35vw] xl:w-[25vw] flex-shrink-0 bg-slate-800/80 backdrop-blur-2xl border border-slate-700/50 rounded-[2.5rem] p-10 pointer-events-auto hover:bg-slate-800 transition-colors shadow-2xl">
                <div className="flex items-center mb-8 gap-1">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-6 h-6 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-gray-300 text-xl font-medium leading-relaxed mb-10 min-h-[6rem]">"{t.content}"</p>
                <div className="flex items-center pt-8 border-t border-slate-700/50">
                  <img src={t.avatar} className="w-16 h-16 rounded-full mr-5 object-cover border-2 border-cyan-500" alt={t.name} />
                  <div>
                    <h4 className="font-bold text-white text-xl">{t.name}</h4>
                    <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section id="cta-section" ref={ctaRef} className="relative py-48 text-center px-4 overflow-hidden border-t border-cyan-900/30">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none z-0"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              {/* Parent CTA timeline controls the trigger */}
              <CustomScrambleText timeline={ctaTimeline} text="Ready to transform your finances?" className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 block" />
            </h2>
            <div ref={ctaContentRef}>
              <p className="text-2xl text-slate-300 mb-14 font-medium">Join thousands of businesses experiencing the future of accounting today.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pointer-events-auto">
                <Link to="/register" className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-slate-200 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] w-full sm:w-auto text-center">
                  Start Free Trial
                </Link>
                <Link to="/login" className="px-10 py-5 bg-slate-800/80 backdrop-blur border-2 border-slate-600 rounded-2xl font-black text-xl text-white hover:bg-slate-700 transition-all w-full sm:w-auto text-center hover:scale-105">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-400 py-16 px-4 border-t border-slate-800/50 pointer-events-auto relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/final.png" alt="Logo" className="h-10 w-auto opacity-80" />
                <span className="text-2xl font-black text-white tracking-tight">Smart Financial</span>
              </div>
              <p className="max-w-sm text-slate-500 font-medium leading-relaxed">The premium financial operating system engineered for scalability, precision, and modern design.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="pl-0 space-y-4">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="pl-0 space-y-4">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50">
            <p>© 2026 Smart Financial. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0 text-sm font-semibold">
              <span className="flex items-center"><Globe className="w-4 h-4 mr-2" /> English</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse"></div>
                All systems operational
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
