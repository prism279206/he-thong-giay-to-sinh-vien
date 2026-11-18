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

const STORAGE_KEY = 'vmh_shared_requests_v1';

// Dữ liệu đơn khởi tạo dùng chung giữa Sinh viên -> Quản trị (Một cửa) -> Giảng viên
export const INITIAL_SHARED_REQUESTS = [
  {
    id: '#2026-1045',
    typeId: 'rt-confirm-student',
    typeName: 'Đơn xin cấp xác nhận học sinh – sinh viên',
    typeCategory: 'Xác nhận học tập',
    studentName: 'Trần Văn Minh',
    studentCode: '24123456',
    phone: '0987654321',
    dob: '15/08/2005',
    pob: 'Hà Nội',
    idCardNumber: '001205012345',
    idCardDate: '20/08/2021',
    idCardPlace: 'Bộ Công an',
    cohort: ACTIVE_COHORTS[1], // K24
    faculty: 'Khoa Công nghệ thông tin',
    major: 'Công nghệ thông tin',
    className: `CD-CNTT-${ACTIVE_COHORTS[1]}A`,
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '16/11/2026 09:15',
    status: 'pending', // pending: Chờ tiếp nhận | in_progress: Đang xử lý | completed: Đã xử lý | rejected: Từ chối
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Vay vốn học sinh sinh viên tại Ngân hàng Chính sách Xã hội địa phương để trang trải học phí kỳ 1 năm học 2026-2027.',
    urgency: 'normal',
    distributionStatus: 'unassigned', // unassigned | assigned | resolved | rejected
    assignedTo: null,
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Trần Văn Minh (Sinh viên)',
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
    studentName: 'Lê Thị Thu Thảo',
    studentCode: '23D10421',
    phone: '0978123456',
    dob: '22/04/2005',
    pob: 'Bắc Ninh',
    idCardNumber: '027205009876',
    idCardDate: '15/05/2021',
    idCardPlace: 'Bộ Công an',
    cohort: ACTIVE_COHORTS[2], // K25
    faculty: 'Khoa Công nghệ thông tin',
    major: 'Công nghệ thông tin',
    className: `CD-CNTT-${ACTIVE_COHORTS[2]}B`,
    campus: 'Mỹ Đình',
    trainingSystem: 'Chính quy',
    createdAt: '15/11/2026 14:30',
    status: 'pending',
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Bị tai nạn giao thông phải điều trị nội trú tại bệnh viện, xin tạm hoãn thi học phần Lập trình Web.',
    urgency: 'urgent',
    distributionStatus: 'unassigned',
    assignedTo: null,
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Lê Thị Thu Thảo (Sinh viên)',
        time: '15/11/2026 14:30',
        note: 'Đã đính kèm giấy nhập viện có dấu xác nhận của bệnh viện.',
      },
    ],
  },
  {
    id: '#2026-1042',
    typeId: 'rt-tuition-waiver',
    typeName: 'Đơn xin miễn giảm học phí chính sách',
    typeCategory: 'Học phí & Tài chính',
    studentName: 'Hoàng Quốc Bảo',
    studentCode: '24D10119',
    phone: '0912345678',
    dob: '10/10/2005',
    pob: 'Hải Dương',
    idCardNumber: '030205001234',
    idCardDate: '12/03/2021',
    idCardPlace: 'Bộ Công an',
    cohort: ACTIVE_COHORTS[1], // K24
    faculty: 'Khoa Kinh tế - Quản trị',
    major: 'Quản trị kinh doanh',
    className: `CD-QTKD-${ACTIVE_COHORTS[1]}A`,
    campus: 'Cầu Giấy',
    trainingSystem: 'Chính quy',
    createdAt: '14/11/2026 16:45',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Sinh viên là con thương binh hạng 3/4, nộp hồ sơ xin xét duyệt miễn giảm học phí theo quy định nhà nước.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'department',
      id: 'tckt',
      name: 'Phòng Tài chính - Kế toán',
      officer: 'ThS. Nguyễn Hồng Hải',
      assignedAt: '15/11/2026 08:30',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển P.TCKT thẩm định hồ sơ công chứng con thương binh và đối soát học phí.',
      deadline: '18/11/2026',
    },
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: '',
    logs: [
      {
        action: 'Nộp đơn',
        actor: 'Hoàng Quốc Bảo (Sinh viên)',
        time: '14/11/2026 16:45',
        note: 'Hồ sơ đã upload 02 bản scan giấy chứng nhận con thương binh.',
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
    studentName: 'Đặng Tuấn Anh',
    studentCode: '22D10058',
    phone: '0966889900',
    dob: '05/02/2004',
    pob: 'Nam Định',
    idCardNumber: '036204005566',
    idCardDate: '10/01/2020',
    idCardPlace: 'Bộ Công an',
    cohort: ACTIVE_COHORTS[0], // K23
    faculty: 'Khoa Thiết kế mỹ thuật',
    major: 'Thiết kế đồ họa',
    className: `CD-TKDH-${ACTIVE_COHORTS[0]}A`,
    campus: 'Phúc Diễn',
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
        actor: 'Đặng Tuấn Anh (Sinh viên)',
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
    studentName: 'Đỗ Khánh Linh',
    studentCode: '23D10512',
    phone: '0933112233',
    dob: '18/09/2005',
    pob: 'Hà Nội',
    idCardNumber: '001205007788',
    idCardDate: '25/08/2021',
    idCardPlace: 'Bộ Công an',
    cohort: ACTIVE_COHORTS[0], // K23
    faculty: 'Khoa Ngoại ngữ',
    major: 'Tiếng Anh',
    className: `CD-TA-${ACTIVE_COHORTS[0]}A`,
    campus: 'Trịnh Văn Bô',
    trainingSystem: 'Chính quy',
    createdAt: '10/11/2026 13:10',
    status: 'completed',
    statusLabel: 'Đã hoàn thành',
    reason: 'Xin xác nhận đang học để bổ sung hồ sơ làm việc bán thời gian tại doanh nghiệp nước ngoài.',
    urgency: 'normal',
    distributionStatus: 'resolved',
    assignedTo: {
      type: 'lecturer',
      id: 'GV001',
      name: 'ThS. Nguyễn Thị Mai (GVCN)',
      faculty: 'Khoa Ngoại ngữ',
      assignedAt: '10/11/2026 14:00',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Đã duyệt.',
      deadline: '12/11/2026',
    },
    studentSignature: DEFAULT_MOCK_SIGNATURE,
    teacherSignature: DEFAULT_TEACHER_SIGNATURE,
    logs: [
      { action: 'Nộp đơn', actor: 'Đỗ Khánh Linh (Sinh viên)', time: '10/11/2026 13:10', note: 'Nộp đơn trực tuyến.' },
      { action: 'Tiếp nhận & Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '10/11/2026 14:00', note: 'Chuyển GVCN duyệt.' },
      { action: 'Ký duyệt hoàn tất', actor: 'GVCN ThS. Nguyễn Thị Mai', time: '11/11/2026 09:30', note: 'Đã ký số điện tử GVCN phê duyệt đơn.' },
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

/**
 * Giảng viên / Cán bộ ký duyệt đơn
 */
export function signAndApproveByTeacher(requestId, teacherInfo, teacherSignatureData) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const sigToUse =
    teacherSignatureData ||
    localStorage.getItem('vmh_saved_signature') ||
    DEFAULT_TEACHER_SIGNATURE;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Ký duyệt hoàn tất',
          actor: `GVCN ${teacherInfo?.name || 'Nguyễn Thị Mai'}`,
          time: timeStr,
          note: 'Đã ký số điện tử GVCN phê duyệt đơn.',
        },
      ];

      return {
        ...req,
        status: 'completed',
        statusLabel: 'Đã hoàn thành',
        distributionStatus: 'resolved',
        teacherSignature: sigToUse,
        approvedAt: timeStr,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);
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

