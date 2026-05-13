import React from "react";
import { ChevronDownIcon, BookmarkIcon, ShareIcon, SettingsIcon } from "./Icons";

export default function ChatTopBar({ title, onShare, onApiKeyClick }) {
  const displayTitle = title || "Hack Club AI";
  
  return (
    <div className="h-14 flex items-center justify-between px-5 border-b border-border flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
          {displayTitle}
        </span>
        <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onApiKeyClick}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="API Settings"
        >
          <SettingsIcon className="w-[18px] h-[18px]" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <BookmarkIcon className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={onShare}
          className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
        >
          <ShareIcon className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </div>
  );
}