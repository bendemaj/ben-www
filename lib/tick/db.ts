import { neon } from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

export function isTickDatabaseConfigured() {
  return Boolean(getConnectionString());
}

export function getTickSql() {
  if (cachedSql) return cachedSql;

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  );
}
