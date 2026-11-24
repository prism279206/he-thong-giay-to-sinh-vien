-- ========================================================
-- MIGRATION: 20261124_support_cms_students_in_requests.sql
-- Mục đích:
--   1. Khắc phục lỗi 500 token NULL của Supabase Auth.
--   2. Tái cấu trúc bảng profiles chuẩn hóa cho Quản trị viên & Giảng viên/Cán bộ:
--      - Xóa bỏ các cột sinh viên (ma_sinh_vien, lop).
--      - Thêm các cột nhân sự: ma_can_bo, don_vi.
--      - 4 đơn vị xử lý chính:
--        + Phòng Đào tạo
--        + Phòng Công tác sinh viên
--        + Phòng Khảo thí
--        + Giảng viên - GVCN
--      - Đồng bộ tài khoản Quản trị viên và Giảng viên Đỗ Thị Hương.
--   3. Cập nhật bảng requests:
--      - Bỏ ràng buộc FK profiles.
--      - Thêm cột ma_sinh_vien (tra cứu), ho_ten_sinh_vien, don_vi_xu_ly.
--      - Dữ liệu chi tiết nằm trọn vẹn trong du_lieu_don (JSONB).
--   4. Cập nhật bảng request_step_logs: thêm actor_name.
--   5. Nạp danh mục 8 loại đơn chuẩn vào request_types (nếu chưa có).
--   6. Thiết lập RLS mở cho sinh viên nộp đơn từ CMS và Cán bộ/GV duyệt đơn.
-- ========================================================

-- 1. Sửa lỗi 500 của Supabase Auth (chuyển các token NULL thành chuỗi rỗng '')
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '');

-- 2. Tái cấu trúc bảng public.profiles chuẩn hóa cho Cán bộ & Giảng viên (xóa sạch toàn bộ các cột sinh viên thừa)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ma_sinh_vien CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS lop CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS khoa_hoc CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS khoa CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS nganh CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cccd CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ngay_cap_cccd CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS noi_cap_cccd CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ngay_sinh CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS noi_sinh CASCADE;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ma_can_bo text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS don_vi text;

-- 2.1. Đồng bộ tài khoản Quản trị viên (admin)
INSERT INTO public.profiles (id, email, ho_ten, role, ma_can_bo, don_vi)
SELECT 
  id, 
  email, 
  'Quản trị viên', 
  'admin', 
  'admincdvmhn', 
  'Ban Tiếp nhận'
FROM auth.users 
WHERE email = 'admin@caodangvietmyhanoi.edu.vn'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  ho_ten = 'Quản trị viên',
  ma_can_bo = 'admincdvmhn',
  don_vi = 'Ban Tiếp nhận';

-- 2.2. Đồng bộ tài khoản Cán bộ Đỗ Thị Hương (staff - Phòng đào tạo)
INSERT INTO public.profiles (id, email, ho_ten, role, ma_can_bo, don_vi)
SELECT 
  id, 
  email, 
  'Đỗ Thị Hương', 
  'staff', 
  'GV002', 
  'Phòng đào tạo'
FROM auth.users 
WHERE email = 'huong.do1@caodangvietmyhanoi.edu.vn'
ON CONFLICT (id) DO UPDATE SET
  role = 'staff',
  ho_ten = 'Đỗ Thị Hương',
  ma_can_bo = 'GV002',
  don_vi = 'Phòng đào tạo';

-- 3. Cập nhật bảng public.requests: Bỏ ràng buộc FK profiles và bật ON DELETE CASCADE cho request_types
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_student_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_request_type_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_current_step_id_fkey;

ALTER TABLE public.requests 
  ADD CONSTRAINT requests_request_type_id_fkey 
  FOREIGN KEY (request_type_id) REFERENCES public.request_types(id) ON DELETE CASCADE;

ALTER TABLE public.requests 
  ADD CONSTRAINT requests_current_step_id_fkey 
  FOREIGN KEY (current_step_id) REFERENCES public.workflow_steps(id) ON DELETE SET NULL;

ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS ma_sinh_vien text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS ho_ten_sinh_vien text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS lop text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS khoa text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS don_vi_xu_ly text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS email_sinh_vien text;

