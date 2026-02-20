import { redirect } from "next/navigation";

export default function RootAdminRedirectPage() {
  redirect("/admin");
}
