import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAccept,
});

interface Inv {
  id: string;
  event_id: string;
  role: string;
  invited_email: string;
  used_at: string | null;
}

function InviteAccept() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Inv | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase
        .from("event_invitations")
        .select("id,event_id,role,invited_email,used_at")
        .eq("token", token)
        .maybeSingle();
      if (e || !data) {
        setError("This invite link is invalid.");
        return;
      }
      setInvite(data as Inv);
      const { data: ev } = await supabase
        .from("events")
        .select("title")
        .eq("id", data.event_id)
        .maybeSingle();
      if (ev) setEventTitle(ev.title);
    })();
  }, [token]);

  const accept = async () => {
    if (!user || !invite) return;
    setBusy(true);
    const { error: memErr } = await supabase
      .from("event_members")
      .insert({ event_id: invite.event_id, user_id: user.id, role: invite.role as "family" });
    if (memErr && !memErr.message.includes("duplicate")) {
      setBusy(false);
      return toast.error(memErr.message);
    }
    await supabase
      .from("event_invitations")
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq("id", invite.id);
    setBusy(false);
    toast.success(`Joined ${eventTitle}!`);
    navigate({ to: "/event/$id", params: { id: invite.event_id } });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <div className="container mx-auto flex justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-gold">
            <Mail className="h-6 w-6 text-foreground" />
          </div>
          {error ? (
            <>
              <h1 className="mt-4 text-center font-serif text-2xl">Invite not found</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">{error}</p>
              <Button variant="hero" className="mt-6 w-full" asChild>
                <Link to="/">Go home</Link>
              </Button>
            </>
          ) : !invite ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">Loading invite…</p>
          ) : invite.used_at ? (
            <>
              <h1 className="mt-4 text-center font-serif text-2xl">Already accepted</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                This invite was already used.
              </p>
              <Button variant="hero" className="mt-6 w-full" asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : !user ? (
            <>
              <h1 className="mt-4 text-center font-serif text-2xl">You're invited!</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Sign in or create an account with <strong>{invite.invited_email}</strong> to join{" "}
                {eventTitle && <>"{eventTitle}"</>} as <strong>{invite.role}</strong>.
              </p>
              <Button variant="hero" className="mt-6 w-full" asChild>
                <Link to="/auth">Sign in / Sign up</Link>
              </Button>
            </>
          ) : user.email?.toLowerCase() !== invite.invited_email.toLowerCase() ? (
            <>
              <h1 className="mt-4 text-center font-serif text-2xl">Wrong account</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                This invite was sent to <strong>{invite.invited_email}</strong>, but you are signed
                in as <strong>{user.email}</strong>.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-center font-serif text-2xl">Join {eventTitle}</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                You've been invited as <strong className="capitalize">{invite.role}</strong>.
              </p>
              <Button variant="hero" className="mt-6 w-full" onClick={accept} disabled={busy}>
                {busy ? "Joining…" : "Accept invitation"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
