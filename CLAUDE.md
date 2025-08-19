# BasicChatUI - Claude Context

## Project Overview
A Next.js-based chat UI application with authentication and webhook integration capabilities.

## Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Prisma adapter
- **Database**: Prisma ORM with SQLite (development)
- **Linting**: ESLint with Next.js config

## Project Structure
```
app/
├── api/
│   ├── auth/[...nextauth]/     # NextAuth.js authentication endpoints
│   └── chat/                   # Chat API endpoints
├── auth/signin/                # Sign-in page
├── components/                 # Reusable UI components
│   └── SessionProvider.tsx     # Session management
├── layout.tsx                  # Root layout
└── page.tsx                    # Home page

lib/
├── auth.ts                     # Authentication configuration
└── prisma.ts                   # Prisma client setup

prisma/
├── schema.prisma               # Database schema
└── dev.db                      # SQLite development database

types/
└── next-auth.d.ts              # NextAuth type definitions
```

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate Prisma client

## Key Features
- User authentication with NextAuth.js
- Session management across the application
- Database integration with Prisma
- API routes for chat functionality
- Webhook integration capabilities (n8n)

## Development Notes
- Uses app directory structure (Next.js 13+ pattern)
- TypeScript configuration is set up
- Tailwind CSS is configured and ready to use
- ESLint is configured with Next.js best practices
- Database schema should be pushed before first run