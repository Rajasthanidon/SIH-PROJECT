# Database Migrations

This directory contains the PostgreSQL schema migrations for the application.

Run the migration runner with:

npm run migrate

Each migration is applied exactly once and recorded in the schema_migrations table.
The initial migration creates the core tables required for users, roles, student profiles,
assessments, projects, internships, scores, and rankings.
