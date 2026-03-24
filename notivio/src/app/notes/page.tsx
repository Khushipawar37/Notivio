import { redirect } from "next/navigation";
import { WorkspaceLayout } from "../components/workspace/workspace-layout";
import { stackServerApp } from "@/stack/server";

export default async function NotesPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    redirect("/auth/login");
  }

  return <WorkspaceLayout />;
}
