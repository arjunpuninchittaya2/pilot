"use client";

import { useEffect, useState } from "react";

type ApiKeySettingsProps = {
  onKeysChange: (keys: { aiKey: string; searchKey: string }) => void;
};

const getStoredKey = (storageKey: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(storageKey) ?? "";
};

export default function ApiKeySettings({ onKeysChange }: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiKey, setAiKey] = useState(() => getStoredKey("hc_ai_key"));
  const [searchKey, setSearchKey] = useState(() => getStoredKey("hc_search_key"));

  useEffect(() => {
    onKeysChange({ aiKey, searchKey });
  }, [aiKey, onKeysChange, searchKey]);

  const saveKeys = () => {
    const nextAiKey = aiKey.trim();
    const nextSearchKey = searchKey.trim();

    localStorage.setItem("hc_ai_key", nextAiKey);
    localStorage.setItem("hc_search_key", nextSearchKey);
    setAiKey(nextAiKey);
    setSearchKey(nextSearchKey);
    setIsOpen(false);
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        API Keys
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">
                Hack Club AI Key
              </span>
              <input
                type="password"
                value={aiKey}
                onChange={(event) => setAiKey(event.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="hc_ai_..."
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">
                Hack Club Search Key
              </span>
              <input
                type="password"
                value={searchKey}
                onChange={(event) => setSearchKey(event.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="hc_search_..."
              />
            </label>

            <button
              type="button"
              onClick={saveKeys}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Save keys
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
