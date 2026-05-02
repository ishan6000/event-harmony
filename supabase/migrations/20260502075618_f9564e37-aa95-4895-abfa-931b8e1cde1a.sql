
-- Shared updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============= Invitations =============
CREATE TABLE public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role public.member_role NOT NULL DEFAULT 'family',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invited_by uuid NOT NULL,
  used_at timestamptz,
  used_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_email ON public.event_invitations(lower(invited_email));
CREATE INDEX idx_invites_token ON public.event_invitations(token);

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host manages invites"
  ON public.event_invitations FOR ALL
  TO authenticated
  USING (public.is_event_host(event_id, auth.uid()))
  WITH CHECK (public.is_event_host(event_id, auth.uid()) AND invited_by = auth.uid());

CREATE POLICY "Invitee can view own invite"
  ON public.event_invitations FOR SELECT
  TO authenticated
  USING (lower(invited_email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Invitee can mark used"
  ON public.event_invitations FOR UPDATE
  TO authenticated
  USING (lower(invited_email) = lower((auth.jwt() ->> 'email')) AND used_at IS NULL);

-- ============= Notifications =============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============= Notification triggers =============
CREATE OR REPLACE FUNCTION public.notify_new_photo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev_title text;
BEGIN
  SELECT title INTO ev_title FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications (user_id, event_id, type, title, body, link)
  SELECT m.user_id, NEW.event_id, 'new_photo',
         'New photos in ' || COALESCE(ev_title, 'your event'),
         'A new photo was just uploaded.',
         '/event/' || NEW.event_id::text
  FROM public.event_members m
  WHERE m.event_id = NEW.event_id AND m.user_id <> NEW.uploader_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_photo
AFTER INSERT ON public.event_photos
FOR EACH ROW EXECUTE FUNCTION public.notify_new_photo();

CREATE OR REPLACE FUNCTION public.notify_new_function()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev_title text; ev_host uuid;
BEGIN
  SELECT title, host_id INTO ev_title, ev_host FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications (user_id, event_id, type, title, body, link)
  SELECT m.user_id, NEW.event_id, 'function_added',
         NEW.title || ' added to ' || COALESCE(ev_title, 'your event'),
         'Scheduled for ' || to_char(NEW.starts_at, 'Mon DD, HH24:MI'),
         '/event/' || NEW.event_id::text
  FROM public.event_members m
  WHERE m.event_id = NEW.event_id AND m.user_id <> ev_host;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_function
AFTER INSERT ON public.event_functions
FOR EACH ROW EXECUTE FUNCTION public.notify_new_function();

CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_host uuid; ev_title text; user_name text;
BEGIN
  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
    SELECT e.host_id, e.title INTO v_host, ev_title FROM public.events e WHERE e.id = NEW.event_id;
    SELECT COALESCE(full_name, email, 'Someone') INTO user_name FROM public.profiles WHERE id = NEW.used_by;
    INSERT INTO public.notifications (user_id, event_id, type, title, body, link)
    VALUES (v_host, NEW.event_id, 'invite_accepted',
            user_name || ' joined ' || COALESCE(ev_title, 'your event'),
            'They accepted your invitation as ' || NEW.role::text,
            '/event/' || NEW.event_id::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_invite_accepted
AFTER UPDATE ON public.event_invitations
FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- ============= Vendors =============
CREATE TYPE public.vendor_category AS ENUM ('photography','catering','decor','music','makeup','venue','planner','other');

CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  business_name text NOT NULL,
  category public.vendor_category NOT NULL,
  description text,
  city text,
  phone text,
  email text,
  website text,
  cover_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendors_active ON public.vendors(is_active, category, city);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed views active vendors"
  ON public.vendors FOR SELECT TO authenticated
  USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owner creates vendor"
  ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner updates vendor"
  ON public.vendors FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner deletes vendor"
  ON public.vendors FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER trg_vendors_updated
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
