package com.example.jdbclab;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class CountingJdbc {
  private final JdbcTemplate jdbc;
  private final AtomicLong queryCount = new AtomicLong();

  public CountingJdbc(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void reset() {
    queryCount.set(0);
  }

  public long count() {
    return queryCount.get();
  }

  public <T> List<T> query(String sql, RowMapper<T> mapper, Object... args) {
    queryCount.incrementAndGet();
    return jdbc.query(sql, mapper, args);
  }

  public Map<String, Object> queryForMap(String sql, Object... args) {
    queryCount.incrementAndGet();
    return jdbc.queryForMap(sql, args);
  }

  public List<Map<String, Object>> queryForList(String sql, Object... args) {
    queryCount.incrementAndGet();
    return jdbc.queryForList(sql, args);
  }

  public int update(String sql, Object... args) {
    queryCount.incrementAndGet();
    return jdbc.update(sql, args);
  }
}
