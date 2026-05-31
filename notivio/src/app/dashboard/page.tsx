import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import ProfileSection from "../components/dashboard/profile-section";
import Footer from "../components/home/Footer";

export default async function DashboardPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <>
    <main className="min-h-screen overflow-x-hidden bg-[#f5f0e8] px-3 pb-8 pt-24 sm:px-4 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileSection />
      </div>
    </main>
    <Footer />
    </>
  );
}
