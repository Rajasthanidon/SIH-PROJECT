# Server Database Setup

This project uses PostgreSQL via the `pg` driver and expects a configured `DATABASE_URL` environment variable.

## 1. Configure environment variables

Copy `.env.example` to `.env` and set real values for your local PostgreSQL instance or Supabase project.

Example:

```bash
cp .env.example .env
```

Required values:

- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `CLIENT_ORIGIN`

## 2. Run the schema migrations

```bash
npm install
npm run migrate
```

This creates the `schema_migrations` table, applies each SQL migration once, and tracks the migration history.

## 3. Seed reference data

```bash
npm run seed
```

This loads the required default roles and skill catalog entries.

## 4. Start the API

```bash
npm run dev
```

or:

```bash
npm start
```

## 5. Reset the development database (explicit and destructive)

Only use this in a local development database when you intentionally want to recreate the schema.

```bash
ALLOW_DB_RESET=true npm run migrate:reset
npm run migrate
npm run seed
```

Do not run this in production.
