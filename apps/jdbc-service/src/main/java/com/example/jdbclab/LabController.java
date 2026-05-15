package com.example.jdbclab;

import java.lang.management.ManagementFactory;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
public class LabController {
  private final CountingJdbc db;

  public LabController(CountingJdbc db) {
    this.db = db;
  }

  record TaskRow(String id, String projectId, String assigneeId, String title, String status, Instant createdAt) {}

  private static final RowMapper<TaskRow> TASK_MAPPER = (rs, rowNum) -> new TaskRow(
      rs.getString("id"),
      rs.getString("project_id"),
      rs.getString("assignee_id"),
      rs.getString("title"),
      rs.getString("status"),
      rs.getTimestamp("created_at").toInstant());

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("ok", true, "stack", "jdbc");
  }

  @PostMapping("/metrics/reset")
  public Map<String, Object> resetMetrics() {
    db.reset();
    return Map.of("ok", true);
  }

  @GetMapping("/metrics")
  public Map<String, Object> metrics() {
    long measuredSqlQueryCount = db.count();
    var runtime = ManagementFactory.getMemoryMXBean();
    var nonHeap = runtime.getNonHeapMemoryUsage().getUsed();
    var heap = runtime.getHeapMemoryUsage().getUsed();
    var connections = db.queryForMap("""
        select count(*)::bigint as connections
        from pg_stat_activity
        where datname = current_database()
          and usename = current_user
        """);
    return Map.of(
        "sql_query_count", measuredSqlQueryCount,
        "app_rss_mb", Math.round(((heap + nonHeap) / 1024.0 / 1024.0) * 10.0) / 10.0,
        "db_connections_used", ((Number) connections.get("connections")).longValue());
  }

  @GetMapping("/tasks/{id}")
  public Map<String, Object> readById(@PathVariable("id") String id,
                                      @RequestParam(name = "mode", defaultValue = "idiomatic") String mode) {
    return db.queryForMap("""
        select t.id, t.title, t.status, t.created_at,
               p.id as project_id, p.name as project_name,
               o.id as organization_id, o.name as organization_name,
               u.id as assignee_id, u.display_name as assignee_name
        from tasks t
        join projects p on p.id = t.project_id
        join organizations o on o.id = p.organization_id
        join users u on u.id = t.assignee_id
        where t.id = ?::uuid
        """, id);
  }

  @GetMapping("/tasks")
  public List<Map<String, Object>> paginatedList(
      @RequestParam("status") String status,
      @RequestParam("projectId") String projectId,
      @RequestParam(name = "createdFrom", defaultValue = "2024-01-01T00:00:00Z") String createdFrom,
      @RequestParam(name = "limit", defaultValue = "50") int limit,
      @RequestParam(name = "offset", defaultValue = "0") int offset) {
    return db.queryForList("""
        select id, title, status, created_at, project_id, assignee_id
        from tasks
        where status = ?::"TaskStatus"
          and project_id = ?::uuid
          and created_at >= ?::timestamptz
        order by created_at desc, id asc
        limit ? offset ?
        """, status, projectId, createdFrom, Math.min(limit, 200), offset);
  }

  @GetMapping("/relation-summary")
  public Object relationSummary(@RequestParam(name = "mode", defaultValue = "optimized") String mode,
                                @RequestParam(name = "limit", defaultValue = "100") int limit) {
    int capped = Math.min(limit, 100);
    var projects = db.queryForList("select id from projects order by id asc limit ?", capped);
    if ("naive".equals(mode)) {
      return projects.stream().map(project -> {
        String projectId = project.get("id").toString();
        var counts = db.queryForList("""
            select status, count(*)::int as total
            from tasks
            where project_id = ?::uuid
            group by status
            """, projectId);
        var last = db.queryForList("""
            select c.id, c.created_at
            from comments c
            join tasks t on t.id = c.task_id
            where t.project_id = ?::uuid
            order by c.created_at desc
            limit 1
            """, projectId);
        return Map.of("projectId", projectId, "counts", counts, "lastComment", last);
      }).toList();
    }
    return db.queryForList("""
        with selected_projects as (
          select id from projects order by id asc limit ?
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
        select sp.id as project_id,
               coalesce(jsonb_object_agg(c.status, c.total) filter (where c.status is not null), '{}'::jsonb) as counts,
               max(lc.comment_id::text) as last_comment_id,
               max(lc.created_at) as last_comment_at
        from selected_projects sp
        left join counts c on c.project_id = sp.id
        left join last_comments lc on lc.project_id = sp.id
        group by sp.id
        order by sp.id
        """, capped);
  }

  @GetMapping("/n-plus-one-trap")
  public Object nPlusOne(@RequestParam(name = "mode", defaultValue = "optimized") String mode) {
    List<TaskRow> tasks = db.query("""
        select id, project_id, assignee_id, title, status, created_at
        from tasks order by id asc limit 100
        """, TASK_MAPPER);
    if ("naive".equals(mode)) {
      return tasks.stream().map(task -> Map.of(
          "task", task,
          "project", db.queryForMap("select * from projects where id = ?::uuid", task.projectId()),
          "assignee", db.queryForMap("select * from users where id = ?::uuid", task.assigneeId()),
          "commentCount", db.queryForMap("select count(*)::int as total from comments where task_id = ?::uuid", task.id())
      )).toList();
    }
    // For JDBC, optimized and best-effort are the same maintainable explicit SQL shape.
    return db.queryForList("""
        select t.id, t.title, t.status, t.created_at,
               p.name as project_name,
               u.display_name as assignee_name,
               count(c.id)::int as comment_count
        from tasks t
        join projects p on p.id = t.project_id
        join users u on u.id = t.assignee_id
        left join comments c on c.task_id = t.id
        group by t.id, p.name, u.display_name
        order by t.id asc
        limit 100
        """);
  }

  @PostMapping("/transaction-write")
  @Transactional
  public Map<String, Object> transactionWrite() {
    var project = db.queryForMap("select id, organization_id from projects order by id asc limit 1");
    var user = db.queryForMap("select id from users where organization_id = ? order by id asc limit 1", project.get("organization_id"));
    UUID taskId = UUID.randomUUID();
    Timestamp now = Timestamp.from(Instant.now());
    db.update("""
        insert into tasks(id, project_id, assignee_id, title, status, created_at, updated_at)
        values (?::uuid, ?, ?, ?, 'TODO', ?, ?)
        """, taskId.toString(), project.get("id"), user.get("id"), "Write " + taskId, now, now);
    db.update("insert into comments(id, task_id, author_id, body, created_at) values (?::uuid, ?::uuid, ?, ?, ?)",
        UUID.randomUUID().toString(), taskId.toString(), user.get("id"), "Created in transaction", now);
    db.update("insert into audit_events(id, task_id, event_type, payload, created_at) values (?::uuid, ?::uuid, 'TASK_CREATED', '{\"source\":\"jdbc\"}'::jsonb, ?)",
        UUID.randomUUID().toString(), taskId.toString(), now);
    return Map.of("id", taskId.toString());
  }

  @GetMapping("/report-aggregation")
  public List<Map<String, Object>> reportAggregation() {
    return db.queryForList("""
        select p.organization_id,
               t.status,
               date_trunc('day', t.created_at)::date as day,
               count(*)::int as total
        from tasks t
        join projects p on p.id = t.project_id
        group by p.organization_id, t.status, date_trunc('day', t.created_at)
        order by day desc, p.organization_id, t.status
        limit 500
        """);
  }
}
