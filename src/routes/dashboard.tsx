import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Copy, Calendar, MapPin } from "lucide-react";
import { EVENT_CATEGORIES, generateShareCode, categoryEmoji, categoryLabel, type EventCategoryValue } from "@/lib/event-helpers";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface EventRow {
  id: string; title: string; category: string; share_code: string;
  event_date: string | null; location: string | null; host_id: string;
}

const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.enum(["wedding", "college_fest", "private_party", "corporate"]),
  location: z.string().trim().max(200).optional(),
  event_date: z.string().optional(),
  description: z.string().trim().max(500).optional(),
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);
    const { data: memberships } = await supabase.from("event_members").select("event_id").eq("user_id", user.id);
    const ids = (memberships ?? []).map((m) => m.event_id);
    if (ids.length === 0) { setEvents([]); setLoadingEvents(false); return; }
    const { data } = await supabase.from("events").select("*").in("id", ids).order("created_at", { ascending: false });
    setEvents((data ?? []) as EventRow[]);
    setLoadingEvents(false);
  };

  useEffect(() => { if (user) fetchEvents(); }, [user]);

  const [form, setForm] = useState({ title: "", category: "wedding" as EventCategoryValue, location: "", event_date: "", description: "" });

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const code = generateShareCode();
    const { data, error } = await supabase.from("events").insert({
      host_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      location: parsed.data.location || null,
      event_date: parsed.data.event_date || null,
      description: parsed.data.description || null,
      share_code: code,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success(`Event created! Code: ${code}`);
    setOpen(false);
    setForm({ title: "", category: "wedding", location: "", event_date: "", description: "" });
    fetchEvents();
    if (data) navigate({ to: "/event/$id", params: { id: data.id } });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-foreground">Your events</h1>
            <p className="mt-1 text-muted-foreground">All events you host or have been invited to.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/join">Join with code</Link></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" /> New event</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif text-2xl">Create your event</DialogTitle></DialogHeader>
                <form onSubmit={createEvent} className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as EventCategoryValue })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Event title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Riya & Arjun's Wedding" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                    <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai" /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
                  <Button type="submit" variant="hero" className="w-full">Create & generate code</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loadingEvents ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : events.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-16 text-center">
              <div className="text-5xl">🎊</div>
              <h3 className="mt-4 font-serif text-2xl">No events yet</h3>
              <p className="mt-2 text-muted-foreground">Create your first event to get started.</p>
            </CardContent></Card>
          ) : events.map((ev) => {
            const isHost = ev.host_id === user.id;
            return (
              <Link key={ev.id} to="/event/$id" params={{ id: ev.id }} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{categoryEmoji(ev.category)}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isHost ? "gradient-gold" : "bg-secondary text-secondary-foreground"}`}>{isHost ? "Host" : "Member"}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold">{ev.title}</h3>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{categoryLabel(ev.category)}</p>
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {ev.event_date && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {new Date(ev.event_date).toLocaleDateString()}</div>}
                  {ev.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {ev.location}</div>}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
                  <span className="font-mono text-sm font-semibold tracking-widest text-primary">{ev.share_code}</span>
                  <button onClick={(e) => { e.preventDefault(); copyCode(ev.share_code); }} className="text-muted-foreground hover:text-primary"><Copy className="h-4 w-4" /></button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}