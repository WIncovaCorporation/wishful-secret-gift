-- =====================================================
-- GIVLYN DATABASE EXPORT
-- Generated from Lovable Cloud
-- Target: External Supabase Project
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('free_user', 'premium_user', 'corporate_manager', 'admin');

-- =====================================================
-- TABLES
-- =====================================================

-- Table: profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    display_name text,
    avatar_url text,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: user_roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'free_user'::app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_by uuid,
    UNIQUE(user_id, role)
);

-- Table: subscription_plans
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    price_monthly numeric DEFAULT 0 NOT NULL,
    price_annual numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    stripe_price_id_monthly text,
    stripe_price_id_annual text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_subscriptions
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamp with time zone,
    trial_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

-- Table: usage_tracking
CREATE TABLE public.usage_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    groups_count integer DEFAULT 0,
    wishlists_count integer DEFAULT 0,
    participants_total integer DEFAULT 0,
    ai_suggestions_used integer DEFAULT 0,
    period_start timestamp with time zone DEFAULT now(),
    period_end timestamp with time zone DEFAULT (now() + '1 mon'::interval),
    last_reset_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: events
CREATE TABLE public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    date date NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: groups
CREATE TABLE public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_by uuid NOT NULL,
    event_id uuid,
    share_code text NOT NULL,
    exchange_date date,
    suggested_budget numeric,
    min_budget numeric,
    max_budget numeric,
    organizer_message text,
    notification_mode text DEFAULT 'private'::text NOT NULL,
    is_drawn boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- Table: gift_lists
CREATE TABLE public.gift_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- Table: group_members
CREATE TABLE public.group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    list_id uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (group_id) REFERENCES public.groups(id),
    FOREIGN KEY (list_id) REFERENCES public.gift_lists(id),
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);

-- Table: gift_items
CREATE TABLE public.gift_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL,
    name text NOT NULL,
    brand text,
    category text,
    size text,
    color text,
    reference_link text,
    image_url text,
    notes text,
    priority text DEFAULT 'medium'::text,
    is_purchased boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (list_id) REFERENCES public.gift_lists(id)
);

-- Table: gift_exchanges
CREATE TABLE public.gift_exchanges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    giver_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    viewed_at timestamp with time zone,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (group_id) REFERENCES public.groups(id)
);

-- Table: anonymous_messages
CREATE TABLE public.anonymous_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    giver_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (group_id) REFERENCES public.groups(id)
);

-- Table: anonymous_message_limits
CREATE TABLE public.anonymous_message_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    message_count integer DEFAULT 0 NOT NULL,
    last_reset_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: ai_suggestion_limits
CREATE TABLE public.ai_suggestion_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    suggestion_count integer DEFAULT 0 NOT NULL,
    last_reset_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: ai_usage_tracking
CREATE TABLE public.ai_usage_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    feature_type text DEFAULT 'gift_suggestion'::text NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    last_reset_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, feature_type)
);

-- Table: affiliate_products
CREATE TABLE public.affiliate_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric,
    currency text DEFAULT 'USD'::text,
    image_url text,
    product_url text,
    affiliate_network text NOT NULL,
    affiliate_link text NOT NULL,
    commission_rate numeric DEFAULT 0.04,
    rating numeric,
    reviews_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: affiliate_clicks
CREATE TABLE public.affiliate_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    product_id uuid NOT NULL,
    clicked_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text,
    referrer text,
    converted boolean DEFAULT false,
    conversion_date timestamp with time zone,
    commission_earned numeric DEFAULT 0,
    order_value numeric,
    FOREIGN KEY (product_id) REFERENCES public.affiliate_products(id)
);

-- Table: affiliate_config
CREATE TABLE public.affiliate_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name text NOT NULL,
    affiliate_id text,
    is_active boolean DEFAULT false,
    commission_rate numeric DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: amazon_credentials
CREATE TABLE public.amazon_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    access_key text NOT NULL,
    secret_key text NOT NULL,
    associate_tag text NOT NULL,
    marketplace text DEFAULT 'US'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: amazon_search_tracking
CREATE TABLE public.amazon_search_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    search_query text NOT NULL,
    results_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: gift_card_inventory
CREATE TABLE public.gift_card_inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer text NOT NULL,
    denomination numeric NOT NULL,
    code text NOT NULL,
    pin text,
    cost numeric NOT NULL,
    selling_price numeric NOT NULL,
    margin numeric,
    currency text DEFAULT 'USD'::text,
    is_sold boolean DEFAULT false,
    sold_to_user_id uuid,
    sold_at timestamp with time zone,
    expires_at date,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: rate_limits
CREATE TABLE public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: github_audit_logs
CREATE TABLE public.github_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repository text NOT NULL,
    workflow_name text NOT NULL,
    workflow_run_id text,
    event_type text NOT NULL,
    branch text,
    commit_sha text,
    commit_message text,
    status text NOT NULL,
    audit_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_analysis jsonb,
    findings_summary jsonb,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: ai_corrections
