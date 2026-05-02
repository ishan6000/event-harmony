import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/join")({
  component: JoinPage,
});

function JoinPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [role, setRole] = useState<"family" | "photographer">("family");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 6) return toast.error("Enter a valid code");
    setBusy(true);
    const { data: ev, error: lookupErr } = await supabase.from("events").select("id, title").eq("share_code", cleaned).maybeSingle();
    if (lookupErr || !ev) { setBusy(false); return toast.error("Code not found"); }
    const { error } = await supabase.from("event_members").insert({ event_id: ev.id, user_id: user.id, role });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success(`Joined ${ev.title}!`);
    navigate({ to: "/event/$id", params: { id: ev.id } });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <div className="container mx-auto flex justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-gold"><KeyRound className="h-6 w-6 text-foreground" /></div>
          <h1 className="mt-4 text-center font-serif text-3xl font-semibold">Join an event</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Enter the code shared by the host</p>
          <form onSubmit={handleJoin} className="mt-6 space-y-4">
            <div>
              <Label>Event code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} className="text-center font-mono text-lg tracking-[0.3em]" placeholder="XXXXXXXX" required />
            </div>
            <div>
              <Label>I am joining as</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "family" | "photographer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family / Guest</SelectItem>
                  <SelectItem value="photographer">Photographer / Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>Join event</Button>
          </form>
        </div>
      </div>
    </div>
  );
}