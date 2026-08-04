import { AuthForm } from "@/components/auth/AuthForm";

export default function AdminLoginPage() {
  return (
    <AuthForm
      flow="admin-login"
      title="Administrator Access"
      subtitle="Authorized operations administrator login"
      redirectUrl="/responder"
    />
  );
}
