"use client";

import type React from "react";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useFirebaseNotes } from "../../hooks/use-firebase-notes";

interface CreateFolderDialogProps {
  darkMode: boolean;
}

export default function CreateFolderDialog({
  darkMode,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#c6ac8f");
  const [loading, setLoading] = useState(false);

  const { createFolder } = useFirebaseNotes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createFolder(name.trim(), color);
      setName("");
      setColor("#c6ac8f");
      setOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    "#c6ac8f",
    "#8a7559",
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${darkMode
              ? "border-gray-600 hover:bg-gray-700"
              : "border-[#c6ac8f]/30 hover:bg-[#c6ac8f]/10"
            }`}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`sm:max-w-[425px] ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"
          }`}
      >
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name..."
                className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-full border-2 ${color === colorOption
                        ? "border-gray-400"
                        : "border-transparent"
                      }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className={darkMode ? "border-gray-600" : ""}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className={`${darkMode
                  ? "bg-[#8a7559] hover:bg-[#8a7559]/90"
                  : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"
                } text-white`}
            >
              {loading ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
