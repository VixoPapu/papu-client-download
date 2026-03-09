create table if not exists profiles (
  id text primary key,
  username text not null unique,
  uuid text,
  avatar_url text,
  status text not null default 'online',
  created_at timestamptz not null default now()
);

create table if not exists friend_links (
  owner_id text not null references profiles(id) on delete cascade,
  friend_id text not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null references profiles(id) on delete cascade,
  recipient_id text not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists call_sessions (
  id uuid primary key default gen_random_uuid(),
  caller_id text not null references profiles(id) on delete cascade,
  recipient_id text not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table profiles disable row level security;
alter table friend_links disable row level security;
alter table messages disable row level security;
alter table call_sessions disable row level security;
