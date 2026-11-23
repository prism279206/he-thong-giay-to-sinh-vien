// Khóa học tính động theo quy tắc ngày 1/8 hàng năm
function getActiveCohorts(date = new Date()) {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const hasPassedAugustFirst = currentMonth > 7 || (currentMonth === 7 && currentDay >= 1);
  const intakeYear = hasPassedAugustFirst ? currentYear : currentYear - 1;
  const latestCohortNum = intakeYear % 100;

  return [
    `K${latestCohortNum - 3}`,
    `K${latestCohortNum - 2}`,
    `K${latestCohortNum - 1}`,
    `K${latestCohortNum}`,
  ];
}

const ACTIVE_COHORTS = getActiveCohorts();

// Mẫu chữ ký trong suốt mặc định cho dữ liệu mẫu (SVG Data URL)
export const DEFAULT_MOCK_SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><path d="M20,50 Q45,15 70,45 T120,35 Q145,20 170,55 M50,45 Q75,70 110,30 T160,50" fill="none" stroke="%231D4ED8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const DEFAULT_TEACHER_SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" width="220" height="80"><path d="M25,48 Q55,20 85,42 T135,28 Q165,15 195,50 M60,42 Q90,65 125,25 T175,45" fill="none" stroke="%237C3AED" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="65" y="72" font-family="sans-serif" font-size="11" font-weight="bold" fill="%236D28D9">Nguyễn Thị Mai</text></svg>';

const STORAGE_KEY = 'vmh_shared_requests_v6';

// Dữ liệu đơn khởi tạo dùng chung giữa Sinh viên -> Quản trị (Quản trị viên) -> Giảng viên
// Mặc định khởi tạo trống trơn (không chứa đơn mẫu cũ), đơn mới do sinh viên nộp hoặc lưu từ DB
export const INITIAL_SHARED_REQUESTS = [];

/**
 * Lấy danh sách đơn từ localStorage (nếu chưa có thì lấy từ danh sách mặc định)
 */
export function getStoredRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHARED_REQUESTS));
      return INITIAL_SHARED_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SHARED_REQUESTS;
  } catch {
    return INITIAL_SHARED_REQUESTS;
  }
}

/**
 * Lưu danh sách đơn vào localStorage
 */
export function saveStoredRequests(requests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_requests_updated'));
    }
  } catch (err) {
    console.error('Lỗi khi lưu mock requests vào localStorage:', err);
  }
}

/**
 * Thêm đơn mới do sinh viên nộp
 */
export function addStudentRequest(newRequest) {
  const currentList = getStoredRequests();
  const updated = [newRequest, ...currentList];
  saveStoredRequests(updated);

  // Gửi thông báo đến Quản trị viên
  addNotification({
    recipient: 'admin',
    title: 'Hồ sơ mới cần tiếp nhận',
    body: `Sinh viên ${newRequest.studentName} (${newRequest.studentCode}) vừa nộp ${newRequest.typeName} (Mã đơn: ${newRequest.id}).`,
    message: `Sinh viên ${newRequest.studentName} (${newRequest.studentCode}) vừa nộp ${newRequest.typeName} (Mã đơn: ${newRequest.id}).`,
    requestId: newRequest.id,
  });

  // Gửi thông báo xác nhận đến sinh viên
  addNotification({
    recipient: newRequest.studentCode,
    studentCode: newRequest.studentCode,
    title: 'Nộp đơn trực tuyến thành công',
    body: `Đơn ${newRequest.id} (${newRequest.typeName}) đã được nộp thành công và chuyển đến Quản trị viên để tiếp nhận.`,
    message: `Đơn ${newRequest.id} (${newRequest.typeName}) đã được nộp thành công và chuyển đến Quản trị viên để tiếp nhận.`,
    requestId: newRequest.id,
  });

  return updated;
}

/**
 * Cán bộ Quản trị viên phân phát đơn tới GV hoặc Phòng ban
 */
