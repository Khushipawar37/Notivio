import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import ProfileSection from "../components/dashboard/profile-section";

export default async function DashboardPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileSection />
      </div>
    </main>
  );
}
