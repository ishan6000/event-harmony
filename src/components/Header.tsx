import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut, Store, Moon, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem("theme") as "light" | "dark" | null;
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const selectedTheme = storedTheme ?? preferredTheme;

    setTheme(selectedTheme);
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary shadow-soft">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold text-primary">EventCircle</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/vendors">
                  <Store className="h-4 w-4" />
                  Vendors
                </Link>
              </Button>
              <NotificationsBell />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
