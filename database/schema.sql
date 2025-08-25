-- =============================================
-- Service Marketplace Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- User Profiles Table
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    phone_country_code TEXT DEFAULT '+92',
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Pakistan',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'provider', 'admin')) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Service Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO service_categories (name, description) VALUES
('Plumbing', 'Plumbing repairs, installations, and maintenance'),
('Electrical', 'Electrical repairs, wiring, and installations'),
('Carpentry', 'Furniture making, repairs, and woodwork'),
('Cleaning', 'House cleaning and maintenance services'),
('AC Repair', 'Air conditioning repair and maintenance'),
('Painting', 'Interior and exterior painting services'),
('Gardening', 'Lawn care and gardening services');

-- =============================================
-- Service Providers Table
-- =============================================
CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL REFERENCES user_profiles(user_id),
    cnic TEXT UNIQUE NOT NULL,
    service_categories UUID[] NOT NULL, -- Array of category IDs
    experience_years INTEGER,
    experience_details TEXT,
    hourly_rate DECIMAL(10, 2),
    minimum_charge DECIMAL(10, 2),
    service_radius_km INTEGER DEFAULT 10,
    availability_status TEXT CHECK (availability_status IN ('online', 'offline', 'busy')) DEFAULT 'offline',
    verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    verification_documents JSONB, -- Store document URLs and verification info
    stripe_account_id TEXT, -- For payment transfers
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Service Bookings Table
-- =============================================
CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL REFERENCES user_profiles(user_id),
    provider_id UUID REFERENCES service_providers(id),
    service_category_id UUID NOT NULL REFERENCES service_categories(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    service_address TEXT NOT NULL,
    service_latitude DECIMAL(10, 8),
    service_longitude DECIMAL(11, 8),
    estimated_cost DECIMAL(10, 2),
    final_cost DECIMAL(10, 2),
    status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')) DEFAULT 'pending',
    scheduled_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    payment_intent_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Payments Table
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES service_bookings(id),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    provider_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    stripe_transfer_id TEXT, -- Transfer to provider
    transfer_status TEXT CHECK (transfer_status IN ('pending', 'succeeded', 'failed')) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Reviews and Ratings Table
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES service_bookings(id),
    customer_id TEXT NOT NULL REFERENCES user_profiles(user_id),
    provider_id UUID NOT NULL REFERENCES service_providers(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Chat Messages Table
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES service_bookings(id),
    sender_id TEXT NOT NULL REFERENCES user_profiles(user_id),
    message_text TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'location', 'system')) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Notifications Table
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('booking', 'payment', 'message', 'system', 'promotion')) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_booking_id UUID REFERENCES service_bookings(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Platform Analytics Table
-- =============================================
CREATE TABLE IF NOT EXISTS platform_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    platform_earnings DECIMAL(12, 2) DEFAULT 0.00,
    active_customers INTEGER DEFAULT 0,
    active_providers INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(availability_status);
CREATE INDEX IF NOT EXISTS idx_service_providers_verification ON service_providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON service_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(is_read);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Service providers: Public read, own update
CREATE POLICY "Anyone can view active providers" ON service_providers
    FOR SELECT USING (verification_status = 'approved');

CREATE POLICY "Providers can update own profile" ON service_providers
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Providers can insert own profile" ON service_providers
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Bookings: Customers and assigned providers can access
CREATE POLICY "Users can view own bookings" ON service_bookings
    FOR SELECT USING (
        customer_id = auth.uid()::text OR 
        provider_id IN (
            SELECT id FROM service_providers WHERE user_id = auth.uid()::text
        )
    );

-- Reviews: Public read, booking participants can write
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

CREATE POLICY "Customers can write reviews" ON reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid()::text);

-- Chat messages: Only booking participants can access
CREATE POLICY "Booking participants can view messages" ON chat_messages
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM service_bookings 
            WHERE customer_id = auth.uid()::text OR 
                  provider_id IN (
                      SELECT id FROM service_providers WHERE user_id = auth.uid()::text
                  )
        )
    );

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid()::text);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to update average rating for providers
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE service_providers 
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM reviews 
        WHERE provider_id = NEW.provider_id
    )
    WHERE id = NEW.provider_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update provider rating when new review is added
CREATE TRIGGER trigger_update_provider_rating
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_service_providers_updated_at
    BEFORE UPDATE ON service_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_service_bookings_updated_at
    BEFORE UPDATE ON service_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();