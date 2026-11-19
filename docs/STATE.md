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
- Triển khai trang Quản trị viên/Một cửa tiếp nhận & phân phối đơn (`src/pages/AdminDashboardPage.jsx`): đồng bộ 100% phong cách thiết kế với Teacher & Student Portal (sidebar trái, header nhỏ gọn kèm tìm kiếm, chuông thông báo & avatar tròn, banner chào mừng minh họa SVG, 3 thẻ thống kê 8 - 45 - 3, bảng đơn cần xử lý kèm thanh 5 bộ lọc thả xuống Khóa học - Khoa - Ngành - Lớp - Trạng thái); hỗ trợ đầy đủ quy trình tiếp nhận đơn từ sinh viên, phân phát tới GVCN hoặc các Phòng ban liên quan, đổi luồng, thu hồi điều phối, từ chối đơn sai quy cách; cấu hình tài khoản Quản lý đăng nhập bằng mã `QL001` (hoặc email `ql001@caodangvietmyhanoi.edu.vn`), mật khẩu `123456` và bổ sung thanh chọn nhanh tài khoản test trong `LoginPage.jsx`.
- Triển khai mục "Các loại đơn đang có" thay thế cho phần chữ ký cá nhân trong Admin Portal (`src/pages/AdminDashboardPage.jsx`): quản lý danh mục tất cả biểu mẫu/loại thủ tục hiện hành của trường; hỗ trợ tính năng "Thêm đơn mới" bằng cách chụp ảnh trực tiếp từ camera hoặc tải file mẫu (PDF/ảnh) lên; hệ thống tự động số hóa và đính kèm file mẫu vào hồ sơ loại đơn, cho phép xem trước mẫu đơn và bật/tắt trạng thái tiếp nhận.
- Sửa lỗi cập nhật và xem trước file mẫu đơn trong Admin Portal: phục hồi các import icon bị thiếu (`Layers`, `Camera`, `Upload`, `Plus`, `FileUp`, `Sparkles`, `Eye`, `Download`), đồng bộ lưu trữ loại đơn và danh sách đơn vào `localStorage` (`mockRequestsStore.js` & `vmh_request_types_store_v2`) tránh bị mất dữ liệu khi reload trang; nâng cấp modal xem trước hỗ trợ mượt mà cả file ảnh và file PDF (qua iframe), đồng thời hiển thị văn bản hành chính mô phỏng chuẩn Quốc hiệu - Tiêu ngữ bằng `OfficialDocumentView` cho các đơn mặc định chưa có file đính kèm.
- Kiểm thử toàn diện tính năng thêm đơn mới trên trang Quản lý: Chạy thành công 5/5 kịch bản kiểm thử (tải file PDF, chụp ảnh camera, lưu trữ localStorage, tìm kiếm/bộ lọc, xem trước đa định dạng), đồng bộ danh mục loại đơn mới sang cả màn hình '+ Tạo đơn mới' của Sinh viên (`RequestTypePicker.jsx`).
- Khởi tạo 6 bảng cơ sở dữ liệu cốt lõi trên Supabase (`profiles`, `request_types`, `workflows`, `workflow_steps`, `requests`, `request_step_logs`) theo định dạng tiếng Việt không dấu khớp với API trường; lưu file migration `supabase/migrations/20261118_create_core_tables.sql` và khởi tạo kết nối client `src/lib/supabase.js`.
- Xây dựng tầng Service hoàn chỉnh kết nối CMS trường và Supabase: `cmsService.js` (đặc tả chuẩn API trường, hàm đối chiếu chéo tên và dãy số trong email, chế độ mock fallback thông minh), `authService.js` (xác thực Supabase Auth hỗ trợ đăng nhập cả bằng MSSV và Email, tự động phân quyền), `requestService.js` (gửi và duyệt đơn trực tiếp trên Supabase); cập nhật `LoginPage.jsx` tích hợp modal hướng dẫn cấp lại mật khẩu và nút test nhanh sinh viên Tiến (mã `61112420189`).
- Khắc phục triệt để lỗi đăng nhập bằng email sinh viên (`tien12420189@...`): hoàn thiện cơ chế tra cứu `findMockStudent` và chuẩn hóa hàm trích xuất hậu tố mã `extractStudentCodeSuffix` (chỉ bỏ tiền tố 611 với mã 11 số, không cắt tiếp nếu đã là đuôi 8 số), đối chiếu chính xác tên sinh viên "Tiến" ("tien") với hồ sơ CMS, đồng thời bổ sung nút chọn nhanh "SV Tiến (Email)" trên giao diện đăng nhập.
- Siết chặt toàn diện logic đăng nhập trong `authService.js` và `cmsService.js`: loại bỏ hoàn toàn cơ chế tự sinh sinh viên ảo khi gõ chuỗi bất kỳ; bổ sung hàm kiểm tra định dạng nghiêm ngặt `parseLoginIdentifier` (chặn chuỗi chữ-số thiếu đuôi trường như `huy12420`, chặn email ngoài trường, chỉ chấp nhận mã số sinh viên hoặc mã cán bộ/giảng viên hợp lệ); bắt buộc phải có hồ sơ thực tế trong CMS mới cho phép đăng nhập.

## Đang làm
- Chạy Seed data mẫu đơn Xác nhận HSSV trên Supabase; chuẩn bị gắn tiếp form cho các loại đơn khác (bảng điểm, miễn giảm học phí, phúc khảo...) và chuyển sang dùng React Router khi hoàn thiện hợp đồng services.

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