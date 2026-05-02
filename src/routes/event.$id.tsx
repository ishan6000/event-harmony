import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { categoryEmoji, categoryLabel } from "@/lib/event-helpers";
import { Copy, Calendar, MapPin, Plus, Check, Clock, Trash2, Upload, Users, Mail, Camera } from "lucide-react";

export const Route = createFileRoute("/event/$id")({
  component: EventDetail,
});

interface EventData {
  id: string; title: string; description: string | null; category: string;
  share_code: string; event_date: string | null; location: string | null; host_id: string;
}

function EventDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState("timeline");
  const [denied, setDenied] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!user) return;
    const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (!ev) { setDenied(true); return; }
    setEvent(ev as EventData);
    const { data: m } = await supabase.from("event_members").select("role").eq("event_id", id).eq("user_id", user.id).maybeSingle();
    if (!m && ev.host_id !== user.id) { setDenied(true); return; }
    setRole(m?.role ?? "host");
  }, [user, id]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { if (user) fetchEvent(); }, [user, fetchEvent]);

  if (loading || !user) return null;
  if (denied) return (
    <div className="min-h-screen bg-secondary/20"><Header />
      <div className="container mx-auto py-20 text-center">
        <h2 className="font-serif text-3xl">Access denied</h2>
        <p className="mt-2 text-muted-foreground">You don't have access to this event.</p>
        <Button variant="hero" className="mt-6" asChild><Link to="/dashboard">Back to dashboard</Link></Button>
      </div></div>
  );
  if (!event) return null;

  const isHost = event.host_id === user.id;
  const canUpload = isHost || role === "photographer" || role === "host";
  const canManageGuests = isHost || role === "family" || role === "host";

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header card */}
        <div className="overflow-hidden rounded-2xl shadow-elegant">
          <div className="gradient-primary p-8 text-primary-foreground">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{categoryEmoji(event.category)}</span>
                  <span className="rounded-full bg-background/15 px-3 py-1 text-xs uppercase tracking-wide backdrop-blur-sm">{categoryLabel(event.category)}</span>
                  <span className="rounded-full gradient-gold px-3 py-1 text-xs font-semibold text-foreground">{role}</span>
                </div>
                <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">{event.title}</h1>
                {event.description && <p className="mt-2 max-w-2xl text-primary-foreground/85">{event.description}</p>}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-primary-foreground/85">
                  {event.event_date && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.event_date).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>}
                  {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>}
                </div>
              </div>
              <div className="rounded-xl bg-background/15 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-wide text-primary-foreground/70">Share code</div>
                <button onClick={() => { navigator.clipboard.writeText(event.share_code); toast.success("Copied!"); }} className="mt-1 flex items-center gap-2 font-mono text-2xl font-bold tracking-widest text-gold">
                  {event.share_code} <Copy className="h-4 w-4" />
                </button>
                <p className="mt-1 text-xs text-primary-foreground/70">Share with family & photographer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="timeline"><Clock className="mr-1.5 h-4 w-4" />Timeline</TabsTrigger>
            <TabsTrigger value="guests"><Users className="mr-1.5 h-4 w-4" />Guests</TabsTrigger>
            <TabsTrigger value="photos"><Upload className="mr-1.5 h-4 w-4" />Photos</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline"><TimelineTab eventId={id} canEdit={isHost} /></TabsContent>
          <TabsContent value="guests"><GuestsTab eventId={id} canEdit={canManageGuests} canDelete={isHost} /></TabsContent>
          <TabsContent value="photos"><PhotosTab eventId={id} userId={user.id} canUpload={canUpload} isHost={isHost} /></TabsContent>
          <TabsContent value="members"><MembersTab eventId={id} hostId={event.host_id} isHost={isHost} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------- Timeline ---------- */
