# SPECLEARN – Quyết định và bài học

## Quyết định đã chốt
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-11-12 | Quy trình lưu trong database, không hard-code | Mỗi thủ tục có đường đi riêng |
| 2026-11-12 | Dùng AGENTS.md ở thư mục gốc làm Rules | Antigravity tự nạp |
| 2026-11-19 | Commit luôn viết bằng tiếng Anh, chỉ push khi có lệnh người dùng | Quy ước chuẩn của dự án và kiểm soát bảo mật |
| 2026-11-23 | Tuyệt đối không tự ý commit; chỉ commit khi người dùng cho phép và phải xác nhận danh sách file + message trước | Người dùng kiểm soát lịch sử Git và tính toàn vẹn mã nguồn |
| 2026-11-24 | Sinh viên chỉ xác thực qua CMS API trường, không lưu tài khoản sinh viên vào Supabase | Trường có hàng nghìn sinh viên biến động liên tục; Supabase Auth và profiles chỉ quản lý Cán bộ & Giảng viên để duyệt và quản trị |
| 2026-11-24 | Xóa đơn completed sau 3 tháng và cho phép sinh viên hủy đơn lập tức | Giảm tải database, bảo vệ quyền riêng tư và dọn dẹp đơn không còn nhu cầu |
| 2026-11-24 | Chuẩn hóa 4 đơn vị nhân sự tiếp nhận & xử lý hồ sơ | 1. Phòng Đào tạo, 2. Phòng Công tác sinh viên, 3. Phòng Khảo thí, 4. Giảng viên - GVCN |
| 2026-11-24 | Thêm tài khoản Giảng viên thầy Đàm Văn Luận (luan.dam1@caodangvietmyhanoi.edu.vn) | Cung cấp tài khoản Giảng viên / GVCN phê duyệt đơn, tự động xuất hiện trong nhóm Giảng viên điều phối của Quản trị viên |
| 2026-11-24 | Nâng cấp hệ thống phân phát đơn hỗ trợ chọn nhiều người ký (tối đa 10 người) | Nhiều loại đơn hành chính yêu cầu từ 2 đến 5 người ký xác nhận (GVCN, Khảo thí, Đào tạo, Ban Giám hiệu...); hỗ trợ chọn tối đa 10 người ký, phân luồng từng người ký theo slot riêng và hiển thị đầy đủ trên văn bản in A4 |
| 2026-11-24 | Phân quyền hiển thị đơn nghiêm ngặt trên Teacher Portal | Chỉ cán bộ/giảng viên được phân công (`assignedSigners` hoặc `assignedTo`) mới nhìn thấy hồ sơ, các tài khoản khác thấy 0 đơn |
| 2026-11-24 | Bóc tách và render động biểu mẫu theo `cmsFields` và `isTranscriptType` | Tránh ép layout cứng đơn xác nhận HSSV lên các biểu mẫu Word khác; chuẩn hóa Unicode NFD/NFC để không bao giờ nhận diện sai |


