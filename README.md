# CrystalChess Backend - Tournament Management System

Backend API for CrystalChess Tournament Booking and Management Platform.

# CrystalChess Backend - Tournament Management System

Backend API for CrystalChess Tournament Booking and Management Platform.

## 🎉 ALL PHASES COMPLETE!

### ✅ Implemented Features:

**Phase 1-2: Authentication & Setup**

- User Registration (Player & Organizer)
- Email Verification
- Login/Logout with JWT
- Password Reset Flow
- Complete project infrastructure

**Phase 3: User & Participant Management**

- User Profile Management
- Profile Picture Upload
- Participant CRUD Operations
- Document Uploads (Passport, Birth Certificate, Aadhar)
- Gender-Based Tournament Rules
- Age Calculation from DOB

**Phase 4: Events Module**

- Event CRUD by Organizers
- Featured Events (Homepage Hero)
- Event Categories Management
- Event Image & Rules Upload
- Edit Requests (Organizers request deletion)
- Search & Filter Events

**Phase 5: Bookings & Payments**

- Multi-Participant Booking
- Category-wise Registration
- Gender & Age Validation
- Razorpay Payment Integration
- Offline Payment Support
- Platform Fee Calculation (₹10/participant for offline)
- Booking Confirmation Emails

**Phase 6: Admin Module**

- Dashboard with System Statistics
- User Management (CRUD)
- Organizer Approval System
- Event Management (Featured, Delete)
- Edit Request Handling
- Audit Logs
- Full System Control

**Phase 7: Enrollments & Notifications**

- Class Enrollment Form (Public)
- Enrollment Management (Admin)
- Flash News Management
- Email Template Management
- Notification System

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL Database
- Gmail account for email service (or other SMTP)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configurations:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/crystalchess"

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Razorpay (for later phases)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Gmail App Password Setup:**

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use that password in EMAIL_PASSWORD

### 3. Setup Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to existing database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

### 4. Create Upload Directories

