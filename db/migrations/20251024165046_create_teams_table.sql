-- migrate:up
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE OR REPLACE FUNCTION enforce_team_size()
RETURNS TRIGGER AS $$
DECLARE count_members INT;
BEGIN
  SELECT COUNT(*) INTO count_members FROM team_members WHERE team_id = NEW.team_id;
  IF (count_members + 1) > 8 THEN
    RAISE EXCEPTION 'Team size limit exceeded (max 8)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_team_size
BEFORE INSERT ON team_members
FOR EACH ROW EXECUTE FUNCTION enforce_team_size();


-- migrate:down
DROP TRIGGER IF EXISTS trg_team_size ON team_members;
DROP FUNCTION IF EXISTS enforce_team_size;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;