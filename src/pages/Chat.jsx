const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useHackClub } from "@/lib/HackClubContext";
import ApiKeyModal from "@/components/ApiKeyModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  PaperclipIcon,
  PanelLeftIcon,
  PlusIcon,
  UserIcon,
  CloseIcon,
  SendIcon,
  MoreHorizontalIcon,
} from "@/components/pilot/Icons";

const CONVERSATIONS_STORAGE_KEY = "pilot_conversations";
const ACTIVE_CONVERSATION_STORAGE_KEY = "pilot_active_conversation";
const MOCK_FALLBACK_RESPONSES = [
  "That's a great question! Here's what I'd suggest:\n\n**Start with the core layout** — get the sidebar and main panel working as flex containers before touching any visual details.\n\nFor the color system, define your CSS custom properties first and reference only those throughout — never hardcode a hex in a component file.\n\nThe key to making it feel polished is the micro-interactions: hover states, focus rings, and message fade-in animations do 80% of the work.",
  "Sure! The Green Revolution refers to a series of agricultural innovations between the 1950s and 1970s that dramatically increased crop yields worldwide.\n\n**The paradox**: while it solved famine in many regions, it also created long-term ecological damage — soil degradation, water table depletion, and monoculture vulnerability.\n\nIt's a classic case of short-term gain vs. long-term sustainability.",
  "For your TOK exhibition, consider framing your personal object around the concept of **justified belief** vs. knowledge.\n\nThe key is connecting your object to a real-world example and an area of knowledge (AOK) — Natural Sciences and Human Sciences tend to offer the richest contrasts for personal experience prompts.",
];

function IconButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}

