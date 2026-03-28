"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  GraduationCap,
  LogIn,
  ShieldCheck,
  UserCog,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "student" | "admin" | "trainer";

interface Tab {
  readonly id: TabId;
  readonly label: string;
  readonly icon: React.ElementType;
}


/* ------------------------------------------------------------------ */
/*  Tabs config                                                        */
/* ------------------------------------------------------------------ */

const TABS: ReadonlyArray<Tab> = [
  { id: "student", label: "Student Login", icon: LogIn },
  { id: "trainer", label: "Trainer Login", icon: UserCog },
  { id: "admin", label: "Admin Login", icon: ShieldCheck },
] as const;

function isValidTab(value: string | null): value is TabId {
  return value === "student" || value === "admin" || value === "trainer";
}

/* ------------------------------------------------------------------ */
/*  Login Form (shared for both student & admin)                       */
/* ------------------------------------------------------------------ */

function LoginPanel({ provider }: { readonly provider: "student" | "admin" | "trainer" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const REDIRECT_MAP: Record<string, string> = {
    admin: "/admin",
    student: "/student/dashboard",
    trainer: "/trainer",
  };
  const CHANGE_PASSWORD_MAP: Record<string, string> = {
    student: "/student/change-password",
    trainer: "/trainer/change-password",
  };
  const redirectTo = REDIRECT_MAP[provider] ?? "/";
  const placeholder =
    provider === "admin"
      ? "gdscapital.168@gmail.com"
      : "your@email.com";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1 (student/trainer): fast access-control pre-check — no bcrypt,
      // surfaces specific errors (locked, no access, expired) immediately.
      let mustChangePassword = false;
      if (provider === "student" || provider === "trainer") {
        const checkRes = await fetch("/api/auth/validate-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, email }),
        });
        const checkData = (await checkRes.json()) as {
          ok: boolean | null;
          error?: string;
          mustChangePassword?: boolean;
        };

        if (checkData.ok === false) {
          setError(checkData.error ?? "Access denied. Please contact admin.");
          setLoading(false);
          return;
        }

        if (checkData.ok === true) {
          mustChangePassword = checkData.mustChangePassword ?? false;
        }
        // ok === null → user not found or no password; fall through to signIn
      }

      // Step 2: authenticate and create the session
      const result = await signIn(provider, {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Step 3: redirect — must-change-password takes priority over default dashboard
      const changePath = CHANGE_PASSWORD_MAP[provider];
      if (mustChangePassword && changePath) {
        router.push(changePath);
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor={`${provider}-email`}>Email Address</Label>
        <Input
          id={`${provider}-email`}
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${provider}-password`}>Password</Label>
        <Input
          id={`${provider}-password`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {/* Account help links */}
      <div className="pt-1 space-y-2 border-t border-gray-100">
        <a
          href={`/forgot-password?type=${provider}`}
          className="block text-sm text-blue-700 hover:underline"
        >
          I forgot my password
        </a>
        <a
          href={`/forgot-password?type=${provider}&mode=email`}
          className="block text-sm text-blue-700 hover:underline"
        >
          I don't know my email address
        </a>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PortalTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const initialTab: TabId = isValidTab(tabParam) ? tabParam : "student";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Sync tab with URL param changes
  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    router.replace(`/portal?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="bg-blue-800 rounded-xl p-3">
            <GraduationCap className="h-8 w-8 text-blue-300" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">HUMI Training Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sign in to your account or enroll in a course
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {activeTab === "student" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Student Login
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Access your courses, lessons, and assignments
            </p>
            <LoginPanel provider="student" />
          </div>
        )}

        {activeTab === "trainer" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Trainer Login
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Manage your schedules, students, and training materials
            </p>
            <LoginPanel provider="trainer" />
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Admin Login
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Manage courses, students, and enrollments
            </p>
            <LoginPanel provider="admin" />
          </div>
        )}

      </div>
    </div>
  );
}
