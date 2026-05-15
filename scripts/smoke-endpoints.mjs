const taskId = "00000000-0000-4000-0100-000000000001";
const projectId = "00000000-0000-4000-0020-000000000001";

const stacks = [
  { name: "prisma", baseUrl: process.env.PRISMA_URL ?? "http://127.0.0.1:3101" },
  { name: "jdbc", baseUrl: process.env.JDBC_URL ?? "http://127.0.0.1:3102" }
];

const endpoints = [
  ["GET", `/tasks/${taskId}`],
  ["GET", `/tasks?status=TODO&projectId=${projectId}&createdFrom=2024-01-01T00:00:00Z&limit=50&offset=0`],
  ["GET", "/relation-summary?mode=naive&limit=100"],
  ["GET", "/relation-summary?mode=optimized&limit=100"],
  ["GET", "/n-plus-one-trap?mode=naive"],
  ["GET", "/n-plus-one-trap?mode=optimized"],
  ["POST", "/transaction-write"],
  ["GET", "/report-aggregation"]
];

const failures = [];

for (const stack of stacks) {
  for (const [method, path] of endpoints) {
    const url = stack.baseUrl + path;
    try {
      const response = await fetch(url, { method });
      await response.arrayBuffer();
      if (!response.ok) {
        failures.push(`${stack.name} ${method} ${path} -> ${response.status}`);
      }
    } catch (error) {
      failures.push(`${stack.name} ${method} ${path} -> ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Endpoint smoke passed for ${stacks.length * endpoints.length} calls`);
