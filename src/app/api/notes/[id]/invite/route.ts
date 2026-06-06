import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { getNoteAccessRole } from "@/server/note-access";

interface InviteBody {
  userId?: string;
  email?: string;
  role?: "viewer" | "editor";
  expiresInDays?: number;
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function sendInviteEmail(to: string, shareUrl: string, role: "viewer" | "editor") {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "You have been invited to collaborate on a Notivio note",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5d4a34;">Notivio Collaboration Invite</h2>
        <p>You were invited as <strong>${role}</strong> to collaborate on a note.</p>
        <p>
          <a href="${shareUrl}" style="display:inline-block;background:#8a7559;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Open Shared Note
          </a>
        </p>
        <p style="font-size:12px;color:#666;">If this does not open directly, copy this URL:<br/>${shareUrl}</p>
      </div>
    `,
  });

  return true;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await context.params;
  const accessRole = await getNoteAccessRole(noteId, user.id);
  if (accessRole !== "owner" && accessRole !== "editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as InviteBody;
  const requestedUserId = String(body.userId || "").trim();
  const requestedEmail = String(body.email || "").trim().toLowerCase();
  if (!requestedUserId && !requestedEmail) {
    return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
  }

  const invitee = requestedUserId || requestedEmail
    ? await prisma.userProfile.findFirst({
        where: requestedUserId
          ? { id: requestedUserId }
          : { email: requestedEmail },
        select: { id: true },
      })
    : null;

  if (!invitee && !requestedEmail) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const role = body.role === "editor" ? "editor" : "viewer";
  const expiresInDays = Number(body.expiresInDays ?? 7);
  const expiresAt =
    expiresInDays > 0
      ? new Date(Date.now() + Math.min(expiresInDays, 365) * 24 * 60 * 60 * 1000)
      : null;
  const token = randomBytes(24).toString("hex");
  const link = await prisma.sharedLink.create({
    data: {
      noteId,
      token,
      role,
      expiresAt,
      createdById: user.id,
    },
  });
  const shareUrl = `${getBaseUrl(request)}/notes?share=${link.token}`;

  const collaborator =
    invitee && invitee.id !== user.id
      ? await prisma.noteCollaborator.upsert({
          where: {
            noteId_userId: {
              noteId,
              userId: invitee.id,
            },
          },
          update: {
            role,
            invitedById: user.id,
          },
          create: {
            noteId,
            userId: invitee.id,
            role,
            invitedById: user.id,
          },
        })
      : null;

  let emailSent = false;
  if (requestedEmail) {
    try {
      emailSent = await sendInviteEmail(requestedEmail, shareUrl, role);
    } catch (error) {
      console.error("Invite email failed", error);
    }
  }

  return NextResponse.json({
    collaborator,
    shareUrl,
    emailSent,
    localOnly: getBaseUrl(request).includes("localhost"),
  });
}
