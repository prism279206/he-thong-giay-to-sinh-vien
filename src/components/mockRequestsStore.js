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

const STORAGE_KEY = 'vmh_shared_requests_v4';

// Dữ liệu đơn khởi tạo dùng chung giữa Sinh viên -> Quản trị (Một cửa) -> Giảng viên
// Sử dụng toàn bộ hồ sơ sinh viên thật được đồng bộ từ API CMS của trường (CCCD chuẩn 12 số)
export const INITIAL_SHARED_REQUESTS = [
  {
    id: '#2026-1045',
    typeId: 'rt-confirm-student',
    typeName: 'Đơn xin cấp xác nhận học sinh – sinh viên',
    typeCategory: 'Xác nhận học tập',
    studentName: 'Nguyễn Hữu Bằng',
    studentCode: '61112420027',
    phone: '',
    dob: '27/03/2006',
    pob: 'Hà Nội',
    idCardNumber: '001206068891',
    idCardDate: '15/04/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    cohort: 'K24',
    faculty: 'Công nghệ - Thiết kế',
    major: 'Ứng dụng phần mềm (VIS)',
    className: 'UDPM24-01',
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '16/11/2026 09:15',
    status: 'pending',
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Vay vốn học sinh sinh viên tại Ngân hàng Chính sách Xã hội địa phương để trang trải học phí kỳ 1 năm học 2026-2027.',
    urgency: 'normal',
    distributionStatus: 'unassigned',
    assignedTo: null,
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Nguyễn Hữu Bằng (Sinh viên)',
        time: '16/11/2026 09:15',
        note: 'Sinh viên hoàn tất ký điện tử và gửi đơn trực tuyến lên hệ thống.',
      },
    ],
  },
  {
    id: '#2026-1044',
    typeId: 'rt-postpone-exam',
    typeName: 'Đơn xin tạm hoãn thi kết thúc học phần',
    typeCategory: 'Khảo thí & Điểm',
    studentName: 'Nguyễn Thị Thanh Trúc',
    studentCode: '51112510151',
    phone: '',
    dob: '23/07/2010',
    pob: 'Hà Nội',
    idCardNumber: '001310015668',
    idCardDate: '10/08/2024',
    idCardPlace: 'Bộ Công an',
    cohort: 'K25',
    faculty: 'Khoa Thẩm mỹ - Làm đẹp',
    major: 'Chăm sóc sắc đẹp (BTF)',
    className: '10A6',
    campus: 'Cầu Giấy',
    trainingSystem: 'Chính quy',
    createdAt: '15/11/2026 14:30',
    status: 'pending',
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Bị ốm sốt virus phải điều trị nội trú tại bệnh viện, xin tạm hoãn thi học phần cơ sở ngành.',
    urgency: 'urgent',
    distributionStatus: 'unassigned',
    assignedTo: null,
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Nguyễn Thị Thanh Trúc (Sinh viên)',
        time: '15/11/2026 14:30',
        note: 'Đã đính kèm giấy chứng nhận y tế của cơ sở khám chữa bệnh.',
      },
    ],
  },
  {
    id: '#2026-1042',
    typeId: 'rt-tuition-waiver',
    typeName: 'Đơn xin miễn giảm học phí chính sách',
    typeCategory: 'Học phí & Tài chính',
    studentName: 'Bùi Mạnh Tháp',
    studentCode: '51112510102',
    phone: '',
    dob: '28/05/2010',
    pob: 'Hà Nội',
    idCardNumber: '001210005544',
    idCardDate: '01/06/2024',
    idCardPlace: 'Bộ Công an',
    cohort: 'K25',
    faculty: 'Khoa Công nghệ',
    major: 'Công nghệ thông tin',
    className: '10A1',
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '14/11/2026 16:45',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Sinh viên nộp hồ sơ xin xét duyệt miễn giảm học phí đối tượng chính sách theo quy định.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'department',
      id: 'tckt',
      name: 'Phòng Tài chính - Kế toán',
      officer: 'ThS. Nguyễn Hồng Hải',
      assignedAt: '15/11/2026 08:30',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển P.TCKT thẩm định hồ sơ công chứng và đối soát mức học phí.',
      deadline: '18/11/2026',
    },
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Bùi Mạnh Tháp (Sinh viên)',
        time: '14/11/2026 16:45',
        note: 'Hồ sơ đã upload 02 bản scan giấy tờ chứng minh đối tượng chính sách.',
      },
      {
        action: 'Tiếp nhận & Phân phát',
        actor: 'Cán bộ Quản lý Một cửa',
        time: '15/11/2026 08:30',
        note: 'Chuyển đơn tới Phòng Tài chính - Kế toán thẩm định chế độ.',
      },
    ],
  },
  {
    id: '#2026-1039',
    typeId: 'rt-defer',
    typeName: 'Đơn xin bảo lưu kết quả học tập',
    typeCategory: 'Học vụ & Đào tạo',
    studentName: 'Triệu Thị Duyên',
    studentCode: '61112520299',
    phone: '',
    dob: '18/02/2007',
    pob: 'Hà Nội',
    idCardNumber: '024307008245',
    idCardDate: '15/03/2022',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    cohort: 'K25',
    faculty: 'Công nghệ - Thiết kế',
    major: 'Ứng dụng phần mềm (VIS)',
    className: 'UDPM25-02',
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '12/11/2026 09:20',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Lý do sức khỏe cần điều trị dài ngày tại địa phương, xin bảo lưu kỳ 1 năm học 2026-2027.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'lecturer',
      id: 'GV001',
      name: 'ThS. Nguyễn Thị Mai (GVCN)',
      faculty: 'Khoa Công nghệ thông tin',
      assignedAt: '12/11/2026 14:00',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển GVCN liên hệ gia đình xác minh và thực hiện ký ý kiến đề xuất bảo lưu.',
      deadline: '16/11/2026',
    },
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Triệu Thị Duyên (Sinh viên)',
        time: '12/11/2026 09:20',
        note: 'Sinh viên nộp đơn online có chữ ký của phụ huynh.',
      },
      {
        action: 'Tiếp nhận & Phân phát',
        actor: 'Cán bộ Quản lý Một cửa',
        time: '12/11/2026 14:00',
        note: 'Chuyển GVCN ThS. Nguyễn Thị Mai xác minh và cho ý kiến ký duyệt.',
      },
    ],
  },
  {
    id: '#2026-1038',
    typeId: 'rt-confirm-student',
    typeName: 'Đơn xin cấp xác nhận học sinh – sinh viên',
    typeCategory: 'Xác nhận học tập',
    studentName: 'Nguyễn Văn Tiến',
    studentCode: '61112420189',
    phone: '',
    dob: '27/09/2006',
    pob: 'Hà Nội',
    idCardNumber: '001206023295',
    idCardDate: '20/06/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    cohort: 'K24',
    faculty: 'Công nghệ - Thiết kế',
    major: 'Ứng dụng phần mềm (VIS)',
    className: 'UDPM24-01',
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '10/11/2026 13:10',
    status: 'completed',
    statusLabel: 'Đã hoàn thành',
    pickupLocation: 'Phòng 102 - Tòa nhà A (Bộ phận Một Cửa)',
    adminNote: 'Đã hoàn tất kiểm tra và đóng dấu đỏ ban hành bản cứng.',
    reason: 'Xin xác nhận đang học để bổ sung hồ sơ thực tập và làm việc bán thời gian tại doanh nghiệp công nghệ.',
    urgency: 'normal',
    distributionStatus: 'resolved',
    assignedTo: {
      type: 'lecturer',
      id: 'GV001',
      name: 'ThS. Nguyễn Thị Mai (GVCN)',
      faculty: 'Khoa Công nghệ thông tin',
      assignedAt: '10/11/2026 14:00',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Đã duyệt.',
      deadline: '12/11/2026',
    },
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: DEFAULT_TEACHER_SIGNATURE,
    logs: [
      { action: 'Nộp đơn', actor: 'Nguyễn Văn Tiến (Sinh viên)', time: '10/11/2026 13:10', note: 'Nộp đơn trực tuyến.' },
      { action: 'Tiếp nhận & Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '10/11/2026 14:00', note: 'Chuyển GVCN duyệt.' },
      { action: 'Ký duyệt hoàn tất', actor: 'GVCN ThS. Nguyễn Thị Mai', time: '11/11/2026 09:30', note: 'Đã ký số điện tử GVCN phê duyệt đơn.' },
      { action: 'Đóng dấu & Ban hành', actor: 'Cán bộ Quản lý Một cửa', time: '11/11/2026 15:45', note: 'Đã đóng dấu số và hoàn tất thủ tục.' },
    ],
  },
];

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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SHARED_REQUESTS;
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
  return updated;
}

