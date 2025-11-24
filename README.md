# Crystal Power Nexus 🏢

**Multi-tier Dashboard for Property Management, Financial Tracking, and Investor Relations**

![Crystal Power Investments](./public/cpi-logo.png)

---

## 🌟 Features

### **Multi-tier Access Control**
- **Super Admin** - Full system access, manage all data and users
- **Internal Admin** - Limited access to assigned investors and properties
- **Investor** - Access to personal portfolio and payment information

### **Core Functionality**
- ✅ **Property Management** - Track assets across categories (CPI Assets, For Sale, Investor Owned)
- ✅ **Payment Tracking** - Automated penalty calculation (3.5% monthly) for overdue payments
- ✅ **Cheque Management** - Three-party tracking system (Beneficiary, Drawer, Collector)
- ✅ **Document Vault** - Secure storage for contracts and receipts
- ✅ **Reservation Workflow** - Property reservation with admin approval
- ✅ **Real-time Dashboard** - Live statistics and pending actions
- ✅ **Notification System** - In-app notifications with bell icon
- ✅ **Stripe Integration** - Payment processing with webhooks

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- MySQL/TiDB database
- Stripe account (for payments)

### **1. Installation**

```bash
# Clone repository
git clone https://github.com/CPInvestMo/nexus-dashboard.git
cd nexus-dashboard

# Install dependencies
npm install
```

### **2. Environment Configuration**

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/crystal_power_nexus

# Manus OAuth
VITE_OAUTH_PORTAL_URL=https://oauth.manus.space
VITE_APP_ID=your_app_id_here
COOKIE_SECRET=your_cookie_secret_here

# Owner Configuration (Super Admin)
OWNER_OPEN_ID=your_owner_open_id_here
OWNER_EMAIL=mmaisara@crystalpowerinvestment.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
VITE_APP_TITLE="Crystal Power Nexus"
NODE_ENV=development
PORT=3000
```

### **3. Database Setup**

```bash
# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed

# (Optional) Open Drizzle Studio to view data
npm run db:studio
```

### **4. Run Development Server**

```bash
# Start both frontend and backend
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **tRPC Endpoint**: http://localhost:3001/api/trpc

---

## 📁 Project Structure

```
crystal-power-nexus/
├── client/                   # Frontend React app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Header.tsx              # Main header with logo
│   │   │   ├── NotificationBell.tsx    # Notification bell icon
│   │   │   └── AddInvestorDialog.tsx   # Add investor dialog
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx                # Landing page
│   │   │   ├── AdminDashboard.tsx      # Admin dashboard
│   │   │   ├── InvestorDashboard.tsx   # Investor dashboard
│   │   │   ├── MyPortfolio.tsx         # Investor portfolio
│   │   │   ├── PaymentCenter.tsx       # Investor payments
│   │   │   ├── DocumentVault.tsx       # Document access
│   │   │   ├── AvailableProperties.tsx # Property browsing
│   │   │   ├── PropertyDetails.tsx     # Property details
│   │   │   ├── Investors.tsx           # Admin: Investor CRM
│   │   │   ├── Properties.tsx          # Admin: Property mgmt
│   │   │   ├── Payments.tsx            # Admin: Payment tracking
│   │   │   └── Cheques.tsx             # Admin: Cheque mgmt
│   │   ├── lib/             # Utilities
│   │   │   ├── trpc.ts                 # tRPC client setup
│   │   │   └── const.ts                # Constants
│   │   ├── hooks/           # Custom hooks
│   │   ├── assets/          # Images, icons
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   └── index.html           # HTML template
│
├── server/                  # Backend Express + tRPC
│   ├── api/                 # tRPC routers
│   │   ├── index.ts                    # Main router
│   │   ├── trpc.ts                     # tRPC setup
│   │   ├── routers.ts                  # Investor routes
│   │   ├── adminRouters.ts             # Admin routes
│   │   ├── notificationRouter.ts       # Notifications
│   │   └── stripeRouter.ts             # Stripe integration
│   ├── lib/                 # Backend utilities
│   │   ├── db.ts                       # Database helpers
│   │   └── notifications.ts            # Notification logic
│   ├── routes/              # Express routes
│   │   └── stripeWebhook.ts            # Stripe webhooks
│   ├── middleware/          # Express middleware
│   ├── _core/               # Core configuration
│   │   └── env.ts                      # Environment config
│   └── index.ts             # Server entry point
│
├── drizzle/                 # Database
│   └── schema.ts            # Drizzle ORM schema
│
├── scripts/                 # Utility scripts
│   └── seed.js              # Database seeding
│
├── shared/                  # Shared code
│   └── const.ts             # Shared constants
│
├── public/                  # Static assets
│   └── cpi-logo.png         # CPI logo
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS config
├── vite.config.ts           # Vite config
└── .env.example             # Environment template
```