export function dispatchRequestByAdmin(requestId, assignedInfo, urgency, deadline, note) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Tiếp nhận & Phân phát',
          actor: 'Quản trị viên',
          time: timeStr,
          note: `Chuyển đơn tới ${assignedInfo.name}. Ghi chú: ${note || 'Không có'}`,
        },
      ];

      return {
        ...req,
        status: 'in_progress',
        statusLabel: 'Đang xử lý',
        distributionStatus: 'assigned',
        urgency: urgency || req.urgency,
        assignedTo: {
          ...assignedInfo,
          assignedAt: timeStr,
          assignedBy: 'Quản trị viên',
          note: note || '',
          deadline: deadline || 'Trong 48 giờ',
        },
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    // Thông báo cho Giảng viên
    addNotification({
      recipient: assignedInfo.id || 'teacher',
      title: 'Hồ sơ mới được phân công duyệt',
      body: `Quản trị viên đã chuyển đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} đến bạn.`,
      message: `Quản trị viên đã chuyển đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} đến bạn. Hạn xử lý: ${deadline || 'Trong 48 giờ'}.`,
      requestId,
    });

    // Thông báo cập nhật tiến độ cho Sinh viên
    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'Đơn đang được xử lý',
      body: `Đơn ${requestId} của bạn đã được Quản trị viên chuyển tới ${assignedInfo.name} để thẩm định và phê duyệt.`,
      message: `Đơn ${requestId} của bạn đã được Quản trị viên chuyển tới ${assignedInfo.name} để thẩm định và phê duyệt.`,
      requestId,
    });
  }

  return updated;
}

/**
 * Cán bộ Quản trị viên từ chối đơn
 */
export function rejectRequestByAdmin(requestId, rejectReason) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Từ chối tiếp nhận',
          actor: 'Quản trị viên',
          time: timeStr,
          note: `Lý do từ chối: ${rejectReason}`,
        },
      ];

      return {
        ...req,
        status: 'rejected',
        statusLabel: 'Bị từ chối',
        distributionStatus: 'rejected',
        rejectReason,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'Đơn bị từ chối tiếp nhận',
      body: `Đơn ${requestId} (${targetReq.typeName}) đã bị từ chối tiếp nhận. Lý do: ${rejectReason}`,
      message: `Đơn ${requestId} (${targetReq.typeName}) đã bị từ chối tiếp nhận. Lý do: ${rejectReason}`,
      requestId,
    });
  }

  return updated;
}

const NOTIFICATIONS_STORAGE_KEY = 'vmh_student_notifications_v5';

const INITIAL_NOTIFICATIONS = [];

/**
 * Lấy danh sách thông báo theo đối tượng (sinh viên, quản trị viên, giảng viên)
 */
export function getStoredNotifications(recipient) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    if (!recipient) return list;

    if (recipient === 'admin') {
      return list.filter((n) => n.recipient === 'admin');
    }

    if (recipient === 'teacher' || (typeof recipient === 'string' && recipient.startsWith('GV'))) {
      return list.filter(
        (n) => n.recipient === recipient || n.recipient === 'teacher' || (n.recipient && n.recipient.startsWith('GV'))
      );
    }

    return list.filter((n) => n.recipient === recipient || n.studentCode === recipient);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Thêm thông báo mới cho hệ thống (sinh viên / admin / giảng viên)
 */
export function addNotification(notification) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleString('vi-VN', { hour12: false }),
      isRead: false,
      ...notification,
    };
    const updated = [newNotif, ...(Array.isArray(current) ? current : [])];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_notifications_updated'));
    }
    return updated;
  } catch (err) {
    console.error('Lỗi khi thêm thông báo:', err);
  }
}

export const addStudentNotification = addNotification;

/**
 * Đánh dấu thông báo là đã đọc
 */
export function markNotificationAsRead(notifId) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const current = JSON.parse(raw);
    if (Array.isArray(current)) {
      const updated = current.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vmh_notifications_updated'));
      }
    }
  } catch (err) {
    console.error('Lỗi khi đánh dấu thông báo:', err);
  }
}

