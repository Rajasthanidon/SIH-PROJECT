CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

-- Note: In a fresh db, these will run correctly. In our current db, the table is already created.
-- We must make sure the constraints don't crash if they exist, but Postgres ALTER TABLE doesn't have IF NOT EXISTS for constraints easily.
-- So we can wrap it in an anonymous DO block.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
    ) THEN
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'IDX_session_expire'
    ) THEN
        CREATE INDEX "IDX_session_expire" ON "session" ("expire");
    END IF;
END $$;