function TimelineTab({ eventId, canEdit }: { eventId: string; canEdit: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", starts_at: "", location: "", description: "" });

  const load = async () => {
    const { data } = await supabase.from("event_functions").select("*").eq("event_id", eventId).order("starts_at");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [eventId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({
      title: z.string().trim().min(1).max(120),
      starts_at: z.string().min(1),
      location: z.string().max(200).optional(),
      description: z.string().max(500).optional(),
    }).safeParse(form);
    if (!parsed.success) return toast.error("Title and time are required");
    const { error } = await supabase.from("event_functions").insert({ event_id: eventId, ...parsed.data });
    if (error) return toast.error(error.message);
    toast.success("Function added");
    setOpen(false);
    setForm({ title: "", starts_at: "", location: "", description: "" });
    load();
  };

  const remove = async (fid: string) => {
    const { error } = await supabase.from("event_functions").delete().eq("id", fid);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mt-6">
      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" className="mb-6"><Plus className="h-4 w-4" />Add function</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif text-2xl">Add a function</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Haldi Ceremony" required /></div>
              <div><Label>Date & time</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
              <Button type="submit" variant="hero" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground"><Clock className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">No functions yet.</p></Card>
      ) : (
        <div className="relative space-y-4 border-l-2 border-gold/40 pl-6">
          {items.map((it) => (
            <div key={it.id} className="relative">
              <div className="absolute -left-[34px] top-2 h-4 w-4 rounded-full gradient-gold ring-4 ring-background" />
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">{new Date(it.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                    <h4 className="mt-1 font-serif text-xl font-semibold">{it.title}</h4>
                    {it.location && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{it.location}</p>}
                    {it.description && <p className="mt-2 text-sm text-muted-foreground">{it.description}</p>}
                  </div>
                  {canEdit && <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Guests ---------- */
function GuestsTab({ eventId, canEdit, canDelete }: { eventId: string; canEdit: boolean; canDelete: boolean }) {
  const [guests, setGuests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", side: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("guests").select("*").eq("event_id", eventId).order("created_at");
    setGuests(data ?? []);
  };
  useEffect(() => { load(); }, [eventId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({ name: z.string().trim().min(1).max(120), phone: z.string().max(20).optional(), side: z.string().max(50).optional(), notes: z.string().max(300).optional() }).safeParse(form);
    if (!parsed.success) return toast.error("Name required");
    const { error } = await supabase.from("guests").insert({ event_id: eventId, ...parsed.data });
    if (error) return toast.error(error.message);
    toast.success("Guest added");
    setOpen(false);
    setForm({ name: "", phone: "", side: "", notes: "" });
    load();
  };

  const toggleArrived = async (g: any) => {
    const arrived_at = g.arrived_at ? null : new Date().toISOString();
    const { error } = await supabase.from("guests").update({ arrived_at, rsvp_status: arrived_at ? "arrived" : g.rsvp_status }).eq("id", g.id);
    if (error) return toast.error(error.message);
    load();
  };
  const remove = async (gid: string) => {
    const { error } = await supabase.from("guests").delete().eq("id", gid);
    if (error) return toast.error(error.message);
    load();
  };

  const arrivedCount = guests.filter((g) => g.arrived_at).length;

  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Total</div><div className="font-serif text-2xl font-semibold">{guests.length}</div></Card>
          <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Arrived</div><div className="font-serif text-2xl font-semibold text-primary">{arrivedCount}</div></Card>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" />Add guest</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-serif text-2xl">Add guest</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Side</Label><Input value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} placeholder="Bride / Groom" /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={300} /></div>
                <Button type="submit" variant="hero" className="w-full">Add</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {guests.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground"><Users className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">No guests added yet.</p></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {guests.map((g) => (
            <Card key={g.id} className={`p-4 transition-smooth ${g.arrived_at ? "border-primary/40 bg-primary/5" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{g.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {g.side && <>{g.side} · </>}{g.phone || "—"}
                  </div>
                  {g.notes && <div className="mt-1 text-xs text-muted-foreground">{g.notes}</div>}
                  {g.arrived_at && <div className="mt-1 text-xs font-medium text-primary">Arrived {new Date(g.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
                </div>
                <div className="flex flex-col gap-2">
                  {canEdit && <Button size="sm" variant={g.arrived_at ? "default" : "outline"} onClick={() => toggleArrived(g)}><Check className="h-3.5 w-3.5" />{g.arrived_at ? "Here" : "Mark"}</Button>}
                  {canDelete && <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Photos ---------- */
function PhotosTab({ eventId, userId, canUpload, isHost }: { eventId: string; userId: string; canUpload: boolean; isHost: boolean }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("event_photos").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    setPhotos(data ?? []);
    if (data && data.length) {
      const out: Record<string, string> = {};
      await Promise.all(data.map(async (p: any) => {
        const { data: signed } = await supabase.storage.from("event-photos").createSignedUrl(p.storage_path, 3600);
        if (signed) out[p.id] = signed.signedUrl;
      }));
      setUrls(out);
    }
  };
  useEffect(() => { load(); }, [eventId]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-photos").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { error: insErr } = await supabase.from("event_photos").insert({ event_id: eventId, uploader_id: userId, storage_path: path });
      if (insErr) toast.error(insErr.message);
    }
    setUploading(false);
    toast.success("Uploaded");
    e.target.value = "";
    load();
  };

  const remove = async (p: any) => {
    await supabase.storage.from("event-photos").remove([p.storage_path]);
    await supabase.from("event_photos").delete().eq("id", p.id);
    load();
  };

  return (
    <div className="mt-6">
      {canUpload && (
        <div className="mb-6">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-smooth hover:-translate-y-0.5">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photos"}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
          </label>
        </div>
      )}
      {photos.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground"><Upload className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">No photos yet.</p></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
              {urls[p.id] && <img src={urls[p.id]} alt="event" className="h-full w-full object-cover transition-smooth group-hover:scale-105" />}
              {(isHost || p.uploader_id === userId) && (
                <button onClick={() => remove(p)} className="absolute right-2 top-2 rounded-full bg-destructive/80 p-1.5 text-destructive-foreground opacity-0 backdrop-blur-sm transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Members + Invites ---------- */
function MembersTab({ eventId, hostId, isHost }: { eventId: string; hostId: string; isHost: boolean }) {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "photographer" as "photographer" | "family" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: m } = await supabase.from("event_members").select("*").eq("event_id", eventId);
    if (m) {
      const ids = m.map((x: any) => x.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      setMembers(m.map((x: any) => ({ ...x, profile: profiles?.find((p: any) => p.id === x.user_id) })));
    }
    if (isHost) {
      const { data: inv } = await supabase.from("event_invitations").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      setInvites(inv ?? []);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId, isHost]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({ email: z.string().trim().email(), role: z.enum(["photographer", "family"]) }).safeParse(form);
    if (!parsed.success) return toast.error("Enter a valid email");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { data, error } = await supabase.from("event_invitations").insert({
      event_id: eventId,
      invited_email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by: user.id,
    }).select("token").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    const link = `${window.location.origin}/invite/${data.token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite created — link copied to clipboard!");
    setOpen(false);
    setForm({ email: "", role: "photographer" });
    load();
  };

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  const removeInvite = async (id: string) => {
    const { error } = await supabase.from("event_invitations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mt-6 space-y-8">
      {isHost && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold">Invite by email</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button variant="hero" size="sm"><Mail className="h-4 w-4" /> New invite</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif text-2xl">Invite someone</DialogTitle></DialogHeader>
                <form onSubmit={sendInvite} className="space-y-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="photographer@studio.com" /></div>
                  <div>
                    <Label>Role</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setForm({ ...form, role: "photographer" })} className={`rounded-lg border-2 p-3 text-left transition ${form.role === "photographer" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <Camera className="h-4 w-4" /><div className="mt-1 font-medium">Photographer</div><div className="text-xs text-muted-foreground">Can upload photos</div>
                      </button>
                      <button type="button" onClick={() => setForm({ ...form, role: "family" })} className={`rounded-lg border-2 p-3 text-left transition ${form.role === "family" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <Users className="h-4 w-4" /><div className="mt-1 font-medium">Family</div><div className="text-xs text-muted-foreground">Can manage guests</div>
                      </button>
                    </div>
                  </div>
                  <p className="rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">After creating, an invite link is copied to your clipboard. Share it with them — they'll sign in with the same email to accept.</p>
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create invite link"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {invites.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {invites.map((inv) => (
                <Card key={inv.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{inv.invited_email}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{inv.role}</span>
                      <span>·</span>
                      <span className={inv.used_at ? "text-primary" : "text-amber-600"}>
                        {inv.used_at ? "Accepted" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!inv.used_at && <Button size="icon" variant="ghost" onClick={() => copyInvite(inv.token)}><Copy className="h-3.5 w-3.5" /></Button>}
                    <Button size="icon" variant="ghost" onClick={() => removeInvite(inv.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-4 font-serif text-xl font-semibold">Members ({members.length})</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{m.profile?.full_name || m.profile?.email || "Member"}</div>
                <div className="text-xs text-muted-foreground">{m.profile?.email}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${m.user_id === hostId ? "gradient-gold text-foreground" : "bg-secondary text-secondary-foreground"}`}>{m.role}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}