/**
 * Cán bộ Một cửa phân phát đơn tới GV hoặc Phòng ban
 */
export function dispatchRequestByAdmin(requestId, assignedInfo, urgency, deadline, note) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Tiếp nhận & Phân phát',
          actor: 'Cán bộ Quản lý Một cửa',
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
          assignedBy: 'Cán bộ Quản lý Một cửa',
          note: note || '',
          deadline: deadline || 'Trong 48 giờ',
        },
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);
  return updated;
}

/**
 * Cán bộ Một cửa từ chối đơn
 */
export function rejectRequestByAdmin(requestId, rejectReason) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Từ chối tiếp nhận',
          actor: 'Cán bộ Quản lý Một cửa',
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
  return updated;
}

const NOTIFICATIONS_STORAGE_KEY = 'vmh_student_notifications_v3';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    studentCode: '61112420027',
    title: 'Hồ sơ đã được tiếp nhận',
    body: 'Đơn #2026-1045 (Đơn xin cấp xác nhận học sinh – sinh viên) của bạn đã được chuyển đến Ban Tiếp nhận Một cửa.',
    time: '16/11/2026 09:16',
    isRead: false,
    requestId: '#2026-1045',
  },
  {
    id: 'notif-2',
    studentCode: '61112420189',
    title: 'Chào mừng bạn đến với Cổng dịch vụ một cửa',
    body: 'Bạn có thể nộp đơn xin cấp giấy xác nhận, bảng điểm và theo dõi tiến độ xử lý trực tiếp trên hệ thống.',
    time: 'Hôm nay',
    isRead: false,
  },
];

