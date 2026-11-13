import { useState, useMemo } from 'react';
import {
  Home,
  ClipboardList,
  History,
  PenTool,
  User,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Building2,
  GraduationCap,
  SendHorizontal,
  Undo2,
  XCircle,
  Eye,
  Inbox,
  Check,
} from 'lucide-react';
import { DEFAULT_LOGO_SRC } from './LoginPage';
import SignatureManager from '../components/SignatureManager';

/**
 * Tính toán danh sách 4 khóa học đang hoạt động (đồng bộ hệ thống)
 */
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

// Danh sách phòng ban chức năng tiếp nhận xử lý
export const DEPARTMENTS = [
  { id: 'dao_tao', name: 'Phòng Đào tạo & Quản lý Khoa học', code: 'P.ĐT', officer: 'ThS. Lê Hoàng Long' },
  { id: 'ctsv', name: 'Phòng Công tác Sinh viên', code: 'P.CTSV', officer: 'Cô Vũ Thị Lan' },
  { id: 'tckt', name: 'Phòng Tài chính - Kế toán', code: 'P.TCKT', officer: 'ThS. Nguyễn Hồng Hải' },
  { id: 'khao_thi', name: 'Trung tâm Khảo thí & Đảm bảo chất lượng', code: 'TT.KT', officer: 'ThS. Đặng Quốc Bảo' },
  { id: 'ktx', name: 'Ban Quản lý Ký túc xá', code: 'BQL.KTX', officer: 'Thầy Hoàng Văn Đức' },
  { id: 'doan_thanh_nien', name: 'Văn phòng Đoàn Thanh niên - Hội Sinh viên', code: 'VP.Đoàn', officer: 'Đ/c Phạm Thu Trang' },
];

// Danh sách giảng viên tiếp nhận
export const LECTURERS = [
  { id: 'GV001', name: 'ThS. Nguyễn Thị Mai', code: 'GV001', faculty: 'Khoa Công nghệ thông tin', role: 'GVCN CD-CNTT-K25A' },
  { id: 'GV002', name: 'TS. Trần Văn Bình', code: 'GV002', faculty: 'Khoa Công nghệ thông tin', role: 'Trưởng bộ môn PM' },
  { id: 'GV003', name: 'ThS. Lê Thị Ánh Tuyết', code: 'GV003', faculty: 'Khoa Kinh tế - Quản trị', role: 'GVCN CD-QTKD-K25A' },
  { id: 'GV004', name: 'ThS. Phạm Hoàng Nam', code: 'GV004', faculty: 'Khoa Thiết kế mỹ thuật', role: 'GVCN CD-TKDH-K26A' },
  { id: 'GV005', name: 'ThS. Đỗ Thúy Hằng', code: 'GV005', faculty: 'Khoa Ngoại ngữ', role: 'GVCN CD-TA-K24A' },
];