```bash
mkdir -p uploads/profiles uploads/documents uploads/events uploads/rules
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

## 📡 Complete API Endpoints

### Authentication

| Method | Endpoint                          | Description            | Access  |
| ------ | --------------------------------- | ---------------------- | ------- |
| POST   | `/api/v1/auth/register/player`    | Register player        | Public  |
| POST   | `/api/v1/auth/register/organizer` | Register organizer     | Public  |
| POST   | `/api/v1/auth/login`              | Login user             | Public  |
| POST   | `/api/v1/auth/verify-email`       | Verify email           | Public  |
| POST   | `/api/v1/auth/forgot-password`    | Request password reset | Public  |
| POST   | `/api/v1/auth/reset-password`     | Reset password         | Public  |
| POST   | `/api/v1/auth/change-password`    | Change password        | Private |
| GET    | `/api/v1/auth/me`                 | Get current user       | Private |

### Users

| Method | Endpoint                        | Description            | Access  |
| ------ | ------------------------------- | ---------------------- | ------- |
| GET    | `/api/v1/users/profile`         | Get user profile       | Private |
| PUT    | `/api/v1/users/profile`         | Update profile         | Private |
| POST   | `/api/v1/users/profile/picture` | Upload profile picture | Private |
| GET    | `/api/v1/users/statistics`      | Get user statistics    | Private |

### Participants

| Method | Endpoint                                   | Description        | Access  |
| ------ | ------------------------------------------ | ------------------ | ------- |
| POST   | `/api/v1/participants`                     | Create participant | Private |
| GET    | `/api/v1/participants`                     | List participants  | Private |
| GET    | `/api/v1/participants/:id`                 | Get participant    | Private |
| PUT    | `/api/v1/participants/:id`                 | Update participant | Private |
| DELETE | `/api/v1/participants/:id`                 | Delete participant | Private |
| POST   | `/api/v1/participants/:id/documents/:type` | Upload document    | Private |
| GET    | `/api/v1/participants/:id/bookings`        | Get bookings       | Private |

### Events (Public)

| Method | Endpoint                  | Description         | Access |
| ------ | ------------------------- | ------------------- | ------ |
| GET    | `/api/v1/events`          | List all events     | Public |
| GET    | `/api/v1/events/featured` | Get featured events | Public |
| GET    | `/api/v1/events/:id`      | Get event details   | Public |

### Events (Organizer)

| Method | Endpoint                          | Description      | Access    |
| ------ | --------------------------------- | ---------------- | --------- |
| POST   | `/api/v1/events`                  | Create event     | Organizer |
| GET    | `/api/v1/events/my-events`        | Get my events    | Organizer |
| PUT    | `/api/v1/events/:id`              | Update event     | Organizer |
| POST   | `/api/v1/events/:id/image`        | Upload image     | Organizer |
| POST   | `/api/v1/events/:id/rules`        | Upload rules PDF | Organizer |
| POST   | `/api/v1/events/:id/edit-request` | Request deletion | Organizer |
| GET    | `/api/v1/events/edit-requests`    | View requests    | Organizer |

### Bookings

| Method | Endpoint                      | Description    | Access  |
| ------ | ----------------------------- | -------------- | ------- |
| POST   | `/api/v1/bookings`            | Create booking | Private |
| GET    | `/api/v1/bookings`            | List bookings  | Private |
| GET    | `/api/v1/bookings/:id`        | Get booking    | Private |
| POST   | `/api/v1/bookings/:id/cancel` | Cancel booking | Private |

### Payments

| Method | Endpoint                        | Description            | Access  |
| ------ | ------------------------------- | ---------------------- | ------- |
| POST   | `/api/v1/payments/create-order` | Create Razorpay order  | Private |
| POST   | `/api/v1/payments/verify`       | Verify payment         | Private |
| POST   | `/api/v1/payments/offline`      | Record offline payment | Private |
| GET    | `/api/v1/payments/booking/:id`  | Get payment details    | Private |

### Enrollments

| Method | Endpoint                  | Description       | Access |
| ------ | ------------------------- | ----------------- | ------ |
| POST   | `/api/v1/enrollments`     | Submit enrollment | Public |
| GET    | `/api/v1/enrollments`     | List enrollments  | Admin  |
| GET    | `/api/v1/enrollments/:id` | Get enrollment    | Admin  |
| PUT    | `/api/v1/enrollments/:id` | Approve/Reject    | Admin  |
| DELETE | `/api/v1/enrollments/:id` | Delete enrollment | Admin  |

### Notifications

| Method | Endpoint                                      | Description           | Access |
| ------ | --------------------------------------------- | --------------------- | ------ |
| GET    | `/api/v1/notifications/flash-news/active`     | Get active flash news | Public |
| POST   | `/api/v1/notifications/flash-news`            | Create flash news     | Admin  |
| GET    | `/api/v1/notifications/flash-news`            | List all flash news   | Admin  |
| PUT    | `/api/v1/notifications/flash-news/:id`        | Update flash news     | Admin  |
| PATCH  | `/api/v1/notifications/flash-news/:id/toggle` | Toggle status         | Admin  |
| DELETE | `/api/v1/notifications/flash-news/:id`        | Delete flash news     | Admin  |
| GET    | `/api/v1/notifications/email-templates`       | List templates        | Admin  |
| POST   | `/api/v1/notifications/email-templates`       | Create template       | Admin  |
| PUT    | `/api/v1/notifications/email-templates/:id`   | Update template       | Admin  |
| DELETE | `/api/v1/notifications/email-templates/:id`   | Delete template       | Admin  |

### Admin

| Method | Endpoint                                    | Description        | Access |
| ------ | ------------------------------------------- | ------------------ | ------ |
| GET    | `/api/v1/admin/dashboard`                   | Dashboard stats    | Admin  |
| GET    | `/api/v1/admin/users`                       | List users         | Admin  |
| POST   | `/api/v1/admin/users`                       | Create user        | Admin  |
| PUT    | `/api/v1/admin/users/:id/status`            | Update status      | Admin  |
| POST   | `/api/v1/admin/users/:id/approve-organizer` | Approve organizer  | Admin  |
| DELETE | `/api/v1/admin/users/:id`                   | Delete user        | Admin  |
| GET    | `/api/v1/admin/events`                      | List events        | Admin  |
| PUT    | `/api/v1/admin/events/:id/featured`         | Set featured       | Admin  |
| DELETE | `/api/v1/admin/events/:id`                  | Delete event       | Admin  |
| GET    | `/api/v1/admin/edit-requests`               | List edit requests | Admin  |
| PUT    | `/api/v1/admin/edit-requests/:id`           | Handle request     | Admin  |
| GET    | `/api/v1/admin/participants/:id`            | View participant   | Admin  |
| GET    | `/api/v1/admin/audit-logs`                  | View audit logs    | Admin  |

### Health Check

| Method | Endpoint  | Description      |
| ------ | --------- | ---------------- |
| GET    | `/health` | API health check |

## 🧪 Testing the API

### 1. Register a Player

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/player \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "Test@1234",
    "fullName": "John Doe",
    "phone": "9876543210"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "Test@1234"
  }'
```

### 3. Create Participant

