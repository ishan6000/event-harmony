import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { categoryEmoji, categoryLabel } from "@/lib/event-helpers";
import { KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-code")({
  component: ForgotCode,
});

function ForgotCode() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Database["public"]["Tables"]["events"]["Row"][]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, category, share_code, event_date")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      setEvents(data ?? []);
    })();
  }, [user]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-center font-serif text-3xl font-semibold">
            Recover your event codes
          </h1>

          {!user ? (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Sign in with the same email you used when creating the event — your codes will
                appear here.
              </p>
              <Button variant="hero" className="mt-6" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                All events you have ever hosted, with their codes.
              </p>
              <div className="mt-6 space-y-3">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    You haven't hosted any events yet.
                  </p>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{categoryEmoji(ev.category)}</div>
                        <div>
                          <div className="font-semibold">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {categoryLabel(ev.category)}{" "}
                            {ev.event_date
                              ? `• ${new Date(ev.event_date).toLocaleDateString()}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ev.share_code);
                          toast.success("Copied");
                        }}
                        className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-mono text-sm font-semibold tracking-widest text-primary hover:bg-card/80"
                      >
                        {ev.share_code} <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
