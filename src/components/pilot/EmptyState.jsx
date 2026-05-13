import React from "react";
import PilotLogo from "./PilotLogo";

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M4 20L16 4L28 20" stroke="#c96442" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 20L16 10L24 20" fill="#c96442" fillOpacity="0.15"/>
          <path d="M4 20H28" stroke="#c96442" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 20V26L16 23L22 26V20" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Start a conversation by typing a message below. I can help with writing, analysis, coding, math, and much more.
      </p>
    </div>
  );
}