CREATE TABLE public.ai_corrections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id uuid NOT NULL,
    severity text NOT NULL,
    file_path text NOT NULL,
    line_number integer,
    issue_title text NOT NULL,
    issue_description text NOT NULL,
    code_before text,
    code_after text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    applied_at timestamp with time zone,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (audit_log_id) REFERENCES public.github_audit_logs(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_gift_items_list_id ON public.gift_items(list_id);
CREATE INDEX idx_gift_exchanges_group_id ON public.gift_exchanges(group_id);
CREATE INDEX idx_gift_exchanges_giver_id ON public.gift_exchanges(giver_id);
CREATE INDEX idx_anonymous_messages_receiver_id ON public.anonymous_messages(receiver_id);
CREATE INDEX idx_affiliate_clicks_product_id ON public.affiliate_clicks(product_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- Function: is_group_member
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

-- Function: is_group_creator
CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Function: assign_default_role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: auto_assign_admin_role
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF user_email IN (
    'givlyn.app@gmail.com',
    'ventas@wincova.com',
    'juancovaviajes@gmail.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.user_id, 'admin'::app_role, NEW.user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: init_usage_tracking
CREATE OR REPLACE FUNCTION public.init_usage_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: check_ai_suggestion_limit
CREATE OR REPLACE FUNCTION public.check_ai_suggestion_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit RECORD;
  v_max_suggestions INTEGER := 10;
BEGIN
  SELECT * INTO v_limit
  FROM public.ai_suggestion_limits
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.ai_suggestion_limits (user_id, suggestion_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_limit;
  END IF;

  IF NOW() - v_limit.last_reset_at > INTERVAL '24 hours' THEN
    UPDATE public.ai_suggestion_limits
    SET suggestion_count = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_limit;
  END IF;

  IF v_limit.suggestion_count >= v_max_suggestions THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'suggestion_count', v_limit.suggestion_count,
      'reset_at', v_limit.last_reset_at + INTERVAL '24 hours'
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_max_suggestions - v_limit.suggestion_count,
    'suggestion_count', v_limit.suggestion_count,
    'reset_at', v_limit.last_reset_at + INTERVAL '24 hours'
  );
END;
$$;

-- Function: increment_ai_suggestion_count
CREATE OR REPLACE FUNCTION public.increment_ai_suggestion_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_suggestion_limits (user_id, suggestion_count, last_reset_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    suggestion_count = ai_suggestion_limits.suggestion_count + 1,
    updated_at = NOW();
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on gift_lists
CREATE TRIGGER update_gift_lists_updated_at
  BEFORE UPDATE ON public.gift_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on gift_items
CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON public.gift_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_message_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestion_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_search_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscription plans policies
CREATE POLICY "Plans are publicly viewable" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- User subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all usage tracking" ON public.usage_tracking FOR SELECT USING (is_admin());

-- Events policies
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (is_admin());

-- Groups policies
CREATE POLICY "Users can view groups they're member of" ON public.groups FOR SELECT 
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()))
  );
CREATE POLICY "Users can view groups by share code" ON public.groups FOR SELECT 
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid())) OR 
    (share_code IS NOT NULL)
  );
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own groups" ON public.groups FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all groups" ON public.groups FOR ALL USING (is_admin());

-- Gift lists policies
CREATE POLICY "Users can view own gift lists" ON public.gift_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Givers can view their assigned receiver's gift lists" ON public.gift_lists FOR SELECT 
  USING (EXISTS (SELECT 1 FROM gift_exchanges ge WHERE ge.receiver_id = gift_lists.user_id AND ge.giver_id = auth.uid()));
CREATE POLICY "Users can view shared gift lists" ON public.gift_lists FOR SELECT 
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.list_id = gift_lists.id AND gm.user_id = auth.uid()));
CREATE POLICY "Users can create own gift lists" ON public.gift_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gift lists" ON public.gift_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gift lists" ON public.gift_lists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all gift lists" ON public.gift_lists FOR SELECT USING (is_admin());

-- Group members policies
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT 
  USING (is_group_creator(group_id, auth.uid()) OR is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all group members" ON public.group_members FOR ALL USING (is_admin());

-- Gift items policies
CREATE POLICY "Users can view own gift items" ON public.gift_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM gift_lists gl WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()));
CREATE POLICY "Givers can view their assigned receiver's gift items" ON public.gift_items FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM gift_lists gl 
    JOIN gift_exchanges ge ON ge.receiver_id = gl.user_id 
    WHERE gl.id = gift_items.list_id AND ge.giver_id = auth.uid()
  ));
CREATE POLICY "Users can view shared gift items" ON public.gift_items FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM gift_lists gl 
    JOIN group_members gm ON gm.list_id = gl.id 
    WHERE gl.id = gift_items.list_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Users can create gift items in own lists" ON public.gift_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM gift_lists gl WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()));
