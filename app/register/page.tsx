import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <AuthForm 
      flow="register"
      title="Citizen Registration"
      subtitle="Create an account to report emergencies"
      redirectUrl="/dashboard"
    />
  );
}
