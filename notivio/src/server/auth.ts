import { stackServerApp } from "@/stack/server";
import { prisma } from "@/server/prisma";
import { isDbConnectivityError, withTimeout } from "@/server/db-guard";

export async function getCurrentUserProfile() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) return null;

  try {
    await withTimeout(
      prisma.userProfile.upsert({
        where: { id: user.id },
        update: {
          email: user.primaryEmail,
          displayName: user.displayName,
          imageUrl: user.profileImageUrl,
        },
        create: {
          id: user.id,
          email: user.primaryEmail,
          displayName: user.displayName,
          imageUrl: user.profileImageUrl,
        },
      }),
      1500,
      "userProfile upsert",
    );
  } catch (error) {
    if (isDbConnectivityError(error)) {
      console.warn("Database unavailable; continuing with authenticated user.");
    } else {
      console.error("userProfile upsert failed; continuing with authenticated user", error);
    }
  }

  return user;
}