CREATE POLICY "Users can update gift items in own lists" ON public.gift_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM gift_lists gl WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()));
CREATE POLICY "Users can delete gift items in own lists" ON public.gift_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM gift_lists gl WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()));
CREATE POLICY "Admins can view all gift items" ON public.gift_items FOR SELECT USING (is_admin());

-- Gift exchanges policies
CREATE POLICY "Users can view exchanges in their groups" ON public.gift_exchanges FOR SELECT 
  USING (
    (auth.uid() = giver_id) OR 
    (EXISTS (SELECT 1 FROM groups g WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()))
  );
CREATE POLICY "Group creators can create exchanges" ON public.gift_exchanges FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM groups g WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()));
CREATE POLICY "Givers can update view status" ON public.gift_exchanges FOR UPDATE USING (auth.uid() = giver_id);
CREATE POLICY "Group creators can delete exchanges" ON public.gift_exchanges FOR DELETE 
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()));
CREATE POLICY "Admins can manage all gift exchanges" ON public.gift_exchanges FOR ALL USING (is_admin());

-- Anonymous messages policies
CREATE POLICY "Receivers can view anonymous messages sent to them" ON public.anonymous_messages FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Givers can view messages they sent" ON public.anonymous_messages FOR SELECT USING (auth.uid() = giver_id);
CREATE POLICY "Givers can send anonymous messages to their receivers" ON public.anonymous_messages FOR INSERT 
  WITH CHECK (
    (auth.uid() = giver_id) AND 
    (EXISTS (
      SELECT 1 FROM gift_exchanges ge 
      WHERE ge.group_id = anonymous_messages.group_id 
        AND ge.giver_id = auth.uid() 
        AND ge.receiver_id = anonymous_messages.receiver_id
    ))
  );
CREATE POLICY "Receivers can mark messages as read" ON public.anonymous_messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Admins can view all anonymous messages" ON public.anonymous_messages FOR SELECT USING (is_admin());

-- AI limits policies
CREATE POLICY "Users can view own message limits" ON public.anonymous_message_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own message limits" ON public.anonymous_message_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own message limits" ON public.anonymous_message_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to anonymous_message_limits" ON public.anonymous_message_limits FOR ALL USING (is_admin());

CREATE POLICY "Users can view own AI suggestion limits" ON public.ai_suggestion_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI suggestion limits" ON public.ai_suggestion_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI suggestion limits" ON public.ai_suggestion_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to ai_suggestion_limits" ON public.ai_suggestion_limits FOR ALL USING (is_admin());

CREATE POLICY "Users can view own AI usage" ON public.ai_usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON public.ai_usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI usage" ON public.ai_usage_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to ai_usage_tracking" ON public.ai_usage_tracking FOR ALL USING (is_admin());

-- Affiliate policies
CREATE POLICY "Anyone can view active products" ON public.affiliate_products FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create own products" ON public.affiliate_products FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own products" ON public.affiliate_products FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own products" ON public.affiliate_products FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage GiftApp products" ON public.affiliate_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND (owner_id IS NULL));

CREATE POLICY "Only admins can view all click data" ON public.affiliate_clicks FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete click records" ON public.affiliate_clicks FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Block direct inserts from clients" ON public.affiliate_clicks FOR INSERT WITH CHECK (false);

CREATE POLICY "Admins can manage affiliate config" ON public.affiliate_config FOR ALL USING (is_admin());

-- Amazon credentials policies
CREATE POLICY "Users can view own credentials" ON public.amazon_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.amazon_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credentials" ON public.amazon_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.amazon_credentials FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all amazon credentials" ON public.amazon_credentials FOR SELECT USING (is_admin());

CREATE POLICY "Users can view own search history" ON public.amazon_search_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all amazon searches" ON public.amazon_search_tracking FOR SELECT USING (is_admin());

-- Gift card inventory policies
CREATE POLICY "Admins can manage gift cards" ON public.gift_card_inventory FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view purchased gift cards" ON public.gift_card_inventory FOR SELECT USING (auth.uid() = sold_to_user_id);

-- Rate limits policies
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits FOR ALL USING (true) WITH CHECK (true);

-- GitHub audit logs policies
CREATE POLICY "Admins can view all audit logs" ON public.github_audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete audit logs" ON public.github_audit_logs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- AI corrections policies
CREATE POLICY "Admins can view all corrections" ON public.ai_corrections FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update corrections" ON public.ai_corrections FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete corrections" ON public.ai_corrections FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert corrections" ON public.ai_corrections FOR INSERT WITH CHECK (true);

-- =====================================================
-- NOTES
-- =====================================================

-- This export was generated from Lovable Cloud.
-- To import into your Supabase project:
-- 1. Connect to your Supabase project SQL editor
-- 2. Run this entire script
-- 3. If you need data migration, export data separately
-- 4. Note: This Lovable project will continue using Lovable Cloud

-- WARNING: Review and adjust RLS policies based on your security requirements
-- Some policies reference auth.uid() which requires Supabase Auth to be properly configured
