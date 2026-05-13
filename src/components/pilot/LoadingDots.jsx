import React from "react";
import { motion } from "framer-motion";

export default function LoadingDots() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <path d="M4 20L16 4L28 20" stroke="#c96442" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 20H28" stroke="#c96442" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}