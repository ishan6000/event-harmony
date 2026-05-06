import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/vendors/new")({
  component: NewVendor,
});

const CATS = [
  { v: "photography", l: "📸 Photography" },
  { v: "catering", l: "🍽️ Catering" },
  { v: "decor", l: "🌸 Decor & Florals" },
  { v: "music", l: "🎵 Music & DJ" },
  { v: "makeup", l: "💄 Makeup & Mehendi" },
  { v: "venue", l: "🏛️ Venue" },
  { v: "planner", l: "📋 Event Planner" },
  { v: "other", l: "✨ Other" },
] as const;

const schema = z.object({
  business_name: z.string().trim().min(2).max(120),
  category: z.enum([
    "photography",
    "catering",
    "decor",
    "music",
    "makeup",
    "venue",
    "planner",
    "other",
  ]),
  description: z.string().trim().max(500).optional(),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().or(z.literal("")).optional(),
  website: z.string().trim().url().or(z.literal("")).optional(),
});

function NewVendor() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: "",
    category: "photography" as const,
    description: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  if (loading || !user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("vendors").insert({
      owner_id: user.id,
      business_name: parsed.data.business_name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      city: parsed.data.city || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Listing created!");
    navigate({ to: "/vendors" });
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/vendors">
            <ArrowLeft className="h-4 w-4" /> Back to vendors
          </Link>
        </Button>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant md:p-8">
          <h1 className="font-serif text-3xl font-semibold">List your business</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reach hosts planning their next event.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Business name *</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c.v} value={c.v}>
                      {c.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>About</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
                placeholder="Tell hosts what makes you special…"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91…"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Publish listing"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
