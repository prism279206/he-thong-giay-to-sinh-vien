# RULES – Hệ thống làm thủ tục giấy tờ sinh viên

Website để sinh viên nộp và theo dõi thủ tục (giấy xác nhận sinh viên, đơn bảo lưu, đơn thi lại, đăng ký vé tháng, ký túc xá...). Cán bộ trường xử lý hồ sơ trên cùng hệ thống.

## 1. Đầu phiên và cuối phiên

**Đầu phiên (bắt buộc):**
1. Chạy `git pull`.
2. Đọc `docs/SPEC.md`, `docs/SPECLEARN.md`, `docs/STATE_a.md`, `docs/STATE_b.md`.
3. Tóm tắt ngắn: dự án đang ở đâu, việc kế tiếp của người đang làm là gì. Chờ xác nhận rồi mới code.

**Cuối phiên:**
1. Cập nhật STATE của người đang làm (chỉ file của mình).
2. Có quyết định mới hoặc lỗi đáng nhớ thì ghi vào `docs/SPECLEARN.md`.

## 2. Stack

- Frontend: ReactJS + Vite (JavaScript), React Router
- Backend: Supabase (Postgres, Auth, Storage, RLS, Edge Functions)
- Ngôn ngữ giao diện: tiếng Việt. Tên biến, hàm, file: tiếng Anh.
- Môi trường dev: Windows, Node.js LTS.

## 3. Quy tắc code

1. Chỉ dùng function component và hooks, không dùng class component.
2. Component không gọi Supabase trực tiếp. Mọi lời gọi Supabase nằm trong `src/services/`.
3. Đặt tên: component `PascalCase.jsx`, hook `useXxx.js`, service `xxxService.js`.
4. Mọi thao tác bất đồng bộ phải có trạng thái loading và xử lý lỗi, hiển thị thông báo lỗi dễ hiểu bằng tiếng Việt.
5. Không copy-paste form giữa các loại thủ tục. Dùng một bộ render form chung, dữ liệu cấu hình theo từng loại.
6. Không thêm thư viện mới khi chưa nêu lý do và được người còn lại đồng ý.
7. Không để code thừa, `console.log` gỡ lỗi hoặc đoạn bị comment trong bản commit.
8. Giao diện phải dùng được trên điện thoại.

## 4. Quy trình thủ tục là DỮ LIỆU (quan trọng nhất)

Mỗi loại thủ tục có đường đi riêng (online, chụp ảnh giấy ký, chuyển bên thứ ba, hẹn ngày lấy). Vì vậy:

1. **Không hard-code** chuỗi trạng thái hoặc đường đi của từng loại thủ tục trong code React. Quy trình khai báo trong database (`workflows`, `workflow_steps`) và code chỉ chạy theo đó.
2. **Chuyển bước chỉ qua MỘT hàm duy nhất** ở phía Supabase (Postgres function/RPC hoặc Edge Function). Hàm này kiểm tra quyền, đổi bước và ghi log trong cùng một transaction. Client KHÔNG được tự update `current_step_id` hay trạng thái.
3. Mọi lần chuyển bước phải ghi vào bảng log, log không được sửa hoặc xóa.
4. Phân biệt **trạng thái hiển thị cho sinh viên** (ít, dễ hiểu) và **bước nội bộ** (chi tiết). Không lộ bước nội bộ cho sinh viên.
5. Quy trình có version. Hồ sơ đang chạy giữ version cũ khi quy trình đổi.
6. Ngày hẹn lấy là "từ ngày X trở đi", lưu dạng `available_from`.
7. Bên thứ ba (xe buýt, ký túc xá): ở phiên bản đầu, cán bộ cập nhật tay. Không tích hợp API.
8. Thêm loại thủ tục mới phải làm được bằng cách thêm dữ liệu, không phải sửa engine.

## 5. Bảo mật (bắt buộc)

