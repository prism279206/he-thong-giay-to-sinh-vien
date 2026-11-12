# STATE – A (nền tảng)

Người phụ trách: (điền tên)
Cập nhật: 2026-11-12
Vùng sở hữu: `supabase/`, `src/services/`, `src/lib/`, xác thực

## Đã xong
- Khởi tạo project Vite + React, đẩy lên GitHub
- Viết AGENTS.md, SPEC.md, SPECLEARN.md, STATE_a.md, STATE_b.md
- Tạo cấu trúc thư mục src/: components, pages, layouts, services, lib
- Cài @supabase/supabase-js, react-router-dom
- Tạo src/lib/supabaseClient.js và .env.example

## Đang làm
- (trống)

## Kế tiếp
1. Commit và push bộ tài liệu, thêm người B làm Collaborator trên GitHub
2. Cùng người B đọc mục 7 của SPEC (hợp đồng `services/`) và chốt tên hàm
3. Tạo project Supabase, điền `.env`, tạo `.env.example`
4. Cài `@supabase/supabase-js`, tạo `src/lib/supabaseClient.js`
5. Viết migration đầu tiên trong `supabase/migrations/`: `profiles`, `request_types`, `workflows`, `workflow_steps`, `requests`, kèm RLS
6. Viết hàm `perform_step_action` và các bảng log, pickups, external_dispatches
7. Viết `authService` và `requestTypeService` trước để người B nối giao diện

## Đang chờ người kia
- Xác nhận người B đồng ý hợp đồng `services/` (mục 7 của SPEC)

## Thay đổi ảnh hưởng người kia
- (trống. Ghi vào đây khi đổi tên cột, đổi tên hàm hoặc tham số trong `services/`)

## Việc cần hỏi trường (xem mục 12 của SPEC)
- Quy trình thật của từng thủ tục: ai tiếp nhận, ai ký, có bên thứ ba không