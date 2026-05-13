import React, { useState } from "react";
import { CloseIcon, LinkIcon, CopyIcon, CheckIcon, DownloadIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";

export default function ShareModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Share conversation</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  {copied ? <CheckIcon className="w-4 h-4 text-primary" /> : <LinkIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {copied ? "Link copied!" : "Copy link"}
                  </p>
                  <p className="text-xs text-muted-foreground">Share this conversation via link</p>
                </div>
              </button>

              <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-left">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <DownloadIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Export as PDF</p>
                  <p className="text-xs text-muted-foreground">Download conversation as a document</p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}