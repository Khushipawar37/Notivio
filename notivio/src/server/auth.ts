import { stackServerApp } from "@/stack/server";
import { prisma } from "@/server/prisma";

export async function getCurrentUserProfile() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) return null;

  await prisma.userProfile.upsert({
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
  });

  return user;
}