1. Bật RLS cho MỌI bảng. Không có bảng nào được để công khai ngoài ý muốn.
2. Sinh viên chỉ đọc và tạo hồ sơ của chính mình (`auth.uid()` khớp chủ hồ sơ).
3. Quyền duyệt, ký, chuyển bước thuộc về vai trò staff/admin, kiểm tra ở phía Supabase chứ không chỉ ẩn nút trên giao diện.
4. Client chỉ dùng `anon key`. Tuyệt đối không dùng hoặc để lộ `service_role` key trong code React.
5. Không commit `.env`. Chỉ commit `.env.example` (khóa để trống).
6. File upload: chỉ nhận pdf/jpg/png, giới hạn dung lượng, lưu bucket private, truy cập bằng signed URL.
7. Dữ liệu hồ sơ là thông tin cá nhân của sinh viên. Không in thông tin cá nhân ra log hoặc console.

## 6. Database và migration

1. Mọi thay đổi database viết thành file migration SQL trong `supabase/migrations/`, đặt tên theo thời gian, ví dụ `20261112_add_workflows.sql`. Không sửa tay trên dashboard rồi bỏ qua file.
2. Chỉ **người A** tạo và sửa migration. Người B cần đổi schema thì báo người A (qua issue hoặc tin nhắn).
3. Thay đổi schema có ảnh hưởng người kia phải ghi trong STATE.

## 7. Làm việc nhóm (2 người)

**Vùng sở hữu:**

| Người | Sở hữu |
|---|---|
| **A (nền tảng)** | `supabase/`, `src/services/`, `src/lib/`, xác thực |
| **B (giao diện)** | `src/pages/`, `src/components/` |

1. Không sửa file ngoài vùng của mình khi chưa báo người kia.
2. AI không được refactor, đổi tên hoặc xóa file ngoài phạm vi việc được yêu cầu.
3. Hai bên giao tiếp qua "hợp đồng" là danh sách hàm trong `src/services/` (tên, tham số, kết quả trả về), ghi trong `docs/SPEC.md`. Đổi hợp đồng phải báo người kia.
4. B có thể làm giao diện bằng dữ liệu giả (mock) khi service của A chưa xong.
5. Mỗi người chỉ sửa `docs/STATE_<tên>.md` của mình.

**Git:**
1. Làm việc và push thẳng lên `main`, không dùng nhánh phụ hay Pull Request.
2. Commit nhỏ, thường xuyên, mỗi commit một việc, thông điệp rõ ràng (`feat:`, `fix:`, `chore:`, `docs:`).
3. Trước khi bắt đầu làm: `git pull --rebase`. Trước khi push: `git pull --rebase` lần nữa, chạy `npm run dev` kiểm tra không lỗi rồi mới `git push`.
4. Không bao giờ dùng `git push --force`, `git reset --hard` hoặc xóa lịch sử khi chưa hỏi người dùng.
5. Chỉ commit file trong vùng của mình. Trước khi commit chạy `git status` và `git diff`, kiểm tra AI có sửa file ngoài phạm vi không.
6. Gặp xung đột (conflict): dừng lại, báo người dùng, không tự chọn bên nào.
7. Thay đổi trong `supabase/` (migration, RLS) và hợp đồng `services/`: nhắn người kia xem trước khi push.
8. Nên commit `package-lock.json`.

## 8. Cách AI làm việc

1. Việc lớn hoặc đụng tới schema, RLS, hàm chuyển bước: nêu kế hoạch ngắn trước và chờ đồng ý rồi mới sửa.
2. Chỉ làm đúng phạm vi được yêu cầu. Thấy việc khác cần sửa thì đề xuất, không tự làm.
3. Không chắc về yêu cầu nghiệp vụ (quy trình thực tế của trường) thì hỏi, không tự đoán.
4. Giải thích ngắn gọn bằng tiếng Việt. Người dùng đang học React, nên giải thích lý do khi dùng khái niệm mới.
5. Khi nhắc tới tính năng của công cụ hoặc thư viện có thể đã đổi, hãy kiểm tra tài liệu hiện hành thay vì tin vào trí nhớ.
6. Phần RLS và hàm chuyển bước ảnh hưởng bảo mật: luôn nhắc người dùng nhờ người thật đọc lại trước khi merge.