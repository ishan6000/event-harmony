import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary shadow-soft">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold text-primary">EventCircle</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" asChild><Link to="/dashboard">Dashboard</Link></Button>
              <Button variant="ghost" asChild><Link to="/join">Join with code</Link></Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" asChild><Link to="/auth">Get started</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}