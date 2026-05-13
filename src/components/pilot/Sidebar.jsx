import React, { useState } from "react";
import PilotLogo from "./PilotLogo";
import {
  PanelLeftIcon, PlusIcon, ChatIcon,
  MoreHorizontalIcon, UserIcon, SettingsIcon,
  TrashIcon, EditIcon
} from "./Icons";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Sidebar({
  collapsed,
  onToggle,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onSettingsClick,
  userName
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div
      className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out ${
        collapsed ? "w-[52px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-3 h-14`}>
        {!collapsed && <PilotLogo />}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <PanelLeftIcon className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-2 mb-1">
        <button
          onClick={onNewChat}
          className={`flex items-center gap-2.5 w-full rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors ${
            collapsed ? "justify-center p-2" : "px-3 py-2"
          }`}
        >
          <PlusIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {/* Nav Links */}
      {!collapsed && (
        <div className="px-2 space-y-0.5 mb-3">
          <NavItem icon={<ChatIcon className="w-4 h-4" />} label="Chats" active />
        </div>
      )}
      {collapsed && (
        <div className="px-2 space-y-0.5 mb-3 flex flex-col items-center">
          <button className="p-2 rounded-md text-foreground bg-accent transition-colors">
            <ChatIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recents */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recents
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors relative ${
                  activeId === conv.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => onSelectConversation(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {activeId === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <span className="text-sm truncate flex-1">{conv.title}</span>
                {hoveredId === conv.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-0.5 rounded hover:bg-secondary flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontalIcon className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onRenameConversation(conv.id); }}
                        className="text-sm gap-2"
                      >
                        <EditIcon className="w-3.5 h-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                        className="text-sm text-destructive gap-2"
                      >
                        <TrashIcon className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom User Section */}
      <div className={`border-t border-border p-3 space-y-2`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className={`flex items-center gap-2 ${collapsed ? "" : "flex-1 min-w-0"}`}>
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            {!collapsed && (
              <span className="text-sm text-foreground truncate">{userName || "User"}</span>
            )}
          </div>
        </div>
        <button 
          onClick={onSettingsClick}
          className={`flex items-center w-full ${collapsed ? "justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" : "gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent"} transition-colors`}>
          <SettingsIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "text-foreground bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}