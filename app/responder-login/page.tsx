import { AuthForm } from "@/components/auth/AuthForm";

export default function ResponderLoginPage() {
  return (
    <AuthForm 
      flow="responder-login"
      title="Responder Portal"
      subtitle="Authorized personnel login"
      redirectUrl="/responder"
    />
  );
}
