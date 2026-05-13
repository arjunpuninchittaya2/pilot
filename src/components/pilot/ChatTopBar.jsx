import React from "react";
import { ChevronDownIcon, MoreHorizontalIcon } from "./Icons";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function ChatTopBar({ title, onApiKeyClick }) {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <MoreHorizontalIcon className="w-[18px] h-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={onApiKeyClick}>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}