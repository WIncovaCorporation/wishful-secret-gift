-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_lists table
CREATE TABLE public.gift_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_items table
CREATE TABLE public.gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.gift_lists(id) ON DELETE CASCADE,
  category TEXT,
  name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  brand TEXT,
  notes TEXT,
  reference_link TEXT,
  image_url TEXT,
  priority TEXT DEFAULT 'medium',
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  min_budget DECIMAL(10,2),
  max_budget DECIMAL(10,2),
  exchange_date DATE,
  is_drawn BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  list_id UUID REFERENCES public.gift_lists(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create gift_exchanges table
CREATE TABLE public.gift_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, giver_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_exchanges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = created_by);

-- Gift lists policies
CREATE POLICY "Users can view own gift lists" ON public.gift_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view shared gift lists" ON public.gift_lists FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.list_id = gift_lists.id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create own gift lists" ON public.gift_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gift lists" ON public.gift_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gift lists" ON public.gift_lists FOR DELETE USING (auth.uid() = user_id);

-- Gift items policies
CREATE POLICY "Users can view own gift items" ON public.gift_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gift_lists gl
    WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view shared gift items" ON public.gift_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gift_lists gl
    JOIN public.group_members gm ON gm.list_id = gl.id
    WHERE gl.id = gift_items.list_id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create gift items in own lists" ON public.gift_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gift_lists gl
    WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update gift items in own lists" ON public.gift_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.gift_lists gl
    WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete gift items in own lists" ON public.gift_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.gift_lists gl
    WHERE gl.id = gift_items.list_id AND gl.user_id = auth.uid()
  )
);

-- Groups policies
CREATE POLICY "Users can view groups they're member of" ON public.groups FOR SELECT USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own groups" ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND (
      g.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.group_members gm2
        WHERE gm2.group_id = g.id AND gm2.user_id = auth.uid()
      )
    )
  )
);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Gift exchanges policies
CREATE POLICY "Users can view exchanges in their groups" ON public.gift_exchanges FOR SELECT USING (
  auth.uid() = giver_id OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()
  )
);
CREATE POLICY "Group creators can create exchanges" ON public.gift_exchanges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()
  )
);
CREATE POLICY "Group creators can delete exchanges" ON public.gift_exchanges FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = gift_exchanges.group_id AND g.created_by = auth.uid()
  )
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_lists_updated_at
  BEFORE UPDATE ON public.gift_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON public.gift_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();