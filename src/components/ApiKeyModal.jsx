import React, { useEffect, useState } from 'react';
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
import { useHackClub } from '@/lib/HackClubContext';

export default function ApiKeyModal({ open, onOpenChange }) {
  const { apiKey: savedApiKey, saveApiKey } = useHackClub();
  const [apiKey, setApiKey] = useState(savedApiKey || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setApiKey(savedApiKey || '');
      setError('');
    }
  }, [open, savedApiKey]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    // Save the key without validation - will fail on first message if invalid
    saveApiKey(apiKey.trim());
    onOpenChange(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hack Club AI API Key</DialogTitle>
          <DialogDescription>
            Enter your Hack Club AI API key to start chatting. Get your key from{' '}
            <a
              href="https://ai.hackclub.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              the Hack Club dashboard
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
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
              className="font-mono"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-gray-500">
              Your API key is stored locally in your browser and never sent to third parties.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
