import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useHackClub } from "@/lib/HackClubContext";
import ApiKeyModal from "@/components/ApiKeyModal";
import Sidebar from "@/components/pilot/Sidebar";
import ChatTopBar from "@/components/pilot/ChatTopBar";
import ChatInput from "@/components/pilot/ChatInput";
import MessageBubble from "@/components/pilot/MessageBubble";
import LoadingDots from "@/components/pilot/LoadingDots";
import EmptyState from "@/components/pilot/EmptyState";
import ScrollToBottom from "@/components/pilot/ScrollToBottom";
import ShareModal from "@/components/pilot/ShareModal";

// Storage keys
const CONVERSATIONS_STORAGE_KEY = "pilot_conversations";
const USERNAME_STORAGE_KEY = "pilot_username";

// Type definitions
/**
 * @typedef {Object} Message
 * @property {string} role
 * @property {string} content
 * @property {string} timestamp
 * @property {Array?} attachments
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 * @property {string} last_activity
 */

export default function Chat() {
  const { isApiKeySet, client, saveApiKey } = useHackClub();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [localMessages, setLocalMessages] = useState(/** @type {Message[]} */[]);
  const [isResponding, setIsResponding] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(!isApiKeySet);
  const [conversations, setConversations] = useState(/** @type {Conversation[]} */[]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (saved) {
      try {
        setConversations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load conversations:", e);
      }
    }

    const savedUserName = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId),
    [conversations, activeConvId]
  );

  useEffect(() => {
    if (activeConv) {
      setLocalMessages(activeConv.messages || []);
    } else if (!activeConvId) {
      setLocalMessages([]);
    }
  }, [activeConvId, activeConv?.id]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isResponding, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!atBottom);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setLocalMessages([]);
  };

  const handleDelete = (convId) => {
    setConversations((prevConvs) =>
      prevConvs.filter((c) => c.id !== convId)
    );
    if (activeConvId === convId) {
      setActiveConvId(null);
      setLocalMessages([]);
    }
  };

  const handleRename = async (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const newTitle = window.prompt("Rename conversation:", conv.title);
    if (newTitle && newTitle.trim()) {
      setConversations((prevConvs) =>
        prevConvs.map((c) =>
          c.id === convId ? { ...c, title: newTitle.trim() } : c
        )
      );
    }
  };

  const handleSend = async (text, attachments, model) => {
    if (!isApiKeySet || !client) {
      setApiKeyModalOpen(true);
      return;
    }

    const userMsg = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const newMessages = [...localMessages, userMsg];
    setLocalMessages(newMessages);
    setIsResponding(true);

    let convId = activeConvId;
    let updatedMessages = newMessages;

    try {
      // Create conversation if needed
      if (!convId) {
        const title = text.slice(0, 60) + (text.length > 60 ? "..." : "");
        const newConv = {
          id: `conv_${Date.now()}`,
          title,
          messages: newMessages,
          last_activity: new Date().toISOString(),
        };
        setConversations((prevConvs) => [newConv, ...prevConvs]);
        convId = newConv.id;
        setActiveConvId(convId);
      } else {
        // Update existing conversation with user message
        setConversations((prevConvs) =>
          prevConvs.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: newMessages,
                  last_activity: new Date().toISOString(),
                }
              : c
          )
        );
      }

      // Call Hack Club API with the conversation history
      // Format messages for the API
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = "";
      const response = await client.sendMessage(apiMessages, {
        model: model,
        temperature: 0.7,
        max_tokens: 2000,
        onChunk: (chunk) => {
          fullResponse += chunk;
          // Update the assistant message in real-time
          setLocalMessages((prevMessages) => {
            const last = prevMessages[prevMessages.length - 1];
            if (last && last.role === "assistant") {
              return [
                ...prevMessages.slice(0, -1),
                { ...last, content: fullResponse },
              ];
            } else {
              return [
                ...prevMessages,
                {
                  role: "assistant",
                  content: fullResponse,
                  timestamp: new Date().toISOString(),
                },
              ];
            }
          });
        },
      });


      // Update conversation with both messages
      updatedMessages = [...newMessages, {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      }];

      setConversations((prevConvs) =>
        prevConvs.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: updatedMessages,
                last_activity: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the user message if API call failed
      setLocalMessages(localMessages);
      setConversations((prevConvs) =>
        prevConvs.map((c) =>
          c.id === convId
            ? { ...c, messages: localMessages }
            : c
        )
      );

      // Show error to user
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's an auth error and open the modal to let them update the key
      if (errorMessage.includes("Invalid or expired API key") || errorMessage.includes("401")) {
        alert("Your API key is invalid. Please update it in settings.");
        setApiKeyModalOpen(true);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsResponding(false);
    }
  };

  const convTitle = activeConv?.title || (localMessages.length > 0 ? "New conversation" : "");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        conversations={conversations}
        activeId={activeConvId}
        onSelectConversation={setActiveConvId}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDelete}
        onRenameConversation={handleRename}
        userName={userName}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatTopBar 
          title={convTitle} 
          onShare={() => setShareOpen(true)}
          onApiKeyClick={() => setApiKeyModalOpen(true)}
        />

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {localMessages.length === 0 && !isResponding ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {localMessages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isResponding && <LoadingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ScrollToBottom visible={showScrollBtn} onClick={scrollToBottom} />

        <ChatInput onSend={handleSend} disabled={isResponding || !isApiKeySet} />
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      
      <ApiKeyModal 
        open={apiKeyModalOpen} 
        onOpenChange={setApiKeyModalOpen}
      />
    </div>
  );
}