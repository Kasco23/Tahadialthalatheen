-- Create storage buckets
insert into storage.buckets (id, name, public)
values 
  ('logos', 'logos', true),
  ('assets', 'assets', true)
on conflict (id) do nothing;