// Dữ liệu mô phỏng các đơn từ sinh viên nộp lên hệ thống
const INITIAL_ADMIN_REQUESTS = [
  {
    id: '#2026-1045',
    typeName: 'Xác nhận đang học',
    typeCategory: 'Xác nhận học tập',
    studentName: 'Trần Văn Minh',
    studentCode: '24123456',
    cohort: ACTIVE_COHORTS[2], // K25
    faculty: 'Khoa Công nghệ thông tin',
    major: 'Công nghệ thông tin',
    className: `CD-CNTT-${ACTIVE_COHORTS[2]}A`,
    createdAt: '13/11/2026 14:15',
    status: 'pending', // pending: Chờ tiếp nhận/phân phát | in_progress: Đang xử lý (đã phân phối) | completed: Đã hoàn tất | overdue: Quá hạn
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Vay vốn học sinh sinh viên tại Ngân hàng Chính sách Xã hội địa phương.',
    urgency: 'normal',
    distributionStatus: 'unassigned', // unassigned | assigned | resolved | rejected
    assignedTo: null,
    logs: [
      { action: 'Nộp đơn', actor: 'Trần Văn Minh (Sinh viên)', time: '13/11/2026 14:15', note: 'Sinh viên hoàn tất ký điện tử và gửi đơn trực tuyến.' },
    ],
  },
  {
    id: '#2026-1044',
    typeName: 'Đơn xin tạm hoãn thi',
    typeCategory: 'Khảo thí & Điểm',
    studentName: 'Lê Thị Thu Thảo',
    studentCode: '23D10421',
    cohort: ACTIVE_COHORTS[2], // K25
    faculty: 'Khoa Công nghệ thông tin',
    major: 'Công nghệ thông tin',
    className: `CD-CNTT-${ACTIVE_COHORTS[2]}B`,
    createdAt: '13/11/2026 11:30',
    status: 'pending',
    statusLabel: 'Chờ tiếp nhận',
    reason: 'Bị tai nạn giao thông phải điều trị nội trú, xin hoãn thi môn Lập trình Web.',
    urgency: 'urgent',
    distributionStatus: 'unassigned',
    assignedTo: null,
    logs: [
      { action: 'Nộp đơn', actor: 'Lê Thị Thu Thảo (Sinh viên)', time: '13/11/2026 11:30', note: 'Đã đính kèm giấy nhập viện có dấu xác nhận bệnh viện.' },
    ],
  },
  {
    id: '#2026-1042',
    typeName: 'Miễn giảm học phí chính sách',
    typeCategory: 'Học phí & Tài chính',
    studentName: 'Hoàng Quốc Bảo',
    studentCode: '24D10119',
    cohort: ACTIVE_COHORTS[2], // K25
    faculty: 'Khoa Kinh tế - Quản trị',
    major: 'Quản trị kinh doanh',
    className: `CD-QTKD-${ACTIVE_COHORTS[2]}A`,
    createdAt: '12/11/2026 16:45',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Sinh viên là con thương binh hạng 3/4, nộp hồ sơ xin xét duyệt miễn giảm học phí.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'department',
      id: 'tckt',
      name: 'Phòng Tài chính - Kế toán',
      officer: 'ThS. Nguyễn Hồng Hải',
      assignedAt: '13/11/2026 08:30',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển P.TCKT thẩm định hồ sơ công chứng con thương binh và đối soát học phí.',
      deadline: '16/11/2026',
    },
    logs: [
      { action: 'Nộp đơn', actor: 'Hoàng Quốc Bảo (Sinh viên)', time: '12/11/2026 16:45', note: 'Hồ sơ đã upload 02 bản scan giấy chứng nhận.' },
      { action: 'Tiếp nhận & Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '13/11/2026 08:30', note: 'Chuyển đơn tới Phòng Tài chính - Kế toán thẩm định chế độ.' },
    ],
  },
  {
    id: '#2026-1039',
    typeName: 'Bảo lưu kết quả học tập',
    typeCategory: 'Học vụ & Đào tạo',
    studentName: 'Đặng Tuấn Anh',
    studentCode: '22D10058',
    cohort: ACTIVE_COHORTS[1], // K24
    faculty: 'Khoa Thiết kế mỹ thuật',
    major: 'Thiết kế đồ họa',
    className: `CD-TKDH-${ACTIVE_COHORTS[1]}A`,
    createdAt: '11/11/2026 09:20',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Lý do sức khỏe cần điều trị dài ngày tại địa phương, xin bảo lưu kỳ 1 năm học 2026-2027.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'lecturer',
      id: 'GV004',
      name: 'ThS. Phạm Hoàng Nam (GVCN)',
      faculty: 'Khoa Thiết kế mỹ thuật',
      assignedAt: '11/11/2026 14:00',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển GVCN liên hệ gia đình xác minh và cho ý kiến đề xuất bảo lưu.',
      deadline: '14/11/2026',
    },
    logs: [
      { action: 'Nộp đơn', actor: 'Đặng Tuấn Anh (Sinh viên)', time: '11/11/2026 09:20', note: 'Sinh viên nộp đơn online có chữ ký phụ huynh.' },
      { action: 'Tiếp nhận & Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '11/11/2026 14:00', note: 'Chuyển GVCN ThS. Phạm Hoàng Nam nắm bắt và cho ý kiến.' },
    ],
  },
  {
    id: '#2026-1035',
    typeName: 'Đăng ký phòng Ký túc xá',
    typeCategory: 'Đời sống sinh viên',
    studentName: 'Nguyễn Bích Ngọc',
    studentCode: '25D10312',
    cohort: ACTIVE_COHORTS[3], // K26
    faculty: 'Khoa Ngoại ngữ',
    major: 'Tiếng Anh',
    className: `CD-TA-${ACTIVE_COHORTS[3]}A`,
    createdAt: '10/11/2026 10:10',
    status: 'in_progress',
    statusLabel: 'Đang xử lý',
    reason: 'Nhà xa tại Tuyên Quang, xin đăng ký 01 chỗ ở tại phòng 6 người khu KTX sinh viên.',
    urgency: 'normal',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'department',
      id: 'ktx',
      name: 'Ban Quản lý Ký túc xá',
      officer: 'Thầy Hoàng Văn Đức',
      assignedAt: '10/11/2026 13:40',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Chuyển BQL.KTX rà soát giường trống phòng 402 hoặc 405 nhà A.',
      deadline: '12/11/2026',
    },
    logs: [
      { action: 'Nộp đơn', actor: 'Nguyễn Bích Ngọc (Sinh viên)', time: '10/11/2026 10:10', note: 'Nộp đơn đăng ký kèm CCCD.' },
      { action: 'Tiếp nhận & Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '10/11/2026 13:40', note: 'Đã chuyển hồ sơ sang Ban Quản lý Ký túc xá.' },
    ],
  },
  {
    id: '#2026-1030',
    typeName: 'Cấp bản sao bảng điểm',
    typeCategory: 'Học vụ & Đào tạo',
    studentName: 'Phạm Đức Huy',
    studentCode: '21D10992',
    cohort: ACTIVE_COHORTS[0], // K23
    faculty: 'Khoa Công nghệ thông tin',
    major: 'Công nghệ thông tin',
    className: `CD-CNTT-${ACTIVE_COHORTS[0]}A`,
    createdAt: '08/11/2026 15:00',
    status: 'completed',
    statusLabel: 'Đã xử lý',
    reason: 'Cần nộp hồ sơ xin việc tại công ty liên doanh nước ngoài.',
    urgency: 'normal',
    distributionStatus: 'resolved',
    assignedTo: {
      type: 'department',
      id: 'dao_tao',
      name: 'Phòng Đào tạo & Quản lý Khoa học',
      officer: 'ThS. Lê Hoàng Long',
      assignedAt: '08/11/2026 15:30',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Phòng Đào tạo in 03 bản sao có dấu đỏ.',
      deadline: '10/11/2026',
    },
    logs: [
      { action: 'Nộp đơn', actor: 'Phạm Đức Huy (Sinh viên)', time: '08/11/2026 15:00', note: 'Đăng ký nhận 03 bản sao có dấu mộc.' },
      { action: 'Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '08/11/2026 15:30', note: 'Chuyển P. Đào tạo xử lý.' },
      { action: 'Hoàn tất & Đóng dấu', actor: 'Phòng Đào tạo', time: '10/11/2026 09:00', note: 'Đã in và ký đóng dấu xong. Sẵn sàng hẹn sinh viên lấy tại phòng 102.' },
    ],
  },
  {
    id: '#2026-1028',
    typeName: 'Đơn xin phúc khảo bài thi',
    typeCategory: 'Khảo thí & Điểm',
    studentName: 'Bùi Tuấn Kiệt',
    studentCode: '23D10499',
    cohort: ACTIVE_COHORTS[3], // K26
    faculty: 'Khoa Thiết kế mỹ thuật',
    major: 'Thiết kế đồ họa',
    className: `CD-TKDH-${ACTIVE_COHORTS[3]}A`,
    createdAt: '20/10/2026 15:20',
    status: 'overdue',
    statusLabel: 'Quá hạn',
    reason: 'Đề nghị chấm lại bài thi môn Thiết kế UI/UX nâng cao.',
    urgency: 'urgent',
    distributionStatus: 'assigned',
    assignedTo: {
      type: 'department',
      id: 'khao_thi',
      name: 'Trung tâm Khảo thí & ĐBCL',
      officer: 'ThS. Đặng Quốc Bảo',
      assignedAt: '21/10/2026 08:30',
      assignedBy: 'Cán bộ Quản lý Một cửa',
      note: 'Kính chuyển TT Khảo thí rút bài thi và thành lập ban chấm phúc khảo.',
      deadline: '24/10/2026',
    },
    logs: [
      { action: 'Nộp đơn', actor: 'Bùi Tuấn Kiệt (Sinh viên)', time: '20/10/2026 15:20', note: 'Đăng ký phúc khảo.' },
      { action: 'Phân phát', actor: 'Cán bộ Quản lý Một cửa', time: '21/10/2026 08:30', note: 'Chuyển TT Khảo thí.' },
    ],
  },
];

// Bộ lọc dữ liệu đồng bộ
const COHORT_OPTIONS = ['Tất cả', ...ACTIVE_COHORTS];
const FACULTY_OPTIONS = [
  'Tất cả',
  'Khoa Công nghệ thông tin',
  'Khoa Kinh tế - Quản trị',
  'Khoa Ngoại ngữ',
  'Khoa Thiết kế mỹ thuật',
];
const MAJOR_OPTIONS = [
  'Tất cả',
  'Công nghệ thông tin',
  'Quản trị kinh doanh',
  'Tiếng Anh',
  'Thiết kế đồ họa',
];
const CLASS_OPTIONS = [
  'Tất cả',
  `CD-CNTT-${ACTIVE_COHORTS[3]}A`,
  `CD-CNTT-${ACTIVE_COHORTS[2]}A`,
  `CD-CNTT-${ACTIVE_COHORTS[2]}B`,
  `CD-CNTT-${ACTIVE_COHORTS[1]}A`,
  `CD-QTKD-${ACTIVE_COHORTS[2]}A`,
  `CD-QTKD-${ACTIVE_COHORTS[1]}A`,
  `CD-TA-${ACTIVE_COHORTS[0]}A`,
  `CD-TA-${ACTIVE_COHORTS[3]}A`,
  `CD-TKDH-${ACTIVE_COHORTS[3]}A`,
  `CD-TKDH-${ACTIVE_COHORTS[1]}A`,
];
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chưa hoàn thành (Chờ tiếp nhận)' },
  { value: 'in_progress', label: 'Đang xử lý (Đã phân luồng)' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'overdue', label: 'Quá hạn' },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: Home },
  { id: 'pending-dispatch', label: 'Đơn cần xử lý', icon: ClipboardList },
  { id: 'history', label: 'Lịch sử xử lý', icon: History },
  { id: 'signature', label: 'Chữ ký cá nhân', icon: PenTool },
  { id: 'profile', label: 'Thông tin cá nhân', icon: User },
];

