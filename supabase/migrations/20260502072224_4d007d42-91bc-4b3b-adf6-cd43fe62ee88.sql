
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Event category enum
CREATE TYPE public.event_category AS ENUM ('wedding', 'college_fest', 'private_party', 'corporate');
CREATE TYPE public.member_role AS ENUM ('host', 'family', 'photographer');

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.event_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date DATE,
  share_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Event members table
CREATE TABLE public.event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'family',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;

-- Helper: is user a member of event (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_event_member(_event_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_members
    WHERE event_id = _event_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.events WHERE id = _event_id AND host_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_host(_event_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.events WHERE id = _event_id AND host_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_member_role(_event_id UUID, _user_id UUID)
RETURNS public.member_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.event_members WHERE event_id = _event_id AND user_id = _user_id LIMIT 1;
$$;

-- Events policies
CREATE POLICY "Members can view event" ON public.events
  FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_event_member(id, auth.uid()));
CREATE POLICY "Anyone authed can lookup by code" ON public.events
  FOR SELECT TO authenticated USING (true);
-- Note: above policy is permissive for SELECT so users can find event by code to join.
-- We only return non-sensitive fields client-side when looking up.

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "Host can update event" ON public.events
  FOR UPDATE TO authenticated USING (host_id = auth.uid());
CREATE POLICY "Host can delete event" ON public.events
  FOR DELETE TO authenticated USING (host_id = auth.uid());

-- Event members policies
CREATE POLICY "Members can view membership" ON public.event_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_event_member(event_id, auth.uid()));
CREATE POLICY "Users can join events themselves" ON public.event_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Host can remove members" ON public.event_members
  FOR DELETE TO authenticated
  USING (public.is_event_host(event_id, auth.uid()) OR user_id = auth.uid());

-- Auto-add host as member
CREATE OR REPLACE FUNCTION public.handle_new_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.event_members (event_id, user_id, role)
  VALUES (NEW.id, NEW.host_id, 'host')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_event();

-- Event functions / timeline
CREATE TABLE public.event_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view functions" ON public.event_functions
  FOR SELECT TO authenticated USING (public.is_event_member(event_id, auth.uid()));
CREATE POLICY "Host manages functions insert" ON public.event_functions
  FOR INSERT TO authenticated WITH CHECK (public.is_event_host(event_id, auth.uid()));
CREATE POLICY "Host manages functions update" ON public.event_functions
  FOR UPDATE TO authenticated USING (public.is_event_host(event_id, auth.uid()));
CREATE POLICY "Host manages functions delete" ON public.event_functions
  FOR DELETE TO authenticated USING (public.is_event_host(event_id, auth.uid()));

-- Guests
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  side TEXT,
  rsvp_status TEXT NOT NULL DEFAULT 'pending',
  arrived_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view guests" ON public.guests
  FOR SELECT TO authenticated USING (public.is_event_member(event_id, auth.uid()));
CREATE POLICY "Host/family insert guests" ON public.guests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_event_member(event_id, auth.uid()) AND public.get_member_role(event_id, auth.uid()) IN ('host','family') OR public.is_event_host(event_id, auth.uid()));
CREATE POLICY "Host/family update guests" ON public.guests
  FOR UPDATE TO authenticated
  USING (public.is_event_member(event_id, auth.uid()) AND public.get_member_role(event_id, auth.uid()) IN ('host','family') OR public.is_event_host(event_id, auth.uid()));
CREATE POLICY "Host delete guests" ON public.guests
  FOR DELETE TO authenticated USING (public.is_event_host(event_id, auth.uid()));

-- Photos
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view photos" ON public.event_photos
  FOR SELECT TO authenticated USING (public.is_event_member(event_id, auth.uid()));
CREATE POLICY "Host/photographer insert photos" ON public.event_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    uploader_id = auth.uid() AND (
      public.is_event_host(event_id, auth.uid()) OR
      public.get_member_role(event_id, auth.uid()) IN ('host','photographer')
    )
  );
CREATE POLICY "Uploader or host delete" ON public.event_photos
  FOR DELETE TO authenticated
  USING (uploader_id = auth.uid() OR public.is_event_host(event_id, auth.uid()));

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members can view event photos in storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-photos' AND
    public.is_event_member((string_to_array(name, '/'))[1]::uuid, auth.uid())
  );

CREATE POLICY "Host/photographer can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos' AND
    (
      public.is_event_host((string_to_array(name, '/'))[1]::uuid, auth.uid()) OR
      public.get_member_role((string_to_array(name, '/'))[1]::uuid, auth.uid()) IN ('host','photographer')
    )
  );

CREATE POLICY "Uploader or host can delete from storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-photos' AND
    (owner = auth.uid() OR public.is_event_host((string_to_array(name, '/'))[1]::uuid, auth.uid()))
  );

-- Indexes
CREATE INDEX idx_events_host ON public.events(host_id);
CREATE INDEX idx_events_share_code ON public.events(share_code);
CREATE INDEX idx_event_members_user ON public.event_members(user_id);
CREATE INDEX idx_event_members_event ON public.event_members(event_id);
CREATE INDEX idx_functions_event ON public.event_functions(event_id, starts_at);
CREATE INDEX idx_guests_event ON public.guests(event_id);
CREATE INDEX idx_photos_event ON public.event_photos(event_id);
