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

## Điều cần nhớ
- (ghi dần)