/**
 * Lấy danh sách thông báo của sinh viên
 */
export function getStoredNotifications(studentCode) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return studentCode
        ? INITIAL_NOTIFICATIONS.filter((n) => !n.studentCode || n.studentCode === studentCode)
        : INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    return studentCode
      ? list.filter((n) => !n.studentCode || n.studentCode === studentCode)
      : list;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Thêm thông báo mới cho sinh viên
 */
export function addStudentNotification(notification) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const newNotif = {
      id: `notif-${Date.now()}`,
      time: new Date().toLocaleString('vi-VN', { hour12: false }),
      isRead: false,
      ...notification,
    };
    const updated = [newNotif, ...(Array.isArray(current) ? current : [])];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Lỗi khi thêm thông báo:', err);
  }
}

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
    }
  } catch (err) {
    console.error('Lỗi khi đánh dấu thông báo:', err);
  }
}

/**
 * Giảng viên / Cán bộ ký duyệt đơn:
 * Theo quy trình: GV ký duyệt xong CHƯA trả về SV luôn,
 * mà chuyển trạng thái "teacher_approved" và gửi về Ban Quản lý Một cửa.
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

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'GVCN ký duyệt & Chuyển Một cửa',
          actor: `GVCN ${teacherName}`,
          time: timeStr,
          note: `GVCN (${teacherName}) đã ký số xác nhận hợp lệ. Đã chuyển hồ sơ về Ban Tiếp nhận Một cửa để đóng dấu và ban hành cho sinh viên.`,
        },
      ];

      return {
        ...req,
        status: 'teacher_approved',
        statusLabel: 'GV đã duyệt (Chờ Một cửa đóng dấu)',
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
  return updated;
}

/**
 * Cán bộ Quản lý Một cửa kiểm tra, đóng dấu và Ban hành kết quả cho Sinh viên:
 * Lúc này đơn mới chính thức "completed" và gửi thông báo qua web cho sinh viên.
 */
export function finalizeAndNotifyStudentByAdmin(
  requestId,
  adminNameOrOptions = 'Cán bộ Quản lý Một cửa',
  pickupInfo = '',
  adminNote = ''
) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetAdminName = 'Cán bộ Quản lý Một cửa';
  let targetPickup = 'Phòng 102 - Tòa nhà A (Bộ phận Một Cửa)';
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
          action: 'Đóng dấu & Ban hành (Một cửa)',
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
      message: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản lý Một cửa đóng dấu hoàn tất. Bạn có thể đến ${targetPickup} để nhận bản cứng hoặc xem bản điện tử trên hệ thống.`,
      body: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản lý Một cửa đóng dấu hoàn tất.`,
      pickupLocation: targetPickup,
      requestId: targetReq.id,
    });
  }

  return updated;
}

export const REQUEST_TYPES_STORAGE_KEY = 'vmh_request_types_store_v2';

