# SPEC – Hệ thống làm thủ tục giấy tờ sinh viên

> Tài liệu mô tả hệ thống PHẢI LÀM GÌ. Quy tắc code xem `AGENTS.md`. Quyết định và lỗi đã gặp xem `docs/SPECLEARN.md`.
> Mục có đánh dấu **[Cần xác nhận]** là giả định, phải đối chiếu với quy trình thật của trường trước khi code.

## 1. Mục tiêu

Sinh viên nộp và theo dõi thủ tục online thay vì chạy tới phòng ban. Cán bộ trường xử lý hồ sơ trên cùng hệ thống. Hệ thống phải hỗ trợ được các cách làm khác nhau của từng loại thủ tục.

## 2. Vai trò

| Vai trò | Quyền chính |
|---|---|
| `student` | Tạo và nộp hồ sơ, xem trạng thái, bổ sung khi được yêu cầu, hủy khi chưa xử lý, xem lịch hẹn lấy |
| `staff` | Xem hàng đợi hồ sơ được giao, duyệt, từ chối, yêu cầu bổ sung, chuyển bên thứ ba, hẹn ngày lấy |
| `admin` | Quyền như staff, thêm quản lý loại thủ tục, quy trình và người dùng |

Mỗi tài khoản có đúng một vai trò. Vai trò lưu trong bảng `profiles`.

## 3. Nguyên tắc thiết kế: quy trình là dữ liệu

Mỗi loại thủ tục có một quy trình riêng gồm nhiều bước. Quy trình khai báo trong database, code chỉ chạy theo đó.

> Ví dụ so sánh: nhà ga chỉ có một (code), còn mỗi tuyến tàu (thủ tục) có danh sách ga dừng riêng (workflow trong database). Hồ sơ là đoàn tàu đang chạy.

### 3.1 Ba trục phân loại thủ tục

| Trục | Giá trị |
|---|---|
| Cách nộp | Điền form online / làm giấy trực tiếp rồi chụp ảnh tải lên |
| Ai xử lý | Chỉ nội bộ trường / có chuyển bên thứ ba |
| Cách trả kết quả | Hẹn ngày đến lấy / tải file / bên thứ ba liên hệ sinh viên / không có kết quả |

### 3.2 Các loại bước (`step_type`)

| Loại bước | Ai làm | Mô tả |
|---|---|---|
| `STUDENT_FORM` | Sinh viên | Điền form online |
| `STUDENT_UPLOAD` | Sinh viên | Chụp ảnh giấy đã ký hoặc minh chứng, tải lên |
| `STAFF_REVIEW` | Cán bộ | Kiểm tra, có thể duyệt, từ chối hoặc yêu cầu bổ sung |
| `STAFF_SIGN` | Cán bộ / lãnh đạo | Ký, phê duyệt |
| `EXTERNAL_FORWARD` | Cán bộ | Gửi hồ sơ cho bên thứ ba, ghi mã tham chiếu |
| `EXTERNAL_WAIT` | Bên thứ ba | Chờ phản hồi, cán bộ cập nhật tay |
| `SCHEDULE_PICKUP` | Cán bộ | Chọn ngày hẹn, hệ thống thông báo cho sinh viên |
| `DONE` | Hệ thống | Kết thúc hồ sơ |

### 3.3 Hành động (`action`) khi xử lý một bước

| Action | Ai dùng | Hiệu ứng |
|---|---|---|
| `submit` | student | Nộp hồ sơ, sang bước kế tiếp |
| `approve` | staff | Sang bước `next_on_approve` |
| `reject` | staff | Sang bước `next_on_reject` (thường là kết thúc, từ chối) |
| `request_more` | staff | Trả về bước `next_on_return` (thường là `STUDENT_UPLOAD` hoặc `STUDENT_FORM`), kèm ghi chú |
| `resubmit` | student | Nộp lại sau khi bổ sung |
| `forward` | staff | Ghi thông tin bên thứ ba, sang bước chờ |
| `external_update` | staff | Cập nhật kết quả từ bên thứ ba |
| `schedule_pickup` | staff | Lưu ngày hẹn, gửi thông báo |
| `complete` | staff / system | Kết thúc hồ sơ |
| `cancel` | student | Hủy, chỉ khi hồ sơ chưa vào bước xử lý của cán bộ |

