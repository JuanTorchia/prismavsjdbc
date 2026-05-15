import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { prisma, resetSqlQueryCount, appMetrics } from "./db.js";

const app = Fastify({ logger: false });
const port = Number(process.env.PORT ?? 3001);

app.get("/health", async () => ({ ok: true, stack: "prisma" }));

app.post("/metrics/reset", async () => {
  resetSqlQueryCount();
  return { ok: true };
});

app.get("/metrics", async () => appMetrics());

app.get("/tasks/:id", async (req) => {
  const { id } = req.params as { id: string };
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, displayName: true } },
      project: {
        select: {
          id: true,
          name: true,
          organization: { select: { id: true, name: true } }
        }
      }
    }
  });
});

app.get("/tasks", async (req) => {
  const q = req.query as Record<string, string>;
  return prisma.task.findMany({
    where: {
      status: q.status as never,
      projectId: q.projectId,
      createdAt: { gte: new Date(q.createdFrom ?? "2024-01-01T00:00:00Z") }
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: Number(q.offset ?? 0),
    take: Math.min(Number(q.limit ?? 50), 200),
    select: { id: true, title: true, status: true, createdAt: true, projectId: true, assigneeId: true }
  });
});

app.get("/relation-summary", async (req) => {
  const mode = ((req.query as Record<string, string>).mode ?? "optimized") as "naive" | "optimized";
  const limit = Math.min(Number((req.query as Record<string, string>).limit ?? 100), 100);
  const projects = await prisma.project.findMany({ orderBy: { id: "asc" }, take: limit });

  if (mode === "naive") {
    return Promise.all(projects.map(async (project) => ({
      projectId: project.id,
      counts: await prisma.task.groupBy({ by: ["status"], where: { projectId: project.id }, _count: true }),
      lastComment: await prisma.comment.findFirst({
        where: { task: { projectId: project.id } },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true }
      })
    })));
  }

  return prisma.$queryRaw`
    with selected_projects as (
      select id from projects order by id asc limit ${limit}
    ),
    counts as (
      select t.project_id, t.status, count(*)::int as total
      from tasks t join selected_projects sp on sp.id = t.project_id
      group by t.project_id, t.status
    ),
    last_comments as (
      select distinct on (t.project_id) t.project_id, c.id as comment_id, c.created_at
      from comments c
      join tasks t on t.id = c.task_id
      join selected_projects sp on sp.id = t.project_id
      order by t.project_id, c.created_at desc
    )
    select sp.id as "projectId",
           coalesce(jsonb_object_agg(c.status, c.total) filter (where c.status is not null), '{}'::jsonb) as counts,
           max(lc.comment_id::text) as "lastCommentId",
           max(lc.created_at) as "lastCommentAt"
    from selected_projects sp
    left join counts c on c.project_id = sp.id
    left join last_comments lc on lc.project_id = sp.id
    group by sp.id
    order by sp.id`;
});

app.get("/n-plus-one-trap", async (req) => {
  const mode = ((req.query as Record<string, string>).mode ?? "optimized") as "naive" | "optimized";
  const tasks = await prisma.task.findMany({ orderBy: { id: "asc" }, take: 100 });
  if (mode === "naive") {
    return Promise.all(tasks.map(async (task) => ({
      task,
      project: await prisma.project.findUnique({ where: { id: task.projectId } }),
      assignee: await prisma.user.findUnique({ where: { id: task.assigneeId } }),
      commentCount: await prisma.comment.count({ where: { taskId: task.id } })
    })));
  }
  return prisma.task.findMany({
    orderBy: { id: "asc" },
    take: 100,
    include: {
      project: true,
      assignee: true,
      _count: { select: { comments: true } }
    }
  });
});

app.post("/transaction-write", async () => {
  const now = new Date();
  const project = await prisma.project.findFirstOrThrow({ orderBy: { id: "asc" } });
  const user = await prisma.user.findFirstOrThrow({ where: { organizationId: project.organizationId }, orderBy: { id: "asc" } });
  const id = randomUUID();
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: { id, projectId: project.id, assigneeId: user.id, title: `Write ${id}`, status: "TODO", createdAt: now, updatedAt: now }
    });
    await tx.comment.create({ data: { id: randomUUID(), taskId: id, authorId: user.id, body: "Created in transaction", createdAt: now } });
    await tx.auditEvent.create({ data: { id: randomUUID(), taskId: id, eventType: "TASK_CREATED", payload: { source: "prisma" }, createdAt: now } });
    return task;
  });
});

app.get("/report-aggregation", async () => prisma.$queryRaw`
  select p.organization_id as "organizationId",
         t.status,
         date_trunc('day', t.created_at)::date as day,
         count(*)::int as total
  from tasks t
  join projects p on p.id = t.project_id
  group by p.organization_id, t.status, date_trunc('day', t.created_at)
  order by day desc, p.organization_id, t.status
  limit 500`);

app.listen({ host: "0.0.0.0", port }).then(() => {
  console.log(`Prisma lab service listening on ${port}`);
});
