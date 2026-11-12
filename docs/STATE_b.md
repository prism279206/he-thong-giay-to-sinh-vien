# STATE – B (giao diện)

Người phụ trách: (điền tên)
Cập nhật: 2026-11-12
Vùng sở hữu: `src/pages/`, `src/components/`

## Đã xong
- (chưa có)

## Đang làm
- Chuẩn bị môi trường làm việc trên máy

## Kế tiếp
1. Cài môi trường: Node.js bản LTS mới (từ 20.19 hoặc 22.12 trở lên), Git
2. Nếu PowerShell chặn npm, chạy `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
3. Nhận lời mời Collaborator, clone repo, chạy `git pull`, `npm install`, `npm run dev`
4. Đọc `AGENTS.md`, `docs/SPEC.md` và cùng người A chốt hợp đồng `services/` (mục 7 của SPEC)
5. Tạo `.env` từ `.env.example`, điền key do người A gửi riêng
6. Cài `react-router-dom`, dựng khung các trang và layout chung
7. Làm giao diện bằng dữ liệu giả (mock): trang đăng nhập, chọn thủ tục, danh sách hồ sơ, chi tiết hồ sơ
8. Làm bộ render form từ `form_schema` (dùng dữ liệu giả trước)

## Đang chờ A
- Chốt tên và tham số các hàm trong `src/services/` (mục 7 của SPEC)
- Key Supabase để điền vào `.env`
- `authService` và `requestTypeService` để nối giao diện với dữ liệu thật

## Thay đổi ảnh hưởng người kia
- (trống. Ghi vào đây khi cần thêm trường vào form, thêm màn hình hoặc cần hàm mới trong `services/`)