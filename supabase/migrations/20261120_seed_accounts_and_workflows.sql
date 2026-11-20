-- ========================================================
-- MIGRATION: 20261120_seed_accounts_and_workflows.sql
-- Mục đích:
--   1. Kích hoạt pgcrypto để băm mật khẩu chuẩn bcrypt
--   2. Tạo tài khoản & mật khẩu cho Quản trị viên (QL001) và Giảng viên (GV001, GV002) vào auth.users + public.profiles
--   3. Tạo tài khoản mẫu Sinh viên (Tiến - 61112420189)
--   4. Khởi tạo danh mục 8 loại đơn hành chính (request_types)
--   5. Khởi tạo quy trình chuẩn 4 chặng (workflows, workflow_steps)
-- ========================================================

-- 1. Kích hoạt extension pgcrypto (nằm trong schema extensions trên Supabase)
create extension if not exists pgcrypto with schema extensions;

-- 2. Hàm hỗ trợ tạo / cập nhật tài khoản an toàn vào auth.users và public.profiles
create or replace function public.upsert_user_account(
  p_id uuid,
  p_email text,
  p_password text,
  p_code text,
  p_ho_ten text,
  p_role text,
  p_khoa text default null,
  p_lop text default null
) returns void as $$
declare
  v_encrypted_pw text;
begin
  -- Băm mật khẩu chuẩn bcrypt (10 vòng)
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- 2.1. Chèn hoặc cập nhật trong auth.users
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', p_ho_ten, 'role', p_role, 'code', p_code),
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  -- 2.2. Chèn vào auth.identities (tương thích Supabase GoTrue Auth)
  begin
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      p_id::text,
      p_id,
      jsonb_build_object('sub', p_id::text, 'email', p_email),
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider, id) do update set
      identity_data = excluded.identity_data,
      updated_at = now();
  exception when others then
    -- Bỏ qua nếu phiên bản GoTrue có schema identities khác
    null;
  end;

  -- 2.3. Chèn hoặc cập nhật vào public.profiles
  insert into public.profiles (
    id,
    email,
    ma_sinh_vien,
    ho_ten,
    role,
    khoa,
    lop
  ) values (
    p_id,
    p_email,
    p_code,
    p_ho_ten,
    p_role,
    p_khoa,
    p_lop
  )
  on conflict (id) do update set
    email = excluded.email,
    ma_sinh_vien = excluded.ma_sinh_vien,
    ho_ten = excluded.ho_ten,
    role = excluded.role,
    khoa = excluded.khoa,
    lop = excluded.lop,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- ========================================================
-- 3. TẠO TÀI KHOẢN VÀ MẬT KHẨU (Mật khẩu mặc định: 123456)
-- ========================================================

-- 3.1. Cán bộ Quản lý - Tiếp nhận & Phân phối Một Cửa (Admin)
-- Đăng nhập bằng mã: QL001 hoặc email: ql001@caodangvietmyhanoi.edu.vn | Mật khẩu: 123456
select public.upsert_user_account(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ql001@caodangvietmyhanoi.edu.vn',
  '123456',
  'QL001',
  'Cán bộ Tiếp nhận Một Cửa',
  'admin',
  'Phòng Đào tạo & Quản lý Khoa học',
  'Ban Tiếp nhận Một Cửa'
);

-- 3.2. Giảng viên chủ nhiệm GV001 (Staff)
-- Đăng nhập bằng mã: GV001 hoặc email: maiant@caodangvietmyhanoi.edu.vn | Mật khẩu: 123456
select public.upsert_user_account(
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'maiant@caodangvietmyhanoi.edu.vn',
  '123456',
  'GV001',
  'ThS. Nguyễn Thị Mai',
  'staff',
  'Khoa Công nghệ thông tin',
  'CD-CNTT-K25A'
);

-- 3.3. Giảng viên khoa GV002 (Staff)
-- Đăng nhập bằng mã: GV002 hoặc email: huong.do1@caodangvietmy.edu.vn | Mật khẩu: 123456
select public.upsert_user_account(
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'huong.do1@caodangvietmy.edu.vn',
  '123456',
  'GV002',
  'ThS. Đỗ Thị Hường',
  'staff',
  'Khoa Quản trị & Kinh tế số',
  'QTKD-K24'
);

-- 3.4. Tài khoản Sinh viên mẫu (Student)
-- Đăng nhập bằng mã: 61112420189 hoặc email: tien12420189@caodangvietmyhanoi.edu.vn | Mật khẩu: 123456
select public.upsert_user_account(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'tien12420189@caodangvietmyhanoi.edu.vn',
  '123456',
  '61112420189',
  'Nguyễn Văn Tiến',
  'student',
  'Công nghệ - Thiết kế',
  'UDPM24-01'
);

