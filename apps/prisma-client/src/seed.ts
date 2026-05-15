import { PrismaClient, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SCALE: Record<string, number> = {
  small: 1_000,
  medium: 50_000,
  editorial: 50_000,
  large: 200_000
};

const taskCount = SCALE[process.env.LAB_SIZE ?? "small"] ?? Number(process.env.LAB_SIZE ?? 1000);
const base = new Date("2024-01-01T00:00:00.000Z");

function uuid(prefix: number, n: number) {
  return `00000000-0000-4000-${prefix.toString().padStart(4, "0")}-${n.toString().padStart(12, "0")}`;
}

function dateAt(days: number, minutes = 0) {
  return new Date(base.getTime() + days * 86_400_000 + minutes * 60_000);
}

async function batch<T>(items: T[], size: number, fn: (slice: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size));
  }
}

async function main() {
  console.log(`Seeding deterministic dataset with ${taskCount} tasks`);
  await prisma.auditEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const orgCount = Math.max(4, Math.ceil(taskCount / 12_500));
  const usersPerOrg = 25;
  const projectsPerOrg = 25;

  const organizations = Array.from({ length: orgCount }, (_, i) => ({
    id: uuid(1, i + 1),
    name: `Org ${i + 1}`,
    createdAt: dateAt(i)
  }));
  await prisma.organization.createMany({ data: organizations });

  const users = organizations.flatMap((org, oi) =>
    Array.from({ length: usersPerOrg }, (_, i) => ({
      id: uuid(2 + oi, i + 1),
      organizationId: org.id,
      email: `user-${oi + 1}-${i + 1}@example.test`,
      displayName: `User ${oi + 1}-${i + 1}`,
      createdAt: dateAt(oi, i)
    }))
  );
  await prisma.user.createMany({ data: users });

  const projects = organizations.flatMap((org, oi) =>
    Array.from({ length: projectsPerOrg }, (_, i) => ({
      id: uuid(20 + oi, i + 1),
      organizationId: org.id,
      name: `Project ${oi + 1}-${i + 1}`,
      createdAt: dateAt(oi * 2, i)
    }))
  );
  await prisma.project.createMany({ data: projects });

  const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED];
  const tasks = Array.from({ length: taskCount }, (_, i) => {
    const project = projects[i % projects.length];
    const orgIndex = organizations.findIndex((o) => o.id === project.organizationId);
    const user = users[orgIndex * usersPerOrg + (i % usersPerOrg)];
    return {
      id: uuid(100, i + 1),
      projectId: project.id,
      assigneeId: user.id,
      title: `Task ${i + 1}`,
      status: statuses[i % statuses.length],
      createdAt: dateAt(i % 180, i % 1440),
      updatedAt: dateAt((i % 180) + 1, i % 1440)
    };
  });
  await batch(tasks, 5_000, (slice) => prisma.task.createMany({ data: slice }));

  const comments = tasks.flatMap((task, i) =>
    Array.from({ length: i % 3 === 0 ? 2 : 1 }, (_, c) => ({
      id: uuid(200 + c, i + 1),
      taskId: task.id,
      authorId: task.assigneeId,
      body: `Synthetic comment ${c + 1} for task ${i + 1}`,
      createdAt: dateAt(i % 180, (i + c + 1) % 1440)
    }))
  );
  await batch(comments, 5_000, (slice) => prisma.comment.createMany({ data: slice }));

  const auditEvents = tasks.map((task, i) => ({
    id: uuid(300, i + 1),
    taskId: task.id,
    eventType: "TASK_SEEDED",
    payload: { source: "deterministic-seed", ordinal: i + 1 },
    createdAt: task.createdAt
  }));
  await batch(auditEvents, 5_000, (slice) => prisma.auditEvent.createMany({ data: slice }));
}

main().finally(async () => prisma.$disconnect());