```bash
curl -X POST http://localhost:5000/api/v1/participants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Child Player",
    "dateOfBirth": "2015-05-15",
    "gender": "MALE",
    "contactNumber": "9876543210",
    "email": "child@example.com",
    "fideId": "12345678"
  }'
```

### 4. Upload Participant Document

```bash
curl -X POST http://localhost:5000/api/v1/participants/1/documents/passportPhoto \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "document=@/path/to/photo.jpg"
```

### 5. Get User Statistics

```bash
curl -X GET http://localhost:5000/api/v1/users/statistics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📁 Project Structure

```
src/
├── config/
│   ├── database.js          # Prisma client configuration
│   ├── environment.js       # Environment variables
│   └── constants.js         # Application constants
├── middleware/
│   ├── auth.middleware.js   # JWT authentication
│   ├── validation.middleware.js
│   ├── upload.middleware.js
│   └── errorHandler.middleware.js
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.validation.js
│   └── notifications/
│       └── email.service.js
├── utils/
│   ├── response.util.js     # Response formatting
│   ├── token.util.js        # JWT utilities
│   ├── hash.util.js         # Password hashing
│   ├── date.util.js         # Date utilities
│   └── file.util.js         # File operations
├── app.js                   # Express app setup
└── server.js                # Server entry point
```

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Email verification required
- Password strength validation
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers

## 📊 Database Schema

Using Prisma ORM with MySQL. Main tables:

- users
- participants
- events
- bookings
- payments
- enrollments
- sessions
- password_resets

## 🚧 Project Status

**ALL 7 PHASES COMPLETE! 🎉**

- ✅ **Phase 1** - Project Setup & Infrastructure
- ✅ **Phase 2** - Authentication Module
- ✅ **Phase 3** - User & Participant Management
- ✅ **Phase 4** - Events Module
- ✅ **Phase 5** - Bookings & Payments
- ✅ **Phase 6** - Admin Module
- ✅ **Phase 7** - Enrollments & Notifications

**Backend is 100% complete and production-ready!**

---

## 📝 Admin Capabilities Explanation

### What Admin CAN Do:

✅ **User Management**

- Create any type of user (Player/Organizer/Admin) - auto-approved
- View all users with filters
- Update user status (active/inactive/suspended)
- Approve/reject organizer applications
- Delete users (with safety checks)

✅ **Event Management**

- View all events
- Set/unset featured events (homepage)
- Delete events (with confirmed booking checks)
- Handle organizer edit/delete requests

✅ **Booking Management**

- View all bookings (through dashboard stats)
- Monitor revenue and platform fees
- Track booking history

✅ **Participant Management**

- View any participant details
- See participant information across all users

✅ **Enrollment Management**

- View all class enrollments
- Approve/reject enrollment requests
- Delete enrollments
- Receive email notifications for new enrollments

✅ **Content Management**

- Create/edit/delete flash news
- Toggle flash news active status
- Manage email templates
- Control homepage content

✅ **System Monitoring**

- View comprehensive dashboard statistics
- Access audit logs (all admin actions tracked)
- Monitor recent activity (last 7 days)
- See pending actions needing attention

### What Admin CANNOT Do (Intentional Design):

❌ **Cannot Edit Participant Details**

- Reason: Participants belong to users, only user can edit their own participants
- Admin can VIEW but not EDIT participant information
- This maintains data integrity and ownership

❌ **Cannot Create Events**

- Reason: Events should be created by approved organizers
- Admin can DELETE events but creation is organizer's responsibility
- Maintains proper event ownership

❌ **Cannot Directly Edit Bookings**

- Reason: Bookings are transactional - created through payment flow
- Admin can view statistics and monitor bookings
- Cancellation/refunds handled through user flow or payment system

❌ **Cannot Manually Process Payments**

- Reason: Payments are handled by Razorpay integration
- Maintains financial integrity and audit trail
- Admin can view payment details but not manually modify

### Why These Restrictions?

1. **Data Ownership**: Users own their participants/bookings
2. **Audit Trail**: Financial transactions need proper tracking
3. **Responsibility**: Organizers responsible for their events
4. **Security**: Prevents accidental data corruption
5. **Compliance**: Maintains proper business workflows

If you need admin to edit participants/bookings, you can add these features:

- Add participant edit endpoints in admin module
- Add booking management endpoints in admin module
- Add proper audit logging for these actions

---

## 📝 Notes

- Organizer accounts require admin approval
- Email verification required before login
- Female participants can join any tournament
- Male participants restricted to male tournaments
- Platform fee: ₹10 per participant for offline events
- All admin actions logged in audit_logs table

---

**Backend Development Complete! Ready for Frontend Integration!** 🚀
