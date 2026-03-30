import { redirect } from "next/navigation";

export default function LegacyStudyPlannerRedirect() {
  redirect("/dashboard/tutor");
}
