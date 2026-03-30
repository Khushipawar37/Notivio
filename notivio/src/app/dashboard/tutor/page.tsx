import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import { TutorClient } from "./tutor-client";

export default async function TutorPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    redirect("/auth/login");
  }

  return <TutorClient />;
}
