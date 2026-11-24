-- ========================================================
-- MIGRATION: 20261123_remove_ma_loai_don.sql
-- Mục đích:
--   1. Xóa bỏ hoàn toàn cột ma_loai_don trong bảng request_types (chỉ giữ tên đơn)
--   2. Đặt ten_loai_don làm khóa duy nhất
--   3. Cập nhật ràng buộc trạng thái hồ sơ bao gồm cả teacher_approved và overdue
-- ========================================================

-- 1. Xóa cột ma_loai_don nếu đang tồn tại
alter table if exists public.request_types drop column if exists ma_loai_don cascade;

-- 2. Đặt ten_loai_don làm unique constraint
alter table if exists public.request_types drop constraint if exists request_types_ten_loai_don_key;
alter table if exists public.request_types add constraint request_types_ten_loai_don_key unique (ten_loai_don);

-- 3. Cập nhật ràng buộc trạng thái hồ sơ requests
alter table if exists public.requests drop constraint if exists requests_trang_thai_check;
alter table if exists public.requests add constraint requests_trang_thai_check
  check (trang_thai in ('pending', 'in_progress', 'teacher_approved', 'completed', 'rejected', 'overdue'));

