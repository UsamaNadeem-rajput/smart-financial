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
const Background3D = () => {
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 1.0,
      ior: 1.5,
      thickness: 0.5,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const cubeGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const glassCube = new THREE.Mesh(cubeGeometry, glassMaterial);
    cubeGroup.add(glassCube);

    const innerCubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const linesGeometry = new THREE.EdgesGeometry(innerCubeGeo);
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x00b7ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const innerLines = new THREE.LineSegments(linesGeometry, linesMaterial);
    cubeGroup.add(innerLines);

    const coreGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0044ff,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const coreCube = new THREE.Mesh(coreGeometry, coreMaterial);
    cubeGroup.add(coreCube);

    const isMobile = window.innerWidth < 992;
    cubeGroup.position.x = isMobile ? 0 : 3.5;
    cubeGroup.position.y = 0;

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1200;
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
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    }
    const particlesMaterial = getParticleMaterial();
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 4, 10);
    pointLight.position.set(0, 0, 0);
    cubeGroup.add(pointLight);

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
      cubeGroup.rotation.y += 0.003;
      cubeGroup.rotation.x += 0.002;
      innerLines.rotation.y -= 0.005;
      innerLines.rotation.z -= 0.002;
      coreCube.rotation.x += 0.01;
      coreCube.rotation.y += 0.01;

      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;
      cubeGroup.position.y += Math.sin(elapsedTime * 2) * 0.001;

      // Removed direct targetX * 0.5 mouse tilt which conflicts with GSAP causing jitter during scroll
      cubeGroup.rotation.z = gsap.utils.interpolate(cubeGroup.rotation.z, targetX * 0.2, 0.05);

      particlesMesh.rotation.y = -0.05 * elapsedTime;
      particlesMesh.position.y = -window.scrollY * 0.0015;

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(tick);
    };
    tick();

    // GSAP SCROLL ANIMATIONS FOR THE 3D CUBE

    // Initial position for Hero (far right)
    cubeGroup.position.set(isMobile ? 0 : 3.5, 0, 0);

    // Create a unified master timeline for the 3D Cube's journey through the sections
    // This is mathematically superior to individual triggers and eliminates "stop/start" jitter completely
    const masterCubeTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#main-content',
        start: 'top top',
        end: () => `+=${window.innerHeight * 4}`, // End after scrolling through Insights, Workflow, and into Dashboard
        scrub: 1.5,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
      }
    });

    // 1. Journey to Insights Section (Left)
    masterCubeTl.to(cubeGroup.position, {
      x: () => (window.innerWidth < 992 ? 0 : -3.5),
      y: 0,
      z: 0,
      ease: "power1.inOut",
      duration: 1
    }, 0);

    // 2. Journey to Workflow Section (Center)
    masterCubeTl.to(cubeGroup.position, {
      x: 0,
      y: 0, // Slight vertical adjustment to center between the cards
      z: -1.5, // Push it back a bit to make it smaller as requested
      ease: "power1.inOut",
      duration: 1
    }, 1);

    // Helper to calculate exact scale needed to hit screen width without overflowing
    const getTargetScale = () => {
      // Use trigonometric calculation for the width of the view frustum at the object's distance
      const vFov = (75 * Math.PI) / 180; // 75 degrees FOV
      // Camera is at z=5. When expanding, we animating to center (z=0, x=0, y=0) in the 2nd step,
      // but the 2nd step sets z: -1.5, so the distance is 6.5.
      const distance = 6.5;

      const heightAtDistance = 2 * Math.tan(vFov / 2) * distance;
      const widthAtDistance = heightAtDistance * (window.innerWidth / window.innerHeight);

      // The box's base size is 2.5 on all sides.
      // However, because the box is constantly rotating, the *diagonal* can be wider
      // The maximum width of a rotating box is roughly Math.sqrt(3) * size
      const maxRotatedSize = 2.5 * Math.sqrt(3);

      // We want to make sure it expands to 100% width but doesn't overspill
      // Calculate what scale creates a size equal to the screen's width at that distance
      let targetScale = widthAtDistance / maxRotatedSize;

      // If the screen is very tall (mobile/portrait), expanding to width might overflow height
      // So we take the minimum boundary to ensure it's exactly 100% of the screen without clipping
      const heightTargetScale = heightAtDistance / maxRotatedSize;

      return Math.min(targetScale, heightTargetScale);
    };

    // 3. Expand the object up to exactly screen width after Section 3
    masterCubeTl.to(cubeGroup.scale, {
      x: getTargetScale,
      y: getTargetScale,
      z: getTargetScale,
      ease: "power1.inOut",
      duration: 2
    }, 2);

    // Illusion of box opening: 
    // The glass cube becomes completely transparent and dissolves, while the inner core lines
    // burst out by scaling larger than the container itself.
    masterCubeTl.to(glassMaterial, {
      opacity: 0.0, // Reduce opacity to simulate opening/disappearing limits
      transmission: 0.0, // Lower refraction
      ease: "power1.inOut",
      duration: 2
    }, 2);

    // Scale down the glass enclosure so it disappears
    masterCubeTl.to(glassCube.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      ease: "power2.inOut",
      duration: 2
    }, 2);

    // Scale up the inner wireframe and core cube specifically to burst outside the bounds
    masterCubeTl.to([innerLines.scale, coreCube.scale], {
      x: 2.5,
      y: 2.5,
      z: 2.5,
      ease: "power2.inOut",
      duration: 2
    }, 2);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      if (window.innerWidth < 992 && ScrollTrigger.getAll().length === 0) {
        cubeGroup.position.x = 0;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      glassMaterial.dispose();
      cubeGeometry.dispose();
      innerCubeGeo.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-purple-600/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-pink-500/10"></div>
      <canvas ref={canvasRef} id="webgl-canvas" className="w-full h-full relative z-10" />
    </div>
  );
};

