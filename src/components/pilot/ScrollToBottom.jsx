import React from "react";
import { ArrowDownIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToBottom({ visible, onClick }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={onClick}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 p-2 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-lg"
        >
          <ArrowDownIcon className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}