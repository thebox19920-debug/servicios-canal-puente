CREATE TABLE site_pageviews (
  local_day TEXT NOT NULL,
  page_path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (local_day, page_path)
);
