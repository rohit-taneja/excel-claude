import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sheet as SheetIcon } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="animate-gradient relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-chart-2/20 via-background to-chart-1/20 p-4">
      {/* Drifting orbs for depth. */}
      <div
        aria-hidden
        className="animate-float-soft pointer-events-none absolute -left-24 top-1/5 size-96 rounded-full bg-chart-2/35 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float-soft pointer-events-none absolute -right-24 bottom-1/5 size-96 rounded-full bg-chart-1/35 blur-3xl [animation-delay:-1.5s]"
      />
      <div
        aria-hidden
        className="animate-float-soft pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-4/20 blur-3xl [animation-delay:-3s]"
      />

      <div className="animate-enter relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <span
              aria-hidden
              className="animate-glow-pulse absolute inset-0 -z-10 rounded-xl bg-primary/60 blur-2xl"
            />
            <div className="animate-float-soft flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <SheetIcon className="size-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Excel Skills
            </h1>
            <p className="text-sm text-muted-foreground">
              Learn and test job-ready Excel skills
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use the credentials configured for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Accounts are managed by your administrator via environment config.
        </p>
      </div>
    </div>
  );
}