/* --- 3. Main Landing Page Component --- */
export default function LandingPage() {
  const container = useRef(null);
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

    const handleGlobalClick = () => {
      const clicksRef = ref(db, 'site_stats/clicks');
      runTransaction(clicksRef, (currentCount) => (currentCount || 0) + 1).catch(console.error);
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

    // 2. Pinned Dashboard Element
    ScrollTrigger.create({
      trigger: dashboardContainerRef.current,
      start: "top top",
      end: "+=150%", // pin for 150% of viewport height scroll
      pin: dashboardElementRef.current,
      scrub: 1,
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
      <Background3D />

      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 shadow-lg border-b border-slate-800 backdrop-blur-xl bg-gradient-to-br from-slate-900 via-blue-950/80 to-indigo-950/80 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
          <div className="flex justify-between items-center h-10">
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
      <div id="main-content" className="relative z-10 mt-10">

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <div className="inline-flex items-center px-4 py-2 bg-slate-800/80 border border-slate-700 backdrop-blur text-cyan-400 text-sm font-semibold rounded-full mb-8 shadow-2xl">
                <Award className="w-4 h-4 mr-2" />
                Premium Financial OS
              </div>
              {/* Typewriter target */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 min-h-[3em] lg:min-h-[2.2em]">Accounting made
                <span ref={heroTitleRef} className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400"></span>
              </h1>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
                Manage your business finances with professional-grade software. From startups to enterprises, experience intelligent automation natively designed for the future.
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                <Link to={user ? "/list" : "/register"} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-200 hover:scale-105 transition-all shadow-xl hover:shadow-cyan-400/20 flex items-center gap-2 group">
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
        <section id="insights-section" className="relative h-screen flex items-center px-4 overflow-hidden border-t border-slate-800/30">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side is intentionally empty for the 3D Object */}
            <div className="hidden lg:block relative z-0 h-full w-full"></div>

            {/* Right side content */}
            <div className="z-10 group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-10 md:p-12 rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">AI-Powered Financial Intelligence</h2>
                <p className="text-xl text-cyan-400 font-semibold mb-8">Ask your financial data in plain English.</p>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-lg">Natural Language Queries</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-lg">Real-Time Ledger Analysis</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-lg">Automatic Debit & Credit Validation</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <span className="text-slate-300 font-medium text-lg">Intelligent Expense Tracking</span>
                  </li>
                </ul>

                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    The system converts user queries into SQL and instantly generates accurate financial insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New Section 2: Financial Management & Reports */}
        <section id="workflow-section" className="relative h-screen flex items-center px-4 overflow-hidden border-t border-slate-800/30">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row justify-between items-center relative z-10 gap-8">

            {/* Left Column: Transaction Management */}
            <div className="group relative w-full lg:w-[450px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-[2rem] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-8 shadow-inner">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Transaction Management</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Double Entry Accounting</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Multi-Ledger Support</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Real-Time Balance Updates</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Automatic Validation</span></li>
                </ul>
                <p className="text-sm text-slate-400 mt-auto pt-6 border-t border-slate-800">
                  Every transaction updates financial records instantly and accurately.
                </p>
              </div>
            </div>

            {/* Right Column: Reports & Insights */}
            <div className="group relative w-full lg:w-[450px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-[2rem] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-slate-700/60 shadow-2xl transition-all duration-300 hover:bg-slate-900/80">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-8 shadow-inner">
                  <PieChart className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Financial Reports & Insights</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Trial Balance</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Income Statement</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Balance Sheet</span></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-slate-300 font-medium text-base">Export & Print Reports</span></li>
                </ul>
                <p className="text-sm text-slate-400 mt-auto pt-6 border-t border-slate-800">
                  Generate professional financial statements anytime with one click.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Dashboard Pinned Section */}
        <section id="dashboard-section" ref={dashboardContainerRef} className="relative h-[250vh] border-t border-slate-800/30">
          <div ref={dashboardElementRef} className="h-screen sticky top-0 flex flex-col items-center justify-center overflow-hidden px-4">
            <h2 ref={dashboardTitleRef} className="text-4xl md:text-5xl font-extrabold mb-10 text-white text-center">Real-time Business Insights</h2>

            <div className="w-full max-w-5xl bg-slate-900/40 backdrop-blur-2xl border border-slate-700 rounded-3xl shadow-[0_0_80px_rgba(0,183,255,0.15)] p-6 sm:p-10 transform-gpu relative z-20 mx-auto">
              {/* Dashboard mockup header */}
              <div className="flex justify-between items-center mb-10 border-b border-slate-700/50 pb-6">
                <div className="flex space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700"></div>
                </div>
                <div className="text-slate-400 font-semibold uppercase tracking-widest text-xs">FinFlow Analytics</div>
              </div>

              {/* Dashboard grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 hover:bg-slate-800/80 transition-all pointer-events-auto">
                  <div className="text-slate-400 mb-2 font-medium">Active Ledger Syncs</div>
                  <div className="text-4xl font-extrabold text-white mb-2">24,103</div>
                  <div className="flex items-center text-emerald-400 text-sm font-semibold bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
                    <Check className="w-4 h-4 mr-1" /> Real-time validation
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 pointer-events-auto">
                  <div className="text-slate-400 mb-2 font-medium">Total Visitors</div>
                  <div className="text-4xl font-extrabold text-white mb-2">{stats.visitors.toLocaleString()}</div>
                  <div className="flex items-center text-cyan-400 text-sm font-semibold bg-cyan-400/10 w-fit px-2 py-1 rounded-md">
                    Live traffic count
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 pointer-events-auto">
                  <div className="text-slate-400 mb-2 font-medium">Total Interactions</div>
                  <div className="text-4xl font-extrabold text-white mb-2">{stats.clicks.toLocaleString()}</div>
                  <div className="flex items-center text-cyan-400 text-sm font-semibold bg-cyan-400/10 w-fit px-2 py-1 rounded-md">
                    Live interaction tracking
                  </div>
                </div>
              </div>

              {/* Dashboard graph mockup */}
              <div className="mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl h-40 flex items-end overflow-hidden p-6 gap-2">
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
              SMART FINANCIAL SYSTEM • NEXT GEN ACCOUNTING • REAL-TIME INSIGHTS • AUTOMATED REPORT GENERATION
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