-- ========================================================
-- 4. KHỞI TẠO DANH MỤC 8 LOẠI ĐƠN HÀNH CHÍNH (request_types)
-- ========================================================

insert into public.request_types (id, ma_loai_don, ten_loai_don, danh_muc, mo_ta, thoi_han_ngay, dang_hoat_dong)
values
  (
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'XAC_NHAN_SV',
    'Đơn xin cấp xác nhận học sinh - sinh viên',
    'Xác nhận học tập',
    'Dùng để xác nhận đang theo học tại trường để vay vốn ngân hàng, tạm hoãn nghĩa vụ quân sự, bổ sung hồ sơ xin việc...',
    2,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'CAP_BANG_DIEM',
    'Đơn xin cấp bảng điểm',
    'Học vụ & Đào tạo',
    'Đề nghị cấp bảng điểm quá trình học tập các học kỳ hoặc bảng điểm tốt nghiệp có xác nhận của nhà trường.',
    3,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000003'::uuid,
    'MIEN_GIAM_HOC_PHI',
    'Đơn xin miễn giảm học phí',
    'Học phí & Tài chính',
    'Dành cho sinh viên thuộc diện chính sách, con thương binh liệt sĩ, hộ nghèo hoặc các đối tượng được hỗ trợ theo quy định.',
    5,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000004'::uuid,
    'BAO_LUU',
    'Đơn xin bảo lưu kết quả học tập',
    'Học vụ & Đào tạo',
    'Đề nghị tạm dừng tiến độ học và bảo lưu kết quả học tập tối đa 02 học kỳ vì lý do sức khỏe hoặc gia đình.',
    3,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000005'::uuid,
    'PHUC_KHAO',
    'Đơn xin phúc khảo bài thi',
    'Khảo thí & Điểm',
    'Đề nghị rút bài thi và thành lập ban chấm phúc khảo điểm bài thi kết thúc học phần trong thời hạn 15 ngày.',
    7,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000006'::uuid,
    'HOAN_THI',
    'Đơn xin tạm hoãn thi kết thúc học phần',
    'Khảo thí & Điểm',
    'Đề nghị hoãn thi kết thúc môn vì lý do ốm đau cấp cứu hoặc trường hợp bất khả kháng, có giấy viện kèm theo.',
    2,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000007'::uuid,
    'DANG_KY_KTX',
    'Đơn đăng ký chỗ ở Ký túc xá',
    'Đời sống sinh viên',
    'Đăng ký phòng ở nội trú tại khu ký túc xá sinh viên dành cho tân sinh viên hoặc sinh viên ở xa.',
    2,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000008'::uuid,
    'VE_THANG_XE_BUYT',
    'Đăng ký xác nhận làm vé tháng xe buýt',
    'Đời sống sinh viên',
    'Đóng dấu xác nhận sinh viên trên bản khai đăng ký vé tháng xe buýt liên tuyến của Tổng công ty Vận tải.',
    1,
    true
  )
on conflict (ma_loai_don) do update set
  ten_loai_don = excluded.ten_loai_don,
  danh_muc = excluded.danh_muc,
  mo_ta = excluded.mo_ta,
  thoi_han_ngay = excluded.thoi_han_ngay,
  dang_hoat_dong = excluded.dang_hoat_dong;

-- ========================================================
-- 5. KHỞI TẠO QUY TRÌNH 4 CHẶNG (workflows & workflow_steps)
-- ========================================================

-- Tạo Workflow mặc định cho Xác nhận sinh viên
insert into public.workflows (id, request_type_id, phien_ban, dang_hoat_dong)
values (
  'e0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  1,
  true
)
on conflict (id) do nothing;

-- 4 bước quy trình chuẩn của nhà trường
insert into public.workflow_steps (id, workflow_id, thu_tu_buoc, ten_buoc, loai_buoc, vai_tro_xu_ly, trang_thai_sinh_vien)
values
  (
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    1,
    'Nộp đơn trực tuyến',
    'submission',
    'student',
    'Đã nộp đơn (Chờ tiếp nhận)'
  ),
  (
    'f0000000-0000-0000-0000-000000000002'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    2,
    'Tiếp nhận & Phân luồng đơn',
    'dispatch',
    'admin',
    'Đã tiếp nhận (Đang phân công GVCN)'
  ),
  (
    'f0000000-0000-0000-0000-000000000003'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    3,
    'GVCN thẩm tra & Ký duyệt số',
    'approval',
    'staff',
    'GV đã duyệt (Chờ Một cửa đóng dấu)'
  ),
  (
    'f0000000-0000-0000-0000-000000000004'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    4,
    'Đóng dấu ban hành & Trả kết quả',
    'finalization',
    'admin',
    'Đã hoàn thành (Sẵn sàng nhận kết quả)'
  )
on conflict (id) do nothing;
