import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, CloseIcon } from '@/components/pilot/Icons';
import { useHackClub } from '@/lib/HackClubContext';

export default function ApiKeyModal({ open, onOpenChange }) {
  const {
    apiKey: savedApiKey,
    saveApiKey,
    client,
    favoriteModels,
    setFavoriteModels,
    defaultFavoriteModel,
  } = useHackClub();
  const [apiKey, setApiKey] = useState(savedApiKey || '');
  const [error, setError] = useState('');
  const [allModels, setAllModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState(defaultFavoriteModel);

  useEffect(() => {
    if (!open) return;
    setApiKey(savedApiKey || '');
  }, [open, savedApiKey]);

  useEffect(() => {
    if (!open || !client) return;

    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const modelList = await client.getModels();
        const unique = Array.from(new Set(modelList)).sort();
        setAllModels(unique);
      } catch (fetchError) {
        console.error('Failed to load models:', fetchError);
        setAllModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [open, client]);

  useEffect(() => {
    if (!open) return;
    const preferred = favoriteModels[0] || defaultFavoriteModel;
    setSelectedModel(preferred);
  }, [open, favoriteModels, defaultFavoriteModel]);

  const modelOptions = useMemo(() => {
    const base = [defaultFavoriteModel, ...allModels];
    return Array.from(new Set(base.filter(Boolean))).sort();
  }, [allModels, defaultFavoriteModel]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    // Save the key without validation - will fail on first message if invalid
    saveApiKey(apiKey.trim());
    onOpenChange(false);
  };

  const handleAddFavoriteModel = () => {
    if (!selectedModel) return;
    if (favoriteModels.includes(selectedModel)) return;
    setFavoriteModels([...favoriteModels, selectedModel]);
  };

  const handleRemoveFavoriteModel = (modelToRemove) => {
    setFavoriteModels(favoriteModels.filter((m) => m !== modelToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[color:var(--border2)] bg-[color:var(--surface)] text-[color:var(--t1)] shadow-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Add your Hack Club AI API key and choose your favorite models.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key" className="text-[color:var(--t1)]">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="font-mono border-[color:var(--border2)] bg-[color:var(--sidebar)] text-[color:var(--t1)] placeholder:text-[color:var(--t3)]"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <p className="text-xs text-[color:var(--t3)]">
              Your API key is stored locally in your browser and never sent to third parties.
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="text-[color:var(--t1)]">Favorite Models</Label>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Select a model to add to favorites"
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-md border border-[color:var(--border2)] bg-[color:var(--sidebar)] px-3 py-2 text-sm text-left text-[color:var(--t1)]"
                  >
                    <span className="truncate">
                      {loadingModels ? 'Loading models...' : selectedModel}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-80 max-w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] border-[color:var(--border2)] bg-[color:var(--sidebar)] text-[color:var(--t1)] shadow-2xl">
                  {modelOptions.map((modelName) => (
                    <DropdownMenuItem
                      key={modelName}
                      onClick={() => setSelectedModel(modelName)}
                      className="text-sm text-[color:var(--t1)] focus:bg-[color:var(--surface2)] focus:text-[color:var(--t1)]"
                    >
                      {modelName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" variant="outline" onClick={handleAddFavoriteModel} className="border-[color:var(--border2)] bg-[color:var(--surface2)] text-[color:var(--t1)] hover:bg-[color:var(--surface)] hover:text-[color:var(--t1)]">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {favoriteModels.map((favoriteModel) => (
                <div
                  key={favoriteModel}
                  className="flex items-center gap-1.5 bg-[color:var(--surface2)] rounded-lg px-2.5 py-1 text-xs border border-[color:var(--border)]"
                >
                  <span className="max-w-[220px] truncate text-[color:var(--t1)]">{favoriteModel}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavoriteModel(favoriteModel)}
                    className="text-[color:var(--t3)] hover:text-[color:var(--t1)]"
                    aria-label={`Remove ${favoriteModel} from favorites`}
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-[color:var(--border2)] bg-[color:var(--surface2)] text-[color:var(--t1)] hover:bg-[color:var(--surface)] hover:text-[color:var(--t1)]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[color:var(--accent)] text-white hover:opacity-90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
