"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashProps {
  isRedirecting: boolean;
  onComplete?: () => void; // 5 soniyadan so'ng chaqiriladigan funksiya
}

// SSR + Client uchun bir xil zarralar (Particles)
const particles = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 73.7) % 100,
  duration: 2.5 + ((i * 0.37) % 2),
  delay: (i * 0.19) % 2,
}));

export default function Splash({ isRedirecting, onComplete }: SplashProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 50ms da bir progress bar-ni oshirib boramiz (Jami 5000ms = 5 soniya)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return prev + 1; // Har 50ms da 1% qo'shiladi (100 * 50ms = 5000ms)
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-lokma-black selection:bg-none">
      
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-lokma-orange rounded-full opacity-40"
            initial={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Orange Glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-lokma-orange opacity-15 blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="splash"
          className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Card / Banner Area */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              delay: 0.1,
            }}
            className="mb-6 relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden border border-lokma-orange/30 shadow-[0_0_30px_rgba(255,122,0,0.2)]"
          >
            <Image
              src="/banner.png"
              alt="LokmaGo Banner"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 640px) 256px, 288px"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="text-white">Lokma</span>
            <span className="text-lokma-orange">Go</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lokma-gold text-xs sm:text-sm tracking-[0.25em] uppercase mb-6 font-medium"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            BUYURTMA · BRON · DOSTAVKA
          </motion.p>

          {/* Progress Container */}
          <motion.div
            className="flex flex-col items-center gap-3 w-full px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Progress Bar Body */}
            <div className="relative w-full h-2.5 bg-white/10 backdrop-blur-md rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-lokma-orange via-amber-400 to-lokma-gold rounded-full shadow-[0_0_12px_rgba(255,150,0,0.8)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Percentage & Status Text */}
            <div className="flex justify-between items-center w-full text-xs text-white/70 font-mono px-1">
              <span>{progress}%</span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {isRedirecting || progress === 100
                  ? "Yo'naltirilmoqda..."
                  : "LokmaGo ochilmoqda..."}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-lokma-dark/80 to-transparent pointer-events-none" />
    </div>
  );
}