/**
 * Đánh dấu tất cả thông báo của một đối tượng là đã đọc
 */
export function markAllNotificationsAsRead(recipient) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const current = JSON.parse(raw);
    if (Array.isArray(current)) {
      const updated = current.map((n) => {
        if (!recipient) return { ...n, isRead: true };
        if (recipient === 'admin' && n.recipient === 'admin') return { ...n, isRead: true };
        if (
          (recipient === 'teacher' || (typeof recipient === 'string' && recipient.startsWith('GV'))) &&
          (n.recipient === recipient || n.recipient === 'teacher' || (n.recipient && n.recipient.startsWith('GV')))
        ) {
          return { ...n, isRead: true };
        }
        if (n.recipient === recipient || n.studentCode === recipient) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vmh_notifications_updated'));
      }
    }
  } catch (err) {
    console.error('Lỗi khi đánh dấu tất cả thông báo:', err);
  }
}

/**
 * Giảng viên / Cán bộ ký duyệt đơn:
 * Theo quy trình: GV ký duyệt xong CHƯA trả về SV luôn,
 * mà chuyển trạng thái "teacher_approved" và gửi về Ban Quản trị viên.
 */
export function signAndApproveByTeacher(requestId, teacherInfoOrSig, signatureOrTeacherName) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let sigToUse = DEFAULT_TEACHER_SIGNATURE;
  let teacherName = 'ThS. Nguyễn Thị Mai';

  if (typeof teacherInfoOrSig === 'string' && teacherInfoOrSig.startsWith('data:image')) {
    sigToUse = teacherInfoOrSig;
    if (typeof signatureOrTeacherName === 'string') {
      teacherName = signatureOrTeacherName;
    } else if (signatureOrTeacherName?.name) {
      teacherName = signatureOrTeacherName.name;
    }
  } else if (typeof teacherInfoOrSig === 'object' && teacherInfoOrSig !== null) {
    teacherName = teacherInfoOrSig.name || teacherName;
    if (signatureOrTeacherName) sigToUse = signatureOrTeacherName;
  } else if (typeof teacherInfoOrSig === 'string') {
    teacherName = teacherInfoOrSig;
    if (signatureOrTeacherName) sigToUse = signatureOrTeacherName;
  }

  if (!sigToUse && typeof localStorage !== 'undefined') {
    sigToUse = localStorage.getItem('vmh_saved_signature') || DEFAULT_TEACHER_SIGNATURE;
  }

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'GVCN ký duyệt & Chuyển Quản trị viên',
          actor: `GVCN ${teacherName}`,
          time: timeStr,
          note: `GVCN (${teacherName}) đã ký số xác nhận hợp lệ. Đã chuyển hồ sơ về Quản trị viên để đóng dấu và ban hành cho sinh viên.`,
        },
      ];

      return {
        ...req,
        status: 'teacher_approved',
        statusLabel: 'GV đã duyệt (Chờ Quản trị viên đóng dấu)',
        distributionStatus: 'teacher_signed',
        teacherSignature: sigToUse,
        teacherApprovedAt: timeStr,
        teacherApprovedBy: teacherName,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    // Thông báo cho Quản trị viên
    addNotification({
      recipient: 'admin',
      title: 'Hồ sơ đã duyệt – Chờ đóng dấu',
      body: `GVCN ${teacherName} đã ký duyệt đơn ${requestId} của SV ${targetReq.studentName}. Vui lòng đóng dấu ban hành.`,
      message: `GVCN ${teacherName} đã ký duyệt đơn ${requestId} của SV ${targetReq.studentName}. Vui lòng đóng dấu ban hành.`,
      requestId,
    });

    // Thông báo cho Sinh viên
    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'GVCN đã ký duyệt đơn',
      body: `Đơn ${requestId} của bạn đã được GVCN ${teacherName} ký số phê duyệt. Đang chờ Quản trị viên đóng dấu ban hành.`,
      message: `Đơn ${requestId} của bạn đã được GVCN ${teacherName} ký số phê duyệt. Đang chờ Quản trị viên đóng dấu ban hành.`,
      requestId,
    });
  }

  return updated;
}

