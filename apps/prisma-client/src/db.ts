import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }]
});

let sqlQueryCount = 0;

prisma.$on("query", () => {
  sqlQueryCount += 1;
});

export function resetSqlQueryCount() {
  sqlQueryCount = 0;
}

export async function appMetrics() {
  const measuredSqlQueryCount = sqlQueryCount;
  const rows = await prisma.$queryRaw<{ connections: bigint }[]>`
    select count(*)::bigint as connections
    from pg_stat_activity
    where datname = current_database()
      and usename = current_user
  `;
  return {
    sql_query_count: measuredSqlQueryCount,
    app_rss_mb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
    db_connections_used: Number(rows[0]?.connections ?? 0)
  };
}
