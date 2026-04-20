-- ================================================
-- جدول طلبات الدفع - نفّذ هذا في Supabase SQL Editor
-- ================================================

create table if not exists payment_requests (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  username    text not null,
  plan_key    text not null,   -- vip | member | youtuber_vip | donor
  plan_name   text,
  status      text default 'pending',  -- pending | approved | rejected
  created_at  timestamptz default now()
);

-- السماح للمستخدمين المسجلين بإدراج طلباتهم
alter table payment_requests enable row level security;

create policy "users can insert own requests"
  on payment_requests for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "users can view own requests"
  on payment_requests for select
  using (auth.uid() = user_id);

create policy "admin can view all"
  on payment_requests for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.roles @> '["admin"]')
    )
  );

create policy "admin can update"
  on payment_requests for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.roles @> '["admin"]')
    )
  );

-- ================================================
-- عند الموافقة (status = approved) يتم تفعيل الرتبة
-- يمكن للأدمن تشغيل هذا الـ trigger لأتمتة كاملة:
-- ================================================

create or replace function auto_grant_rank()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'approved' and old.status = 'pending' and new.user_id is not null then
    update profiles
    set role = new.plan_key
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_payment_approved on payment_requests;
create trigger on_payment_approved
  after update on payment_requests
  for each row execute function auto_grant_rank();
