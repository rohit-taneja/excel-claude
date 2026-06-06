import { ShieldX } from "lucide-react";

import { getAppUsers, requireUser } from "@/lib/auth";
import { getSkills, getTests, questions } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldX className="mx-auto mb-3 size-10 text-destructive" />
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account doesn&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  const users = getAppUsers();
  const skills = getSkills();
  const tests = getTests();
  const supabaseOn = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Read-only overview of users, content and configuration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Skills" value={skills.length} />
        <StatCard label="Questions" value={questions.length} />
        <StatCard label="Tests" value={tests.length} />
        <StatCard label="Configured users" value={users.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
          <CardDescription>
            Managed through environment variables — see the README.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md border p-3">
            <span>Persistence</span>
            <Badge variant={supabaseOn ? "success" : "warning"}>
              {supabaseOn ? "Supabase connected" : "In-memory fallback"}
            </Badge>
          </div>
          {!supabaseOn ? (
            <p className="text-xs text-muted-foreground">
              Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to
              persist progress and attempts. Without them, data is kept in memory
              and resets when the server restarts.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>
            Defined in the <code className="font-mono">APP_USERS_JSON</code>{" "}
            environment variable. Password hashes are never displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users configured. Add them to{" "}
              <code className="font-mono">APP_USERS_JSON</code>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>User key</TableHead>
                  <TableHead className="text-right">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.userKey}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {u.userKey}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