function AdminIllustration() {
  return (
    <svg
      viewBox="0 0 380 180"
      className="h-36 w-auto shrink-0 select-none lg:h-44"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="190" cy="155" rx="165" ry="20" fill="#EBF2FF" />
      <circle cx="85" cy="80" r="32" fill="#EAF3FF" opacity="0.7" />
      <circle cx="310" cy="70" r="28" fill="#EAF3FF" opacity="0.7" />

      {/* Cây lá trang trí bên trái */}
      <path
        d="M60 148c0-30 18-50 18-50s18 20 18 50H60z"
        fill="#7EA8F8"
        opacity="0.85"
      />
      <circle cx="78" cy="88" r="16" fill="#A5C4FC" />
      <circle cx="64" cy="108" r="12" fill="#C5DAFD" />

      {/* Tòa nhà quản trị Một Cửa (Admin Center) */}
      <rect x="135" y="32" width="140" height="135" rx="12" fill="#FFFFFF" stroke="#D3E2FB" strokeWidth="2" />
      <rect x="155" y="24" width="100" height="16" rx="4" fill="#2563EB" />
      <circle cx="205" cy="32" r="4" fill="#FFFFFF" />

      {/* Biểu tượng luân chuyển phân phối hồ sơ */}
      <path d="M165 62h80" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M235 57l10 5-10 5" fill="#2563EB" />
      <rect x="165" y="76" width="45" height="7" rx="3.5" fill="#DCE7FA" />
      <rect x="220" y="76" width="25" height="7" rx="3.5" fill="#BFDBFE" />

      <path d="M165 102l6 6 12-12" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="192" y="98" width="55" height="6" rx="3" fill="#DCE7FA" />

      <rect x="165" y="122" width="16" height="16" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <rect x="192" y="126" width="50" height="6" rx="3" fill="#E2E8F0" />

      {/* Cây lá trang trí bên phải */}
      <path
        d="M300 148c0-36 20-60 20-60s20 24 20 60h-40z"
        fill="#558EEA"
        opacity="0.9"
      />
      <circle cx="320" cy="80" r="18" fill="#8BB5F8" />
      <circle cx="335" cy="102" r="13" fill="#BBD4FC" />
    </svg>
  );
}

