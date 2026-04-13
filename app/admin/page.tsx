import { redirect } from "next/navigation";
import AdminDashboardScreen from "@/screens/AdminDashboard";
import { getServerMockAuth } from "@/lib/auth/serverAuth";
import { spaceCatalog } from "@/lib/data/spaceCatalog";

export default async function AdminPage() {
  const auth = getServerMockAuth();

  if (!auth.isAuthenticated) {
    redirect("/login?redirect=/admin");
  }

  if (!auth.isAdmin) {
    redirect("/");
  }

  const spaces = await spaceCatalog.listSpaces();

  return <AdminDashboardScreen spaces={spaces} />;
}
