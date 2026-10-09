import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  User, Menu, X, ArrowRight, Check, Play, ArrowUpRight, Camera, Scale, Users, Sparkles
} from 'lucide-react';
import { ref, runTransaction, onValue } from "firebase/database";
import { db } from "../Visister/firebase";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* --- 1. Three.js 3D Hero Canvas Component --- */
const Hero3D = () => {
  const canvasContainerRef = useRef(null);

  useGSAP(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const isMobile = window.innerWidth < 900;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let scene, camera, renderer;
    let slabGroup, barMeshes = [], orbitCards = [];
    let pointLight, rimLight;
    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    let isHeroInView = true;
    let animId;

    function createCardTexture(title, subtitle, tag, isLime) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');

      function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y + r, x, y);
        c.closePath();
      }

      roundRect(ctx, 10, 10, 492, 300, 28);
      if (isLime) {
        ctx.fillStyle = '#CCFF00';
        ctx.fill();
        ctx.strokeStyle = '#0F1E14';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#0F1E14';
        ctx.font = 'bold 36px "DM Sans", sans-serif';
        ctx.fillText(title, 40, 100);
        ctx.font = '500 24px "DM Sans", sans-serif';
        ctx.fillText(subtitle, 40, 150);

        ctx.fillStyle = '#0F1E14';
        ctx.font = 'bold 20px "DM Sans", sans-serif';
        ctx.fillText(tag, 40, 250);
      } else {
        ctx.fillStyle = 'rgba(21, 39, 27, 0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 241, 53, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px "DM Sans", sans-serif';
        ctx.fillText(title, 40, 100);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '500 22px "DM Sans", sans-serif';
        ctx.fillText(subtitle, 40, 150);

        ctx.fillStyle = '#C8F135';
        ctx.font = 'bold 20px "DM Sans", sans-serif';
        ctx.fillText(tag, 40, 250);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 12);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      pointLight = new THREE.PointLight(0xC8F135, 3.2, 25);
      pointLight.position.set(4, 3, 4);
      scene.add(pointLight);

      rimLight = new THREE.PointLight(0xF3F4EC, 2.0, 30);
      rimLight.position.set(-5, -4, -3);
      scene.add(rimLight);

      slabGroup = new THREE.Group();
      scene.add(slabGroup);

      const slabGeo = new THREE.BoxGeometry(6.4, 4.2, 0.28);
      const slabMat = new THREE.MeshPhysicalMaterial({
        color: 0x0F1E14,
        metalness: 0.1,
        roughness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
        reflectivity: 0.5
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabGroup.add(slabMesh);

      const faceGeo = new THREE.PlaneGeometry(6.1, 3.9);
      const faceMat = new THREE.MeshBasicMaterial({
        color: 0x15271B
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.z = 0.15;
      slabGroup.add(faceMesh);

      const barWidth = 0.52;
      const barHeights = [1.2, 1.8, 1.5, 2.2, 2.0, 3.1];
      const startX = -2.0;
      const spacingX = 0.8;

      for (let i = 0; i < 6; i++) {
        const isLast = (i === 5);
        const targetH = barHeights[i];
        const barGeo = new THREE.BoxGeometry(barWidth, targetH, 0.25);
        barGeo.translate(0, targetH / 2, 0);

        const barMat = new THREE.MeshStandardMaterial({
          color: isLast ? 0xC8F135 : 0x223D2C,
          emissive: isLast ? 0xC8F135 : 0x0A140E,
          emissiveIntensity: isLast ? 0.35 : 0.1,
          roughness: 0.3,
          metalness: 0.2
        });

        const barMesh = new THREE.Mesh(barGeo, barMat);
        barMesh.position.set(startX + (i * spacingX), -1.4, 0.2);
        barMesh.scale.y = 0.001;
        slabGroup.add(barMesh);
        barMeshes.push(barMesh);
      }

      slabGroup.position.set(isMobile ? 0 : 2.2, isMobile ? -0.8 : -0.2, 0);
      slabGroup.rotation.set(-0.15, -0.35, 0.05);

      const cardData = [
        { title: "Invoice #1042", subtitle: "Studio Nova • Rs. 145,000", tag: "PAID IN FULL", isLime: true, orbitR: 5.2, speed: 0.45, yOffset: 1.6, scale: 0.9 },
        { title: "Bank Feed Sync", subtitle: "Meezan • 24 Transactions", tag: "RECONCILED", isLime: false, orbitR: 4.6, speed: -0.38, yOffset: -1.8, scale: 0.8 },
        { title: "Receipt Captured", subtitle: "AWS Cloud • Rs. 18,900", tag: "AUTO-TAGGED", isLime: false, orbitR: 5.8, speed: 0.55, yOffset: -0.4, scale: 0.75 },
        { title: "Vendor Bill", subtitle: "Kite Labs • Rs. 420,000", tag: "PENDING SIGN-OFF", isLime: false, orbitR: 6.2, speed: -0.48, yOffset: 2.1, scale: 0.85 },
        { title: "FBR Tax Reserve", subtitle: "Q1 Advance • Ready", tag: "GST AUDITED", isLime: true, orbitR: 4.9, speed: 0.32, yOffset: 0.8, scale: 0.7 },
        { title: "Multi-Currency", subtitle: "USD Wire • $3,200.00", tag: "SETTLED", isLime: false, orbitR: 5.5, speed: -0.6, yOffset: -1.2, scale: 0.78 }
      ];

      const cardCount = isMobile ? 3 : cardData.length;

      for (let i = 0; i < cardCount; i++) {
        const data = cardData[i];
        const cardTexture = createCardTexture(data.title, data.subtitle, data.tag, data.isLime);
        const cardGeo = new THREE.PlaneGeometry(2.4, 1.5);
        const cardMat = new THREE.MeshBasicMaterial({
          map: cardTexture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });

        const cardMesh = new THREE.Mesh(cardGeo, cardMat);
        cardMesh.scale.setScalar(data.scale);
        cardMesh.userData = {
          angle: (i / cardCount) * Math.PI * 2,
          radius: data.orbitR,
          speed: data.speed,
          yOffset: data.yOffset,
          baseScale: data.scale
        };

        scene.add(cardMesh);
        orbitCards.push(cardMesh);
      }

      // Mouse Parallax
      const handleMouseMove = (e) => {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetMouseX = normX;
        targetMouseY = normY;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      const clock = new THREE.Clock();

      const animateLoop = () => {
        animId = requestAnimationFrame(animateLoop);
        if (!renderer || !scene || !camera || !isHeroInView) return;

        const elapsedTime = clock.getElapsedTime();

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        const driftX = isMobile ? Math.sin(elapsedTime * 0.8) * 0.2 : mouseX;
        const driftY = isMobile ? Math.cos(elapsedTime * 0.6) * 0.15 : mouseY;

        if (slabGroup) {
          slabGroup.position.y = (isMobile ? -0.8 : -0.2) + Math.sin(elapsedTime * 1.2) * 0.15;
          slabGroup.rotation.y = -0.35 + (driftX * 0.14);
          slabGroup.rotation.x = -0.15 - (driftY * 0.14);
          slabGroup.rotation.z = 0.05 + Math.sin(elapsedTime * 0.7) * 0.02;
        }

        orbitCards.forEach((card) => {
          const u = card.userData;
          u.angle += u.speed * 0.015;
          card.position.x = slabGroup.position.x + Math.cos(u.angle) * u.radius;
          card.position.z = Math.sin(u.angle) * (u.radius * 0.6);
          card.position.y = slabGroup.position.y + u.yOffset + Math.sin(elapsedTime * 1.5 + u.angle) * 0.15;

          const depthNorm = (card.position.z + 4) / 8;
          card.scale.setScalar(u.baseScale * (0.85 + depthNorm * 0.3));
          card.material.opacity = 0.55 + Math.max(0, depthNorm) * 0.45;
          card.lookAt(camera.position);
        });

        if (pointLight) {
          pointLight.intensity = 2.8 + Math.sin(elapsedTime * 2.0) * 0.7;
        }

        renderer.render(scene, camera);
      };
      animateLoop();

      // GSAP Bars Elastic Entrance
      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (camera) {
        introTl.from(camera.position, { z: 18, y: 1.5, duration: 2.4, ease: "power2.out" }, 0);
      }

      barMeshes.forEach((bar, idx) => {
        introTl.to(bar.scale, {
          y: 1,
          duration: 1.8,
          ease: "elastic.out(1, 0.45)",
          delay: idx * 0.08
        }, 0.6);
      });

      // View check
      ScrollTrigger.create({
        trigger: "#hero-section",
        start: "top bottom",
        end: "bottom top",
        onEnter: () => { isHeroInView = true; },
        onLeave: () => { isHeroInView = false; },
        onEnterBack: () => { isHeroInView = true; },
        onLeaveBack: () => { isHeroInView = false; }
      });

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animId);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };

    } catch (err) {
      console.warn('WebGL init fallback:', err);
      const fallback = document.getElementById('hero-static-fallback');
      if (fallback) fallback.classList.remove('hidden');
    }
  }, { scope: canvasContainerRef });

  return (
    <div
      aria-hidden="true"
      id="hero-canvas-container"
      ref={canvasContainerRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
};

/* --- 2. Main Landing Page Component --- */
export default function LandingPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ visitors: 0, clicks: 0 });

  // Auth & Tracking (Unchanged logic)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true });
        setUser(res.data.username);
      } catch {
        setUser(null);
      }
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
      if (now - lastClickTime > 1000) {
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

  // GSAP DOM Animations (Stitch design specification)
  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 900;

    if (!prefersReducedMotion) {
      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      introTl.to("#hero-badge", { opacity: 1, duration: 0.8 }, 0.4);

      introTl.to(".reveal-word", {
        y: "0%",
        duration: 1.0,
        stagger: 0.12,
        ease: "power4.out"
      }, 0.7);

      introTl.to("#hero-highlight-bg", {
        scaleX: 1,
        duration: 0.7,
        ease: "power2.inOut"
      }, 1.4);

      introTl.to("#hero-desc", { opacity: 1, y: 0, duration: 0.8 }, 1.5);
      introTl.to("#hero-cta-group", { opacity: 1, y: 0, duration: 0.8 }, 1.7);
      introTl.to("#hero-microcopy", { opacity: 1, duration: 0.6 }, 1.9);

      introTl.to("#hero-ai-chip", {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "back.out(1.7)"
      }, 1.9);

      introTl.to("#hero-metric-chip", {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "back.out(1.7)"
      }, 2.0);

      introTl.to("#scroll-cue", { opacity: 1, duration: 0.8 }, 2.4);

      const counterObj = { val: 0 };
      introTl.to(counterObj, {
        val: 4892000,
        duration: 2.2,
        ease: "power2.out",
        onUpdate: () => {
          const el = document.getElementById('cash-counter');
          if (el) el.innerText = Math.floor(counterObj.val).toLocaleString('en-US');
        }
      }, 1.0);

      // Hero Scroll Pin & Parallax (Desktop)
      if (!isMobile) {
        const heroScrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: "#hero-section",
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1.2,
            anticipatePin: 1
          }
        });

        heroScrollTl.to("#hero-headline, #hero-desc, #hero-cta-group, #hero-badge, #scroll-cue", {
          opacity: 0,
          y: -80,
          stagger: 0.05,
          ease: "none"
        }, 0);

        heroScrollTl.to("#hero-ai-chip, #hero-metric-chip", {
          opacity: 0,
          scale: 0.85,
          y: 40,
          ease: "none"
        }, 0);
      }

      // Features section highlight & cards
      gsap.to("#features-highlight-bg", {
        scaleX: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#features",
          start: "top 75%"
        }
      });

      gsap.from(".feature-card", {
        y: 60,
        opacity: 0,
        rotateX: 12,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#features",
          start: "top 70%"
        }
      });

      // Invoicing card interactive tilt
      const invoicingCard = document.getElementById('invoicing-card');
      if (invoicingCard && !isMobile) {
        const handleTiltMove = (e) => {
          const rect = invoicingCard.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(invoicingCard, {
            x: x * 0.15,
            y: y * 0.15,
            rotation: x * 0.03,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        const handleTiltLeave = () => {
          gsap.to(invoicingCard, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
        };
        invoicingCard.addEventListener('mousemove', handleTiltMove);
        invoicingCard.addEventListener('mouseleave', handleTiltLeave);
      }

      // How It Works Steps
      const stepsTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#how-it-works",
          start: "top 65%"
        }
      });
      stepsTl.to("#step-progress-line", { width: "100%", duration: 1.2, ease: "power2.inOut" }, 0);
      stepsTl.to("#step-stroke-1", { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 0.2);
      stepsTl.to("#step-stroke-2", { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 0.6);
      stepsTl.to("#step-stroke-3", { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 1.0);

      // AI panel scale & chat stream
      gsap.to("#ai-panel", {
        scale: 1,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#ai-panel",
          start: "top 80%"
        }
      });

      gsap.from("#urdu-sticker", {
        rotate: -15,
        scale: 0.7,
        opacity: 0,
        duration: 0.9,
        ease: "back.out(2)",
        scrollTrigger: {
          trigger: "#ai-panel",
          start: "top 70%"
        }
      });

      const chatTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#ai-panel",
          start: "top 60%",
          end: "bottom 80%",
          scrub: 0.8
        }
      });

      chatTl.to("#chat-q1", { opacity: 1, y: 0, duration: 0.4 });
      chatTl.call(() => {
        const typ = document.getElementById('chat-typing-1');
        if (typ) typ.classList.remove('hidden');
      });
      chatTl.to({}, { duration: 0.3 });
      chatTl.call(() => {
        const typ = document.getElementById('chat-typing-1');
        if (typ) typ.classList.add('hidden');
      });
      chatTl.to("#chat-a1", { opacity: 1, y: 0, duration: 0.5 });
      chatTl.to("#chat-q2", { opacity: 1, y: 0, duration: 0.4 });

      // Pricing cards entrance
      gsap.from(".pricing-card", {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#pricing",
          start: "top 75%"
        }
      });

      // Final CTA split line entrance
      gsap.from(".cta-split-line", {
        y: 60,
        opacity: 0,
        stagger: 0.2,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: {
          trigger: "#final-cta-headline",
          start: "top 80%"
        }
      });

    } else {
      // Reduced motion fallbacks
      document.querySelectorAll('.reveal-word').forEach(w => {
        w.style.transform = 'none';
        w.style.opacity = '1';
      });
      const highlight = document.getElementById('hero-highlight-bg');
      if (highlight) highlight.style.transform = 'scaleX(1)';
      const desc = document.getElementById('hero-desc');
      if (desc) desc.style.opacity = '1';
      const ctaGroup = document.getElementById('hero-cta-group');
      if (ctaGroup) ctaGroup.style.opacity = '1';
      const aiChip = document.getElementById('hero-ai-chip');
      if (aiChip) aiChip.style.opacity = '1';
      const metricChip = document.getElementById('hero-metric-chip');
      if (metricChip) metricChip.style.opacity = '1';
      const counter = document.getElementById('cash-counter');
      if (counter) counter.innerText = '4,892,000';
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#F3F4EC] text-[#0F1E14] font-sans antialiased selection:bg-[#C8F135] selection:text-[#0F1E14] min-h-screen overflow-x-hidden">
      
      {/* ============================================================== */}
      {/* TOP STICKY NAVIGATION BAR                                       */}
      {/* ============================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-md bg-[#F3F4EC]/90 border-b border-[#0F1E14]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#top" aria-label="Smart Financials Home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0F1E14] flex items-center justify-center text-[#C8F135] font-black text-xl shadow-sm transition-transform duration-200 group-hover:scale-105">
              SF
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-[#0F1E14] leading-none">Smart Financials</span>
              <span className="text-[11px] font-medium text-[#6C7A70] tracking-wider uppercase mt-1">AI Automated Books</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0F1E14]/80">
            <a href="#features" className="hover:text-[#0F1E14] transition-colors py-1 hover:border-b-2 hover:border-[#C8F135]">Features</a>
            <a href="#insights" className="hover:text-[#0F1E14] transition-colors py-1 hover:border-b-2 hover:border-[#C8F135]">Insights</a>
            <a href="#how-it-works" className="hover:text-[#0F1E14] transition-colors py-1 hover:border-b-2 hover:border-[#C8F135]">How It Works</a>
            <a href="#ai-assistant" className="hover:text-[#0F1E14] transition-colors py-1 hover:border-b-2 hover:border-[#C8F135]">Khushi AI</a>
            <a href="#pricing" className="hover:text-[#0F1E14] transition-colors py-1 hover:border-b-2 hover:border-[#C8F135]">Pricing</a>
          </nav>

          {/* Trailing CTAs / Dynamic Auth States */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/list")}
                  className="text-sm font-semibold text-[#0F1E14] hover:text-[#0F1E14]/70 px-3 py-2 transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-2 transition-colors cursor-pointer"
                >
                  Logout
                </button>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 bg-[#0F1E14] text-[#C8F135] hover:bg-[#15271B] font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <User className="w-4 h-4 text-[#C8F135]" />
                  <span>Welcome, {user}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm font-semibold text-[#0F1E14] hover:text-[#0F1E14]/70 px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-[#0F1E14] text-[#C8F135] hover:bg-[#15271B] font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#0F1E14] focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0F1E14] text-white border-t border-white/10 w-full p-6 absolute top-full left-0 shadow-2xl">
            <div className="flex flex-col space-y-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-[#C8F135] text-base py-1">Features</a>
              <a href="#insights" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-[#C8F135] text-base py-1">Insights</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-[#C8F135] text-base py-1">How It Works</a>
              <a href="#ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-[#C8F135] text-base py-1">Khushi AI</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-[#C8F135] text-base py-1">Pricing</a>

              <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
                {user ? (
                  <>
                    <span className="text-[#C8F135] font-bold text-sm">Signed in as {user}</span>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); navigate("/list"); }}
                      className="text-left text-white hover:text-[#C8F135] font-semibold py-1 cursor-pointer"
                    >
                      Dashboard
                    </button>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-left text-white hover:text-[#C8F135] font-semibold py-1"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                      className="text-left text-red-400 hover:text-red-300 font-semibold py-1 cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-white hover:text-[#C8F135] font-semibold py-1"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 bg-[#C8F135] text-[#0F1E14] font-bold text-sm px-5 py-3 rounded-full"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* HERO SECTION (3D WebGL Canvas + Dynamic GSAP Overlay)          */}
      {/* ============================================================== */}
      <main className="relative" id="top">
        <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-20" id="hero-section">
          {/* Three.js WebGL Layer */}
          <Hero3D />

          {/* Fallback gradient */}
          <div className="hidden absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#C8F135]/5 to-transparent" id="hero-static-fallback"></div>

          {/* Hero Content Layer */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full pointer-events-none flex flex-col justify-between min-h-[calc(100vh-5rem)]">
            
            {/* Top Pill Badge */}
            <div className="pt-4 pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#0F1E14]/10 shadow-sm text-xs font-semibold text-[#0F1E14] opacity-0" id="hero-badge">
                <span className="w-2 h-2 rounded-full bg-[#C8F135] ring-2 ring-[#0F1E14]/10 animate-ping"></span>
                <span className="tracking-wide">New: Autonomous AI Bookkeeping v3.4</span>
              </div>
            </div>

            {/* Main Headline & Subheadline Grid */}
            <div className="my-auto py-12 max-w-3xl pointer-events-auto">
              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-[#0F1E14] leading-[0.95] tracking-tight" id="hero-headline">
                <div className="line-mask"><span className="reveal-word">Books</span></div>{" "}
                <div className="line-mask"><span className="reveal-word">that</span></div>{" "}
                <div className="line-mask">
                  <span className="reveal-word relative inline-block">
                    <span className="relative z-10 px-2 text-[#0F1E14]" id="hero-highlight">balance</span>
                    <span className="absolute inset-0 bg-[#C8F135] rounded-xl -rotate-1 z-0 scale-x-0 origin-left" id="hero-highlight-bg"></span>
                  </span>
                </div>
                <br className="hidden sm:inline" />{" "}
                <div className="line-mask"><span className="reveal-word">themselves.</span></div>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-[#0F1E14]/80 max-w-xl font-normal leading-relaxed opacity-0" id="hero-desc">
                Invoices, expenses, bank feeds and automated reconciliation in one calm workspace — with an intelligent AI that does the boring bookkeeping for you.
              </p>

              {/* Interactive CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4 opacity-0" id="hero-cta-group">
                <Link
                  to={user ? "/list" : "/register"}
                  className="inline-flex items-center gap-3 bg-[#C8F135] text-[#0F1E14] hover:bg-[#D9F926] font-bold text-base px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-lg btn-pulse"
                >
                  <span>{user ? "Go to Dashboard" : "Start 30-Day Free Trial"}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-[#0F1E14] font-semibold text-base px-6 py-4 rounded-full border border-[#0F1E14]/10 shadow-sm transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5 text-[#0F1E14] fill-current" />
                  <span>Watch 2-Minute Demo</span>
                </a>
              </div>

              <p className="mt-3 text-xs text-[#6C7A70] font-medium opacity-0" id="hero-microcopy">
                No credit card required. Cancel anytime.
              </p>
            </div>

            {/* Live Floating AI Notification Card & Cash Metrics */}
            <div className="pointer-events-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6">
              
              {/* AI Live Notification Floating Chip */}
              <div className="glass-dark text-white p-4 sm:p-5 rounded-2xl max-w-sm shadow-2xl border border-[#C8F135]/30 opacity-0 transform translate-y-6" id="hero-ai-chip">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8F135] animate-ping"></span>
                    <span className="text-xs uppercase tracking-wider font-bold text-[#C8F135]">Smart Financials AI</span>
                  </div>
                  <span className="text-[11px] text-white/50">Just now</span>
                </div>
                <p className="text-sm font-medium text-white/90 leading-snug">
                  "14 bank transactions matched automatically and 1 duplicate bill detected. Review now?"
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button className="px-3.5 py-1.5 rounded-lg bg-[#C8F135] text-[#0F1E14] text-xs font-bold hover:bg-[#D9F926] transition-colors cursor-pointer" type="button">
                    Review
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-colors cursor-pointer" type="button">
                    Later
                  </button>
                </div>
              </div>

              {/* Bottom Metric: Live Cash-Flow Counter */}
              <div className="glass-chip p-5 rounded-2xl shadow-xl border border-white/60 min-w-[260px] opacity-0 transform translate-y-6" id="hero-metric-chip">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6C7A70] mb-1">
                  <span>Consolidated Net Cash Flow</span>
                  <span className="text-[#0F1E14] bg-[#C8F135] px-2 py-0.5 rounded text-[10px] font-bold">LIVE Q1</span>
                </div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F1E14] tabular-nums">
                  Rs. <span id="cash-counter">0</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#0F1E14]/70 font-medium">
                  <span className="text-emerald-700 font-bold">↑ +14.6%</span>
                  <span>across 4 linked business accounts</span>
                </div>
              </div>

            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-0 pointer-events-none" id="scroll-cue">
            <span className="text-[11px] uppercase tracking-widest text-[#6C7A70] font-bold">Scroll Down</span>
            <div className="w-5 h-9 rounded-full border-2 border-[#0F1E14]/20 flex items-start justify-center p-1">
              <div className="w-1.5 h-2.5 rounded-full bg-[#0F1E14] animate-bounce"></div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MODULE PILLS STRIP                                             */}
        {/* ============================================================== */}
        <section className="py-8 bg-white border-y border-[#0F1E14]/5">
          <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center min-w-max gap-3 sm:gap-4">
              <span className="px-5 py-2.5 rounded-full bg-[#0F1E14] text-[#C8F135] text-xs font-bold uppercase tracking-wider shadow-sm">Invoicing</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Expenses</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Bank Feeds</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Payroll</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Inventory</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Tax &amp; VAT</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Multi-Currency</span>
              <span className="px-5 py-2.5 rounded-full bg-[#F3F4EC] text-[#0F1E14] text-xs font-semibold uppercase tracking-wider hover:bg-[#E5E7DC] transition-colors cursor-default">Reports</span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FEATURES SECTION (Bento Grid with 6 Cards)                     */}
        {/* ============================================================== */}
        <section className="py-24 sm:py-32 px-6 max-w-7xl mx-auto" id="features">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C7A70] block mb-3">EVERYTHING IN ONE PLACE</span>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-[#0F1E14] tracking-tight leading-[1.05]">
              Less spreadsheet. <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-3 py-0.5 text-[#0F1E14]">More business.</span>
                <span className="absolute inset-0 bg-[#CCFF00] rounded-2xl -rotate-1 z-0 scale-x-0 origin-left" id="features-highlight-bg"></span>
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: INVOICING */}
            <article className="feature-card bg-[#CCFF00] p-8 rounded-2xl flex flex-col justify-between min-h-[310px] transition-all duration-300 shadow-sm hover:shadow-xl" id="invoicing-card">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#0F1E14]/75">INVOICING</span>
                  <span className="w-8 h-8 rounded-full bg-[#0F1E14] text-[#CCFF00] flex items-center justify-center font-bold text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F1E14] leading-tight mb-3">
                  Get paid days sooner.
                </h3>
                <p className="text-[#0F1E14]/80 text-sm font-medium leading-relaxed">
                  Branded invoices, automatic reminders and one-tap payment links.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-[#0F1E14] uppercase tracking-wider flex items-center gap-1.5">
                <span>Instant payment checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </article>

            {/* Card 2: BANK FEEDS */}
            <article className="feature-card bg-white p-8 rounded-2xl border border-[#0F1E14]/10 flex flex-col justify-between min-h-[310px] shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#6C7A70]">BANK FEEDS</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Synced</span>
                </div>
                <div className="mb-5 bg-[#FAF9F5] p-3 rounded-xl border border-[#0F1E14]/5">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#0F1E14] mb-1.5">
                    <span className="text-[#6C7A70]">Reconciliation state</span>
                    <span className="font-bold tabular-nums text-[#0F1E14]" id="recon-percent">86% reconciled automatically</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#E5E7DC] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F1E14] rounded-full w-[86%] transition-all duration-1000" id="recon-bar"></div>
                  </div>
                </div>
                <h3 className="font-display text-3xl font-extrabold text-[#0F1E14] leading-tight mb-3">
                  Reconcile in minutes.
                </h3>
                <p className="text-[#6C7A70] text-sm leading-relaxed">
                  Transactions match themselves. You only touch the odd ones out.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-[#0F1E14] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Continuous automatic matching</span>
              </div>
            </article>

            {/* Card 3: REPORTS */}
            <article className="feature-card bg-[#111315] text-white p-8 rounded-2xl flex flex-col justify-between min-h-[310px] shadow-xl hover:shadow-2xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#CCFF00]">REPORTS</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white/70">Realtime</span>
                </div>
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  Know your numbers.
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Profit &amp; loss, balance sheet and cash forecast — always current, never exported.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs text-[#CCFF00] font-semibold border-t border-white/10">
                <span>Automated P&amp;L Reports</span>
                <span>Live Audit Trail</span>
              </div>
            </article>

            {/* Card 4: EXPENSES */}
            <article className="feature-card bg-white p-8 rounded-2xl border border-[#0F1E14]/10 flex flex-col justify-between min-h-[290px] shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#6C7A70]">EXPENSES</span>
                  <span className="w-8 h-8 rounded-full bg-[#F3F4EC] flex items-center justify-center text-sm text-[#0F1E14]">
                    <Camera className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F1E14] leading-tight mb-2">
                  Snap a receipt. Done.
                </h3>
                <p className="text-[#6C7A70] text-sm leading-relaxed">
                  Scan, categorise and attach to the right bill.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-[#0F1E14]">
                AI Optical Character Recognition (OCR)
              </div>
            </article>

            {/* Card 5: TAX */}
            <article className="feature-card bg-white p-8 rounded-2xl border border-[#0F1E14]/10 flex flex-col justify-between min-h-[290px] shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#6C7A70]">TAX</span>
                  <span className="w-8 h-8 rounded-full bg-[#F3F4EC] flex items-center justify-center text-sm text-[#0F1E14]">
                    <Scale className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F1E14] leading-tight mb-2">
                  Tax-ready all year.
                </h3>
                <p className="text-[#6C7A70] text-sm leading-relaxed">
                  VAT and sales tax tracked as you go, filed without panic.
                </p>
              </div>
              <div className="pt-4 text-xs font-semibold text-emerald-700">
                Auto-audited sales tax &amp; VAT
              </div>
            </article>

            {/* Card 6: TEAM */}
            <article className="feature-card bg-white p-8 rounded-2xl border border-[#0F1E14]/10 flex flex-col justify-between min-h-[290px] shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-[#6C7A70]">TEAM</span>
                  <span className="w-8 h-8 rounded-full bg-[#F3F4EC] flex items-center justify-center text-sm text-[#0F1E14]">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F1E14] leading-tight mb-2">
                  Your accountant, invited.
                </h3>
                <p className="text-[#6C7A70] text-sm leading-relaxed">
                  Share access with roles — no more emailing files.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-[#0F1E14]">
                Multi-user granular permissions
              </div>
            </article>

          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION: REAL-TIME BUSINESS INSIGHTS (TELEMETRY DASHBOARD)      */}
        {/* ============================================================== */}
        <section className="py-20 px-6 max-w-7xl mx-auto" id="insights">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="font-display text-4xl sm:text-6xl font-black text-[#0F1E14] tracking-tight">
              Real-time Business Insights
            </h2>
            <p className="mt-4 text-[#6C7A70] text-base sm:text-lg">
              Instant visibility across all active ledger syncs, live visitors, and continuous interaction streams.
            </p>
          </div>

          <div className="relative rounded-3xl bg-[#09111e] border border-cyan-500/25 shadow-2xl p-6 sm:p-10 text-white overflow-hidden backdrop-blur-2xl">
            {/* Glowing Ambient Radials */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#C8F135]/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Window Header Bar */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-cyan-400/30"></div>
                <div className="w-3 h-3 rounded-full bg-cyan-400/20"></div>
                <span className="ml-2 text-xs font-mono text-cyan-200/60 hidden sm:inline">live://finflow.telemetry/v4.1</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold font-mono">FINFLOW ANALYTICS</span>
              </div>
            </div>

            {/* 3 Top Metric Bento Cards (Bound to real Firebase data) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
              
              {/* Card 1: Active Ledger Syncs */}
              <div className="rounded-2xl bg-gradient-to-b from-[#132238] to-[#0e1829] border border-cyan-500/30 p-6 sm:p-7 shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all duration-300">
                <div>
                  <p className="text-sm font-semibold text-cyan-100/70 mb-2">Active Ledger Syncs</p>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums" id="metric-syncs">
                    24,103
                  </div>
                </div>
                <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-3 py-1.5 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    <span>Real-time validation</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Total Visitors (Real Firebase Visitor count) */}
              <div className="rounded-2xl bg-gradient-to-b from-[#132238] to-[#0e1829] border border-cyan-500/30 p-6 sm:p-7 shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all duration-300">
                <div>
                  <p className="text-sm font-semibold text-cyan-100/70 mb-2">Total Visitors</p>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums" id="metric-visitors">
                    {stats.visitors.toLocaleString()}
                  </div>
                </div>
                <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>Live traffic count</span>
                  </span>
                </div>
              </div>

              {/* Card 3: Total Interactions (Real Firebase Interactions count) */}
              <div className="rounded-2xl bg-gradient-to-b from-[#132238] to-[#0e1829] border border-cyan-500/30 p-6 sm:p-7 shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all duration-300">
                <div>
                  <p className="text-sm font-semibold text-cyan-100/70 mb-2">Total Interactions</p>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums" id="metric-interactions">
                    {stats.clicks.toLocaleString()}
                  </div>
                </div>
                <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Live interaction tracking</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Lower Card: Large Glowing Histogram Chart Box (9 Bars) */}
            <div className="rounded-2xl bg-gradient-to-b from-[#101b2f] to-[#09111f] border border-cyan-500/30 p-6 sm:p-8 relative z-10 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-200 uppercase">Synchronous Throughput Histogram (Last 8 Intervals)</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-cyan-200/70">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#00E5FF]"></span> Automated Ingestion</span>
                  <span className="hidden md:inline text-white/30">|</span>
                  <span className="hidden md:inline text-emerald-400 font-bold">Peak: +34.2% Sync Velocity</span>
                </div>
              </div>

              {/* Bar Graphic Container (9 Bars) */}
              <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2.5 sm:gap-4 pt-8 pb-3 border-b border-cyan-500/20" id="telemetry-bar-container">
                {/* Bar 1 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    2,410 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '24%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">08:00</span>
                </div>
                {/* Bar 2 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    3,840 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '38%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">10:00</span>
                </div>
                {/* Bar 3 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    1,780 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '18%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">12:00</span>
                </div>
                {/* Bar 4 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    5,200 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '52%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">14:00</span>
                </div>
                {/* Bar 5 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    3,810 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '38%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">16:00</span>
                </div>
                {/* Bar 6 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    6,620 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '66%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">18:00</span>
                </div>
                {/* Bar 7 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    4,240 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '42%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">20:00</span>
                </div>
                {/* Bar 8 (Peak) */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-100 text-[11px] font-mono bg-[#00E5FF] text-[#09111e] font-black px-2 py-0.5 rounded shadow">
                    PEAK 9,410
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00E5FF] to-[#C8F135] transition-all duration-700 hover:brightness-125 telemetry-bar-glow" style={{ height: '94%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold mt-2">NOW</span>
                </div>
                {/* Bar 9 */}
                <div className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded shadow pointer-events-none">
                    5,610 syncs
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0091FF] via-[#00B4D8] to-[#00E5FF] transition-all duration-700 hover:brightness-125" style={{ height: '56%' }}></div>
                  <span className="text-[10px] font-mono text-cyan-300/60 mt-2">+2h EST</span>
                </div>
              </div>

              {/* Chart Footer Status Metrics */}
              <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-cyan-200/70 gap-4">
                <div className="flex items-center gap-6">
                  <div>Sync Health: <span className="text-emerald-400 font-mono font-bold">99.98% uptime</span></div>
                  <div>Average Latency: <span className="text-cyan-300 font-mono font-bold">42ms</span></div>
                  <div className="hidden sm:inline">Packet Loss: <span className="text-white font-mono font-bold">0.00%</span></div>
                </div>
                <div className="flex items-center gap-2 text-cyan-300">
                  <span>Ledger status: In Sync</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* HOW IT WORKS SECTION (Stroke Drawing Numbers + Connecting Line)*/}
        {/* ============================================================== */}
        <section className="py-24 sm:py-32 bg-white border-y border-[#0F1E14]/5 relative overflow-hidden" id="how-it-works">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6C7A70] block mb-2">HOW IT WORKS</span>
              <h2 className="font-display text-4xl sm:text-6xl font-black text-[#0F1E14] tracking-tight">
                Set up before your chai cools.
              </h2>
            </div>

            {/* 3-Step Process with Connecting SVG Line */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-14 left-[15%] right-[15%] h-1 bg-[#E5E7DC] z-0">
                <div className="h-full bg-[#C8F135] w-0 transition-all duration-300" id="step-progress-line"></div>
              </div>

              {/* Step 1 */}
              <div className="step-card relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-28 h-28 mb-6 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-[#0F1E14]/10">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 100 100">
                    <path
                      className="step-stroke"
                      d="M35 35 L50 20 L50 80 M30 80 L70 80"
                      id="step-stroke-1"
                      stroke="#0F1E14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="8"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0F1E14] mb-3">
                  1. Connect your bank
                </h3>
                <p className="text-[#6C7A70] text-base leading-relaxed">
                  Secure read-only feeds bring in every transaction instantly into your automated workspace.
                </p>
              </div>

              {/* Step 2 */}
              <div className="step-card relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-28 h-28 mb-6 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-[#0F1E14]/10">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 100 100">
                    <path
                      className="step-stroke"
                      d="M25 35 C25 20 75 20 75 40 C75 60 25 80 25 80 L75 80"
                      id="step-stroke-2"
                      stroke="#0F1E14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="8"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0F1E14] mb-3">
                  2. Let Smart Financials sort it
                </h3>
                <p className="text-[#6C7A70] text-base leading-relaxed">
                  Categories, automatic matching and payment reminders happen seamlessly on autopilot.
                </p>
              </div>

              {/* Step 3 */}
              <div className="step-card relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-28 h-28 mb-6 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-[#0F1E14]/10">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 100 100">
                    <path
                      className="step-stroke"
                      d="M25 25 L75 25 L45 50 C65 50 75 60 75 75 C75 90 25 90 25 75"
                      id="step-stroke-3"
                      stroke="#0F1E14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="8"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0F1E14] mb-3">
                  3. Run on real numbers
                </h3>
                <p className="text-[#6C7A70] text-base leading-relaxed">
                  Open the dashboard and see exactly where your business stands in real time, 24 hours a day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* AI ASSISTANT SECTION ("Just ask your books")                   */}
        {/* ============================================================== */}
        <section className="py-24 sm:py-32 px-6 max-w-7xl mx-auto" id="ai-assistant">
          <div className="bg-[#0F1E14] text-white rounded-[2.5rem] p-8 sm:p-14 lg:p-20 shadow-2xl relative overflow-hidden transform scale-[0.92] transition-transform" id="ai-panel">
            {/* Ambient decorative glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C8F135]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Left Column: Copy */}
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#C8F135] uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#C8F135]"></span>
                  <span>SMART FINANCIALS AI</span>
                </div>
                <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]">
                  Just ask your books.
                </h2>
                <p className="mt-6 text-white/80 text-base sm:text-lg leading-relaxed">
                  Type a question in plain English or Roman Urdu. Get an instant answer, a chart, and the underlying journal entry behind it.
                </p>

                {/* Urdu/Roman Capable Badge */}
                <div className="mt-8 inline-block origin-top-left transform rotate-3" id="urdu-sticker">
                  <div className="bg-[#C8F135] text-[#0F1E14] font-bold text-sm sm:text-base px-4 py-2.5 rounded-2xl shadow-lg border-2 border-[#0F1E14] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F1E14]" />
                    <span>Understands natural business queries</span>
                  </div>
                </div>

                <div className="mt-10">
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0F1E14] hover:bg-[#D9F926] font-bold text-sm px-6 py-3.5 rounded-full transition-all hover:scale-105 shadow-md"
                  >
                    <span>Meet the assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive Scrubbed Chat Stream */}
              <div className="lg:col-span-7">
                <div className="bg-[#15271B]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl backdrop-blur-md">
                  {/* Chat Bubble 1 */}
                  <div className="flex justify-end opacity-0 transform translate-y-4" id="chat-q1">
                    <div className="bg-white/10 hover:bg-white/15 text-white/90 px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm sm:text-base font-medium max-w-md border border-white/5">
                      "What's the profit margin this month across nav shop &amp; Ai agency?"
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="hidden flex items-center gap-2 text-xs text-[#C8F135] pl-2 font-mono" id="chat-typing-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C8F135] animate-ping"></span>
                    <span>Khushi AI calculating consolidated ledger...</span>
                  </div>

                  {/* Chat Bubble 2 (AI Reply) */}
                  <div className="flex justify-start opacity-0 transform translate-y-4" id="chat-a1">
                    <div className="bg-[#C8F135] text-[#0F1E14] px-6 py-4 rounded-2xl rounded-tl-sm text-sm sm:text-base font-bold max-w-lg shadow-lg">
                      Net combined profit is Rs. 785,400 (up 22% on last month). Software licensing was the strongest driver at Rs. 310,000.
                    </div>
                  </div>

                  {/* Chat Bubble 3 */}
                  <div className="flex justify-end opacity-0 transform translate-y-4" id="chat-q2">
                    <div className="bg-white/10 hover:bg-white/15 text-white/90 px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm sm:text-base font-medium max-w-md border border-white/5">
                      "Show unpaid invoices over 30 days."
                    </div>
                  </div>

                  {/* Input bar mockup */}
                  <div className="pt-2">
                    <div className="w-full bg-[#08110B] border border-white/10 rounded-full px-5 py-3.5 flex items-center justify-between text-sm text-white/40">
                      <span>Ask anything about your consolidated finances...</span>
                      <div className="w-7 h-7 rounded-full bg-[#C8F135] text-[#0F1E14] flex items-center justify-center font-bold text-xs">
                        ↑
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* PRICING SECTION (Simple plans. Honest prices.)                 */}
        {/* ============================================================== */}
        <section className="py-24 sm:py-32 px-6 max-w-7xl mx-auto" id="pricing">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C7A70] block mb-2">PRICING</span>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-[#0F1E14] tracking-tight">
              Simple plans. Honest prices.
            </h2>
            <p className="mt-4 text-[#6C7A70] text-base">
              From solo boutique operators to fast-scaling multi-branch agencies — transparent pricing for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Starter Tier */}
            <div className="pricing-card bg-white p-8 sm:p-10 rounded-3xl border border-[#0F1E14]/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-bold text-[#0F1E14]">Starter</h3>
                  <span className="text-xs uppercase font-bold text-[#6C7A70]">Freelancers</span>
                </div>
                <div className="font-display text-4xl font-extrabold text-[#0F1E14] mb-1">
                  $19 <span className="text-sm font-medium text-[#6C7A70]">/month</span>
                </div>
                <div className="text-xs text-[#6C7A70] mb-6">or Rs. 4,500/month billed annually</div>
                <ul className="space-y-3.5 text-sm text-[#0F1E14]/80 mb-8 font-medium">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Invoices &amp; basic expenses
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> 1 Bank account feed
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Monthly P&amp;L report export
                  </li>
                  <li className="flex items-center gap-3 text-[#6C7A70]">
                    <span>—</span> AI Copilot assistant
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-3.5 px-6 rounded-full border-2 border-[#0F1E14] text-[#0F1E14] font-bold text-sm hover:bg-[#0F1E14] hover:text-[#C8F135] transition-all block"
              >
                Choose Starter
              </Link>
            </div>

            {/* Growth Tier (Most Popular) */}
            <div className="pricing-card bg-[#C8F135] p-8 sm:p-10 rounded-3xl shadow-xl border-2 border-[#0F1E14] flex flex-col justify-between relative lg:-translate-y-4">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F1E14] text-[#C8F135] text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-bold text-[#0F1E14]">Growth</h3>
                  <span className="text-xs uppercase font-bold text-[#0F1E14]/70">Growing Teams</span>
                </div>
                <div className="font-display text-4xl font-extrabold text-[#0F1E14] mb-1">
                  $49 <span className="text-sm font-medium text-[#0F1E14]/70">/month</span>
                </div>
                <div className="text-xs text-[#0F1E14]/80 mb-6">or Rs. 12,500/month billed annually</div>
                <ul className="space-y-3.5 text-sm text-[#0F1E14] mb-8 font-semibold">
                  <li className="flex items-center gap-3">
                    <span className="text-[#0F1E14] font-black">✓</span> All Starter features included
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[#0F1E14] font-black">✓</span> Unlimited live bank accounts
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[#0F1E14] font-black">✓</span> Full Smart Financials AI assistant
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[#0F1E14] font-black">✓</span> Payroll &amp; multi-currency
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-4 px-6 rounded-full bg-[#0F1E14] text-[#C8F135] hover:bg-[#15271B] font-bold text-sm shadow-md transition-all hover:scale-105 block"
              >
                Choose Growth
              </Link>
            </div>

            {/* Scale Tier */}
            <div className="pricing-card bg-white p-8 sm:p-10 rounded-3xl border border-[#0F1E14]/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-bold text-[#0F1E14]">Scale</h3>
                  <span className="text-xs uppercase font-bold text-[#6C7A70]">Finance Teams</span>
                </div>
                <div className="font-display text-4xl font-extrabold text-[#0F1E14] mb-1">
                  $119 <span className="text-sm font-medium text-[#6C7A70]">/month</span>
                </div>
                <div className="text-xs text-[#6C7A70] mb-6">or Rs. 28,000/month billed annually</div>
                <ul className="space-y-3.5 text-sm text-[#0F1E14]/80 mb-8 font-medium">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> All Growth features included
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Multi-entity consolidated books
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Custom roles &amp; audit trails
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Priority 24/7 dedicated support
                  </li>
                </ul>
              </div>
              <Link
                to="/contact"
                className="w-full text-center py-3.5 px-6 rounded-full border-2 border-[#0F1E14] text-[#0F1E14] font-bold text-sm hover:bg-[#0F1E14] hover:text-[#C8F135] transition-all block"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FINAL CALL TO ACTION (Giant Lime Banner + Splitting Headline) */}
        {/* ============================================================== */}
        <section className="py-16 px-6 max-w-7xl mx-auto">
          <div className="bg-[#C8F135] rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-4xl sm:text-7xl font-black text-[#0F1E14] tracking-tight leading-[0.95] mb-8" id="final-cta-headline">
                <span className="cta-split-line block">Close the books.</span>
                <span className="cta-split-line block">Not your weekend.</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to={user ? "/list" : "/register"}
                  className="bg-[#0F1E14] text-[#C8F135] hover:bg-[#15271B] font-bold text-base px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-xl btn-pulse inline-block"
                >
                  {user ? "Go to Dashboard" : "Start Free Trial"}
                </Link>
                <Link
                  to="/contact"
                  className="bg-white/80 hover:bg-white text-[#0F1E14] font-bold text-base px-8 py-4 rounded-full border border-[#0F1E14]/10 transition-all hover:scale-105 inline-block"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLOW LIME MARQUEE STRIP (Infinite Seamless Running Tape)       */}
        {/* ============================================================== */}
        <section aria-label="Operating highlights" className="py-6 bg-[#C8F135] border-y border-[#0F1E14] overflow-hidden">
          <div className="animate-marquee font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[#0F1E14] flex items-center">
            <span className="mx-6">AUTOMATED RECONCILIATION</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">INTELLIGENT AI COPILOT</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">TAX &amp; COMPLIANCE READY</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">MULTI-ENTITY CASH FLOW</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">INSTANT AUDIT TRAILS</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">ZERO MANUAL SPREADSHEETS</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            {/* Duplicated seamless loop set */}
            <span className="mx-6">AUTOMATED RECONCILIATION</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">INTELLIGENT AI COPILOT</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">TAX &amp; COMPLIANCE READY</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">MULTI-ENTITY CASH FLOW</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">INSTANT AUDIT TRAILS</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
            <span className="mx-6">ZERO MANUAL SPREADSHEETS</span>
            <span className="w-3 h-3 rounded-full bg-[#0F1E14]"></span>
          </div>
        </section>

      </main>

      {/* ============================================================== */}
      {/* FOOTER (Deep Ink Charcoal #08110B)                             */}
      {/* ============================================================== */}
      <footer className="bg-[#08110B] text-white pt-20 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/10">
            {/* Left Brand Col */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C8F135] flex items-center justify-center text-[#0F1E14] font-black text-xl">
                  SF
                </div>
                <span className="font-display text-2xl font-bold tracking-tight text-white">Smart Financials</span>
              </div>
              <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-6">
                Accounting that feels like a conversation. Built for modern operators, founders, and multi-entity enterprises.
              </p>
              <div className="text-xs text-[#C8F135] font-semibold">
                Calibrated with SOC2 Type II Certification &amp; 256-bit encryption.
              </div>
            </div>

            {/* Links Col 1 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-white/70 list-none p-0">
                <li><a className="hover:text-[#C8F135] transition-colors" href="#features">Invoicing</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#features">Expenses &amp; OCR</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#features">Bank Sync</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#insights">Insights &amp; Telemetry</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#ai-assistant">Khushi AI Assistant</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#features">Reports &amp; VAT</a></li>
              </ul>
            </div>

            {/* Links Col 2 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-white/70 list-none p-0">
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">About Us</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">Careers</a></li>
                <li><Link className="hover:text-[#C8F135] transition-colors" to="/contact">Contact</Link></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">Security Architecture</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">API Documentation</a></li>
              </ul>
            </div>

            {/* Links Col 3 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-white/70 list-none p-0">
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">Help Centre</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">FBR Tax Guides</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">Accounting Glossary</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#insights">System Telemetry</a></li>
                <li><a className="hover:text-[#C8F135] transition-colors" href="#top">Privacy Ledger</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright & Bottom Info */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
            <p>© 2026 Smart Financials Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a className="hover:text-white transition-colors" href="#top">Privacy Policy</a>
              <a className="hover:text-white transition-colors" href="#top">Terms of Service</a>
              <a className="hover:text-white transition-colors" href="#top">Security Status</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