export const INITIAL_REQUEST_TYPES = [
  {
    id: 'rt-confirm-student',
    code: 'XAC_NHAN_SV',
    name: 'Đơn xin cấp xác nhận học sinh - sinh viên',
    category: 'Xác nhận học tập',
    departmentName: 'Phòng Đào tạo & Quản lý Khoa học',
    slaDays: 2,
    description: 'Dùng để xác nhận đang theo học tại trường để vay vốn ngân hàng, tạm hoãn nghĩa vụ quân sự, bổ sung hồ sơ...',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xac_Nhan_HSSV.pdf',
    templateFileSize: '124 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-transcript',
    code: 'CAP_BANG_DIEM',
    name: 'Đơn xin cấp bảng điểm',
    category: 'Học vụ & Đào tạo',
    departmentName: 'Phòng Đào tạo & Quản lý Khoa học',
    slaDays: 3,
    description: 'Đề nghị cấp bảng điểm quá trình học tập các học kỳ hoặc bảng điểm tốt nghiệp có xác nhận của nhà trường.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Bang_Diem.pdf',
    templateFileSize: '98 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-tuition-waiver',
    code: 'MIEN_GIAM_HOC_PHI',
    name: 'Đơn xin miễn giảm học phí',
    category: 'Học phí & Tài chính',
    departmentName: 'Phòng Tài chính - Kế toán',
    slaDays: 5,
    description: 'Dành cho sinh viên thuộc diện chính sách, con thương binh liệt sĩ, hộ nghèo hoặc các đối tượng được hỗ trợ theo quy định.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Mien_Giam_Hoc_Phi.pdf',
    templateFileSize: '215 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-defer',
    code: 'BAO_LUU',
    name: 'Đơn xin bảo lưu kết quả học tập',
    category: 'Học vụ & Đào tạo',
    departmentName: 'Ban Giám hiệu & Phòng Đào tạo',
    slaDays: 3,
    description: 'Đề nghị tạm dừng tiến độ học và bảo lưu kết quả học tập tối đa 02 học kỳ vì lý do sức khỏe hoặc gia đình.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Bao_Luu.pdf',
    templateFileSize: '150 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-recheck-exam',
    code: 'PHUC_KHAO',
    name: 'Đơn xin phúc khảo bài thi',
    category: 'Khảo thí & Điểm',
    departmentName: 'Trung tâm Khảo thí & ĐBCL',
    slaDays: 7,
    description: 'Đề nghị rút bài thi và thành lập ban chấm phúc khảo điểm bài thi kết thúc học phần trong thời hạn 15 ngày.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Phuc_Khao_Diem.pdf',
    templateFileSize: '112 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-exam-delay',
    code: 'HOAN_THI',
    name: 'Đơn xin tạm hoãn thi kết thúc học phần',
    category: 'Khảo thí & Điểm',
    departmentName: 'Trung tâm Khảo thí & ĐBCL',
    slaDays: 2,
    description: 'Đề nghị hoãn thi kết thúc môn vì lý do ốm đau cấp cứu hoặc trường hợp bất khả kháng, có giấy viện kèm theo.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Xin_Hoan_Thi.pdf',
    templateFileSize: '86 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-dormitory',
    code: 'DANG_KY_KTX',
    name: 'Đơn đăng ký chỗ ở Ký túc xá',
    category: 'Đời sống sinh viên',
    departmentName: 'Ban Quản lý Ký túc xá',
    slaDays: 2,
    description: 'Đăng ký phòng ở nội trú tại khu ký túc xá sinh viên dành cho tân sinh viên hoặc sinh viên ở xa.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Dang_Ky_KTX.pdf',
    templateFileSize: '180 KB',
    templateFileUrl: null,
  },
  {
    id: 'rt-bus-pass',
    code: 'VE_THANG_XE_BUYT',
    name: 'Đăng ký xác nhận làm vé tháng xe buýt',
    category: 'Đời sống sinh viên',
    departmentName: 'Phòng Công tác Sinh viên',
    slaDays: 1,
    description: 'Đóng dấu xác nhận sinh viên trên bản khai đăng ký vé tháng xe buýt liên tuyến của Tổng công ty Vận tải.',
    isActive: true,
    hasTemplateFile: true,
    templateFileName: 'Mau_Don_Ve_Thang_Xe_Buyt.pdf',
    templateFileSize: '92 KB',
    templateFileUrl: null,
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REQUEST_TYPES;
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
  } catch (err) {
    console.error('Lỗi khi lưu danh sách loại đơn vào localStorage:', err);
  }
}

