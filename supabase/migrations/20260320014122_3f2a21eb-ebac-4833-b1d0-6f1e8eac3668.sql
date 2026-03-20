
ALTER TABLE public.bots ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.bots ADD COLUMN premium_free_messages integer NOT NULL DEFAULT 2;