function StatusPill({ status, label }) {
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
      <span>{label}</span>
    </span>
  );
}

export default function AdminDashboardPage({ user, logoSrc = DEFAULT_LOGO_SRC, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Bộ lọc dữ liệu chuẩn
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('Tất cả');
  const [selectedFaculty, setSelectedFaculty] = useState('Tất cả');
  const [selectedMajor, setSelectedMajor] = useState('Tất cả');
  const [selectedClass, setSelectedClass] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Quản lý danh sách đơn
  const [requestsList, setRequestsList] = useState(INITIAL_ADMIN_REQUESTS);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Modal xem chi tiết và Phân phát
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Form phân phối đơn
  const [dispatchType, setDispatchType] = useState('lecturer'); // lecturer | department
  const [targetId, setTargetId] = useState('');
  const [dispatchDeadline, setDispatchDeadline] = useState('3');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchUrgency, setDispatchUrgency] = useState('normal');

  // Modal từ chối tiếp nhận
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Tên cán bộ quản lý
  const adminName = user?.fullName || 'Cán bộ Quản lý Một cửa';
  const adminInitial = 'QL';

  // Thống kê số lượng
  const stats = useMemo(() => {
    const pendingCount = requestsList.filter((r) => r.status === 'pending').length;
    const completedCount = requestsList.filter((r) => r.status === 'completed').length;
    const overdueCount = requestsList.filter((r) => r.status === 'overdue').length;
    return { pendingCount, completedCount, overdueCount };
  }, [requestsList]);

  // Lọc danh sách theo các tiêu chí
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      // 1. Tìm kiếm theo từ khóa
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchKeyword =
          req.id.toLowerCase().includes(query) ||
          req.typeName.toLowerCase().includes(query) ||
          req.studentName.toLowerCase().includes(query) ||
          req.studentCode.toLowerCase().includes(query) ||
          req.className.toLowerCase().includes(query);
        if (!matchKeyword) return false;
      }

      // 2. Khóa học
      if (selectedCohort !== 'Tất cả' && req.cohort !== selectedCohort) {
        return false;
      }

      // 3. Khoa
      if (selectedFaculty !== 'Tất cả' && req.faculty !== selectedFaculty) {
        return false;
      }

      // 4. Ngành học
      if (selectedMajor !== 'Tất cả' && req.major !== selectedMajor) {
        return false;
      }

      // 5. Lớp học
      if (selectedClass !== 'Tất cả' && req.className !== selectedClass) {
        return false;
      }

      // 6. Trạng thái
      if (selectedStatus === 'pending' && req.status !== 'pending') {
        return false;
      }
      if (selectedStatus === 'in_progress' && req.status !== 'in_progress') {
        return false;
      }
      if (selectedStatus === 'completed' && req.status !== 'completed') {
        return false;
      }
      if (selectedStatus === 'overdue' && req.status !== 'overdue') {
        return false;
      }

      return true;
    });
  }, [
    requestsList,
    searchTerm,
    selectedCohort,
    selectedFaculty,
    selectedMajor,
    selectedClass,
    selectedStatus,
  ]);

  const hasActiveFilter =
    searchTerm.trim() !== '' ||
    selectedCohort !== 'Tất cả' ||
    selectedFaculty !== 'Tất cả' ||
    selectedMajor !== 'Tất cả' ||
    selectedClass !== 'Tất cả' ||
    selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCohort('Tất cả');
    setSelectedFaculty('Tất cả');
    setSelectedMajor('Tất cả');
    setSelectedClass('Tất cả');
    setSelectedStatus('all');
  };

  const handleSelectNav = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Mở modal phân phát đơn
  const handleOpenDispatch = (req) => {
    setSelectedRequest(req);
    setDispatchUrgency(req.urgency || 'normal');
    setDispatchNote('');
    if (req.typeCategory?.includes('Học vụ') || req.typeCategory?.includes('Khảo thí')) {
      setDispatchType('department');
      setTargetId('dao_tao');
    } else if (req.typeCategory?.includes('Học phí')) {
      setDispatchType('department');
      setTargetId('tckt');
    } else if (req.typeCategory?.includes('Ký túc xá')) {
      setDispatchType('department');
      setTargetId('ktx');
    } else {
      setDispatchType('lecturer');
      setTargetId(LECTURERS[0].id);
    }
    setIsDispatchModalOpen(true);
  };

  // Xác nhận phân phát đơn tới GV hoặc Phòng ban
  const handleConfirmDispatch = (e) => {
    e.preventDefault();
    if (!selectedRequest || !targetId) return;

    let targetInfo = null;
    if (dispatchType === 'lecturer') {
      const gv = LECTURERS.find((item) => item.id === targetId);
      if (!gv) return;
      targetInfo = {
        type: 'lecturer',
        id: gv.id,
        name: gv.name,
        role: gv.role,
        faculty: gv.faculty,
        assignedAt: new Date().toLocaleString('vi-VN', { hour12: false }),
        assignedBy: adminName,
        note: dispatchNote || 'Kính chuyển Thầy/Cô tiếp nhận kiểm tra và có ý kiến xác nhận.',
        deadline: `Sau ${dispatchDeadline} ngày làm việc`,
      };
    } else {
      const dept = DEPARTMENTS.find((item) => item.id === targetId);
      if (!dept) return;
      targetInfo = {
        type: 'department',
        id: dept.id,
        name: dept.name,
        officer: dept.officer,
        assignedAt: new Date().toLocaleString('vi-VN', { hour12: false }),
        assignedBy: adminName,
        note: dispatchNote || 'Kính chuyển Quý phòng ban kiểm tra và phối hợp giải quyết cho sinh viên.',
        deadline: `Sau ${dispatchDeadline} ngày làm việc`,
      };
    }

    setRequestsList((prev) =>
      prev.map((item) => {
        if (item.id === selectedRequest.id) {
          return {
            ...item,
            status: 'in_progress',
            statusLabel: 'Đang xử lý',
            distributionStatus: 'assigned',
            urgency: dispatchUrgency,
            assignedTo: targetInfo,
            logs: [
              ...item.logs,
              {
                action: `Phân phát tới: ${targetInfo.name}`,
                actor: adminName,
                time: targetInfo.assignedAt,
                note: targetInfo.note,
              },
            ],
          };
        }
        return item;
      })
    );

    setIsDispatchModalOpen(false);
    setSelectedRequest(null);
    setActionSuccessMsg(`Đã phân phát thành công đơn ${selectedRequest.id} tới ${targetInfo.name}!`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Thu hồi phân phát về hàng đợi tiếp nhận
  const handleRevokeDispatch = (req) => {
    setRequestsList((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'pending',
              statusLabel: 'Chờ tiếp nhận',
              distributionStatus: 'unassigned',
              assignedTo: null,
              logs: [
                ...r.logs,
                {
                  action: 'Thu hồi điều phối',
                  actor: adminName,
                  time: new Date().toLocaleString('vi-VN', { hour12: false }),
                  note: 'Thu hồi về hàng đợi tiếp nhận để phân luồng lại.',
                },
              ],
            }
          : r
      )
    );
    setActionSuccessMsg(`Đã thu hồi đơn ${req.id} về hàng đợi chờ phân phối!`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Từ chối tiếp nhận đơn
  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!selectedRequest || !rejectReason.trim()) return;

    setRequestsList((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: 'completed',
              statusLabel: 'Đã từ chối',
              distributionStatus: 'rejected',
              logs: [
                ...r.logs,
                {
                  action: 'Từ chối tiếp nhận đơn',
                  actor: adminName,
                  time: new Date().toLocaleString('vi-VN', { hour12: false }),
                  note: `Lý do từ chối: ${rejectReason}`,
                },
              ],
            }
          : r
      )
    );

    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
    setActionSuccessMsg(`Đã từ chối tiếp nhận đơn ${selectedRequest.id}. Hệ thống đã gửi thông báo đến sinh viên.`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Render Sidebar trái đồng bộ
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Logo trường & Tiêu đề Admin Portal */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-6">
          <img
            src={logoSrc}
            alt="Logo Cao đẳng Việt Mỹ Hà Nội"
            className="h-11 w-auto max-w-[115px] object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-slate-800">Admin Portal</p>
            <p className="truncate text-[11px] text-slate-500">Quản lý Một cửa</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Menu quản lý">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,0.6)]'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'pending-dispatch' && stats.pendingCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-white text-[#2563EB]' : 'bg-blue-100 text-[#2563EB]'
                    }`}
                  >
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Nút Đăng xuất */}
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        <span>Đăng xuất</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F7FE] text-slate-800">
      {/* Sidebar cho Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-gradient-to-b from-[#F8FAFF] to-[#EEF4FF] lg:block">
        <div className="sticky top-0 h-screen">{renderSidebarContent()}</div>
      </aside>

      {/* Sidebar ngăn kéo cho Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 h-full w-64 bg-gradient-to-b from-[#F8FAFF] to-[#EEF4FF] shadow-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-white"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Nội dung bên phải */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header trên cùng */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Thanh tìm kiếm nhỏ gọn trên Header */}
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm mã đơn, sinh viên, lớp..."
                className="w-full rounded-xl border border-slate-200/80 bg-[#F4F7FE] py-2 pr-4 pl-10 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <button
              type="button"
              className="relative cursor-pointer rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
              <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Thông tin Cán bộ Quản lý */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-xs">
                {adminInitial}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{adminName}</p>
                <p className="text-xs text-slate-500">Ban Tiếp nhận & Phân luồng</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        {/* Thông báo thao tác thành công nếu có */}
        {actionSuccessMsg && (
          <div className="mx-4 mt-4 max-w-6xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm sm:mx-8">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Banner chào mừng Quản lý (Đồng bộ với giáo viên) */}
              <section className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#F6F9FF] via-[#EFF4FF] to-[#E9F0FF] p-6 ring-1 ring-blue-100/70 md:flex-row md:items-center md:px-8 md:py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
                    Xin chào, {adminName}!
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                    Trung tâm tiếp nhận & phân phối hồ sơ sinh viên Một Cửa. Chúc bạn làm việc hiệu quả!
                  </p>
                </div>

                <div className="hidden md:block">
                  <AdminIllustration />
                </div>
              </section>

              {/* 3 Thẻ thống kê: Đơn chờ tiếp nhận - Đã xử lý - Đơn quá hạn */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('pending')}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-slate-800">{stats.pendingCount}</p>
                      <p className="text-sm text-slate-500">Đơn chờ tiếp nhận</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('completed')}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-slate-800">{stats.completedCount}</p>
                      <p className="text-sm text-slate-500">Đã hoàn tất</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('overdue')}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-all hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-slate-800">{stats.overdueCount}</p>
                      <p className="text-sm text-slate-500">Đơn quá hạn</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </section>

              {/* Bảng Đơn cần tiếp nhận & phân phối + Bộ lọc chi tiết */}
              <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="h-5 w-5 text-[#2563EB]" />
                    <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                      Đơn cần tiếp nhận & phân phối
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                </div>

                {/* 5 Bộ lọc thả xuống đồng bộ */}
                <div className="mb-5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {/* 1. Lọc Khóa học */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Khóa học
                      </label>
                      <select
                        value={selectedCohort}
                        onChange={(e) => setSelectedCohort(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {COHORT_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Lọc Khoa */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Khoa</label>
                      <select
                        value={selectedFaculty}
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {FACULTY_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Lọc Ngành học */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Ngành học
                      </label>
                      <select
                        value={selectedMajor}
                        onChange={(e) => setSelectedMajor(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {MAJOR_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Lọc Lớp học */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Lớp học
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {CLASS_OPTIONS.map((cl) => (
                          <option key={cl} value={cl}>
                            {cl}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Lọc Trạng thái */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Trạng thái đơn
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {STATUS_FILTER_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BẢNG DANH SÁCH ĐƠN TỪ TIẾP NHẬN */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                        <th className="py-3 pr-4 pl-2">Mã đơn</th>
                        <th className="px-4 py-3">Loại đơn</th>
                        <th className="px-4 py-3">Sinh viên</th>
                        <th className="px-4 py-3">Ngày tạo</th>
                        <th className="px-4 py-3">Phân phối tới</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-700 whitespace-nowrap">
                              {req.id}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                              {req.typeName}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <p className="font-medium text-slate-800">
                                {req.studentName}{' '}
                                <span className="text-slate-400 font-normal">
                                  ({req.studentCode})
                                </span>
                              </p>
                              <p className="text-xs text-slate-400">{req.className}</p>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                              {req.createdAt}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {req.assignedTo ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  {req.assignedTo.type === 'lecturer' ? (
                                    <GraduationCap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  ) : (
                                    <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  <span>{req.assignedTo.name}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                  <Clock className="h-3 w-3" />
                                  Chờ phân phát
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <StatusPill status={req.status} label={req.statusLabel} />
                            </td>
                            <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequest(req)}
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                >
                                  Chi tiết
                                </button>

                                {req.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDispatch(req)}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
                                  >
                                    <SendHorizontal className="h-3.5 w-3.5" />
                                    <span>Phân phát</span>
                                  </button>
                                )}

                                {req.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDispatch(req)}
                                    className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-blue-100"
                                  >
                                    Đổi luồng
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'pending-dispatch' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Danh sách đơn chờ tiếp nhận & phân luồng</h1>
                  <p className="text-sm text-slate-500">
                    Tiếp nhận hồ sơ mới từ sinh viên và điều phối tới Giảng viên chủ nhiệm hoặc Phòng ban phụ trách.
                  </p>
                </div>
              </div>

              {/* Bảng đơn pending */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="py-3 pr-4 pl-2">Mã đơn</th>
                      <th className="px-4 py-3">Loại đơn</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">Ngày tạo</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requestsList
                      .filter((r) => r.status === 'pending')
                      .map((req) => (
                        <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-700 whitespace-nowrap">{req.id}</td>
                          <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">{req.typeName}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="font-medium text-slate-800">
                              {req.studentName} <span className="text-slate-400 font-normal">({req.studentCode})</span>
                            </p>
                            <p className="text-xs text-slate-400">{req.className}</p>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{req.createdAt}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusPill status={req.status} label={req.statusLabel} />
                          </td>
                          <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDispatch(req)}
                              className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
                            >
                              <SendHorizontal className="h-3.5 w-3.5" />
                              <span>Phân phát ngay</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'history' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <h1 className="text-xl font-bold text-slate-800 mb-2">Lịch sử điều phối toàn bộ hồ sơ</h1>
              <p className="text-sm text-slate-500 mb-6">
                Nhật ký lưu trữ toàn bộ các đơn từ sinh viên đã được tiếp nhận, phân luồng và xử lý hoàn tất.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="py-3 pr-4 pl-2">Mã đơn</th>
                      <th className="px-4 py-3">Loại đơn</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">Người/Phòng thụ lý</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="py-3 pr-2 pl-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requestsList.map((req) => (
                      <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-700 whitespace-nowrap">{req.id}</td>
                        <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">{req.typeName}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{req.studentName} ({req.studentCode})</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          {req.assignedTo ? req.assignedTo.name : 'Chưa phân phát'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusPill status={req.status} label={req.statusLabel} />
                        </td>
                        <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'signature' && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <SignatureManager
                userName={adminName}
                userRoleLabel="Cán bộ Quản lý Một cửa"
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin tài khoản Quản lý</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Mã quản lý:</span>{' '}
                  <span className="font-semibold text-slate-800">{user?.code || 'QL001'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Họ và tên:</span>{' '}
                  <span className="font-semibold text-slate-800">{adminName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-semibold text-slate-800">{user?.email || 'ql001@caodangvietmyhanoi.edu.vn'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Bộ phận:</span>{' '}
                  <span className="font-semibold text-slate-800">Ban Tiếp nhận Một cửa & Quản lý Đào tạo</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: PHÂN PHÁT ĐƠN CHO GV HOẶC PHÒNG BAN */}
      {isDispatchModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-800">Phân phát đơn: {selectedRequest.id}</h3>
                <p className="text-xs text-slate-500">{selectedRequest.typeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1">
                <div><strong>Sinh viên:</strong> {selectedRequest.studentName} ({selectedRequest.studentCode}) - {selectedRequest.className}</div>
                <div className="text-slate-600 italic">"Lý do: {selectedRequest.reason}"</div>
              </div>

              {/* Chọn đối tượng: GV hoặc Phòng ban */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  1. Đối tượng tiếp nhận giải quyết:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchType('lecturer');
                      setTargetId(LECTURERS[0].id);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      dispatchType === 'lecturer'
                        ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB] ring-1 ring-[#2563EB]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <GraduationCap className="h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Giảng viên / GVCN</div>
                      <div className="text-[11px] text-slate-500">Xác nhận, cho ý kiến</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDispatchType('department');
                      setTargetId(DEPARTMENTS[0].id);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      dispatchType === 'department'
                        ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB] ring-1 ring-[#2563EB]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building2 className="h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Phòng ban Chức năng</div>
                      <div className="text-[11px] text-slate-500">Đào tạo, CTSV, Kế toán...</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chọn cụ thể */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dispatchType === 'lecturer' ? 'Chọn Giảng viên phụ trách:' : 'Chọn Phòng ban chức năng phụ trách:'}
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  required
                >
                  {dispatchType === 'lecturer' ? (
                    LECTURERS.map((gv) => (
                      <option key={gv.id} value={gv.id}>
                        {gv.name} — {gv.role} ({gv.faculty})
                      </option>
                    ))
                  ) : (
                    DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code}) — {dept.officer}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Hạn xử lý SLA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mức độ ưu tiên:</label>
                  <select
                    value={dispatchUrgency}
                    onChange={(e) => setDispatchUrgency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hạn xử lý (SLA):</label>
                  <select
                    value={dispatchDeadline}
                    onChange={(e) => setDispatchDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="1">Trong 24 giờ</option>
                    <option value="2">Trong 48 giờ</option>
                    <option value="3">Trong 3 ngày</option>
                    <option value="5">Trong 5 ngày</option>
                  </select>
                </div>
              </div>

              {/* Lời nhắn điều phối */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ghi chú điều phối & Yêu cầu xử lý:
                </label>
                <textarea
                  rows={3}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="Nhập ghi chú yêu cầu chuyên môn gửi kèm cho GV/Phòng ban..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span>Xác nhận phân phát</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM CHI TIẾT ĐƠN */}
      {selectedRequest && !isDispatchModalOpen && !isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Đơn {selectedRequest.id}</h3>
                <p className="text-xs text-slate-500">{selectedRequest.typeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <div className="rounded-xl border border-slate-100 p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin sinh viên</div>
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div><span className="text-slate-500">Họ và tên:</span> <span className="font-bold text-slate-800">{selectedRequest.studentName}</span></div>
                  <div><span className="text-slate-500">Mã sinh viên:</span> <span className="font-bold text-slate-800">{selectedRequest.studentCode}</span></div>
                  <div><span className="text-slate-500">Lớp học:</span> <span className="text-slate-700">{selectedRequest.className}</span></div>
                  <div><span className="text-slate-500">Khoa:</span> <span className="text-slate-700">{selectedRequest.faculty}</span></div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Lý do xin cấp:</span>
                  <p className="mt-1 font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              {selectedRequest.assignedTo && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-1.5">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600" />
                    Đơn vị đang thụ lý giải quyết
                  </div>
                  <div className="text-sm font-bold text-slate-800">{selectedRequest.assignedTo.name}</div>
                  <div className="text-xs text-slate-600">Ghi chú: "{selectedRequest.assignedTo.note}"</div>
                  <div className="text-xs text-blue-700 font-medium">Hạn xử lý: {selectedRequest.assignedTo.deadline}</div>
                </div>
              )}

              {/* Lịch sử */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nhật ký chuyển giao hồ sơ</div>
                <div className="space-y-2">
                  {selectedRequest.logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB] font-bold text-[10px] shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{log.action}</span>
                          <span className="text-slate-400 text-[11px]">{log.time}</span>
                        </div>
                        <div className="text-slate-500">{log.actor}</div>
                        {log.note && <div className="text-slate-600 italic">"{log.note}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejectModalOpen(true);
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Từ chối đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDispatch(selectedRequest)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    <span>Phân phát đơn này</span>
                  </button>
                </div>
              )}

              {selectedRequest.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => handleRevokeDispatch(selectedRequest)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Thu hồi điều phối</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TỪ CHỐI ĐƠN */}
      {isRejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-red-100 bg-red-50 px-6 py-4 flex items-center justify-between text-red-900">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-base">Từ chối tiếp nhận đơn</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-red-100 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-slate-600">
                Đơn <strong>{selectedRequest.id}</strong> của sinh viên <strong>{selectedRequest.studentName}</strong> sẽ bị từ chối và gửi phản hồi lý do lại cho sinh viên.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lý do từ chối tiếp nhận (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Thiếu giấy tờ chứng minh, đơn nộp không đúng khoa/lớp..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
