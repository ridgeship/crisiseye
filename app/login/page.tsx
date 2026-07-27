import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <AuthForm 
      flow="login"
      title="Citizen Login"
      subtitle="Sign in to report and track emergencies"
      redirectUrl="/dashboard"
    />
  );
}