## Lỗi đã gặp
| Vấn đề | Nguyên nhân | Cách sửa |
|---|---|---|
| `npm run dev` báo Cannot find native binding | Node cũ (20.18) và npm lỗi cài gói tùy chọn | Cập nhật Node LTS, xóa node_modules và package-lock.json rồi cài lại |
| PowerShell chặn npm.ps1 | Execution policy của Windows | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Đăng nhập email báo tên không khớp hồ sơ ("0189") | `getStudentProfile` chỉ tra cứu mã 11 số nên không tìm thấy đuôi 8 số, fallback sinh "Sinh viên 0189" | Thêm `findMockStudent` tra cứu cả mã 11 số và đuôi 8 số; chuẩn hóa `extractStudentCodeSuffix` tránh cắt số 2 lần |
| Gõ tài khoản bất kỳ (như `huy12420`, `abc`) vẫn đăng nhập được | `parseLoginIdentifier` coi chuỗi không có @ là mã sinh viên, và mock provider tự tạo sinh viên ảo cho mọi mã | Xóa bỏ hoàn toàn code sinh mock ảo trong `cmsService.js`, thêm kiểm tra định dạng nghiêm ngặt trong `authService.js` |
| Tên miền email chứa chuỗi con 'gv' làm sai role | Chuỗi `caodangvietmyhanoi.edu.vn` chứa 'gv' (`caodan[gv]ietmy...`), `targetEmail.includes('gv')` nhận diện nhầm tất cả SV thành GV | Chỉ kiểm tra phần username trước ký tự `@` (`usernamePrefix.startsWith('gv')` hoặc `startsWith('ql')`) |
| Mã đăng nhập QL001 bị nhận diện thành sinh viên | Hàm phân tích `parseLoginIdentifier` kiểm tra `@`, nếu không có `@` mặc định gán `student_code` | Thêm điều kiện kiểm tra tiền tố `ql` hoặc `admin` trước khi mặc định là sinh viên |
| GV ký xong trả thẳng cho SV sai nghiệp vụ | Giảng viên chỉ phê duyệt chuyên môn, thẩm quyền đóng dấu và ban hành thuộc Bộ phận Một cửa | Thiết lập trạng thái trung gian `teacher_approved`, chuyển hồ sơ về Một cửa kiểm tra, ký đóng dấu và gửi thông báo địa điểm nhận kết quả cho SV |
| Đơn bóc tách bị thừa trường 'Em tên là' và mục 'Nội dung chi tiết của đơn' | Biến thể nhãn 'Em tên là' chưa khớp regex fullName, và parser tự động ép 'Lý do' vào customFields; bản in A4 tự chèn tiêu đề gạch chân | Nhận diện 'Em tên là', 'Giới tính', 'Nơi cấp' vào CMS; ánh xạ lý do vào trường reason chuẩn; gỡ bỏ tiêu đề 'Nội dung chi tiết của đơn' trên bản in A4 để giữ nguyên vẹn 100% bản gốc |
| Lệnh DELETE requests trả về 204 nhưng không xóa dòng nào trong database | Bảng requests bật RLS nhưng thiếu policy DELETE cho client/anon | Bổ sung `requests_delete_policy` cho phép DELETE trong migration SQL |
| Supabase Auth báo lỗi 500: Database error querying schema | Cột token (`confirmation_token`, `recovery_token`) trong bảng `auth.users` bị NULL | Chạy SQL cập nhật COALESCE(token, '') để GoTrue parse chuỗi rỗng thay vì NULL |
| Đăng nhập tài khoản admin hoặc giảng viên bị gán nhầm quyền sinh viên | Bảng profiles trên database rỗng khiến authService fallback mặc định role: 'student' | Tự động nhận diện chuẩn xác role 'admin' và 'staff' theo email/mã tài khoản kể cả khi bảng profiles chưa nạp |
| Thông báo lỗi đăng nhập để lộ mật khẩu mặc định hoặc phân biệt tài khoản tồn tại | authService trả về chi tiết mật khẩu mặc định 123456 hoặc thông báo không tìm thấy mã SV | Chuẩn hóa thông báo duy nhất "Tài khoản hoặc mật khẩu không chính xác." cho mọi trường hợp theo chuẩn bảo mật |
| Sinh viên nộp đơn bị nhân đôi (x2 lá đơn cùng lúc) | `StudentConfirmationForm.jsx` gọi đồng thời cả `addStudentRequest` và `submitRequest` (bên trong cũng gọi tiếp `addMockRequest`) | Xóa lời gọi thừa trong form, thêm cờ khóa `isSubmitting` và cơ chế khử trùng lặp theo ID trong `mockRequestsStore.js` |
| Danh sách Giảng viên và Phòng ban điều phối bị hard-code tĩnh | `AdminDashboardPage.jsx` dùng mảng tĩnh `LECTURERS` chứa tên các giảng viên mẫu cũ | Tạo hàm `listLecturersFromDatabase` trong `authService.js` lấy trực tiếp từ bảng `profiles` và chuẩn hóa 4 phòng ban |
| Bản in văn bản A4 bị dính chữ 'Đăng nhập hệ thống', ngày giờ, localhost URL và số trang | Do thuộc tính lề mặc định của `@page` kích hoạt Header/Footer của trình duyệt và `index.html` chứa title 'Đăng nhập hệ thống' | Đặt `@page { margin: 0mm !important }`, căn lề hành chính bằng padding nội bộ và dùng `triggerPrintClean` tạm thời xóa rỗng document.title trước khi `window.print()` |
| Supabase chặn xóa dòng trong `request_types` bằng Table Editor | Bảng `workflows`, `workflow_steps` và `requests` chứa khóa ngoại liên kết tới `request_types(id)` | Chạy lệnh `TRUNCATE TABLE ... CASCADE` trong Supabase SQL Editor để xóa sạch triệt để trong 1 giây; cập nhật `ON DELETE CASCADE` cho khóa ngoại |
| Lịch sử xử lý đơn dùng dữ liệu ảo và đơn mới không hiện trên database | `createRequest` gửi cột thừa (`lop`, `khoa`) làm lỗi insert Supabase; `listStaffRequests` có điều kiện `data.length > 0` nên khi DB rỗng lại fallback lấy mock cache cũ | Chuẩn hóa payload lưu đơn vào `requests`, kết nối trực tiếp `listStaffRequests` với Supabase Realtime, tự động dọn sạch cache localStorage cũ |
| Tab Lịch sử của Giảng viên hiển thị 2 dòng đơn ảo (#2025-1038, #2025-1030) | Giao diện Tab Lịch sử trong `TeacherDashboardPage.jsx` trước đó viết mã tĩnh (hardcoded mockup) | Thay thế hoàn toàn bằng danh sách động kết nối Supabase, hiển thị đúng các đơn đã xử lý thật hoặc trạng thái rỗng khi chưa có đơn |
| Đơn cấp bảng điểm hiển thị sai layout (ép layout đơn xác nhận HSSV) | `OfficialDocumentView` và `StudentConfirmationForm` trước đó hardcode cố định layout theo Đơn xác nhận HSSV cho mọi loại đơn | Nâng cấp bộ render biểu mẫu và văn bản A4 hỗ trợ cấu hình động theo loại đơn (nhận diện form bảng điểm), giữ nguyên 100% bố cục gốc, đúng 7 trường thông tin, các tùy chọn toàn khóa/năm học/học kỳ và đủ 3 vị trí chữ ký |
| Đẩy file Word lên hệ thống bị sai layout và hiện CCCD, Cơ sở học tập | Text XML trong file Word sử dụng Unicode tổ hợp (NFD) khiến regex `/bảng điểm/i` trả về false; `formType` bị lưu thành `standard` và form ép các trường CCCD/Cơ sở học tập | Viết hàm `isTranscriptType` chuẩn hóa NFD/NFC, tự động gán đúng 7 trường CMS của đơn bảng điểm khi parse Word; đồng thời cấu hình render trường động theo `cmsFields` cho mọi mẫu đơn mới |

## Điều cần nhớ
- (ghi dần)