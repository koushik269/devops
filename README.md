# VPS Seller Portal

A comprehensive VPS seller portal with custom resource configuration, user authentication, order management, and Proxmox backend integration via Terraform.

## Features

- ✅ Custom VPS configuration with real-time pricing
- ✅ User authentication with JWT and 2FA support
- ✅ Responsive frontend built with Next.js and Tailwind CSS
- ✅ RESTful API with Express.js and TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ Docker containerization
- 🚧 Multiple payment options (Stripe, PayPal, Crypto)
- 🚧 Admin approval workflow
- 🚧 Proxmox integration via Terraform
- 🚧 Customer self-service portal

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Infrastructure:** Docker, Proxmox, Terraform
- **Authentication:** JWT with 2FA support
- **Payments:** Stripe, PayPal, Coinbase Commerce

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devops
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Redis cache on port 6379
   - Backend API on port 3001
   - Frontend on port 3000
   - MailHog (email testing) on port 8025

3. **Run database migrations**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

4. **Seed the database**
   ```bash
   docker-compose exec backend npm run prisma:seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MailHog (email viewer): http://localhost:8025
   - PgAdmin (optional): http://localhost:5050

   **Default Admin Account:**
   - Email: admin@vpsportal.com
   - Password: admin123456

### Local Development (without Docker)

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env.local

   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases only
   docker-compose up -d postgres redis
   ```

4. **Run database migrations and seed**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   # Backend (in terminal 1)
   cd backend
   npm run dev

   # Frontend (in terminal 2)
   cd frontend
   npm run dev
   ```

## Project Structure

```
devops/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── validators/      # Input validation
│   │   └── contexts/        # Database contexts
│   ├── prisma/              # Database schema and migrations
│   └── Dockerfile
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── Dockerfile
├── terraform/              # Infrastructure code
│   ├── modules/proxmox/    # Proxmox modules
│   └── environments/       # Environment configurations
└── docker-compose.yml      # Development environment
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa` - 2FA verification
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification

### VPS Configuration
- `GET /api/vps/plans` - Get available VPS options
- `POST /api/vps/calculate-price` - Calculate VPS price
- `POST /api/vps/orders` - Create VPS order
- `GET /api/vps/orders` - Get user orders
- `GET /api/vps/instances` - Get VPS instances

### Payment (Planned)
- `POST /api/payments/stripe/create-intent` - Stripe payment
- `POST /api/payments/paypal/create-order` - PayPal payment
- `POST /api/payments/crypto/create-payment` - Crypto payment

### Admin (Planned)
- `GET /api/admin/orders` - Get all orders
- `POST /api/admin/orders/:id/approve` - Approve order
- `GET /api/admin/infrastructure/status` - Infrastructure status

## Environment Variables

### Backend (.env.local)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
PAYPAL_CLIENT_ID="your-paypal-id"
PROXMOX_API_URL="https://proxmox:8006/api2/json"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-id"
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **vps_orders** - VPS orders and configurations
- **vps_instances** - Provisioned VPS instances
- **invoices** - Billing and payment records
- **terraform_executions** - Infrastructure provisioning logs

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   # Run tests (when implemented)
   npm test

   # Check types
   npm run type-check
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Deployment

### Production Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention with Prisma
- 🚧 2FA implementation
- 🚧 Payment security (PCI compliance)

## Monitoring and Logging

- Request logging with Morgan
- Error handling and logging
- Health check endpoints
- Database query logging
- 🚧 Application performance monitoring
- 🚧 Error tracking with Sentry

## Contributing

1. Follow the existing code style and patterns
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed
5. Ensure all tests pass before submitting

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.