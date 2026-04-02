"use client";

import { motion, Variants } from "framer-motion";

export function AnimatedTitle() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100,
      },
    },
  };

  const feedText = "Feed".split("");
  const pulseText = "Pulse".split("");

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight flex justify-center items-center flex-wrap"
    >
      <div className="flex font-extrabold text-zinc-900 dark:text-white drop-shadow-sm">
        {feedText.map((letter, index) => (
          <motion.span key={index} variants={letterVariants}>
            {letter}
          </motion.span>
        ))}
      </div>
      <div className="flex font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 drop-shadow-md ml-1">
        {pulseText.map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className="inline-block"
            whileHover={{
              scale: 1.1,
              rotate: Math.random() * 10 - 5,
              color: "#a855f7",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.h1>
  );
}
