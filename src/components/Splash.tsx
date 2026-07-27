"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashProps {
  isRedirecting: boolean;
}

export default function Splash({ isRedirecting }: SplashProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-lokma-black">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-lokma-orange rounded-full opacity-40"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -100],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        className="absolute w-64 h-64 rounded-full bg-lokma-orange opacity-10 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="splash"
          className="relative z-10 flex flex-col items-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="mb-8"
          >
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 glow-orange rounded-2xl overflow-hidden">
              <Image
                src="/lokmago-preview.jpg"
                alt="LokmaGo Logo"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 256px, 288px"
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-3 text-glow tracking-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="text-white">Lokma</span>
            <span className="text-lokma-orange">Go</span>
          </motion.h1>

          <motion.p
            className="text-lokma-gold text-sm sm:text-base tracking-[0.3em] uppercase mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            BUYURTMA · BRON · DOSTAVKA
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-lokma-orange to-lokma-gold rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>

            <motion.p
              className="text-white/60 text-sm"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isRedirecting ? "Telegramga yo'naltirilmoqda..." : "LokmaGo ochilmoqda..."}
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-lokma-dark/50 to-transparent pointer-events-none" />
    </div>
  );
}