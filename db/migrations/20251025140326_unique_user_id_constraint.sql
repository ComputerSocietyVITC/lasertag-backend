-- migrate:up
ALTER TABLE public.team_members
ADD CONSTRAINT ux_team_members_user_id UNIQUE (user_id);


-- migrate:down
ALTER TABLE public.team_members REMOVE CONSTRAINT ux_team_members_user_id;