function createMessage(role, content, extra = {}) {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

function formatAttachmentsForApi(attachment, index) {
  const isImage = attachment.type?.startsWith("image/");
  if (isImage) {
    // For images, check if URL is publicly accessible (https://) or already base64
    // If it's a relative URL or data URL, use it as-is (data URLs are already base64)
    // The API will handle both public URLs and base64 data URLs
    const imageUrl = attachment.url;
    
    if (!imageUrl) {
      console.error("Image URL is empty or undefined");
      throw new Error("Image URL is missing");
    }
    
    return {
      type: "image_url",
      image_url: { url: imageUrl },
    };
  }

  const extension = attachment.type?.split("/")[1] || "bin";
  const randomId =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`;
  const fallbackFilename = `attachment-${randomId}.${extension}`;

  return {
    type: "file",
    file: {
      filename: attachment.name || fallbackFilename,
      file_data: attachment.url,
    },
  };
}

function formatMessagesForView(messages) {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp || new Date().toISOString(),
  }));
}

function RenderMarkdown({ children }) {
  return (
    <ReactMarkdown
      components={{
        pre: ({ children: preChildren }) => <pre>{preChildren}</pre>,
        code: ({ inline, children: codeChildren, ...props }) => {
          if (inline) {
            return <code {...props}>{codeChildren}</code>;
          }
          return <code {...props}>{codeChildren}</code>;
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function Chat() {
  const { isApiKeySet, client, favoriteModels, defaultFavoriteModel } = useHackClub();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(!isApiKeySet);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(defaultFavoriteModel);
  const [localMessages, setLocalMessages] = useState([]);
  const [isResponding, setIsResponding] = useState(false);
  const [screen, setScreen] = useState("welcome");
  const [welcomeText, setWelcomeText] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatAttachments, setChatAttachments] = useState([]);
  const [copiedMessageKey, setCopiedMessageKey] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileRef = useRef(null);
  const timeoutsRef = useRef([]);
  const lastUserMessageRef = useRef("");

  const activeConv = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConvId),
    [conversations, activeConvId]
  );
  const topbarTitle = activeConv?.title || "Hack Club AI";
  const showChatScreen = screen === "chat" && (activeConvId || localMessages.length > 0 || isResponding);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    const savedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const savedActiveConversation = localStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY);

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    }

    if (savedActiveConversation) {
      setActiveConvId(savedActiveConversation);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeConvId) {
      localStorage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, activeConvId);
    } else {
      localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (activeConv) {
      setLocalMessages(formatMessagesForView(activeConv.messages || []));
      setScreen("chat");
    } else if (!activeConvId) {
      setLocalMessages([]);
      setScreen("welcome");
    }
  }, [activeConv, activeConvId]);

  useEffect(() => {
    if (favoriteModels.length === 0) return;
    if (!favoriteModels.includes(selectedModel)) {
      setSelectedModel(favoriteModels[0]);
    }
  }, [favoriteModels, selectedModel]);

  useEffect(() => {
    if (isApiKeySet) {
      setSettingsOpen(false);
    }
  }, [isApiKeySet]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isResponding, screen]);

  const schedule = useCallback((callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const triggerFilePicker = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const startNewChat = useCallback(() => {
    clearTimers();
    setActiveConvId(null);
    setLocalMessages([]);
    setChatText("");
    setChatAttachments([]);
    setWelcomeText("");
    setIsResponding(false);
    setScreen("welcome");
  }, [clearTimers]);

  const selectConversation = useCallback((conversationId) => {
    clearTimers();
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    setActiveConvId(conversationId);
    setScreen("chat");
    setLocalMessages(formatMessagesForView(conversation.messages || []));
    setWelcomeText("");
    setChatText("");
    setChatAttachments([]);
    setIsResponding(false);
  }, [clearTimers, conversations]);

  const handleDeleteConversation = useCallback((conversationId) => {
    setConversations((previous) => previous.filter((conversation) => conversation.id !== conversationId));
    if (activeConvId === conversationId) {
      startNewChat();
    }
  }, [activeConvId, startNewChat]);

  const handleRenameConversation = useCallback((conversationId) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    const newTitle = window.prompt("Rename conversation:", conversation.title);
    if (!newTitle || !newTitle.trim()) return;

    setConversations((previous) =>
      previous.map((item) =>
        item.id === conversationId ? { ...item, title: newTitle.trim() } : item
      )
    );
  }, [conversations]);

  const loadConversationIntoState = useCallback((messages) => {
    setLocalMessages(formatMessagesForView(messages));
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
  };

  const handleTextareaChange = (event, source) => {
    const nextValue = event.target.value;
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
    if (source === "welcome") {
      setWelcomeText(nextValue);
    } else {
      setChatText(nextValue);
    }
  };

  const handleKeyDown = (event, source) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (source === "welcome") {
        sendMessage(welcomeText, [], selectedModel);
      } else {
        sendMessage(chatText, chatAttachments, selectedModel);
      }
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const uploaded = [];
    for (const file of files) {
      const isImage = file.type?.startsWith("image/");
      
      if (isImage) {
        // For images, convert to base64 data URL for reliable API compatibility
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        
        try {
          const base64DataUrl = await base64Promise;
          uploaded.push({ name: file.name, url: base64DataUrl, type: file.type });
        } catch (error) {
          console.error(`Failed to read image file ${file.name}:`, error);
          throw new Error(`Failed to process image: ${file.name}`);
        }
      } else {
        // For non-image files (PDFs, etc), upload normally
        const { file_url } = await db.integrations.Core.UploadFile({ file });
        uploaded.push({ name: file.name, url: file_url, type: file.type });
      }
    }

    setChatAttachments((previous) => [...previous, ...uploaded]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setChatAttachments((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleCopyMessage = async (messageKey, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageKey(messageKey);
    setTimeout(() => setCopiedMessageKey(null), 1500);
  };

  const retryLast = () => {
    if (lastUserMessageRef.current) {
      sendMessage(lastUserMessageRef.current, [], selectedModel);
    }
  };

  const sendMessage = async (text, attachments, model) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    if (!isApiKeySet || !client) {
      setSettingsOpen(true);
      return;
    }

    clearTimers();
    setScreen("chat");
    setIsResponding(true);
    setCopiedMessageKey(null);
    lastUserMessageRef.current = trimmedText;

    const userMessage = {
      role: "user",
      content: trimmedText,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const conversationId = activeConvId || `conv_${Date.now()}`;
    const newMessages = [...localMessages, userMessage];
    setLocalMessages(newMessages);
    setWelcomeText("");
    setChatText("");
    setChatAttachments([]);

    if (!activeConvId) {
      const newConversation = {
        id: conversationId,
        title: trimmedText.slice(0, 60) + (trimmedText.length > 60 ? "..." : ""),
        messages: newMessages,
        last_activity: new Date().toISOString(),
      };
      setConversations((previous) => [newConversation, ...previous]);
      setActiveConvId(conversationId);
    } else {
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: newMessages,
                last_activity: new Date().toISOString(),
              }
            : conversation
        )
      );
    }

    try {
      const apiMessages = newMessages.map((message) => {
        const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
        if (!hasAttachments) {
          return {
            role: message.role,
            content: message.content,
          };
        }

        const content = [];
        if (message.content && message.content.trim()) {
          content.push({ type: "text", text: message.content });
        }
        content.push(...message.attachments.map((attachment, index) => formatAttachmentsForApi(attachment, index)));

        return {
          role: message.role,
          content,
        };
      });

      const hasFileAttachments = apiMessages.some(
        (message) => Array.isArray(message.content) && message.content.some((item) => item?.type === "file")
      );

      let fullResponse = "";
      const response = await client.sendMessage(apiMessages, {
        model,
        temperature: 0.7,
        max_tokens: 2000,
        plugins: hasFileAttachments ? [{ id: "file-parser", pdf: { engine: "native" } }] : undefined,
        onChunk: (chunk) => {
          fullResponse += chunk;
          setLocalMessages((previous) => {
            const lastMessage = previous[previous.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              return [...previous.slice(0, -1), { ...lastMessage, content: fullResponse }];
            }
            return [
              ...previous,
              {
                role: "assistant",
                content: fullResponse,
                timestamp: new Date().toISOString(),
              },
            ];
          });
        },
      });

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setLocalMessages((previous) => {
        const lastMessage = previous[previous.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          return [...previous.slice(0, -1), assistantMessage];
        }
        return [...previous, assistantMessage];
      });

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...newMessages, assistantMessage],
                last_activity: new Date().toISOString(),
              }
            : conversation
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setLocalMessages(localMessages);
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, messages: localMessages }
            : conversation
        )
      );

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Invalid or expired API key") || errorMessage.includes("401")) {
        alert("Your API key is invalid. Please update it in settings.");
        setSettingsOpen(true);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsResponding(false);
    }
  };

  useEffect(() => {
    const active = conversations.find((conversation) => conversation.id === activeConvId);
    if (!active && conversations.length > 0 && !activeConvId && screen !== "welcome") {
      loadConversationIntoState(conversations[0].messages || []);
      setActiveConvId(conversations[0].id);
      setScreen("chat");
    }
  }, [activeConvId, conversations, loadConversationIntoState, screen]);

  return (
    <div className="pilot-shell">
      <h2 className="sr-only">Pilot</h2>

      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : "expanded"}`}>
        <div className="sidebar-top">
          {!sidebarCollapsed && <div className="logo">Pilot</div>}
          <IconButton
            className="icon-btn"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
          >
            <PanelLeftIcon className="w-[18px] h-[18px]" />
          </IconButton>
        </div>

        <button className="new-chat-btn" onClick={startNewChat} type="button">
          <PlusIcon className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>New chat</span>}
        </button>

        {!sidebarCollapsed && (
          <>
            <div className="recents-header">Recents</div>
            <div className="recents-list">
              {conversations.length === 0 ? (
                <div className="recents-empty">No chats yet</div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`chat-item ${activeConvId === conversation.id ? "active" : ""}`}
                    onClick={() => selectConversation(conversation.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="chat-item-title">{conversation.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="chat-item-dots"
                          aria-label={`Open menu for ${conversation.title}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontalIcon className="w-[13px] h-[13px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40 border-[color:var(--border2)] bg-[color:var(--sidebar)] p-1 text-[color:var(--t1)] shadow-2xl">
                        <DropdownMenuItem
                          className="cursor-pointer rounded-sm px-2 py-1.5 text-sm text-[color:var(--t1)] outline-none transition-colors focus:bg-[color:var(--surface2)] focus:text-[color:var(--t1)]"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                        >
                          Delete chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="sidebar-bottom">
          <button className="account-btn" type="button" onClick={openSettings}>
            <div className="avatar">U</div>
            {!sidebarCollapsed && <span className="user-label">User</span>}
          </button>
        </div>
      </aside>

      <main className="main">
        {showChatScreen && (
          <div className="topbar">
            <div className="topbar-title">
              <span className="topbar-title-text">{topbarTitle}</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[color:var(--t2)]" />
            </div>
          </div>
        )}

        {screen === "welcome" ? (
          <div className="welcome">
            <div className="welcome-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="var(--accent)" opacity="0.25" stroke="none" />
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
              </svg>
            </div>
            <div className="welcome-title">Back at it, Arjun</div>
            <div className="input-wrap narrow">
              <div className="input-row">
                <textarea
                  className="msg-input"
                  value={welcomeText}
                  rows={1}
                  placeholder="Type / for skills"
                  onChange={(event) => handleTextareaChange(event, "welcome")}
                  onKeyDown={(event) => handleKeyDown(event, "welcome")}
                />
                <button className="send-btn" onClick={() => sendMessage(welcomeText, [], selectedModel)} aria-label="Send" type="button">
                  <SendIcon className="w-[15px] h-[15px]" />
                </button>
              </div>
              <div className="input-footer">
                <div className="input-left">
                  <button className="icon-btn" aria-label="Attach" type="button" onClick={triggerFilePicker}>
                    <PaperclipIcon className="w-[15px] h-[15px]" />
                  </button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="model-pill" type="button">
                      {selectedModel}
                      <ChevronDownIcon className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48 border-[color:var(--border2)] bg-[color:var(--sidebar)] p-1 text-[color:var(--t1)] shadow-2xl">
                    {favoriteModels.map((modelName) => (
                      <DropdownMenuItem
                        key={modelName}
                        onClick={() => setSelectedModel(modelName)}
                        className={selectedModel === modelName ? "cursor-pointer rounded-sm px-2 py-1.5 text-sm bg-[color:var(--surface2)] text-[color:var(--t1)] outline-none" : "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-[color:var(--t1)] outline-none transition-colors focus:bg-[color:var(--surface2)] focus:text-[color:var(--t1)]"}
                      >
                        {modelName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-screen">
            <div className="chat-area" ref={scrollContainerRef} onScroll={handleScroll}>
              {localMessages.map((message, index) => {
                const messageKey = `${message.role}-${index}-${message.timestamp}`;
                const isUser = message.role === "user";
                return (
                  <div
                    key={messageKey}
                    className={`msg-row ${message.role}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {isUser && message.attachments?.length > 0 && (
                      <div className="attachment-row">
                        {message.attachments.map((attachment, attachmentIndex) => (
                          <a
                            key={`${messageKey}-att-${attachmentIndex}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-chip"
                          >
                            <span className="attachment-name">{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {isUser ? (
                      <>
                        <div className="msg-bubble">{message.content}</div>
                      </>
                    ) : (
                      <>
                        <div className="msg-ai-text markdown-content">
                          <RenderMarkdown>{message.content}</RenderMarkdown>
                        </div>
                        <div className="action-bar">
                          <button className="action-btn" onClick={() => handleCopyMessage(messageKey, message.content)} title="Copy" type="button">
                            {copiedMessageKey === messageKey ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            {copiedMessageKey === messageKey ? "Copied" : "Copy"}
                          </button>
                          <button className="action-btn" title="Good response" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                          </button>
                          <button className="action-btn" title="Bad response" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                            </svg>
                          </button>
                          <button className="action-btn" onClick={retryLast} title="Retry" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="1 4 1 10 7 10" />
                              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                            </svg>
                            Retry
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {isResponding && (
                <div className="msg-row ai typing-row">
                  <div className="loading-dots" aria-label="Pilot is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="bottom-bar">
              <div className="bottom-bar-inner">
                {chatAttachments.length > 0 && (
                  <div className="attachment-row attachment-row-bottom">
                    {chatAttachments.map((attachment, index) => (
                      <div key={`${attachment.name}-${index}`} className="attachment-chip">
                        <span className="attachment-name">{attachment.name}</span>
                        <button type="button" className="attachment-remove" onClick={() => removeAttachment(index)} aria-label={`Remove ${attachment.name}`}>
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="input-wrap">
                  <div className="input-row">
                    <textarea
                      className="msg-input"
                      value={chatText}
                      rows={1}
                      placeholder="Reply to Pilot..."
                      onChange={(event) => handleTextareaChange(event, "chat")}
                      onKeyDown={(event) => handleKeyDown(event, "chat")}
                    />
                    <button className="send-btn" onClick={() => sendMessage(chatText, chatAttachments, selectedModel)} aria-label="Send" type="button">
                      <SendIcon className="w-[15px] h-[15px]" />
                    </button>
                  </div>
                  <div className="input-footer">
                    <div className="input-left">
                      <button className="icon-btn" aria-label="Attach" type="button" onClick={triggerFilePicker}>
                        <PaperclipIcon className="w-[15px] h-[15px]" />
                      </button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="model-pill" type="button">
                          {selectedModel}
                          <ChevronDownIcon className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48 border-[color:var(--border2)] bg-[color:var(--sidebar)] p-1 text-[color:var(--t1)] shadow-2xl">
                        {favoriteModels.map((modelName) => (
                          <DropdownMenuItem
                            key={modelName}
                            onClick={() => setSelectedModel(modelName)}
                            className={selectedModel === modelName ? "cursor-pointer rounded-sm px-2 py-1.5 text-sm bg-[color:var(--surface2)] text-[color:var(--t1)] outline-none" : "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-[color:var(--t1)] outline-none transition-colors focus:bg-[color:var(--surface2)] focus:text-[color:var(--t1)]"}
                          >
                            {modelName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="disclaimer">Pilot is AI and can make mistakes. Please double-check responses.</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <ApiKeyModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
