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
- Sửa lỗi nhận diện vai trò tài khoản (`authService.js`): Khắc phục lỗi `QL001` bị nhận diện nhầm thành sinh viên và lỗi chuỗi email tên miền chứa `gv` (`caodangvietmyhanoi.edu.vn`) làm sai lệch phân quyền.
- Hoàn thiện luồng xử lý hành chính chuẩn thực tế nhà trường: Giảng viên ký duyệt xong không trả kết quả trực tiếp cho sinh viên ngay, mà chuyển trạng thái sang `teacher_approved` ("GV đã duyệt (Chờ Một cửa đóng dấu)") và tự động chuyển hồ sơ về Ban Tiếp nhận & Quản lý Một cửa.
- Triển khai phân hệ Tiếp nhận & Đóng dấu trên Admin Portal (`AdminDashboardPage.jsx`): Cán bộ Một cửa kiểm tra chữ ký GVCN, thực hiện đóng dấu số ban hành, ghi rõ địa điểm nhận bản cứng và phát thông báo trực tiếp qua Web đến sinh viên.
- Triển khai tính năng Thông báo trực tiếp (Web Notification) và Xem văn bản số hóa trên Sinh viên Portal (`StudentDashboardPage.jsx` & `OfficialDocumentView.jsx`): Chuông thông báo hiển thị số lượng tin chưa đọc, xem chi tiết địa điểm nhận kết quả, đồng thời cho phép xem và in bản A4 đầy đủ gồm Chữ ký sinh viên, Chữ ký GVCN và Con dấu số đỏ của Bộ phận Một cửa.
- Kết nối thành công API CMS chính thức của trường (`https://hanoi.vietmycollege.com/api/integrations/student-profile`): Xóa bỏ hoàn toàn tài khoản thử nghiệm và dữ liệu sinh viên giả lập (`24123456`, `SV00123`). Loại bỏ mục lưu trữ chữ ký trong tài khoản sinh viên (tránh nguy cơ đánh cắp/sử dụng lại chữ ký), chỉ cho phép ký trực tiếp khi làm đơn; giữ nguyên chức năng lưu chữ ký cho giảng viên để tiện duyệt đơn. Đồng bộ chính xác 100% thông tin sinh viên thật từ API CMS (Họ tên, ngày sinh, CCCD, mã sinh viên, lớp, khoa, ngành).
- Chuẩn hóa định dạng số CCCD (12 chữ số): Bổ sung hàm `formatCccd` tự động thêm số `0` ở đầu nếu dữ liệu trả về từ hệ thống CMS bị thiếu số 0 (do lưu kiểu số), đảm bảo hiển thị đúng chuẩn 12 chữ số Căn cước công dân trên toàn bộ hệ thống (Thông tin cá nhân, Form điền đơn, Văn bản in A4 và API).
- Khắc phục triệt để lỗi không mở được đơn trên toàn hệ thống:
  + Nâng cấp `StudentConfirmationForm` thành bộ render biểu mẫu chung nhận `requestType` động, cho phép sinh viên mở, điền lý do, ký điện tử, xem trước chuẩn A4 và nộp thành công toàn bộ 8 loại đơn hành chính (Xác nhận SV, Cấp bảng điểm, Miễn giảm học phí, Tạm hoãn thi, Bảo lưu, Phúc khảo, Ký túc xá, Vé xe buýt).
  + Chuẩn hóa bộ lọc `myRequests` của sinh viên: so khớp mã SV linh hoạt (hỗ trợ cả mã 8 số và mã đầy đủ 11 số có tiền tố 611), sửa lỗi danh sách đơn của sinh viên bị trống.
  + Luôn cho phép sinh viên mở xem toàn văn văn bản A4 tại mọi trạng thái (kể cả khi vừa nộp, đang chờ duyệt hay đã hoàn tất), bổ sung nút "Mở đơn (A4)" ngay tại bảng danh sách và trong modal chi tiết.
  + Bổ sung tính năng "Mở đơn" xem văn bản A4 chuẩn Times New Roman cho cả Giảng viên (`TeacherDashboardPage.jsx`) và Cán bộ Một cửa (`AdminDashboardPage.jsx`).
