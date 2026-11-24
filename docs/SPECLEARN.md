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

## Điều cần nhớ
- (ghi dần)