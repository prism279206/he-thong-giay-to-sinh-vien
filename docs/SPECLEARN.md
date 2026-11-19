# SPECLEARN – Quyết định và bài học

## Quyết định đã chốt
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-11-12 | Quy trình lưu trong database, không hard-code | Mỗi thủ tục có đường đi riêng |
| 2026-11-12 | Dùng AGENTS.md ở thư mục gốc làm Rules | Antigravity tự nạp |

## Lỗi đã gặp
| Vấn đề | Nguyên nhân | Cách sửa |
|---|---|---|
| `npm run dev` báo Cannot find native binding | Node cũ (20.18) và npm lỗi cài gói tùy chọn | Cập nhật Node LTS, xóa node_modules và package-lock.json rồi cài lại |
| PowerShell chặn npm.ps1 | Execution policy của Windows | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Đăng nhập email báo tên không khớp hồ sơ ("0189") | `getStudentProfile` chỉ tra cứu mã 11 số nên không tìm thấy đuôi 8 số, fallback sinh "Sinh viên 0189" | Thêm `findMockStudent` tra cứu cả mã 11 số và đuôi 8 số; chuẩn hóa `extractStudentCodeSuffix` tránh cắt số 2 lần |

## Điều cần nhớ
- (ghi dần)