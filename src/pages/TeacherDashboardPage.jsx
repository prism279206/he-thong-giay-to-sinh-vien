import { useState, useMemo, useEffect } from 'react';
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
  Eye,
} from 'lucide-react';
import { DEFAULT_LOGO_SRC } from './LoginPage';
import SignatureManager from '../components/SignatureManager';
import OfficialDocumentView from '../components/OfficialDocumentView';
import {
  getStoredRequests,
  signAndApproveByTeacher,
} from '../components/mockRequestsStore';

/**
 * Tính toán danh sách 4 khóa học đang hoạt động:
 * - Hiện tại (năm 2026): Gồm các khóa từ K23 đến K26.
 * - Quy tắc chuyển khóa: Vào ngày 1/8 hàng năm (thời điểm tuyển sinh khóa mới),
 *   hệ thống tự động thêm 1 khóa mới và loại bỏ khóa cũ nhất (ví dụ ngày 01/08/2027 sẽ chuyển thành K24 đến K27).
 */
function getActiveCohorts(date = new Date()) {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed: Tháng 8 là index 7
  const currentDay = date.getDate();

  // Kiểm tra đã đến hoặc qua ngày 01/08 của năm hiện tại hay chưa
  const hasPassedAugustFirst = currentMonth > 7 || (currentMonth === 7 && currentDay >= 1);
  const intakeYear = hasPassedAugustFirst ? currentYear : currentYear - 1;

  // Lấy số khóa tương ứng với 2 số cuối của năm tuyển sinh (Ví dụ năm 2026 -> Khóa K26)
  const latestCohortNum = intakeYear % 100;

  return [
    `K${latestCohortNum - 3}`,
    `K${latestCohortNum - 2}`,
    `K${latestCohortNum - 1}`,
    `K${latestCohortNum}`,
  ];
}

const ACTIVE_COHORTS = getActiveCohorts();

// Các bộ lọc dữ liệu (Khóa học lấy động theo quy tắc ngày 1/8 hàng năm)
const COHORT_OPTIONS = ['Tất cả', ...ACTIVE_COHORTS];
const FACULTY_OPTIONS = [
  'Tất cả',
  'Khoa Công nghệ nghệ thiết kế',
  'Khoa Kinh tế - Quản trị',
  'Khoa Ngoại ngữ',
  'Khoa Thiết kế mỹ thuật',
];
const MAJOR_OPTIONS = [
  'Tất cả',
  'Thiết kế đồ hoạ (VIG)',
  'Công nghệ ô tô (VIT)',
  'Digital Marketing (DMK)',
  'Tiếng Trung Quốc',
  'Phiên dịch tiếng Anh thương mại',
  'Quản trị khách sạn',

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
  `CD-TKDH-${ACTIVE_COHORTS[3]}A`,
];
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ tiếp nhận' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'teacher_approved', label: 'GV đã duyệt (Chờ Một cửa)' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'overdue', label: 'Quá hạn' },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: Home },
  { id: 'pending-requests', label: 'Đơn cần xử lý', icon: ClipboardList },
  { id: 'history', label: 'Lịch sử xử lý', icon: History },
  { id: 'signature', label: 'Chữ ký cá nhân', icon: PenTool },
  { id: 'profile', label: 'Thông tin cá nhân', icon: User },
];