### 3.4 Ví dụ quy trình ban đầu [Cần xác nhận]

| Thủ tục | Tuyến |
|---|---|
| Giấy xác nhận sinh viên | `STUDENT_FORM` → `STAFF_REVIEW` → `SCHEDULE_PICKUP` → `DONE` |
| Đơn xin bảo lưu (làm giấy) | `STUDENT_UPLOAD` → `STAFF_REVIEW` → `STAFF_SIGN` → `SCHEDULE_PICKUP` → `DONE` |
| Đơn xin thi lại | `STUDENT_FORM` → `STAFF_REVIEW` → `STAFF_SIGN` → `DONE` |
| Đăng ký vé tháng (bên thứ ba) | `STUDENT_FORM` → `STAFF_REVIEW` → `EXTERNAL_FORWARD` → `EXTERNAL_WAIT` → `SCHEDULE_PICKUP` → `DONE` |
| Đăng ký ký túc xá (bên thứ ba) | Tương tự vé tháng, có thể thêm `STUDENT_UPLOAD` ảnh giấy tờ |

Các tuyến trên chỉ là điểm xuất phát. Quy trình thật phải lấy từ phòng ban liên quan (xem mục 12).

## 4. Trạng thái hiển thị cho sinh viên

Sinh viên chỉ thấy các trạng thái đơn giản, mỗi bước (`workflow_steps.student_status`) ánh xạ tới một trạng thái. Bước nội bộ không lộ ra.

| Mã | Hiển thị | Ý nghĩa |
|---|---|---|
| `draft` | Bản nháp | Chưa nộp |
| `submitted` | Đã nộp | Đã gửi, chờ tiếp nhận |
| `processing` | Đang xử lý | Đang ở các bước của cán bộ hoặc bên thứ ba |
| `need_more_info` | Cần bổ sung | Cán bộ trả về, sinh viên phải làm thêm |
| `ready_for_pickup` | Sẵn sàng nhận | Đã có ngày hẹn, từ ngày đó trở đi được lấy |
| `completed` | Hoàn tất | Kết thúc |
| `rejected` | Bị từ chối | Kèm lý do |
| `cancelled` | Đã hủy | Sinh viên tự hủy |

## 5. Mô hình dữ liệu (Supabase / PostgreSQL)

Tất cả bảng bật RLS. Id dùng `uuid`, thời gian dùng `timestamptz`.

