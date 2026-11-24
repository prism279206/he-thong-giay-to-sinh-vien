-- ========================================================
-- MIGRATION: 20261118_create_core_tables.sql
-- Mục đích: Tạo 6 bảng cốt lõi theo tiếng Việt không dấu,
--           bật RLS và thiết lập Policies + Dữ liệu mẫu (Seed Data)
-- ========================================================

-- 1. BẢNG PROFILES (Tài khoản & Hồ sơ sinh viên / giảng viên)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  ma_sinh_vien text unique,
  ho_ten text not null,
  sdt text,
  cccd text,
  ngay_cap_cccd text,
  noi_cap_cccd text default 'Cục Cảnh sát QLHC về TTXH',
  ngay_sinh text,
  noi_sinh text,
  khoa_hoc text,
  lop text,
  khoa text,
  nganh text,
  role text default 'student' check (role in ('student', 'staff', 'admin')),
  signature_data text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. BẢNG REQUEST_TYPES (Danh mục loại đơn / thủ tục)
create table if not exists public.request_types (
  id uuid default gen_random_uuid() primary key,
  ten_loai_don text unique not null,
  danh_muc text default 'Học vụ & Đào tạo',
  mo_ta text,
  thoi_han_ngay int default 3,
  dang_hoat_dong boolean default true,
  created_at timestamptz default now()
);

-- 3. BẢNG WORKFLOWS (Quy trình có phiên bản)
create table if not exists public.workflows (
  id uuid default gen_random_uuid() primary key,
  request_type_id uuid references public.request_types(id) on delete cascade,
  phien_ban int default 1,
  dang_hoat_dong boolean default true,
  created_at timestamptz default now()
);

-- 4. BẢNG WORKFLOW_STEPS (Các bước trong một quy trình)
create table if not exists public.workflow_steps (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade,
  thu_tu_buoc int not null,
  ten_buoc text not null,
  loai_buoc text not null,
  vai_tro_xu_ly text not null,
  trang_thai_sinh_vien text not null,
  created_at timestamptz default now()
);

-- 5. BẢNG REQUESTS (Hồ sơ từng lá đơn nộp)
create table if not exists public.requests (
  id text primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  request_type_id uuid references public.request_types(id),
  current_step_id uuid references public.workflow_steps(id),
  trang_thai text default 'pending' check (trang_thai in ('pending', 'in_progress', 'completed', 'rejected')),
  du_lieu_don jsonb not null default '{}'::jsonb,
  chu_ky_sinh_vien text,
  chu_ky_giang_vien text,
  nguoi_duyet_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- 6. BẢNG REQUEST_STEP_LOGS (Nhật ký xử lý - Bất biến)
create table if not exists public.request_step_logs (
  id uuid default gen_random_uuid() primary key,
  request_id text references public.requests(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  hanh_dong text not null,
  ghi_chu text,
  created_at timestamptz default now()
);

-- ========================================================
-- BẬT ROW LEVEL SECURITY (RLS)
-- ========================================================
alter table public.profiles enable row level security;
alter table public.request_types enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.requests enable row level security;
alter table public.request_step_logs enable row level security;

-- ========================================================
-- RLS POLICIES
-- ========================================================

-- Profiles: Người dùng xem profile của mình; Staff/Admin xem được tất cả
create policy "profiles_select_policy"
on public.profiles for select
using (
  auth.uid() = id or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')
  )
);

create policy "profiles_update_policy"
on public.profiles for update
using (auth.uid() = id);

create policy "profiles_insert_policy"
on public.profiles for insert
with check (auth.uid() = id or exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
));

-- Request Types: Đọc được cho tất cả người dùng; Chỉ Admin được sửa
create policy "request_types_select_policy"
on public.request_types for select
using (true);

create policy "request_types_admin_all"
on public.request_types for all
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Workflows & Steps: Đọc được cho tất cả người dùng đã đăng nhập
create policy "workflows_select_policy"
on public.workflows for select
using (auth.role() = 'authenticated');

create policy "workflow_steps_select_policy"
on public.workflow_steps for select
using (auth.role() = 'authenticated');

-- Requests: Sinh viên xem và nộp đơn của mình; Staff/Admin xem và cập nhật được
create policy "requests_student_select"
on public.requests for select
using (
  student_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')
  )
);

create policy "requests_student_insert"
on public.requests for insert
with check (
  student_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')
  )
);

create policy "requests_staff_update"
on public.requests for update
using (
  student_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')
  )
);

-- Request Step Logs: Người liên quan xem được log; Được ghi thêm log
create policy "logs_select_policy"
on public.request_step_logs for select
using (
  exists (
    select 1 from public.requests r
    where r.id = request_step_logs.request_id
      and (r.student_id = auth.uid() or exists (
        select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')
      ))
  )
);

create policy "logs_insert_policy"
on public.request_step_logs for insert
with check (auth.role() = 'authenticated');

