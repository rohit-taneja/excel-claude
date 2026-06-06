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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <SheetIcon className="size-6" />
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
