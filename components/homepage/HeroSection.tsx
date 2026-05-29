"use client";

import EmergencyInput from "../EmergencyInput";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface Props {
  onSubmit: (text: string) => void;
  onSOS: () => void;
  lang: "en" | "id";
  locationStatus: "loading" | "detected" | "denied" | "ignored" | string;
  onLocationUpdate?: (loc: {lat: number, lng: number}) => void;
  onContinueWithoutLocation?: () => void;
}

export default function HeroSection({ onSubmit, onSOS, lang, locationStatus, onLocationUpdate, onContinueWithoutLocation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    interface Drop {
      x: number;
      y: number;
      len: number;
      speed: number;
      opacity: number;
      width: number;
    }

    let drops: Drop[] = [];

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      drops = Array.from({ length: Math.floor((W * H) / 4200) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 14 + Math.random() * 28,
        speed: 9 + Math.random() * 18,
        opacity: 0.06 + Math.random() * 0.22,
        width: 0.5 + Math.random() * 0.8,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    // Mist layer state
    let mistX = 0;

    const draw = () => {
      if (W <= 0 || H <= 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, W, H);

      // Slow horizontal mist bands
      mistX -= 0.18;
      const mistGrad = ctx.createLinearGradient(mistX % W, 0, (mistX % W) + W * 2, 0);
      mistGrad.addColorStop(0, "rgba(0,130,166,0.00)");
      mistGrad.addColorStop(0.2, "rgba(0,130,166,0.04)");
      mistGrad.addColorStop(0.45, "rgba(0,180,216,0.07)");
      mistGrad.addColorStop(0.7, "rgba(0,130,166,0.04)");
      mistGrad.addColorStop(1, "rgba(0,130,166,0.00)");
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, H * 0.3, W, H * 0.45);

      // Rain streaks
      for (const d of drops) {
        ctx.beginPath();
        // slight diagonal — Jakarta rain leans a bit
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.18, d.y + d.len);
        ctx.strokeStyle = `rgba(160,220,255,${d.opacity})`;
        ctx.lineWidth = d.width;
        ctx.lineCap = "round";
        ctx.stroke();

        d.y += d.speed;
        d.x -= d.speed * 0.18;

        if (d.y - d.len > H || d.x < -20) {
          d.y = -d.len - Math.random() * 60;
          d.x = Math.random() * (W + 40);
        }
      }

      // Subtle city-light bloom at bottom — urban glow through the rain
      const bloomGrad = ctx.createRadialGradient(W * 0.5, H, 0, W * 0.5, H, W * 0.55);
      bloomGrad.addColorStop(0, "rgba(0,130,166,0.14)");
      bloomGrad.addColorStop(0.5, "rgba(0,180,216,0.06)");
      bloomGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, W, H);

      // Secondary warm amber glow (streetlights)
      const amberGrad = ctx.createRadialGradient(W * 0.28, H * 0.88, 0, W * 0.28, H * 0.88, W * 0.3);
      amberGrad.addColorStop(0, "rgba(255,180,60,0.06)");
      amberGrad.addColorStop(1, "rgba(255,180,60,0)");
      ctx.fillStyle = amberGrad;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center pt-32 md:pt-48 pb-20 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080f1e 0%, #0a1628 55%, #0d1f35 100%)" }}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        {/* Rain canvas */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Top vignette — keeps text readable */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(8,15,30,0.55) 0%, transparent 35%, transparent 65%, rgba(8,15,30,0.40) 100%)",
          }}
        />
      </motion.div>

      {/* Main content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ y, opacity }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="w-full relative z-10"
      >
        <EmergencyInput
          onSubmit={onSubmit}
          onSOS={onSOS}
          lang={lang}
          isAnalyzing={false}
          locationStatus={locationStatus}
          onLocationUpdate={onLocationUpdate}
          onContinueWithoutLocation={onContinueWithoutLocation}
          dark
        />
      </motion.div>
    </section>
  );
}
