import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CitizenDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["citizen", "admin"]} fallbackUrl="/login">
      <DashboardLayout role="citizen">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
