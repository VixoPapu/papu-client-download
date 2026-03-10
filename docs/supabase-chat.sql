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

create table if not exists friend_requests (
  sender_id text not null references profiles(id) on delete cascade,
  recipient_id text not null references profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (sender_id, recipient_id)
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
  status text not null default 'ringing',
  answered_at timestamptz,
  ended_at timestamptz
);

alter table call_sessions add column if not exists status text not null default 'ringing';
alter table call_sessions add column if not exists answered_at timestamptz;

create table if not exists call_signals (
  id bigint generated always as identity primary key,
  session_id uuid not null references call_sessions(id) on delete cascade,
  from_id text not null references profiles(id) on delete cascade,
  to_id text not null references profiles(id) on delete cascade,
  signal_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles disable row level security;
alter table friend_links disable row level security;
alter table friend_requests disable row level security;
alter table messages disable row level security;
alter table call_sessions disable row level security;
alter table call_signals disable row level security;
