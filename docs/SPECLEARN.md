# SPECLEARN – Quyết định và bài học

## Quyết định đã chốt
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-11-12 | Quy trình lưu trong database, không hard-code | Mỗi thủ tục có đường đi riêng |
| 2026-11-12 | Dùng AGENTS.md ở thư mục gốc làm Rules | Antigravity tự nạp |
| 2026-11-19 | Commit luôn viết bằng tiếng Anh, chỉ push khi có lệnh người dùng | Quy ước chuẩn của dự án và kiểm soát bảo mật |

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

## Điều cần nhớ
- (ghi dần)