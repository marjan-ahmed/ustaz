# 🚀 Ustaz - Service Marketplace MVP

A production-ready service marketplace platform similar to Uber but for home services like plumbing, electrical work, carpentry, and more. Built with Next.js, Supabase, Stripe, and Clerk authentication.

## ✨ Features

### 🔹 Core User Roles

**Customer Features:**
- ✅ Sign up/sign in with Clerk authentication
- ✅ Request services by selecting categories (plumber, electrician, carpenter, etc.)
- ✅ Enter address/location manually or via map integration
- ✅ View nearby available service providers
- ✅ Book providers and make secure payments through Stripe
- ✅ Track job status (Pending → Accepted → In Progress → Completed)
- ✅ In-app chat with phone number masking
- ✅ Rate and review completed services

**Service Provider Features:**
- ✅ Sign up/sign in with KYC verification (CNIC upload)
- ✅ Set availability status (online/offline/busy)
- ✅ Receive and accept/reject service requests
- ✅ View earnings after platform commission (90% to provider, 10% to platform)
- ✅ Chat with customers through secure messaging
- ✅ Manage service categories and rates

**Admin Features:**
- ✅ Manage users and providers
- ✅ View transactions and platform earnings
- ✅ Approve/reject service provider accounts
- ✅ Platform analytics and revenue tracking
- ✅ Monitor booking activities

### 🔹 Payments & Revenue Model

- ✅ Secure payments through Stripe
- ✅ Automatic 10% platform commission
- ✅ 90% payment transfer to service providers
- ✅ Invoice and receipt generation
- ✅ Payment status tracking

### 🔹 MVP Features to Prevent Off-App Deals

- ✅ In-app chat system with phone number masking
- ✅ Blocked sharing of personal contact information
- ✅ Customer satisfaction rating system
- ✅ Loyalty rewards system (points and discounts)
- ✅ Masked calling through Twilio integration

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Clerk
- **Payments:** Stripe
- **Real-time:** Supabase Real-time
- **Styling:** Tailwind CSS + Radix UI
- **Deployment:** Vercel (Frontend) + Supabase (Backend)
- **Communication:** Twilio (Masked calling)
- **Maps:** Google Maps API / React Leaflet

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Stripe account
- Twilio account (optional, for calling features)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ustaz-marketplace
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_COMMISSION_RATE=0.10

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Twilio (for SMS/calls)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database schema:

```bash
# Copy the SQL from database/schema.sql and run it in your Supabase SQL editor
```

3. Enable Row Level Security (RLS) policies as defined in the schema

### 4. Stripe Setup

1. Create a Stripe account and get your API keys
2. Set up webhooks pointing to `your-domain.com/api/payments/webhook`
3. Configure webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 5. Clerk Setup

1. Create a Clerk application
2. Configure OAuth providers if needed
3. Set up user metadata for roles (customer, provider, admin)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Key Pages & Features

### Customer Journey
1. **Homepage** (`/`) - Service categories and hero section
2. **Find Provider** (`/find-provider`) - Search and book services
3. **Bookings** (`/bookings`) - Manage all bookings and payments
4. **Dashboard** (`/dashboard`) - User profile and history

### Provider Journey
1. **Become Provider** (`/become-ustaz`) - Provider registration
2. **Provider Dashboard** (`/dashboard`) - Manage requests and earnings
3. **Profile Setup** - Set services, rates, and availability

### Admin Panel
1. **Admin Dashboard** (`/admin`) - Platform management
2. **Provider Approvals** - KYC verification
3. **Analytics** - Revenue and user metrics

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Phone number masking** in chat and calling
- **Payment security** through Stripe
- **Contact information blocking** in messages
- **User verification** for service providers
- **Secure API routes** with authentication

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- Supabase credentials
- Clerk authentication keys
- Stripe API keys and webhook secrets
- Twilio credentials
- Google Maps API key

### Database Migration

Run the schema SQL in your production Supabase instance.

## 📊 Database Schema

The application uses the following main tables:

- `user_profiles` - User information for all roles
- `service_providers` - Provider-specific data and verification
- `service_categories` - Available service types
- `service_bookings` - Booking requests and status
- `payments` - Payment transactions and commission tracking
- `reviews` - Customer ratings and feedback
- `chat_messages` - In-app messaging
- `notifications` - User notifications

## 🛡️ Security & Privacy

### Phone Number Protection
- All calls are routed through masked numbers
- Personal contact sharing is blocked in chat
- Twilio proxy service for secure communication

### Payment Security
- PCI DSS compliant through Stripe
- Secure payment intent creation
- Automatic commission splitting

### Data Privacy
- GDPR compliant data handling
- User consent management
- Secure file uploads for verification documents

## 🔧 Customization

### Adding New Service Categories

1. Insert into `service_categories` table
2. Update the service selection UI
3. Add category-specific features if needed

### Modifying Commission Rate

Update the `PLATFORM_COMMISSION_RATE` environment variable (default: 0.10 for 10%).

### Localization

The app supports multiple languages through next-intl:
- English (en)
- Urdu (ur) 
- Arabic (ar)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🚀 Production Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] Database is properly configured with RLS
- [ ] Stripe webhooks are configured
- [ ] Domain is configured in Clerk
- [ ] SSL certificates are installed
- [ ] Error monitoring is set up (Sentry recommended)
- [ ] Backup strategy is in place
- [ ] Rate limiting is configured
- [ ] SEO optimization is complete
- [ ] Legal pages are added (Terms, Privacy Policy)

## 🌟 Future Enhancements

- Real-time GPS tracking
- Push notifications
- Multi-language support expansion
- Advanced analytics dashboard
- Mobile app (React Native)
- AI-powered service matching
- Subscription plans for providers
- Service package offerings

Built with ❤️ for the Pakistani service marketplace.