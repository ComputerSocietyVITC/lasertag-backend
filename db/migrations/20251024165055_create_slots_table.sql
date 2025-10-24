-- migrate:up
CREATE TABLE slots (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  booked_by INT DEFAULT NULL REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX ux_slot_time ON slots(start_time, end_time);

-- migrate:down
DROP INDEX IF EXISTS ux_slot_time;
DROP TABLE slots;