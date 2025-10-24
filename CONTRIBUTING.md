# Contributing to Lasertag Backend

Thank you for your interest in contributing to the Lasertag Backend project! This guide will help you set up your development environment and get started.

## Application Overview

### Application Flow

Here's an overview of how the application works:

<img width="854" height="1208" alt="image" src="https://github.com/user-attachments/assets/da2c2ce0-3c36-4dc0-abb1-45e7004d4d43" />


**Key Features:**
- **User Management**: Users can register via CSV import or manual registration with email and password
- **Authentication**: Login system with JWT tokens for secure access
- **Dashboard**: View teams and slots with sorting capabilities (by name, join time)
- **Team Management**:
  - Create teams with a unique invite code
  - Join teams using invite codes
  - Leader can kick members
  - Members can leave teams
  - Leader can leave (transfers leadership or dissolves team)
- **Room System**:
  - Private rooms (invite-only)
  - Public rooms (anyone can join to complete 8/8 team)
  - Leader can make room public (one-way toggle)
  - Leader cannot kick when room is public
  - If team is not full, it breaks for random allocation

### Database Schema

Here's the database structure:

<img width="2206" height="1282" alt="SQL Import (postgresql) (3)" src="https://github.com/user-attachments/assets/7d9b1230-6a07-443c-8e83-0fddd910e34f" />

**Tables:**
- `users`: Stores user information including credentials and team assignment
- `teams`: Team details with invite codes and public/private status
- `slots`: Time slot bookings linked to teams
- `team_members`: Junction table managing team membership relationships

## Prerequisites

Before you begin, make sure you have the following installed:
- [Bun](https://bun.sh) (v1.1.34 or later)
- [PostgreSQL](https://www.postgresql.org/) (v12 or later)
- Git

## Development Setup

### 1. Install Bun

If you haven't installed Bun yet, follow these steps:

**On Linux/macOS:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**On Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

After installation, verify Bun is installed correctly:
```bash
bun --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/ComputerSocietyVITC/lasertag-backend.git
cd lasertag-backend
```

### 3. Install Dependencies

Install all project dependencies using Bun:

```bash
bun install
```

This will install all the packages defined in `package.json`, including:
- Express.js for the web server
- PostgreSQL driver for database connections
- JWT for authentication
- bcryptjs for password hashing
- And other development dependencies

### 4. Setup Environment Variables

Create a `.env` file in the root directory by copying the example file:

```bash
cp .env.example .env
```

Edit the `.env` file and configure your environment variables:

```bash
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/lasertag_db

# JWT secret key (use a strong, random string in production)
SECRET_KEY=your_secret_key_here_please_change_this

# Environment
NODE_ENV=development
```

**Important Notes:**
- Replace `username` and `password` with your PostgreSQL credentials
- Replace `lasertag_db` with your desired database name
- Generate a strong `SECRET_KEY` for production (you can use: `openssl rand -hex 32`)

#### Setting up PostgreSQL Database

1. **Create the database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE lasertag_db;
   
   # Exit psql
   \q
   ```

2. **Verify your connection:**
   Make sure your `DATABASE_URL` in `.env` matches your PostgreSQL setup.

### 5. Run Database Migrations

The project uses [dbmate](https://github.com/amacneil/dbmate) for database migrations. Run the migrations to set up the database schema:

```bash
bun run dbmate:migrate
```

This will create all necessary tables:
- `users` - User accounts and authentication
- `teams` - Team information
- `slots` - Time slot bookings
- And their relationships with foreign key constraints

**Available migration commands:**
- `bun run dbmate:migrate` - Run all pending migrations
- `bun run dbmate:rollback` - Rollback the last migration
- `bun run dbmate:new <migration_name>` - Create a new migration file

### 6. Create a Temporary User

To test the application, you'll need at least one user account. Use the provided script to create a temporary user:

```bash
bun run scripts/createUser.ts <email> <username> <password> <phone_no>
```

**Example:**
```bash
bun run scripts/createUser.ts test@test.com testuser password123 9876543210
```

**User Creation Rules:**
- Email must be a valid email format (contains `@`)
- Username must be at least 3 characters long
- Password must be at least 6 characters long
- Phone number is required

Upon successful creation, you'll see output like:
```
User created successfully!

User Details:
─────────────────────────────────
ID:         1
Username:   testuser
Email:      test@test.com
Is Leader:  false
Created At: 2025-10-25T10:30:00.000Z
─────────────────────────────────
```

### 7. Start the Development Server

Run the application in development mode with auto-reload:

```bash
bun run start
```

The server should now be running on the configured port (check `index.ts` for the port configuration).

## Project Structure

```
lasertag-backend/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Request handlers
├── db/             # Database schema and migrations
├── logs/           # Application logs
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API route definitions
├── scripts/        # Utility scripts
├── types/          # TypeScript type definitions
└── utils/          # Helper functions and utilities
```

## Development Workflow

1. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project's coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git add .
   git commit -m "feat: add description of your feature"
   ```

5. **Push your branch** to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub with a clear description of your changes

## Database Migrations

When you need to modify the database schema:

1. **Create a new migration:**
   ```bash
   bun run dbmate:new add_your_feature_description
   ```

2. **Edit the migration file** in `db/migrations/`

3. **Apply the migration:**
   ```bash
   bun run dbmate:migrate
   ```

4. **If you need to rollback:**
   ```bash
   bun run dbmate:rollback
   ```

## Common Issues

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check your `DATABASE_URL` in `.env`
- Ensure the database exists and credentials are correct

### Migration Errors
- Make sure PostgreSQL is running
- Verify `DATABASE_URL` is correctly formatted
- Check if migrations have already been applied

### Bun Installation Issues
- Make sure you have the latest version of Bun
- Try reinstalling: `curl -fsSL https://bun.sh/install | bash`

## Getting Help

- Check existing [Issues](https://github.com/ComputerSocietyVITC/lasertag-backend/issues)
- Create a new issue if you encounter problems
- Reach out to the maintainers

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to learn and build something great together!

---

Happy coding! 🚀
