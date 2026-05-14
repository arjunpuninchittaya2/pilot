const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from "react";
import { PaperclipIcon, SendIcon, ChevronDownIcon, MicIcon, CloseIcon, FileIcon } from "./Icons";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { useHackClub } from "@/lib/HackClubContext";

export default function ChatInput({ onSend, disabled }) {
  const { favoriteModels, defaultFavoriteModel } = useHackClub();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [model, setModel] = useState(defaultFavoriteModel);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (favoriteModels.length === 0) {
      setModel(defaultFavoriteModel);
      return;
    }
    if (!favoriteModels.includes(model)) {
      setModel(favoriteModels[0]);
    }
  }, [favoriteModels, model, defaultFavoriteModel]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    onSend(text.trim(), attachments, model);
    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url, type: file.type });
    }
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2.5 py-1.5 text-xs">
              <FileIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate max-w-[100px] text-foreground">{att.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground ml-1">
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 bg-secondary rounded-2xl border border-border px-3 py-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 mb-0.5"
        >
          <PaperclipIcon className="w-[18px] h-[18px]" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none py-1.5 leading-relaxed focus:outline-none"
        />

        <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <span className="sr-only">Select chat model</span>
                  <span>{model || "No models"}</span>
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border max-h-72 overflow-y-auto">
                {favoriteModels.map((m) => (
                  <DropdownMenuItem
                    key={m}
                    onClick={() => setModel(m)}
                  className={`text-sm ${m === model ? "text-primary" : ""}`}
                >
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <MicIcon className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && attachments.length === 0)}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-muted-foreground mt-2">
        Pilot is AI and can make mistakes. Please double-check responses.
      </p>
    </div>
  );
}
