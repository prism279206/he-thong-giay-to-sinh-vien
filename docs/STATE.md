# STATE – B (giao diện)

Người phụ trách: (điền tên)
Cập nhật: 2026-11-13
Vùng sở hữu: `src/pages/`, `src/components/`

## Đã xong
- Kích hoạt `@tailwindcss/vite` trong `vite.config.js` và `src/index.css`
- Tạo giao diện màn hình Đăng nhập đầu tiên (`src/pages/LoginPage.jsx`) và tài khoản ảo để test đăng nhập
- Tạo trang Tổng quan sinh viên sau khi đăng nhập (`src/pages/StudentDashboardPage.jsx`) và màn hình chọn loại đơn (`src/components/RequestTypePicker.jsx`) nối qua `src/App.jsx`
- Triển khai mục Quản lý chữ ký cá nhân (`src/components/SignatureManager.jsx`): tải ảnh chữ ký tự động tách nền giấy trắng/xám bằng Canvas thuần không cần thư viện ngoài, tùy chỉnh độ nhạy & màu mực, hỗ trợ ký tay/chuột trực tiếp trên màn hình, lưu và tải file PNG trong suốt.
- Triển khai form "Đơn xin cấp xác nhận học sinh - sinh viên" (`src/components/StudentConfirmationForm.jsx`): toàn bộ bản Live Preview dùng font Times New Roman chuẩn văn bản hành chính; lý do mặc định để trống và hiển thị 4 dòng kẻ chấm nếu chưa nhập; bỏ bộ chọn đổi vai trò giả lập (cố định vai trò theo tài khoản, ô GVCN để trống cho sinh viên); tích hợp trực tiếp ô chữ ký người làm đơn ngay trong form (cho phép ký tay trực tiếp hoặc tải ảnh chữ ký tự động tách nền).
- Triển khai trang dành riêng cho phân quyền Giáo viên (`src/pages/TeacherDashboardPage.jsx`): giao diện Teacher Portal đồng bộ với mẫu thiết kế (banner chào mừng, 3 thẻ thống kê 8 đơn chờ xử lý - 45 đã xử lý - 3 đơn quá hạn, bảng Đơn cần xử lý), thanh tìm kiếm nhỏ gọn kèm theo bộ lọc chuyên sâu (Khóa học, Khoa, Ngành học, Lớp học, Trạng thái đơn), modal xem chi tiết & thực hiện ký duyệt đơn GVCN. Khóa học được thiết lập động từ K23 đến K26 và tự động cập nhật thêm 1 khóa/xóa khóa cũ vào ngày 1/8 hàng năm. Điều hướng phân quyền tự động theo role trong `src/App.jsx`.

## Đang làm
- Chuẩn bị gắn tiếp form cho các loại đơn khác (bảng điểm, miễn giảm học phí, phúc khảo...) và chuyển sang dùng React Router khi hoàn thiện hợp đồng services

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