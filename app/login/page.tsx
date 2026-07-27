import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <AuthForm
      flow="login"
      title="Citizen Login"
      subtitle="Sign in to your CrisisEye account"
      redirectUrl="/dashboard"
    />
  );
}