-- Kích hoạt Realtime cho bảng requests để web cập nhật tức thì khi có đơn mới
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Cập nhật bảng public.request_step_logs: Thêm actor_name và bỏ ràng buộc FK actor_id
ALTER TABLE public.request_step_logs DROP CONSTRAINT IF EXISTS request_step_logs_actor_id_fkey;
ALTER TABLE public.request_step_logs ADD COLUMN IF NOT EXISTS actor_name text;

-- 5. (TÙY CHỌN) Danh mục 8 loại đơn mẫu
-- Lưu ý: Nếu bạn muốn tự tạo và số hóa các mẫu đơn từ file Word (.docx) của riêng mình, 
-- không cần chạy lệnh INSERT dưới đây để tránh trùng lặp.
-- INSERT INTO public.request_types (id, ten_loai_don, danh_muc, mo_ta, thoi_han_ngay, dang_hoat_dong) ...

-- 6. Thiết lập chính sách bảo mật RLS linh hoạt

-- 6.1. Bảng requests:
DROP POLICY IF EXISTS "requests_student_select" ON public.requests;
DROP POLICY IF EXISTS "requests_student_insert" ON public.requests;
DROP POLICY IF EXISTS "requests_staff_update" ON public.requests;
DROP POLICY IF EXISTS "requests_select_policy" ON public.requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON public.requests;
DROP POLICY IF EXISTS "requests_update_policy" ON public.requests;

CREATE POLICY "requests_select_policy"
ON public.requests FOR SELECT
USING (true);

CREATE POLICY "requests_insert_policy"
ON public.requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "requests_update_policy"
ON public.requests FOR UPDATE
USING (true);

CREATE POLICY "requests_delete_policy"
ON public.requests FOR DELETE
USING (true);

-- 6.2. Bảng request_step_logs:
DROP POLICY IF EXISTS "logs_select_policy" ON public.request_step_logs;
DROP POLICY IF EXISTS "logs_insert_policy" ON public.request_step_logs;
DROP POLICY IF EXISTS "logs_delete_policy" ON public.request_step_logs;

CREATE POLICY "logs_select_policy"
ON public.request_step_logs FOR SELECT
USING (true);

CREATE POLICY "logs_insert_policy"
ON public.request_step_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "logs_delete_policy"
ON public.request_step_logs FOR DELETE
USING (true);

-- 6.3. Bảng request_types:
ALTER TABLE public.request_types ADD COLUMN IF NOT EXISTS don_vi_phu_trach text;
ALTER TABLE public.request_types ADD COLUMN IF NOT EXISTS file_mau_url text;
ALTER TABLE public.request_types ADD COLUMN IF NOT EXISTS file_mau_ten text;
ALTER TABLE public.request_types ADD COLUMN IF NOT EXISTS cau_hinh jsonb DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "request_types_select_policy" ON public.request_types;
DROP POLICY IF EXISTS "request_types_admin_all" ON public.request_types;

CREATE POLICY "request_types_select_policy"
ON public.request_types FOR SELECT
USING (true);

CREATE POLICY "request_types_admin_all"
ON public.request_types FOR ALL
USING (true)
WITH CHECK (true);

-- Kích hoạt Realtime cho request_types để web tự động cập nhật khi thêm/xóa loại đơn
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'request_types'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.request_types;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 6.4. Bảng profiles: Cho phép đọc thông tin cán bộ / giảng viên để phục vụ tiếp nhận & điều phối
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (true);

-- 6.5. Kích hoạt Realtime cho bảng profiles để giao diện tự cập nhật khi cán bộ/giảng viên thay đổi trên database
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ========================================================
-- 7. TỰ ĐỘNG DỌN DẸP ĐƠN ĐÃ HOÀN TẤT QUÁ 3 THÁNG
-- ========================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_completed_requests()
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Xóa các đơn đã hoàn tất (trang_thai = 'completed') có ngày đóng đơn (closed_at) quá 3 tháng
  DELETE FROM public.requests
  WHERE trang_thai = 'completed'
    AND closed_at IS NOT NULL
    AND closed_at < (NOW() - INTERVAL '3 months');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

