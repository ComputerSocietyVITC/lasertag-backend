-- migrate:up
CREATE FUNCTION public.auto_delete_empty_team() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = OLD.team_id) THEN
    DELETE FROM teams WHERE id = OLD.team_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_auto_delete_empty_team
AFTER DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.auto_delete_empty_team();

-- migrate:down
DROP TRIGGER IF EXISTS trg_auto_delete_empty_team ON public.team_members;
DROP FUNCTION IF EXISTS public.auto_delete_empty_team();