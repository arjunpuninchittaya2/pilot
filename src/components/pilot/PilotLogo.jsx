import React from "react";

export default function PilotLogo({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20L16 4L28 20" stroke="#c96442" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 20L16 10L24 20" fill="#c96442" fillOpacity="0.2"/>
        <path d="M4 20H28" stroke="#c96442" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 20V26L16 23L22 26V20" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {!collapsed && (
        <span className="text-lg font-bold text-foreground tracking-tight">Pilot</span>
      )}
    </div>
  );
}