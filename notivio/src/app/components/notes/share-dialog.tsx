"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

interface CollaboratorResponse {
  collaborators: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string | null;
      displayName: string | null;
    };
  }>;
  links: Array<{
    id: string;
    role: string;
    url: string;
    expiresAt: string | null;
  }>;
}

interface ShareDialogProps {
  noteId: string;
  disabled?: boolean;
}

export function ShareDialog({ noteId, disabled = false }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("viewer");
  const [shareDays, setShareDays] = useState(7);
  const [shareLink, setShareLink] = useState<string>("");
  const [shareLocalOnly, setShareLocalOnly] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string>("");
  const [data, setData] = useState<CollaboratorResponse | null>(null);

  const absoluteShareLink = useMemo(() => {
    if (!shareLink) return "";
    if (shareLink.startsWith("http://") || shareLink.startsWith("https://")) return shareLink;
    if (typeof window === "undefined") return shareLink;
    return `${window.location.origin}${shareLink}`;
  }, [shareLink]);

  useEffect(() => {
    if (!open || !noteId) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/notes/${noteId}/collaborators`);
        if (response.ok) {
          setData((await response.json()) as CollaboratorResponse);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, noteId]);

  const createShareLink = async () => {
    const response = await fetch(`/api/notes/${noteId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: shareRole, expiresInDays: shareDays }),
    });

    if (!response.ok) return;
    const payload = (await response.json()) as { url: string; localOnly?: boolean };
    setShareLink(payload.url);
    setShareLocalOnly(Boolean(payload.localOnly));
  };

  const invite = async () => {
    if (!inviteUserId.trim()) return;

    const response = await fetch(`/api/notes/${noteId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        inviteUserId.includes("@")
          ? { email: inviteUserId.trim(), role: inviteRole }
          : { userId: inviteUserId.trim(), role: inviteRole }
      ),
    });

    if (!response.ok) {
      setInviteStatus("Invite failed. Please verify email/user and try again.");
      return;
    }
    const payload = (await response.json()) as { emailSent?: boolean; shareUrl?: string; localOnly?: boolean };
    setInviteStatus(
      payload.emailSent
        ? "Invite email sent successfully."
        : "Invite created. If email was not sent, configure EMAIL_USER and EMAIL_PASSWORD."
    );
    if (payload.shareUrl) setShareLink(payload.shareUrl);
    setShareLocalOnly(Boolean(payload.localOnly));

    setInviteUserId("");

    const collaboratorsResponse = await fetch(`/api/notes/${noteId}/collaborators`);
    if (collaboratorsResponse.ok) {
      setData((await collaboratorsResponse.json()) as CollaboratorResponse);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#fff8ee] border border-[#d8c6b2]">
        <DialogHeader>
          <DialogTitle className="text-[#5d4a34]">Share Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[#6f5b43]">
          <div className="rounded-lg border border-[#eadfce] p-3">
            <p className="text-sm font-medium">Create share link</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={shareRole}
                onChange={(event) => setShareRole(event.target.value as "viewer" | "editor")}
                className="rounded-md border border-[#d8c6b2] px-2 py-1 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <input
                type="number"
                min={1}
                max={365}
                value={shareDays}
                onChange={(event) => setShareDays(Number(event.target.value || 7))}
                className="w-24 rounded-md border border-[#d8c6b2] px-2 py-1 text-sm"
              />
              <Button size="sm" onClick={() => void createShareLink()}>
                Create Link
              </Button>
            </div>
            {absoluteShareLink && (
              <div className="mt-2 space-y-2">
                <div className="rounded bg-[#f6eddf] p-2 text-xs break-all">{absoluteShareLink}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(absoluteShareLink)}
                  >
                    Copy Link
                  </Button>
                </div>
                {shareLocalOnly && (
                  <p className="text-xs text-amber-700">
                    This is a localhost link. Others can open it only if your app is publicly reachable
                    (deployed URL or tunnel like ngrok/Cloudflare tunnel).
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#eadfce] p-3">
            <p className="text-sm font-medium">Invite collaborator by User ID or Email</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={inviteUserId}
                onChange={(event) => setInviteUserId(event.target.value)}
                placeholder="user id or email"
                className="min-w-[220px] flex-1 rounded-md border border-[#d8c6b2] px-2 py-1.5 text-sm"
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as "viewer" | "editor")}
                className="rounded-md border border-[#d8c6b2] px-2 py-1 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button size="sm" onClick={() => void invite()}>
                Invite
              </Button>
            </div>
            {inviteStatus ? <p className="mt-2 text-xs text-[#7a6852]">{inviteStatus}</p> : null}
          </div>

          <div className="rounded-lg border border-[#eadfce] p-3">
            <p className="text-sm font-medium">Collaborators</p>
            {loading ? (
              <p className="mt-2 text-xs text-[#8e775e]">Loading...</p>
            ) : (
              <div className="mt-2 space-y-1 text-xs">
                {data?.collaborators?.length ? (
                  data.collaborators.map((collab) => (
                    <div key={collab.id} className="rounded bg-[#f6eddf] px-2 py-1">
                      {(collab.user.displayName || collab.user.email || collab.user.id) +
                        ` (${collab.role})`}
                    </div>
                  ))
                ) : (
                  <p className="text-[#8e775e]">No collaborators yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
