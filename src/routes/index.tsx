import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { EVENT_CATEGORIES } from "@/lib/event-helpers";
import { Calendar, Users, Camera, KeyRound, Sparkles, Clock } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Indian wedding celebration"
            width={1600}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="container relative mx-auto px-4 py-28 md:py-40">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-4 py-1.5 text-sm font-medium text-gold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Built for Indian celebrations
            </span>
            <h1 className="mt-6 font-serif text-5xl font-semibold leading-tight text-primary-foreground md:text-7xl">
              Every moment of your event, <span className="text-gradient-gold">in one circle.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85 md:text-xl">
              Plan timelines, track guests, share photos, and invite your whole family with a single
              code — for weddings, fests, parties and corporate events.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/auth">Start your event</Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-primary-foreground/40 bg-background/10 text-primary-foreground backdrop-blur-sm hover:bg-background/20 hover:text-primary-foreground"
                asChild
              >
                <Link to="/join">I have a code</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-semibold text-foreground md:text-5xl">
            Built for every kind of event
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick a category and we'll set up the right tools for you.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              to="/auth"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="text-5xl">{c.emoji}</div>
              <h3 className="mt-5 font-serif text-2xl font-semibold text-foreground">{c.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              <div className="absolute inset-x-0 bottom-0 h-1 gradient-gold opacity-0 transition-smooth group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: KeyRound,
                title: "One unique code",
                body: "Share a single code with family, photographer & guests — they all join instantly.",
              },
              {
                Icon: Clock,
                title: "Live timeline",
                body: "Add Haldi, Mehendi, Sangeet & more. Everyone knows what's next.",
              },
              {
                Icon: Users,
                title: "Guest tracking",
                body: "RSVPs, arrival check-ins, side allocations — all in one place.",
              },
              {
                Icon: Camera,
                title: "Photographer collab",
                body: "Photographers upload directly. Family relives every moment.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-card p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary shadow-soft">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 text-center shadow-elegant md:p-20">
          <Calendar className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-6 font-serif text-4xl font-semibold text-primary-foreground md:text-5xl">
            Ready to host your circle?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
            It takes 30 seconds. Years from now, your code still works.
          </p>
          <Button variant="gold" size="xl" className="mt-8" asChild>
            <Link to="/auth">Create your event</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EventCircle — Made with ❤ for Indian celebrations.
      </footer>
    </div>
  );
}
