/*
  # StaySiam Platform Schema

  ## Overview
  Complete database schema for StaySiam property rental platform with role-based access control.

  ## Tables Created

  1. **profiles**
     - Extends auth.users with additional user information
     - id (uuid, references auth.users)
     - email (text)
     - name (text)
     - role (enum: GUEST, HOST, STAFF, OWNER)
     - assigned_by (uuid, references profiles)
     - created_at (timestamptz)

  2. **host_profiles**
     - Additional information for users with HOST role
     - user_id (uuid, references profiles)
     - display_name (text)
     - phone (text)
     - verification_status (text: pending, verified, rejected)
     - created_at (timestamptz)

  3. **listings**
     - Property listings created by hosts
     - id (uuid)
     - host_id (uuid, references profiles)
     - title (text)
     - description (text)
     - city (text)
     - price_per_night (numeric)
     - bedrooms (integer)
     - bathrooms (integer)
     - max_guests (integer)
     - images (text array)
     - amenities (text array)
     - status (text: draft, published, archived)
     - created_at (timestamptz)

  4. **bookings**
     - Guest bookings for listings
     - id (uuid)
     - listing_id (uuid, references listings)
     - guest_id (uuid, references profiles)
     - host_id (uuid, references profiles)
     - check_in (date)
     - check_out (date)
     - total (numeric)
     - status (text: pending, confirmed, cancelled, completed)
     - guest_count (integer)
     - stripe_payment_intent_id (text)
     - created_at (timestamptz)

  5. **assignments**
     - Track role assignments by email
     - id (uuid)
     - assigned_email (text)
     - assigned_role (text)
     - assigned_by_user_id (uuid, references profiles)
     - target_user_id (uuid, references profiles)
     - created_at (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Role-based access policies
  - Guests can only see their own bookings
  - Hosts can only manage their own listings
  - Staff can assign HOST roles
  - Owner has full access
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'GUEST' CHECK (role IN ('GUEST', 'HOST', 'STAFF', 'OWNER')),
  assigned_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create host_profiles table
CREATE TABLE IF NOT EXISTS host_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text NOT NULL,
  price_per_night numeric NOT NULL CHECK (price_per_night >= 0),
  bedrooms integer NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  bathrooms integer NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
  max_guests integer NOT NULL DEFAULT 1 CHECK (max_guests >= 1),
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total numeric NOT NULL CHECK (total >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  guest_count integer NOT NULL DEFAULT 1 CHECK (guest_count >= 1),
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_email text NOT NULL,
  assigned_role text NOT NULL CHECK (assigned_role IN ('GUEST', 'HOST', 'STAFF', 'OWNER')),
  assigned_by_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff and Owner can update roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('STAFF', 'OWNER')
    )
  );

-- RLS Policies for host_profiles
CREATE POLICY "Anyone can view host profiles"
  ON host_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hosts can create own profile"
  ON host_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can update own profile"
  ON host_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for listings
CREATE POLICY "Anyone can view published listings"
  ON listings FOR SELECT
  TO authenticated
  USING (status = 'published' OR host_id = auth.uid());

CREATE POLICY "Public can view published listings"
  ON listings FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Hosts can create own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = host_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HOST', 'OWNER')
    )
  );

CREATE POLICY "Hosts can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- RLS Policies for bookings
CREATE POLICY "Guests can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guest_id 
    OR auth.uid() = host_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('STAFF', 'OWNER')
    )
  );

CREATE POLICY "Guests can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Guests and hosts can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = guest_id OR auth.uid() = host_id)
  WITH CHECK (auth.uid() = guest_id OR auth.uid() = host_id);

-- RLS Policies for assignments
CREATE POLICY "Staff and Owner can view assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('STAFF', 'OWNER')
    )
  );

CREATE POLICY "Staff and Owner can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('STAFF', 'OWNER')
    )
    AND assigned_by_user_id = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_assignments_email ON assignments(assigned_email);
CREATE INDEX IF NOT EXISTS idx_assignments_target_user ON assignments(target_user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  pending_assignment RECORD;
BEGIN
  -- Insert new profile
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    'GUEST'
  );

  -- Check for pending assignment
  SELECT * INTO pending_assignment
  FROM public.assignments
  WHERE assigned_email = new.email
  AND target_user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If assignment exists, update role
  IF pending_assignment IS NOT NULL THEN
    UPDATE public.profiles
    SET role = pending_assignment.assigned_role,
        assigned_by = pending_assignment.assigned_by_user_id
    WHERE id = new.id;

    -- Link assignment to user
    UPDATE public.assignments
    SET target_user_id = new.id
    WHERE id = pending_assignment.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