/**
 * Quản trị viên kiểm tra, đóng dấu và Ban hành kết quả cho Sinh viên:
 * Lúc này đơn mới chính thức "completed" và gửi thông báo qua web cho sinh viên.
 */
export function finalizeAndNotifyStudentByAdmin(
  requestId,
  adminNameOrOptions = 'Quản trị viên',
  pickupInfo = '',
  adminNote = ''
) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetAdminName = 'Quản trị viên';
  let targetPickup = 'Phòng 102 - Tòa nhà A (Phòng Đào tạo)';
  let targetNote = '';

  if (typeof adminNameOrOptions === 'object' && adminNameOrOptions !== null) {
    targetAdminName = adminNameOrOptions.adminName || targetAdminName;
    targetPickup = adminNameOrOptions.pickupLocation || adminNameOrOptions.pickupInfo || targetPickup;
    targetNote = adminNameOrOptions.adminNote || targetNote;
  } else if (typeof adminNameOrOptions === 'string') {
    targetAdminName = adminNameOrOptions || targetAdminName;
    if (pickupInfo) targetPickup = pickupInfo;
    if (adminNote) targetNote = adminNote;
  }

  let targetReq = null;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Đóng dấu & Ban hành (Quản trị viên)',
          actor: targetAdminName,
          time: timeStr,
          note: targetNote || `Đã kiểm tra chữ ký GVCN, ký duyệt đóng dấu văn bản và ban hành kết quả cho sinh viên. Địa điểm nhận: ${targetPickup}`,
        },
      ];

      return {
        ...req,
        status: 'completed',
        statusLabel: 'Đã hoàn thành',
        distributionStatus: 'resolved',
        finalizedAt: timeStr,
        finalizedBy: targetAdminName,
        pickupLocation: targetPickup,
        adminNote: targetNote,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  // Gửi thông báo đến sinh viên qua web
  if (targetReq) {
    addStudentNotification({
      studentCode: targetReq.studentCode,
      title: 'Hồ sơ đã được phê duyệt & ban hành',
      message: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản trị viên đóng dấu hoàn tất. Bạn có thể đến ${targetPickup} để nhận bản cứng hoặc xem bản điện tử trên hệ thống.`,
      body: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản trị viên đóng dấu hoàn tất.`,
      pickupLocation: targetPickup,
      requestId: targetReq.id,
    });
  }

  return updated;
}

export const REQUEST_TYPES_STORAGE_KEY = 'vmh_request_types_store_v4';

