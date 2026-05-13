import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { CopyIcon, CheckIcon, FileIcon } from "./Icons";
import PilotLogo from "./PilotLogo";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <path d="M4 20L16 4L28 20" stroke="#c96442" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 20H28" stroke="#c96442" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "order-1" : ""}`}>
        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att, i) => (
              <AttachmentCard key={i} attachment={att} />
            ))}
          </div>
        )}
        {/* Content */}
        <div className="relative group">
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-secondary text-foreground"
                : "text-foreground"
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                    code: ({ inline, children, ...props }) => {
                      if (inline) {
                        return <code {...props}>{children}</code>;
                      }
                      return <code {...props}>{children}</code>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <button
            onClick={handleCopyMessage}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy message"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="mt-1 px-1">
          <span className="text-[11px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium text-foreground">U</span>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const codeText = extractText(children);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="!pr-12">{children}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function AttachmentCard({ attachment }) {
  const isPdf = attachment.type === "application/pdf" || attachment.name?.endsWith(".pdf");
  const isImage = attachment.type?.startsWith("image/");

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/80 hover:bg-secondary transition-colors border border-border"
    >
      {isImage ? (
        <img src={attachment.url} alt={attachment.name} className="w-10 h-10 rounded object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-accent flex items-center justify-center relative">
          <FileIcon className="w-5 h-5 text-muted-foreground" />
          {isPdf && (
            <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-primary text-primary-foreground px-1 rounded">
              PDF
            </span>
          )}
        </div>
      )}
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{attachment.name}</span>
    </a>
  );
}

function extractText(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children?.props?.children) return extractText(children.props.children);
  return "";
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}