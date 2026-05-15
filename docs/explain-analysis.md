# EXPLAIN ANALYZE / BUFFERS

Baseline: PostgreSQL 16, dataset editorial de 50k tasks generado para la corrida principal Node 24 + Java 21.

## relation-summary-optimized

```sql
with selected_projects as (
  select id from projects order by id asc limit 100
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
order by sp.id;
```

```text
                                                                          QUERY PLAN                                                                           
---------------------------------------------------------------------------------------------------------------------------------------------------------------
 GroupAggregate  (cost=14502.52..14849.77 rows=100 width=88) (actual time=108.716..118.639 rows=100 loops=1)
   Group Key: sp.id
   Buffers: shared hit=2537, temp read=421 written=422
   CTE selected_projects
     ->  Limit  (cost=7.32..7.57 rows=100 width=16) (actual time=0.043..0.054 rows=100 loops=1)
           Buffers: shared hit=3
           ->  Sort  (cost=7.32..7.57 rows=100 width=16) (actual time=0.042..0.047 rows=100 loops=1)
                 Sort Key: projects.id
                 Sort Method: quicksort  Memory: 27kB
                 Buffers: shared hit=3
                 ->  Seq Scan on projects  (cost=0.00..4.00 rows=100 width=16) (actual time=0.011..0.027 rows=100 loops=1)
                       Buffers: shared hit=3
   ->  Merge Left Join  (cost=14494.95..14837.94 rows=200 width=48) (actual time=108.242..118.183 rows=100 loops=1)
         Merge Cond: (sp.id = t_1.project_id)
         Buffers: shared hit=2524, temp read=421 written=422
         ->  Sort  (cost=2421.68..2422.18 rows=200 width=24) (actual time=19.385..19.408 rows=100 loops=1)
               Sort Key: sp.id
               Sort Method: quicksort  Memory: 29kB
               Buffers: shared hit=730
               ->  Hash Right Join  (cost=2401.53..2414.03 rows=200 width=24) (actual time=19.303..19.341 rows=100 loops=1)
                     Hash Cond: (t.project_id = sp.id)
                     Buffers: shared hit=730
                     ->  HashAggregate  (cost=2398.28..2403.28 rows=400 width=24) (actual time=19.192..19.209 rows=100 loops=1)
                           Group Key: t.project_id, t.status
                           Batches: 1  Memory Usage: 45kB
                           Buffers: shared hit=727
                           ->  Hash Join  (cost=3.25..1997.95 rows=53377 width=20) (actual time=0.039..12.379 rows=51980 loops=1)
                                 Hash Cond: (t.project_id = sp_1.id)
                                 Buffers: shared hit=727
                                 ->  Seq Scan on tasks t  (cost=0.00..1260.77 rows=53377 width=20) (actual time=0.003..3.776 rows=51980 loops=1)
                                       Buffers: shared hit=727
                                 ->  Hash  (cost=2.00..2.00 rows=100 width=16) (actual time=0.017..0.017 rows=100 loops=1)
                                       Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                       ->  CTE Scan on selected_projects sp_1  (cost=0.00..2.00 rows=100 width=16) (actual time=0.000..0.006 rows=100 loops=1)
                     ->  Hash  (cost=2.00..2.00 rows=100 width=16) (actual time=0.084..0.084 rows=100 loops=1)
                           Buckets: 1024  Batches: 1  Memory Usage: 13kB
                           Buffers: shared hit=3
                           ->  CTE Scan on selected_projects sp  (cost=0.00..2.00 rows=100 width=16) (actual time=0.044..0.068 rows=100 loops=1)
                                 Buffers: shared hit=3
         ->  Unique  (cost=12073.27..12412.02 rows=100 width=40) (actual time=88.851..98.658 rows=100 loops=1)
               Buffers: shared hit=1794, temp read=421 written=422
               ->  Sort  (cost=12073.27..12242.65 rows=67749 width=40) (actual time=88.849..94.925 rows=67981 loops=1)
                     Sort Key: t_1.project_id, c.created_at DESC
                     Sort Method: external merge  Disk: 3368kB
                     Buffers: shared hit=1794, temp read=421 written=422
                     ->  Hash Join  (cost=1931.23..4782.12 rows=67749 width=40) (actual time=15.616..51.867 rows=68647 loops=1)
                           Hash Cond: (t_1.project_id = sp_2.id)
                           Buffers: shared hit=1791
                           ->  Hash Join  (cost=1927.98..3847.32 rows=67749 width=40) (actual time=15.580..41.540 rows=68647 loops=1)
                                 Hash Cond: (c.task_id = t_1.id)
                                 Buffers: shared hit=1791
                                 ->  Seq Scan on comments c  (cost=0.00..1741.49 rows=67749 width=40) (actual time=0.010..6.540 rows=68647 loops=1)
                                       Buffers: shared hit=1064
                                 ->  Hash  (cost=1260.77..1260.77 rows=53377 width=32) (actual time=15.222..15.223 rows=51980 loops=1)
                                       Buckets: 65536  Batches: 1  Memory Usage: 3761kB
                                       Buffers: shared hit=727
                                       ->  Seq Scan on tasks t_1  (cost=0.00..1260.77 rows=53377 width=32) (actual time=0.008..4.590 rows=51980 loops=1)
                                             Buffers: shared hit=727
                           ->  Hash  (cost=2.00..2.00 rows=100 width=16) (actual time=0.019..0.020 rows=100 loops=1)
                                 Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                 ->  CTE Scan on selected_projects sp_2  (cost=0.00..2.00 rows=100 width=16) (actual time=0.001..0.007 rows=100 loops=1)
 Planning:
   Buffers: shared hit=283
 Planning Time: 1.987 ms
 Execution Time: 120.328 ms
(65 rows)

```