export const INITIAL_REQUEST_TYPES = [
  {
    id: 'rt-confirm-student',
    code: 'XAC_NHAN_SV',
    name: 'Đơn xin cấp xác nhận học sinh - sinh viên',
    category: 'Xác nhận học tập',
    departmentName: 'Phòng Đào tạo & Bộ phận Khảo thí',
    slaDays: 2,
    description: 'Dùng để xác nhận đang theo học tại trường để vay vốn ngân hàng, tạm hoãn nghĩa vụ quân sự, bổ sung hồ sơ thực tập...',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xac_Nhan_HSSV.pdf',
    templateFileSize: '124 KB',
    templateFileUrl: null,
    fields: [],
  },
  {
    id: 'rt-transcript',
    code: 'CAP_BANG_DIEM',
    name: 'Đơn xin cấp bảng điểm học tập',
    category: 'Học vụ & Đào tạo',
    departmentName: 'Phòng Đào tạo & Bộ phận Khảo thí',
    slaDays: 3,
    description: 'Đề nghị cấp bảng điểm học tập toàn khóa, theo năm học hoặc theo từng học kỳ có xác nhận của nhà trường.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Cap_Bang_Diem.pdf',
    templateFileSize: '98 KB',
    templateFileUrl: null,
    fields: [
      { id: 'f_so_luong', label: 'Số lượng bản cần cấp', type: 'number', required: true, placeholder: 'VD: 2' },
      { id: 'f_loai_bang_diem', label: 'Loại bảng điểm (Toàn khóa / Từng kỳ)', type: 'text', required: true, placeholder: 'VD: Toàn khóa tích lũy' },
      { id: 'f_muc_dich', label: 'Mục đích sử dụng', type: 'textarea', required: true, placeholder: 'VD: Bổ sung hồ sơ xin thực tập doanh nghiệp...' },
    ],
  },
  {
    id: 'rt-graduation-cert',
    code: 'CAP_CHUNG_NHAN_TOT_NGHIEP',
    name: 'Đơn xin cấp giấy chứng nhận tốt nghiệp tạm thời',
    category: 'Xác nhận học tập',
    departmentName: 'Phòng Đào tạo Trường Cao đẳng Việt Mỹ',
    slaDays: 5,
    description: 'Dành cho sinh viên đã hoàn thành chương trình đào tạo và đủ điều kiện tốt nghiệp, chờ nhận bằng chính thức.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Cap_CNTN_Tam_Thoi.pdf',
    templateFileSize: '110 KB',
    templateFileUrl: null,
    fields: [
      { id: 'f_so_luong_cntn', label: 'Số lượng bản cần cấp', type: 'number', required: true, placeholder: 'VD: 1' },
      { id: 'f_dot_tot_nghiep', label: 'Đợt xét tốt nghiệp', type: 'text', required: false, placeholder: 'VD: Đợt 1 năm 2026' },
    ],
  },
  {
    id: 'rt-recheck-exam',
    code: 'PHUC_KHAO',
    name: 'Đơn xin chấm phúc khảo bài thi',
    category: 'Khảo thí & Điểm',
    departmentName: 'Phòng Đào tạo & Bộ phận Khảo thí',
    slaDays: 7,
    description: 'Đề nghị Bộ phận khảo thí xem xét chấm lại bài thi kết thúc học phần trong thời hạn 15 ngày kể từ khi công bố điểm.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Phuc_Khao_Bai_Thi.pdf',
    templateFileSize: '112 KB',
    templateFileUrl: null,
    fields: [
      { id: 'f_mon_thi', label: 'Tên môn thi / học phần', type: 'text', required: true, placeholder: 'VD: Lập trình Web nâng cao' },
      { id: 'f_ma_mon', label: 'Mã học phần', type: 'text', required: false, placeholder: 'VD: WEB201' },
      { id: 'f_diem_cu', label: 'Điểm đã công bố', type: 'text', required: true, placeholder: 'VD: 4.5' },
      { id: 'f_ngay_thi', label: 'Ngày thi', type: 'date', required: true },
      { id: 'f_ca_thi', label: 'Ca thi / Phòng thi', type: 'text', required: false, placeholder: 'VD: Ca 2, P.302' },
      { id: 'f_ly_do', label: 'Lý do xin chấm phúc khảo', type: 'textarea', required: true, placeholder: 'Nêu rõ bài làm hoặc thắc mắc về điểm...' },
    ],
  },
];

/**
 * Lấy danh sách các loại đơn từ localStorage
 */
export function getStoredRequestTypes() {
  try {
    const raw = localStorage.getItem(REQUEST_TYPES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUEST_TYPES_STORAGE_KEY, JSON.stringify(INITIAL_REQUEST_TYPES));
      return INITIAL_REQUEST_TYPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REQUEST_TYPES;
  } catch {
    return INITIAL_REQUEST_TYPES;
  }
}

/**
 * Lưu danh sách các loại đơn vào localStorage
 */
export function saveStoredRequestTypes(types) {
  try {
    localStorage.setItem(REQUEST_TYPES_STORAGE_KEY, JSON.stringify(types));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_request_types_updated'));
    }
  } catch (err) {
    console.error('Lỗi khi lưu danh sách loại đơn vào localStorage:', err);
  }
}

