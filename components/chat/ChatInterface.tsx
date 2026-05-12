"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AttachmentUI, Thread } from "@assistant-ui/react-ui";

import ApiKeySettings from "@/components/chat/ApiKeySettings";

type StoredKeys = {
  aiKey: string;
  searchKey: string;
};

const CustomComposer = () => {
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <ComposerPrimitive.Root className="aui-composer-root">
      <div className="aui-composer-attachments">
        <ComposerPrimitive.Attachments components={{ Attachment: AttachmentUI }} />
      </div>
      <ComposerPrimitive.AddAttachment asChild>
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
        >
          Attach
        </button>
      </ComposerPrimitive.AddAttachment>
      <ComposerPrimitive.Input
        rows={1}
        className="aui-composer-input"
        placeholder="Write a message..."
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButtonRef.current?.click();
          }
        }}
      />
      <ComposerPrimitive.Send asChild>
        <button
          ref={sendButtonRef}
          type="button"
          className="rounded-md bg-black px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Send
        </button>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
};

export default function ChatInterface() {
  const [keys, setKeys] = useState<StoredKeys>({ aiKey: "", searchKey: "" });

  const handleKeysChange = useCallback((nextKeys: StoredKeys) => {
    setKeys(nextKeys);
  }, []);

  const attachmentAdapter = useMemo(
    () =>
      new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    [],
  );

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
      headers: {
        "x-api-key": keys.aiKey,
        "x-search-key": keys.searchKey,
      },
    }),
    adapters: {
      attachments: attachmentAdapter,
    },
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-4xl flex-col p-4">
      <ApiKeySettings onKeysChange={handleKeysChange} />
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          welcome={{
            message: "Bring your own Hack Club AI + Search keys to start chatting.",
          }}
          components={{
            Composer: CustomComposer,
          }}
        />
      </AssistantRuntimeProvider>
    </div>
  );
}