function TeacherIllustration() {
  return (
    <svg
      viewBox="0 0 380 180"
      className="h-36 w-auto shrink-0 select-none lg:h-44"
      fill="none"
      aria-hidden="true"
    >
      {/* Vòm mây mềm */}
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

      {/* Bảng kẹp hồ sơ chính (Clipboard) */}
      <rect x="145" y="32" width="120" height="135" rx="10" fill="#FFFFFF" stroke="#D3E2FB" strokeWidth="2" />
      {/* Kẹp tài liệu đầu bảng */}
      <rect x="175" y="24" width="60" height="16" rx="4" fill="#6B9DF7" />
      <circle cx="205" cy="32" r="4" fill="#FFFFFF" />

      {/* Các dòng checklist bên trong clipboard */}
      <path d="M165 60l6 6 12-12" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="192" y="56" width="55" height="6" rx="3" fill="#DCE7FA" />

      <path d="M165 88l6 6 12-12" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="192" y="84" width="55" height="6" rx="3" fill="#DCE7FA" />

      <rect x="165" y="112" width="16" height="16" rx="4" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
      <rect x="192" y="116" width="50" height="6" rx="3" fill="#E2E8F0" />

      <rect x="165" y="136" width="80" height="5" rx="2.5" fill="#EEF2F6" />

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
  if (status === 'teacher_approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>GV đã duyệt (Chờ Một cửa đóng dấu)</span>
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

/**
 * Giao diện dành riêng cho tài khoản được phân quyền Giáo viên (Teacher Portal).
 */
function TeacherDashboardPage({ user, logoSrc = DEFAULT_LOGO_SRC, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Bộ lọc dữ liệu theo yêu cầu của bạn
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('Tất cả');
  const [selectedFaculty, setSelectedFaculty] = useState('Tất cả');
  const [selectedMajor, setSelectedMajor] = useState('Tất cả');
  const [selectedClass, setSelectedClass] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal xem chi tiết và ký duyệt đơn của sinh viên
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDocRequest, setViewDocRequest] = useState(null);
  const [requestsList, setRequestsList] = useState(() => getStoredRequests());
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Tự động đồng bộ danh sách đơn khi chuyển tab hoặc mở trang
  useEffect(() => {
    setRequestsList(getStoredRequests());
  }, [activeTab]);

  // Thống kê số lượng đơn động
  const stats = useMemo(() => {
    const pendingCount = requestsList.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    ).length;
    const completedCount = requestsList.filter(
      (r) => r.status === 'completed' || r.status === 'teacher_approved'
    ).length;
    const overdueCount = requestsList.filter((r) => r.status === 'overdue').length;
    return { pendingCount, completedCount, overdueCount };
  }, [requestsList]);

  // Tên giáo viên và avatar
  const teacherName = user?.fullName || 'Nguyễn Thị Mai';
  const teacherInitial = 'GV';

  // Lọc danh sách theo từ khóa và các tiêu chí dropdown
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

      // 6. Trạng thái (đã hoàn thành / chưa hoàn thành (chờ xử lý/đang xử lý) / quá hạn)
      if (selectedStatus === 'pending' && req.status !== 'pending' && req.status !== 'in_progress') {
        return false;
      }
      if (selectedStatus === 'in_progress' && req.status !== 'in_progress') {
        return false;
      }
      if (selectedStatus === 'teacher_approved' && req.status !== 'teacher_approved') {
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

  // Thao tác ký duyệt đơn (GV ký duyệt xong chuyển Một cửa kiểm tra, đóng dấu)
  const handleApproveRequest = (reqId) => {
    const updated = signAndApproveByTeacher(reqId, {
      name: teacherName,
      id: user?.studentCode || user?.code || 'GV001',
    });
    setRequestsList(updated);
    setActionSuccessMsg(
      `Đã ký số phê duyệt đơn ${reqId}! Hồ sơ đã được chuyển tiếp đến Ban Tiếp nhận Một cửa để đóng dấu và ban hành kết quả cho sinh viên.`
    );
    setTimeout(() => setActionSuccessMsg(''), 4500);
    setSelectedRequest(null);
  };

  const handleSelectNav = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Render Sidebar
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Logo trường & Tiêu đề Teacher Portal */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-6">
          <img
            src={logoSrc}
            alt="Logo Cao đẳng Việt Mỹ Hà Nội"
            className="h-11 w-auto max-w-[115px] object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-slate-800">Teacher Portal</p>
            <p className="truncate text-[11px] text-slate-500">Việt Mỹ Hà Nội</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Menu giảng viên">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${isActive
                    ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,0.6)]'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                <span>{item.label}</span>
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
                placeholder="Tìm kiếm đơn từ..."
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

            {/* Thông tin Giảng viên */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-xs">
                {teacherInitial}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{teacherName}</p>
                <p className="text-xs text-slate-500">{user?.title || 'Giảng viên'}</p>
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
              {/* Banner chào mừng Giảng viên (Đồng bộ với ảnh thiết kế) */}
              <section className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#F6F9FF] via-[#EFF4FF] to-[#E9F0FF] p-6 ring-1 ring-blue-100/70 md:flex-row md:items-center md:px-8 md:py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
                    Xin chào, {teacherName}!
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                    Chúc bạn một ngày làm việc hiệu quả!
                  </p>
                </div>

                <div className="hidden md:block">
                  <TeacherIllustration />
                </div>
              </section>

              {/* 3 Thẻ thống kê: 8 Đơn chờ xử lý - 45 Đã xử lý - 3 Đơn quá hạn */}
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
                      <p className="text-sm text-slate-500">Đơn chờ xử lý</p>
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
                      <p className="text-sm text-slate-500">Đã xử lý</p>
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

              {/* Bảng Đơn cần xử lý + Bộ lọc chi tiết theo yêu cầu */}
              <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="h-5 w-5 text-[#2563EB]" />
                    <h2 className="text-base font-bold text-slate-800 sm:text-lg">Đơn cần xử lý</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pending-requests')}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* KHU VỰC BỘ LỌC CHI TIẾT (Khóa học, Khoa, Ngành học, Lớp học, Trạng thái) */}
                <div className="mb-5 rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Filter className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>Bộ lọc tìm kiếm nâng cao:</span>
                    </div>

                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Xóa tất cả bộ lọc</span>
                      </button>
                    )}
                  </div>

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
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Khoa đào tạo
                      </label>
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

                {/* BẢNG DANH SÁCH ĐƠN TỪ (Giống hình ảnh thiết kế) */}
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
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
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
                              <StatusPill status={req.status} label={req.statusLabel} />
                            </td>
                            <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewDocRequest(req)}
                                  className="cursor-pointer rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
                                  title="Mở toàn văn văn bản đơn A4"
                                >
                                  Mở đơn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequest(req)}
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563EB] hover:bg-slate-50"
                                >
                                  Chi tiết
                                </button>
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

          {activeTab === 'pending-requests' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Danh sách toàn bộ đơn cần xử lý</h1>
                  <p className="text-sm text-slate-500">
                    Xem và tiếp nhận duyệt đơn của sinh viên thuộc các lớp được phân công.
                  </p>
                </div>
              </div>

              {/* Bảng */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="py-3 pr-4 pl-2">Mã đơn</th>
                      <th className="px-4 py-3">Loại đơn</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">Lớp / Ngành</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-700">{req.id}</td>
                        <td className="px-4 py-3.5 text-slate-700">{req.typeName}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{req.studentName}</p>
                          <p className="text-xs text-slate-400">MSSV: {req.studentCode}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs">
                          <p className="font-medium text-slate-700">{req.className}</p>
                          <p className="text-slate-400">{req.major}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusPill status={req.status} label={req.statusLabel} />
                        </td>
                        <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewDocRequest(req)}
                              className="cursor-pointer rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                              title="Mở toàn văn văn bản đơn A4"
                            >
                              Mở đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRequest(req)}
                              className="cursor-pointer rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                            >
                              Duyệt đơn
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'history' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <h1 className="text-lg font-bold text-slate-800">Lịch sử xử lý đơn từ</h1>
              <p className="mt-1 text-sm text-slate-500">
                Toàn bộ lịch sử duyệt, chuyển tiếp hoặc từ chối đơn sinh viên được ghi nhật ký bất biến.
              </p>
              <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
                <div className="py-2.5">
                  <span className="font-semibold text-slate-800">#2025-1038 (Đỗ Khánh Linh):</span> Đã ký duyệt và chuyển tiếp phòng Đào tạo (02/11/2025 14:00)
                </div>
                <div className="py-2.5">
                  <span className="font-semibold text-slate-800">#2025-1030 (Lê Văn Hoàng):</span> Đã xác nhận thông tin sinh viên học kỳ phụ (28/10/2025 11:20)
                </div>
              </div>
            </section>
          )}

          {/* Tab Chữ ký cá nhân (Tái sử dụng SignatureManager cho Giáo viên) */}
          {activeTab === 'signature' && <SignatureManager />}

          {/* Tab Thông tin cá nhân */}
          {activeTab === 'profile' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs sm:p-8">
              <h1 className="text-lg font-bold text-slate-800">Thông tin Giảng viên</h1>
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Họ và tên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{teacherName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mã cán bộ / Giảng viên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{user?.teacherCode || 'GV001'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Khoa / Bộ môn</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {user?.department || 'Khoa Công nghệ thông tin'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Chức vụ / Vai trò</p>
                  <p className="mt-0.5 font-semibold text-[#2563EB]">{user?.title || 'Giảng viên'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Email công vụ</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {user?.email || 'maiant@caodangvietmyhanoi.edu.vn'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* MODAL XEM CHI TIẾT & KÝ DUYỆT ĐƠN CHO GIÁO VIÊN */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#2563EB]">{selectedRequest.id}</span>
                <h3 className="mt-0.5 text-lg font-bold text-slate-800">
                  {selectedRequest.typeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chi tiết sinh viên */}
            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Sinh viên:</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Mã sinh viên:</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.studentCode}</p>
                </div>
                <div>
                  <span className="text-slate-400">Lớp:</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.className}</p>
                </div>
                <div>
                  <span className="text-slate-400">Khoa / Khóa:</span>
                  <p className="font-semibold text-slate-800">
                    {selectedRequest.faculty} ({selectedRequest.cohort})
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200/70 pt-2">
                <span className="text-slate-400">Lý do sinh viên làm đơn:</span>
                <p className="mt-1 rounded-lg bg-white p-2.5 font-medium text-slate-800 border border-slate-200">
                  {selectedRequest.reason}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/70 pt-2">
                <span className="text-slate-400">Trạng thái hiện tại:</span>
                <StatusPill status={selectedRequest.status} label={selectedRequest.statusLabel} />
              </div>
            </div>

            {/* Các hành động xử lý của Giáo viên */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setViewDocRequest(selectedRequest)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 py-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100"
              >
                <Eye className="h-4 w-4" />
                <span>Mở xem toàn văn bản đơn A4</span>
              </button>

              <button
                type="button"
                onClick={() => handleApproveRequest(selectedRequest.id)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1D4ED8]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Ký duyệt đơn (Chữ ký điện tử GVCN)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã gửi thông báo yêu cầu bổ sung thông tin tới sinh viên ${selectedRequest.studentName}.`);
                    setSelectedRequest(null);
                  }}
                  className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/60 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  <AlertTriangle className="mr-1 inline-block h-3.5 w-3.5" />
                  Yêu cầu bổ sung
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã từ chối đơn ${selectedRequest.id}.`);
                    setSelectedRequest(null);
                  }}
                  className="cursor-pointer rounded-xl border border-red-200 bg-red-50/60 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Từ chối đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL XEM TOÀN VĂN ĐƠN A4 CHO GIÁO VIÊN */}
      {viewDocRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Toàn văn văn bản đơn A4 — {viewDocRequest.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  In / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewDocRequest(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto bg-slate-100">
              <OfficialDocumentView request={viewDocRequest} />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setViewDocRequest(null)}
                className="rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Đóng văn bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboardPage;
