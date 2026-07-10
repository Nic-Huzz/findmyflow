-- Track whether a completed courage challenge feels safe (inside cone) or not yet
alter table quest_tasks add column safety_status text;
-- Values: null (regular task / not yet completed)
--         'safe' (courage challenge done + felt good + met/exceeded expectations)
--         'not_safe' (courage challenge done + felt bad or worse than expected)
