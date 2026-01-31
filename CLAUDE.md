# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrystalChess Backend - Chess Tournament Management & Booking Platform API built with Express.js, Prisma ORM, and MySQL.

## Commands

```bash
npm run dev              # Start development server (nodemon, port 5001)
npm start                # Start production server
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Create and apply database migrations
npm run prisma:studio    # Open Prisma Studio (visual DB browser)
npm run prisma:seed      # Seed database with initial data
```

**Note:** No test framework is configured.

## Architecture

### Module Pattern
Each feature follows a consistent MVC-like structure in `/src/modules/{module}/`:
- `{module}.controller.js` - Request handlers (asyncHandler wrapper)
- `{module}.service.js` - Business logic (Prisma queries)
- `{module}.routes.js` - Express routes with middleware chain
- `{module}.validation.js` - Joi schemas

### Key Modules
- **auth** - JWT authentication, registration, password reset, Google OAuth
- **users** - User profiles and management
- **participants** - Chess player profiles with document uploads
- **events** - Tournament CRUD by organizers
- **bookings** - Event registration with payment
- **payments** - Razorpay integration
- **admin** - Dashboard, user management, audit logs
- **enrollments** - Class enrollment forms
- **notifications** - Email and flash news

### Middleware Pipeline
Routes use: `authenticate` → `isOrganizer/isAdmin` → `validate(schema)` → controller

### Response Pattern
All responses use `ResponseUtil` from `/src/utils/response.util.js`:
```javascript
ResponseUtil.success(res, data, message)
ResponseUtil.created(res, data, message)
ResponseUtil.paginated(res, data, page, limit, total, message)
ResponseUtil.badRequest(res, message)
```

### Database
- Prisma ORM with MySQL
- Schema: `/prisma/schema.prisma`
- Connection: `/src/config/database.js`

### File Uploads
- Multer middleware stores files in `/uploads/{profiles,documents,events,rules}/`
- Max 5MB, JPEG/PNG/PDF allowed
- Files served statically at `/uploads/*`

### Authentication
- JWT tokens (access + refresh)
- Role-based: `player`, `organizer`, `admin`
- Organizers require admin approval before access

## Configuration

Environment variables centralized in `/src/config/environment.js` with validation.

Key configs:
- `PORT` - Server port (default 5001)
- `DATABASE_URL` - MySQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` - Token secrets
- `EMAIL_USER` / `EMAIL_APP_PASSWORD` - Gmail SMTP
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - Payment gateway
- `FRONTEND_URL` - CORS origin

## API Versioning

All routes prefixed with `/api/v1/`. Health check at `/health`.
