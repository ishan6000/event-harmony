import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Phone, Mail, Globe, MapPin, Store } from "lucide-react";

export const Route = createFileRoute("/vendors")({
  component: VendorsList,
});

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "photography", label: "📸 Photography" },
  { value: "catering", label: "🍽️ Catering" },
  { value: "decor", label: "🌸 Decor & Florals" },
  { value: "music", label: "🎵 Music & DJ" },
  { value: "makeup", label: "💄 Makeup & Mehendi" },
  { value: "venue", label: "🏛️ Venue" },
  { value: "planner", label: "📋 Event Planner" },
  { value: "other", label: "✨ Other" },
];

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  owner_id: string;
}

function VendorsList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const base = supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const { data } = cat === "all" ? await base : await base.eq("category", cat as never);
      setVendors((data ?? []) as Vendor[]);
    })();
  }, [user, cat]);

  if (loading || !user) return null;

  const filtered = vendors.filter(
    (v) =>
      !search ||
      v.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.city ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold md:text-4xl">Vendor directory</h1>
            <p className="mt-1 text-muted-foreground">
              Discover photographers, caterers, decorators and more.
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/vendors/new">
              <Plus className="h-4 w-4" /> List your business
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search by name or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground md:col-span-2 lg:col-span-3">
              <Store className="mx-auto h-10 w-10 opacity-40" />
              <p className="mt-3">No vendors found. Be the first to list your business!</p>
            </Card>
          ) : (
            filtered.map((v) => (
              <Card key={v.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl font-semibold">{v.business_name}</h3>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
                    {v.category}
                  </span>
                </div>
                {v.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v.description}</p>
                )}
                <div className="mt-4 space-y-1.5 text-sm">
                  {v.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {v.city}
                    </div>
                  )}
                  {v.phone && (
                    <a
                      href={`tel:${v.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" /> {v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a
                      href={`mailto:${v.email}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {v.email}
                    </a>
                  )}
                  {v.website && (
                    <a
                      href={v.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