---

## 👥 User Roles

### **Super Admin** (`mmaisara@crystalpowerinvestment.com`)
- Full system access
- Manage all investors, properties, payments, cheques
- Approve/reject reservations
- Upload documents
- Assign internal admins to investors/properties
- View all notifications and activity logs

### **Internal Admin**
- Limited access to assigned investors and properties
- Manage assigned investor relationships
- Track payments and cheques for assigned properties
- Cannot see unassigned data

### **Investor**
- View personal portfolio
- Access payment center
- Make payments via Stripe
- Browse available properties
- Submit reservation requests
- Access document vault
- Receive notifications

---

## 💳 Payment System

### **Automated Penalty Calculation**
- **3.5% per month** on overdue amounts
- Penalty starts accumulating from due date
- Formula: `Penalty = Amount × 0.035 × Months Overdue`
- Total Due = Amount + Penalty Amount

### **Payment Statuses**
- **Pending** - Payment not yet received
- **Paid** - Payment collected
- **Overdue** - Payment past due date (penalty applied)

### **Stripe Integration**
- Secure checkout sessions
- Webhook handling for payment confirmation
- Real-time payment status updates
- Support for multiple currencies

---

## 🔔 Notification System

### **Features**
- **Notification Bell Icon** - Shows unread count
- **Notification Dropdown** - View recent notifications
- **Mark as Read** - Individual or bulk
- **Action URLs** - Click to navigate to related content
- **Real-time Updates** - Automatic refresh

### **Notification Types**
- ℹ️ **Info** - General information
- ✅ **Success** - Successful actions
- ⚠️ **Warning** - Important alerts
- ❌ **Error** - Critical issues

### **Notification Triggers**
- Reservation approved/rejected
- Payment overdue
- Document uploaded
- Cheque bounced
- New reservation submitted

---

## 🗄️ Database Schema

### **8 Core Tables**

1. **users** - Authentication and role management
2. **investors** - Investor profiles and contact information
3. **properties** - Property details and categorization
4. **payments** - Payment tracking with penalty calculation
5. **cheques** - Three-party cheque management
6. **documents** - Secure file storage references
7. **reservations** - Property reservation workflow
8. **activityLogs** - Audit trail for all actions
9. **notifications** - In-app notification system

---

## 🧪 Testing

### **Seed Data**
Run `npm run db:seed` to create test data:
- 4 Users (1 super admin, 1 internal admin, 2 investors)
- 3 Investors
- 5 Properties (across all categories)
- 3 Payments (overdue, pending, paid)
- 2 Cheques (pending, cleared)
- 2 Documents
- 1 Pending reservation
- 2 Notifications

### **Test Accounts**

**Super Admin:**
- Email: `mmaisara@crystalpowerinvestment.com`
- Role: Super Admin

**Investor 1:**
- Email: `sarah.ahmed@example.com`
- Portfolio: 2 properties, 1 overdue payment

**Investor 2:**
- Email: `mohamed.ali@example.com`
- Portfolio: 1 property, all payments current

---

## 🚀 Deployment

### **Production Checklist**

1. ✅ Set `NODE_ENV=production` in `.env`
2. ✅ Configure production database URL
3. ✅ Set strong `COOKIE_SECRET`
4. ✅ Update Stripe keys to live mode
5. ✅ Configure OAuth with production callback URL
6. ✅ Set `OWNER_OPEN_ID` and `OWNER_EMAIL`
7. ✅ Run database migrations
8. ✅ Build frontend: `npm run build`
9. ✅ Start server: `npm start`

### **Environment Variables (Production)**

```env
NODE_ENV=production
DATABASE_URL=mysql://prod-user:prod-pass@prod-host:3306/nexus
COOKIE_SECRET=strong-random-secret-here
STRIPE_SECRET_KEY=sk_live_your_live_key
OWNER_OPEN_ID=production-owner-open-id
OWNER_EMAIL=mmaisara@crystalpowerinvestment.com
```

---

## 📚 Additional Resources

- **User Guide**: See `Crystal Power Nexus - User Guide.md`
- **TODO Tracker**: See `todo.md` for project progress
- **Stripe Docs**: https://stripe.com/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **tRPC**: https://trpc.io

---

## 🛠️ Technology Stack

- **Frontend**: React 19 + Tailwind CSS 4 + Vite
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL/TiDB + Drizzle ORM
- **Authentication**: Manus OAuth
- **Payments**: Stripe
- **Icons**: Lucide React
- **Date Handling**: date-fns

---

## 📝 License

© 2025 Crystal Power Investments. All rights reserved.

---

## 👨‍💻 Developer

**Mo'men Maisara**  
Email: mmaisara@crystalpowerinvestment.com  
Organization: Crystal Power Investments

---

**Built with ❤️ for Crystal Power Investments**
