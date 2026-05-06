import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) setTimeout(() => acceptPendingInvites(s.user.id, s.user.email), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) acceptPendingInvites(session.user.id, session.user.email);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

async function acceptPendingInvites(userId: string, email?: string | null) {
  if (!email) return;
  const { data: invites } = await supabase
    .from("event_invitations")
    .select("id, event_id, role")
    .is("used_at", null);
  if (!invites || invites.length === 0) return;
  for (const inv of invites) {
    const { error: memErr } = await supabase
      .from("event_members")
      .insert({ event_id: inv.event_id, user_id: userId, role: inv.role });
    if (!memErr || memErr.message?.includes("duplicate")) {
      await supabase
        .from("event_invitations")
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq("id", inv.id);
    }
  }
}