- Tích hợp mã QR Code vector SVG đối chiếu xác thực văn bản gốc và modal chứng thực điện tử hiển thị thông tin cấp trên `OfficialDocumentView.jsx` (không phát sinh thư viện ngoài).
- Tối ưu hóa layout in ấn chuẩn khổ A4 (@media print) cho tính năng in/lưu PDF trực tiếp từ trình duyệt, tự động ẩn giao diện web xung quanh.
- Bổ sung thanh tiến trình 4 chặng (`WorkflowTimeline`) trực quan trên cả Student Portal (`StudentDashboardPage.jsx`) và Admin Portal (`AdminDashboardPage.jsx`).
- Kiểm tra toàn diện 6 bảng cốt lõi trên Supabase (tất cả đều đã tồn tại và sẵn sàng hoạt động). Tạo file migration `supabase/migrations/20261120_seed_accounts_and_workflows.sql` cung cấp mã lệnh SQL tạo tài khoản & mật khẩu cho Quản trị viên (`QL001`) và Giảng viên (`GV001`, `GV002`) vào `auth.users` và `public.profiles`, đồng thời nạp seed data 8 loại đơn và quy trình 4 chặng. Chuẩn hóa `src/services/authService.js` map mã cán bộ sang email trước khi gọi Supabase Auth.
- Cập nhật định danh tài khoản Quản trị viên thành mã `admincdvmhn` (email: `admin@caodangvietmyhanoi.edu.vn`) và Giáo viên chủ nhiệm thành mã `gvcn` (email: `gvcn@caodangvietmyhanoi.edu.vn`), đồng bộ trên `authService.js`, các trang giao diện Dashboard và file migration Supabase.
- Sửa lỗi thiếu import gây sập màn hình trắng (blank screen) khi sinh viên tạo đơn mới hoặc xem đơn đã tạo: bổ sung import `useEffect` trong `StudentConfirmationForm.jsx` và import icon `Eye` trong `StudentDashboardPage.jsx`.
- Tích hợp hình nền động campus breeze toàn hệ thống (`CampusBackdrop.jsx`) và tính năng ghi nhớ đăng nhập trình duyệt (`vmh_saved_session`).
- Chuẩn hóa vai trò: Thay thế toàn bộ thuật ngữ "Một cửa" thành "Quản trị viên" / "Ban Quản trị" trên toàn bộ giao diện và services.
- Dọn dẹp dữ liệu khởi tạo trống sạch sẽ (`INITIAL_SHARED_REQUESTS = []`, `INITIAL_NOTIFICATIONS = []`) và nâng cấp storage key để reset dữ liệu mẫu cũ.
- Nâng cấp hệ thống thông báo thời gian thực (`real-time event`), thay thế chấm đỏ tĩnh bằng huy hiệu hiển thị số lượng tin nhắn/hồ sơ thực tế kèm popover thông báo chi tiết cho cả 3 vai trò (Sinh viên, Giảng viên, Quản trị viên).
- Tinh gọn bảng danh sách hồ sơ: gỡ bỏ cột "Mã đơn" (#2026-xxxx) trên các bảng của Sinh viên, Giảng viên và Quản trị viên, đưa "Loại đơn" lên vị trí nổi bật đầu bảng.
- Triển khai tính năng số hóa tự động biểu mẫu từ file Word (.docx) thuần JavaScript: xây dựng `docxParser.js` sử dụng Web API gốc (`DecompressionStream('deflate-raw')`, `DOMParser`) không cài thêm thư viện ngoài (tuân thủ Rule 3.6); tự động bóc tách tiêu đề đơn, phân loại danh mục, khớp đơn vị tiếp nhận (Kính gửi), tự động lọc bỏ trường thông tin cá nhân CMS và nhận diện chính xác các trường câu hỏi nhập liệu đặc thù; tích hợp bộ cấu hình trường động trong modal "Thêm đơn mới" của Admin và bộ render form động + Live Preview A4 chuẩn Times New Roman phía Sinh viên (`StudentConfirmationForm.jsx`, `OfficialDocumentView.jsx`).

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