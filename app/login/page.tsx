import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

function LoginPageFallback() {
  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