| Bảng | Cột chính |
|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name`, `student_code`, `class_name`, `phone`, `role` |
| `request_types` | `id`, `code`, `name`, `description`, `form_schema` (jsonb), `is_active` |
| `workflows` | `id`, `request_type_id`, `version`, `is_active` |
| `workflow_steps` | `id`, `workflow_id`, `step_order`, `step_type`, `name`, `assignee_role`, `student_status`, `next_on_approve`, `next_on_reject`, `next_on_return`, `notify_template`, `sla_days` |
| `requests` | `id`, `student_id`, `request_type_id`, `workflow_id`, `current_step_id`, `student_status`, `data` (jsonb), `submitted_at`, `closed_at`, `created_at`, `updated_at` |
| `request_files` | `id`, `request_id`, `step_id`, `storage_path`, `file_name`, `kind`, `uploaded_by`, `created_at` |
| `request_step_log` | `id`, `request_id`, `step_id`, `actor_id`, `action`, `note`, `created_at` (**chỉ thêm, không sửa hoặc xóa**) |
| `pickups` | `request_id`, `available_from`, `location`, `note` |
| `external_dispatches` | `id`, `request_id`, `partner`, `sent_at`, `external_ref`, `external_status`, `note` |
| `notifications` | `id`, `user_id`, `request_id`, `title`, `body`, `is_read`, `created_at` |

Ghi chú:
- `form_schema` mô tả các trường của form (tên, nhãn, kiểu, bắt buộc, lựa chọn). Giao diện render form từ đây.
- `requests.data` chứa câu trả lời form của sinh viên, cấu trúc theo `form_schema`.
- `workflows.version` tăng khi đổi quy trình. Hồ sơ đang chạy giữ `workflow_id` cũ.

## 6. Hàm xử lý bước (phía Supabase)

Chỉ có **một** hàm được phép đổi bước hồ sơ, ví dụ RPC `perform_step_action(request_id, action, payload)`. Hàm này, trong cùng một transaction:

1. Xác định người gọi (`auth.uid()`) và vai trò.
2. Kiểm tra hồ sơ đang ở bước nào và người gọi có quyền làm `action` ở bước đó không.
3. Tìm bước kế tiếp theo `action` (`next_on_approve`, `next_on_reject` hoặc `next_on_return`).
4. Cập nhật `current_step_id` và `student_status` của hồ sơ.
5. Ghi một dòng vào `request_step_log`.
6. Với `schedule_pickup`: ghi `pickups`. Với `forward`: ghi `external_dispatches`.
7. Tạo dòng `notifications` theo `notify_template` của bước.

Client không được tự cập nhật `current_step_id`, `student_status` hoặc các bảng log, pickup, dispatch. RLS phải chặn những thao tác này.

## 7. Hợp đồng giữa người A và người B

Người A viết các hàm trong `src/services/`, người B gọi chúng từ giao diện. Mọi hàm trả về dạng `{ data, error }`. Tên và tham số dưới đây là hợp đồng, đổi phải báo người còn lại.

| Service | Hàm | Mô tả |
|---|---|---|
| `authService` | `signIn(email, password)`, `signOut()`, `getCurrentProfile()` | Đăng nhập, lấy vai trò |
| `requestTypeService` | `listActive()`, `getFormSchema(typeId)` | Danh sách thủ tục và cấu trúc form |
| `requestService` | `createDraft(typeId, data)`, `updateDraft(id, data)` | Tạo và lưu nháp |
| | `submit(id)` | Nộp hồ sơ (gọi hàm xử lý bước) |
| | `resubmit(id, data)` | Nộp lại sau khi bổ sung |
| | `cancel(id)` | Hủy hồ sơ |
| | `listMine(filters)`, `getDetail(id)` | Danh sách và chi tiết hồ sơ của sinh viên |
| | `uploadFile(requestId, stepId, file, kind)`, `getFileUrl(path)` | Tải lên và lấy link xem file |
| `staffService` | `listQueue(filters)` | Hàng đợi, lọc theo loại, bước, trạng thái |
| | `getRequestForStaff(id)` | Chi tiết, lịch sử, file |
| | `performAction(requestId, action, payload)` | Duyệt, từ chối, yêu cầu bổ sung, chuyển bên thứ ba, hẹn ngày lấy |
| `notificationService` | `listMine()`, `markRead(id)` | Thông báo trong ứng dụng |
| `adminService` | `listUsers()`, `setUserRole(userId, role)`, `manageRequestTypes(...)` | Quản trị (giai đoạn sau) |

`payload` của `performAction` theo từng action, ví dụ `request_more`: `{ note }`, `schedule_pickup`: `{ available_from, location, note }`, `forward`: `{ partner, external_ref, note }`.

## 8. Màn hình

**Sinh viên**

| Màn hình | Nội dung |
|---|---|
| Đăng nhập | Email và mật khẩu |
| Trang chủ | Hồ sơ đang xử lý, thông báo mới, nút tạo hồ sơ |
| Chọn thủ tục | Danh sách loại thủ tục đang mở |
| Form nộp hồ sơ | Form render từ `form_schema`, tải file nếu cần, lưu nháp |
| Danh sách hồ sơ | Lọc theo trạng thái |
| Chi tiết hồ sơ | Trạng thái, tiến trình, ghi chú cán bộ, nút bổ sung hoặc hủy, ngày hẹn lấy |
| Thông báo | Danh sách thông báo |

**Cán bộ**

| Màn hình | Nội dung |
|---|---|
| Hàng đợi | Lọc theo loại thủ tục, bước, trạng thái, sắp xếp theo thời gian chờ |
| Chi tiết xử lý | Xem dữ liệu, file, lịch sử. Các nút hành động tùy theo bước hiện tại |
| Hẹn ngày lấy | Chọn ngày, địa điểm, ghi chú |
| Theo dõi bên thứ ba | Hồ sơ đã chuyển, mã tham chiếu, trạng thái |

**Quản trị (giai đoạn sau):** quản lý người dùng, loại thủ tục, quy trình.

## 9. Thông báo

- Mỗi bước có thể gắn mẫu thông báo (`notify_template`).
- Giai đoạn đầu chỉ có thông báo trong ứng dụng. Email là việc làm sau.
- Các thời điểm bắt buộc có thông báo cho sinh viên: hồ sơ được tiếp nhận, cần bổ sung, bị từ chối, sẵn sàng nhận (kèm ngày hẹn), hoàn tất.
- Hồ sơ nằm quá `sla_days` ở một bước thì cán bộ thấy cảnh báo trong hàng đợi.

## 10. Yêu cầu phi chức năng

| Yêu cầu | Nội dung |
|---|---|
| Bảo mật | RLS mọi bảng, sinh viên chỉ thấy hồ sơ của mình, quyền cán bộ kiểm tra ở phía Supabase |
| File | pdf, jpg, png, giới hạn dung lượng **[Cần xác nhận mức giới hạn]**, bucket private, dùng signed URL |
| Truy vết | Mọi lần đổi bước đều có log bất biến |
| Giao diện | Dùng được trên điện thoại |
| Ngôn ngữ | Giao diện tiếng Việt |
| Dữ liệu cá nhân | Không in thông tin sinh viên ra log |

## 11. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| 1. Nền tảng | Đăng nhập, phân vai trò, schema, RLS, hàm `perform_step_action` |
| 2. Tuyến đơn giản | Thủ tục đầu tiên (giấy xác nhận): form → duyệt → hẹn ngày lấy |
| 3. Tuyến upload và ký | Đơn bảo lưu: tải ảnh, bổ sung, ký |
| 4. Tuyến bên thứ ba | Vé tháng, ký túc xá: chuyển đi, chờ phản hồi |
| 5. Hoàn thiện | Thông báo, cảnh báo SLA, trang quản trị, email |

Mỗi giai đoạn phải chạy được trọn vẹn trước khi sang giai đoạn sau.

## 12. Việc cần xác nhận với trường trước khi code

Ngồi với cán bộ phòng ban liên quan, điền bảng sau cho từng thủ tục:

| Thủ tục | Ai tiếp nhận đầu tiên | Ai ký | Có bên thứ ba không | Kết quả trả thế nào | Thời gian xử lý | Hay bị trả lại vì lý do gì |
|---|---|---|---|---|---|---|

Các câu hỏi mở:
- Cán bộ tiếp nhận có phân theo khoa hoặc lớp không, hay một hàng đợi chung?
- Mỗi thủ tục có bao nhiêu cấp ký, và có ký thay được không?
- Sinh viên có được sửa hồ sơ sau khi nộp, và đến lúc nào?
- Thủ tục cần giấy gốc: sinh viên nộp bản giấy ở đâu, khi nào?
- Có thủ tục nào thu phí không? (Thanh toán online nằm ngoài phạm vi phiên bản đầu.)

## 13. Ngoài phạm vi (phiên bản đầu)

- Thanh toán online
- Chữ ký số
- Tích hợp API với bên thứ ba (xe buýt, ký túc xá): cán bộ cập nhật tay
- Tích hợp với cổng sinh viên hiện có
- Ứng dụng di động riêng