## n-plus-one-trap-optimized

```sql
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
limit 100;
```

```text
                                                                              QUERY PLAN                                                                               
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=1.85..63.03 rows=100 width=63) (actual time=0.237..0.770 rows=100 loops=1)
   Buffers: shared hit=896
   ->  GroupAggregate  (cost=1.85..41451.37 rows=67749 width=63) (actual time=0.236..0.764 rows=100 loops=1)
         Group Key: t.id, p.name, u.display_name
         Buffers: shared hit=896
         ->  Incremental Sort  (cost=1.85..39927.02 rows=67749 width=75) (actual time=0.231..0.711 rows=135 loops=1)
               Sort Key: t.id, p.name, u.display_name
               Presorted Key: t.id
               Full-sort Groups: 5  Sort Method: quicksort  Average Memory: 28kB  Peak Memory: 28kB
               Buffers: shared hit=896
               ->  Nested Loop Left Join  (cost=1.14..37381.33 rows=67749 width=75) (actual time=0.042..0.612 rows=161 loops=1)
                     Buffers: shared hit=890
                     ->  Nested Loop  (cost=0.72..5672.57 rows=53377 width=59) (actual time=0.034..0.391 rows=121 loops=1)
                           Buffers: shared hit=406
                           ->  Nested Loop  (cost=0.57..4329.82 rows=53377 width=66) (actual time=0.019..0.204 rows=121 loops=1)
                                 Buffers: shared hit=206
                                 ->  Index Scan using tasks_pkey on tasks t  (cost=0.41..2987.07 rows=53377 width=70) (actual time=0.008..0.028 rows=121 loops=1)
                                       Buffers: shared hit=6
                                 ->  Memoize  (cost=0.15..0.17 rows=1 width=28) (actual time=0.001..0.001 rows=1 loops=121)
                                       Cache Key: t.project_id
                                       Cache Mode: logical
                                       Hits: 21  Misses: 100  Evictions: 0  Overflows: 0  Memory Usage: 14kB
                                       Buffers: shared hit=200
                                       ->  Index Scan using projects_pkey on projects p  (cost=0.14..0.16 rows=1 width=28) (actual time=0.001..0.001 rows=1 loops=100)
                                             Index Cond: (id = t.project_id)
                                             Buffers: shared hit=200
                           ->  Memoize  (cost=0.15..0.17 rows=1 width=25) (actual time=0.001..0.001 rows=1 loops=121)
                                 Cache Key: t.assignee_id
                                 Cache Mode: logical
                                 Hits: 21  Misses: 100  Evictions: 0  Overflows: 0  Memory Usage: 14kB
                                 Buffers: shared hit=200
                                 ->  Index Scan using users_pkey on users u  (cost=0.14..0.16 rows=1 width=25) (actual time=0.001..0.001 rows=1 loops=100)
                                       Index Cond: (id = t.assignee_id)
                                       Buffers: shared hit=200
                     ->  Index Scan using comments_task_id_created_at_idx on comments c  (cost=0.42..0.58 rows=1 width=32) (actual time=0.001..0.002 rows=1 loops=121)
                           Index Cond: (task_id = t.id)
                           Buffers: shared hit=484
 Planning:
   Buffers: shared hit=322
 Planning Time: 1.383 ms
 Execution Time: 0.991 ms
(41 rows)

```

## report-aggregation

```sql
select p.organization_id,
       t.status,
       date_trunc('day', t.created_at)::date as day,
       count(*)::int as total
from tasks t
join projects p on p.id = t.project_id
group by p.organization_id, t.status, date_trunc('day', t.created_at)
order by day desc, p.organization_id, t.status
limit 500;
```

```text
                                                              QUERY PLAN                                                               
---------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=3570.28..3571.53 rows=500 width=36) (actual time=25.120..25.166 rows=500 loops=1)
   Buffers: shared hit=741
   ->  Sort  (cost=3570.28..3623.66 rows=21352 width=36) (actual time=25.118..25.138 rows=500 loops=1)
         Sort Key: (((date_trunc('day'::text, t.created_at)))::date) DESC, p.organization_id, t.status
         Sort Method: quicksort  Memory: 75kB
         Buffers: shared hit=741
         ->  HashAggregate  (cost=2079.29..2506.33 rows=21352 width=36) (actual time=24.666..24.856 rows=721 loops=1)
               Group Key: p.organization_id, t.status, date_trunc('day'::text, t.created_at)
               Batches: 1  Memory Usage: 913kB
               Buffers: shared hit=730
               ->  Hash Join  (cost=5.25..1545.52 rows=53377 width=36) (actual time=0.100..16.098 rows=51980 loops=1)
                     Hash Cond: (t.project_id = p.id)
                     Buffers: shared hit=730
                     ->  Seq Scan on tasks t  (cost=0.00..1260.77 rows=53377 width=28) (actual time=0.018..4.024 rows=51980 loops=1)
                           Buffers: shared hit=727
                     ->  Hash  (cost=4.00..4.00 rows=100 width=32) (actual time=0.054..0.055 rows=100 loops=1)
                           Buckets: 1024  Batches: 1  Memory Usage: 15kB
                           Buffers: shared hit=3
                           ->  Seq Scan on projects p  (cost=0.00..4.00 rows=100 width=32) (actual time=0.005..0.025 rows=100 loops=1)
                                 Buffers: shared hit=3
 Planning:
   Buffers: shared hit=220
 Planning Time: 0.850 ms
 Execution Time: 25.927 ms
(24 rows)

```

