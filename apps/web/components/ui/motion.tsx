"use client";

import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease
    }
  }
};

const containerVariants = (delay: number) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: delay
    }
  }
});

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease
    }
  }
};

type MotionProps = PropsWithChildren<{ className?: string }>;

type MotionContainerProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function MotionPage({ children, className }: MotionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial="hidden"
      animate="show"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionContainer({ children, className, delay = 0 }: MotionContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants(delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }: MotionProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
