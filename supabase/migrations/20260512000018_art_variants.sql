-- Art variant tables: one release can have multiple art styles for the same cards

create table art_variants (
  id         serial primary key,
  release_id int  not null references releases(id),
  name       text not null,
  style      text not null,
  icon       text,
  created_at timestamptz not null default now()
);

create table card_art_variants (
  id             serial primary key,
  card_id        int  not null references cards(id),
  art_variant_id int  not null references art_variants(id),
  art_url        text not null,
  created_at     timestamptz not null default now(),
  unique(card_id, art_variant_id)
);
