import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  History,
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
  RotateCcw,
  Building2,
  GraduationCap,
  SendHorizontal,
  Undo2,
  XCircle,
  Check,
  Layers,
  Camera,
  Upload,
  Plus,
  Download,
  Image as ImageIcon,
  FileUp,
  Sparkles,
  Eye,
} from 'lucide-react';
import { DEFAULT_LOGO_SRC } from './LoginPage';
import OfficialDocumentView from '../components/OfficialDocumentView';
import { parseDocxFile } from '../utils/docxParser';
import {
  getStoredRequests,
  saveStoredRequests,
  getStoredRequestTypes,
  saveStoredRequestTypes,
  finalizeAndNotifyStudentByAdmin,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../components/mockRequestsStore';

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
  { value: 'teacher_approved', label: 'GV đã duyệt (Chờ Quản trị viên đóng dấu)' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'overdue', label: 'Quá hạn' },
];

// Danh mục menu bên trái: Thay 'signature' bằng 'request-types'
const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: Home },
  { id: 'pending-dispatch', label: 'Đơn cần xử lý', icon: ClipboardList },
  { id: 'request-types', label: 'Các loại đơn đang có', icon: Layers },
  { id: 'history', label: 'Lịch sử xử lý', icon: History },
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

      {/* Tòa nhà quản trị Quản trị viên (Admin Center) */}
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
  if (status === 'teacher_approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
        <span>{label || 'GV đã duyệt (Chờ đóng dấu)'}</span>
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
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span>{label || 'Đã từ chối'}</span>
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
 * Thanh tiến trình 4 chặng theo dõi hồ sơ trên cổng Quản trị
 */
function WorkflowTimeline({ status }) {
  let currentStep = 1;
  if (status === 'pending') currentStep = 2;
  else if (status === 'in_progress') currentStep = 3;
  else if (status === 'teacher_approved') currentStep = 4;
  else if (status === 'completed') currentStep = 5;
  else if (status === 'rejected') currentStep = -1;

  const steps = [
    { num: 1, label: 'Nộp đơn', sub: 'Sinh viên' },
    { num: 2, label: 'Tiếp nhận', sub: 'Một Cửa' },
    { num: 3, label: 'Ký duyệt', sub: 'GVCN' },
    { num: 4, label: 'Đóng dấu', sub: 'Một Cửa' },
  ];

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Tiến trình giải quyết hồ sơ (4 chặng)
      </div>
      <div className="flex items-center justify-between">
        {steps.map((st, idx) => {
          const isDone = currentStep > st.num || currentStep === 5;
          const isCurrent = currentStep === st.num;
          return (
            <div key={st.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : st.num}
                </div>
                <span
                  className={`mt-1 text-[11px] font-semibold text-center leading-tight ${
                    isDone
                      ? 'text-emerald-700'
                      : isCurrent
                      ? 'text-[#2563EB]'
                      : 'text-slate-400'
                  }`}
                >
                  {st.label}
                </span>
                <span className="text-[9px] text-slate-400">{st.sub}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1.5 transition-colors ${
                    currentStep > st.num || currentStep === 5
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
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

  // Quản lý danh sách đơn (lấy từ kho lưu trữ chung)
  const [requestsList, setRequestsList] = useState(() => getStoredRequests());
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Quản lý thông báo gửi về cho Quản trị viên
  const [showAdminNotifications, setShowAdminNotifications] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState(() =>
    getStoredNotifications('admin')
  );

  // Tự động đồng bộ danh sách đơn và thông báo khi chuyển tab hoặc khi có cập nhật
  useEffect(() => {
    setRequestsList(getStoredRequests());
    setAdminNotifications(getStoredNotifications('admin'));
  }, [activeTab]);

  useEffect(() => {
    const syncData = () => {
      setRequestsList(getStoredRequests());
      setAdminNotifications(getStoredNotifications('admin'));
    };
    window.addEventListener('vmh_notifications_updated', syncData);
    window.addEventListener('vmh_requests_updated', syncData);
    window.addEventListener('storage', syncData);
    return () => {
      window.removeEventListener('vmh_notifications_updated', syncData);
      window.removeEventListener('vmh_requests_updated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, []);

  const adminUnreadCount = useMemo(() => {
    return adminNotifications.filter((n) => !n.isRead).length;
  }, [adminNotifications]);

  // Quản lý danh mục các loại đơn đang có trong hệ thống (lưu trữ vĩnh viễn trên localStorage)
  const [requestTypes, setRequestTypes] = useState(() => getStoredRequestTypes());
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [selectedTypeCategory, setSelectedTypeCategory] = useState('all');

  // Modal thêm loại đơn mới bằng Chụp ảnh / Tải file
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('Học vụ & Đào tạo');
  const [newTypeDepartment, setNewTypeDepartment] = useState('Phòng Đào tạo & Quản lý Khoa học');
  const [newTypeSla, setNewTypeSla] = useState('3');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null); // { name, size, type, previewUrl, isImage, isDocx }
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [parsedFields, setParsedFields] = useState([]); // [{ id, label, type, required, placeholder }]
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [docxParseSummary, setDocxParseSummary] = useState('');

  // Xem chi tiết mẫu đơn đã có
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Refs cho camera và file upload
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Thao tác với các trường nhập liệu tùy biến
  const handleAddCustomField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: `Mục thông tin ${parsedFields.length + 1}`,
      type: 'text',
      required: true,
      placeholder: 'Nhập nội dung...',
    };
    setParsedFields((prev) => [...prev, newField]);
  };

  const handleUpdateCustomField = (id, key, val) => {
    setParsedFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: val } : f))
    );
  };

  const handleRemoveCustomField = (id) => {
    setParsedFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Modal xem chi tiết và Phân phát
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDocRequest, setViewDocRequest] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Form phân phối đơn
  const [dispatchType, setDispatchType] = useState('lecturer');
  const [targetId, setTargetId] = useState('');
  const [dispatchDeadline, setDispatchDeadline] = useState('3');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchUrgency, setDispatchUrgency] = useState('normal');

  // Modal từ chối tiếp nhận
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Modal đóng dấu & thông báo cho sinh viên (Quản trị viên thụ lý sau khi GV ký)
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('Phòng 102 - Tòa nhà A (Phòng Đào tạo)');
  const [adminFinalizeNote, setAdminFinalizeNote] = useState(
    'Đã đối chiếu xác nhận chữ ký của GVCN, đóng dấu số và hoàn tất xử lý. Sinh viên có thể đến nhận bản cứng hoặc tải bản số hóa.'
  );

  // Tên cán bộ quản lý
  const adminName = user?.fullName || 'Quản trị viên';
  const adminInitial = 'QL';

  // Thống kê số lượng
  const stats = useMemo(() => {
    const pendingCount = requestsList.filter((r) => r.status === 'pending').length;
    const teacherApprovedCount = requestsList.filter((r) => r.status === 'teacher_approved').length;
    const completedCount = requestsList.filter((r) => r.status === 'completed').length;
    const overdueCount = requestsList.filter((r) => r.status === 'overdue').length;
    return { pendingCount, teacherApprovedCount, completedCount, overdueCount };
  }, [requestsList]);

  // Lọc danh sách theo các tiêu chí
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
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

      if (selectedCohort !== 'Tất cả' && req.cohort !== selectedCohort) return false;
      if (selectedFaculty !== 'Tất cả' && req.faculty !== selectedFaculty) return false;
      if (selectedMajor !== 'Tất cả' && req.major !== selectedMajor) return false;
      if (selectedClass !== 'Tất cả' && req.className !== selectedClass) return false;

      if (selectedStatus === 'pending' && req.status !== 'pending') return false;
      if (selectedStatus === 'in_progress' && req.status !== 'in_progress') return false;
      if (selectedStatus === 'teacher_approved' && req.status !== 'teacher_approved') return false;
      if (selectedStatus === 'completed' && req.status !== 'completed') return false;
      if (selectedStatus === 'overdue' && req.status !== 'overdue') return false;

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

  // Lọc danh mục loại đơn đang có
  const filteredRequestTypes = useMemo(() => {
    return requestTypes.filter((type) => {
      if (typeSearchTerm.trim()) {
        const q = typeSearchTerm.trim().toLowerCase();
        const match =
          type.name.toLowerCase().includes(q) ||
          type.code.toLowerCase().includes(q) ||
          type.description.toLowerCase().includes(q) ||
          type.departmentName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedTypeCategory !== 'all' && type.category !== selectedTypeCategory) {
        return false;
      }
      return true;
    });
  }, [requestTypes, typeSearchTerm, selectedTypeCategory]);

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

  // Tự sinh mã loại đơn từ tên tiếng Việt
  const handleNameChange = (name) => {
    setNewTypeName(name);
    // Tự sinh mã gợi ý (ví dụ: "Đơn xin rút học phần" -> "RUT_HOC_PHAN")
    const cleanStr = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/^don xin /i, '')
      .replace(/^don /i, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    if (cleanStr && cleanStr !== '_') {
      setNewTypeCode(cleanStr);
    }
  };

  // Xử lý khi chọn file tải lên (Word .docx, Ảnh hoặc PDF)
  const handleFileSelected = async (file) => {
    if (!file) return;
    const isDocx = file.name.endsWith('.docx') || file.type?.includes('wordprocessingml');
    const isImg = file.type?.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFile({
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: file.type,
          previewUrl: e.target.result,
          isImage: true,
          isDocx: false,
          isPdf: false,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFile({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || (isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream'),
        previewUrl: null,
        isImage: false,
        isDocx: isDocx,
        isPdf: isPdf,
      });
    }

    if (isDocx) {
      try {
        setIsParsingDocx(true);
        setDocxParseSummary('Đang tự động đọc nội dung và cấu trúc file Word...');
        const res = await parseDocxFile(file);
        if (res?.success) {
          if (res.title) {
            handleNameChange(res.title);
          }
          if (res.suggestedCode) {
            setNewTypeCode(res.suggestedCode);
          }
          if (res.category) {
            setNewTypeCategory(res.category);
          }
          if (res.department) {
            setNewTypeDepartment(res.department);
          }
          if (res.customFields && Array.isArray(res.customFields) && res.customFields.length > 0) {
            setParsedFields(res.customFields);
          }
          setDocxParseSummary(
            `Đã đọc file Word thành công! Bóc tách được ${res.customFields?.length || 0} trường nhập liệu và khớp với đơn vị "${res.department}".`
          );
        }
      } catch (err) {
        console.error('Lỗi khi bóc tách file Word docx:', err);
        setDocxParseSummary(`Không thể tự động bóc tách (${err.message}). Bạn vẫn có thể tùy chỉnh các trường bên dưới.`);
      } finally {
        setIsParsingDocx(false);
      }
    } else {
      // Nếu chưa có tên đơn, gợi ý theo tên file
      if (!newTypeName.trim()) {
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        handleNameChange(rawName.charAt(0).toUpperCase() + rawName.slice(1));
      }
    }
  };

  // Bật camera để chụp ảnh mẫu đơn trực tiếp
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Lỗi khi truy cập camera:', err);
      alert('Không thể truy cập camera. Vui lòng cho phép quyền camera trên trình duyệt hoặc sử dụng nút "Tải file lên" từ máy tính.');
      setIsCameraActive(false);
    }
  };

  // Chụp ảnh từ camera video feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    setUploadedFile({
      name: `Mau_Don_Chup_${new Date().getTime().toString().slice(-6)}.jpg`,
      size: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`,
      type: 'image/jpeg',
      previewUrl: dataUrl,
      isImage: true,
    });
  };

  // Tắt camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Xử lý lưu loại đơn mới (lưu vào localStorage vĩnh viễn)
  const handleSaveNewRequestType = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newTypeItem = {
      id: `rt-${Date.now()}`,
      code: newTypeCode.trim() || `DON_${Date.now().toString().slice(-4)}`,
      name: newTypeName.trim(),
      category: newTypeCategory,
      departmentName: newTypeDepartment,
      slaDays: parseInt(newTypeSla, 10) || 3,
      description: newTypeDescription.trim() || 'Thủ tục được số hóa từ mẫu đơn mới do Quản lý tải lên.',
      isActive: true,
      hasTemplateFile: Boolean(uploadedFile),
      templateFileName: uploadedFile ? uploadedFile.name : 'Chua_co_file_mau.pdf',
      templateFileSize: uploadedFile ? uploadedFile.size : '—',
      templateFileUrl: uploadedFile ? uploadedFile.previewUrl : null,
      isImage: uploadedFile ? uploadedFile.isImage : false,
      fields: parsedFields,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    const updatedTypes = [newTypeItem, ...requestTypes];
    setRequestTypes(updatedTypes);
    saveStoredRequestTypes(updatedTypes);

    // Chuyển bộ lọc danh mục về 'all' và xóa từ khóa tìm kiếm để loại đơn mới xuất hiện ngay đầu danh sách
    setSelectedTypeCategory('all');
    setTypeSearchTerm('');

    setIsAddTypeModalOpen(false);
    stopCamera();

    // Reset form
    setNewTypeName('');
    setNewTypeCode('');
    setNewTypeDescription('');
    setUploadedFile(null);
    setParsedFields([]);
    setDocxParseSummary('');

    setActionSuccessMsg(`Đã tạo và số hóa thành công loại đơn mới: "${newTypeItem.name}"!`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Bật/tắt trạng thái loại đơn
  const handleToggleTypeStatus = (typeId) => {
    const updated = requestTypes.map((t) =>
      t.id === typeId ? { ...t, isActive: !t.isActive } : t
    );
    setRequestTypes(updated);
    saveStoredRequestTypes(updated);
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

    const updatedList = requestsList.map((item) => {
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
    });

    setRequestsList(updatedList);
    saveStoredRequests(updatedList);

    setIsDispatchModalOpen(false);
    setSelectedRequest(null);
    setActionSuccessMsg(`Đã phân phát thành công đơn ${selectedRequest.id} tới ${targetInfo.name}!`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Thu hồi phân phát về hàng đợi tiếp nhận
  const handleRevokeDispatch = (req) => {
    const updatedList = requestsList.map((r) =>
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
    );
    setRequestsList(updatedList);
    saveStoredRequests(updatedList);
    setActionSuccessMsg(`Đã thu hồi đơn ${req.id} về hàng đợi chờ phân phối!`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Từ chối tiếp nhận đơn
  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!selectedRequest || !rejectReason.trim()) return;

    const updatedList = requestsList.map((r) =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'rejected',
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
    );

    setRequestsList(updatedList);
    saveStoredRequests(updatedList);
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
    setActionSuccessMsg(`Đã từ chối tiếp nhận đơn ${selectedRequest.id}. Hệ thống đã gửi thông báo đến sinh viên.`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Mở modal đóng dấu & ban hành kết quả cho sinh viên (khi GV đã duyệt xong)
  const handleOpenFinalize = (req) => {
    setSelectedRequest(req);
    setPickupLocation('Phòng 102 - Tòa nhà A (Phòng Đào tạo)');
    setAdminFinalizeNote(
      'Đã đối chiếu xác nhận chữ ký của GVCN, đóng dấu số và hoàn tất xử lý. Sinh viên có thể đến nhận bản cứng hoặc tải bản số hóa.'
    );
    setIsFinalizeModalOpen(true);
  };

  // Xác nhận đóng dấu và ban hành thông báo đến sinh viên qua web
  const handleConfirmFinalize = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const updated = finalizeAndNotifyStudentByAdmin(selectedRequest.id, {
      pickupLocation,
      adminName: user?.fullName || 'Quản trị viên',
      adminNote: adminFinalizeNote,
    });
    setRequestsList(updated);
    setIsFinalizeModalOpen(false);
    const updatedTarget = updated.find((r) => r.id === selectedRequest.id);
    setSelectedRequest(updatedTarget || null);
    setActionSuccessMsg(
      `Đã đóng dấu phê duyệt và gửi thông báo hoàn tất đơn ${selectedRequest.id} tới sinh viên!`
    );
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Render Sidebar trái: Đã thay Chữ ký cá nhân bằng "Các loại đơn đang có"
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="flex items-center gap-3 px-2 pt-1 pb-6">
          <img
            src={logoSrc}
            alt="Logo Cao đẳng Việt Mỹ Hà Nội"
            className="h-11 w-auto max-w-[115px] object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-slate-800">Admin Portal</p>
            <p className="truncate text-[11px] text-slate-500">Quản trị viên</p>
          </div>
        </div>

        <nav className="space-y-1.5" aria-label="Menu quản lý">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${isActive
                    ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,0.6)]'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'pending-dispatch' && (stats.pendingCount + stats.teacherApprovedCount) > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white text-[#2563EB]' : 'bg-blue-100 text-[#2563EB]'
                      }`}
                  >
                    {stats.pendingCount + stats.teacherApprovedCount}
                  </span>
                )}
                {item.id === 'request-types' && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white text-[#2563EB]' : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {requestTypes.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

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
    <div className="flex min-h-screen bg-slate-900/5 text-slate-800">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/95 shadow-sm lg:block">
        <div className="sticky top-0 h-screen">{renderSidebarContent()}</div>
      </aside>

      {/* Sidebar Mobile */}
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

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={activeTab === 'request-types' ? typeSearchTerm : searchTerm}
                onChange={(e) => {
                  if (activeTab === 'request-types') {
                    setTypeSearchTerm(e.target.value);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                placeholder={
                  activeTab === 'request-types'
                    ? 'Tìm kiếm loại đơn, mã thủ tục...'
                    : 'Tìm kiếm loại đơn, sinh viên, lớp...'
                }
                className="w-full rounded-xl border border-slate-200/80 bg-[#F4F7FE] py-2 pr-4 pl-10 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {/* Chuông thông báo hồ sơ gửi về cho Quản trị viên */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAdminNotifications((prev) => !prev)}
                className="relative cursor-pointer rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-xs ring-2 ring-white leading-none">
                    {adminUnreadCount > 99 ? '99+' : adminUnreadCount}
                  </span>
                )}
              </button>

              {/* Popover danh sách thông báo gửi về cho Quản trị viên */}
              {showAdminNotifications && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#2563EB]" />
                      <h4 className="text-sm font-bold text-slate-800">Thông báo hồ sơ gửi về</h4>
                    </div>
                    {adminNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          markAllNotificationsAsRead('admin');
                          setAdminNotifications(getStoredNotifications('admin'));
                        }}
                        className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {adminNotifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Chưa có thông báo hồ sơ nào gửi về.
                      </p>
                    ) : (
                      adminNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`rounded-xl border p-3 text-xs transition-colors ${
                            notif.isRead
                              ? 'border-slate-100 bg-slate-50/60 text-slate-600'
                              : 'border-blue-200 bg-blue-50/50 text-slate-800 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800">{notif.title}</p>
                            {!notif.isRead && (
                              <button
                                type="button"
                                onClick={() => {
                                  markNotificationAsRead(notif.id);
                                  setAdminNotifications(getStoredNotifications('admin'));
                                }}
                                className="cursor-pointer text-[10px] font-semibold text-[#2563EB] hover:underline"
                              >
                                Đã xem
                              </button>
                            )}
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-600">{notif.message || notif.body}</p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{notif.time}</span>
                            {notif.requestId && (
                              <button
                                type="button"
                                onClick={() => {
                                  markNotificationAsRead(notif.id);
                                  setAdminNotifications(getStoredNotifications('admin'));
                                  setShowAdminNotifications(false);
                                  setActiveTab('pending-dispatch');
                                }}
                                className="cursor-pointer font-semibold text-[#2563EB] hover:underline"
                              >
                                Mở xử lý &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#F6F9FF] via-[#EFF4FF] to-[#E9F0FF] p-6 ring-1 ring-blue-100/70 md:flex-row md:items-center md:px-8 md:py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
                    Xin chào, {adminName}!
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                    Trung tâm tiếp nhận & phân phối hồ sơ sinh viên Quản trị viên. Chúc bạn làm việc hiệu quả!
                  </p>
                </div>
                <div className="hidden md:block">
                  <AdminIllustration />
                </div>
              </section>

              {/* 3 Thẻ thống kê */}
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

              {/* Cảnh báo khi có đơn GV đã duyệt xong chờ Quản trị viên đóng dấu & trả kết quả */}
              {stats.teacherApprovedCount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-950">
                        Có {stats.teacherApprovedCount} đơn Giảng viên đã duyệt & ký số thành công!
                      </h4>
                      <p className="text-xs text-indigo-700">
                        Hồ sơ đang chờ Quản trị viên kiểm tra, đóng dấu và gửi thông báo hoàn tất đến sinh viên qua web.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus('teacher_approved');
                      setActiveTab('pending-dispatch');
                    }}
                    className="cursor-pointer shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 shadow-xs"
                  >
                    Xem & Đóng dấu ngay
                  </button>
                </div>
              )}

              {/* Bảng Đơn cần tiếp nhận & phân phối */}
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

                {/* 5 Bộ lọc thả xuống */}
                <div className="mb-5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Khóa học</label>
                      <select
                        value={selectedCohort}
                        onChange={(e) => setSelectedCohort(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {COHORT_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Khoa</label>
                      <select
                        value={selectedFaculty}
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {FACULTY_OPTIONS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Ngành học</label>
                      <select
                        value={selectedMajor}
                        onChange={(e) => setSelectedMajor(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {MAJOR_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Lớp học</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {CLASS_OPTIONS.map((cl) => (
                          <option key={cl} value={cl}>{cl}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Trạng thái đơn</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none"
                      >
                        {STATUS_FILTER_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BẢNG DANH SÁCH ĐƠN */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                        <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
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
                          <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                            Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800 whitespace-nowrap">{req.typeName}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <p className="font-medium text-slate-800">{req.studentName} <span className="text-slate-400 font-normal">({req.studentCode})</span></p>
                              <p className="text-xs text-slate-400">{req.className}</p>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{req.createdAt}</td>
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
                                  <Clock className="h-3 w-3" /> Chờ phân phát
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
                                  onClick={() => setViewDocRequest(req)}
                                  className="cursor-pointer rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-blue-50"
                                  title="Mở toàn văn văn bản đơn A4"
                                >
                                  Mở đơn
                                </button>
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
                                {req.status === 'teacher_approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFinalize(req)}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 shadow-xs"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Đóng dấu & Báo SV</span>
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

          {/* TAB 2: ĐƠN CẦN XỬ LÝ */}
          {activeTab === 'pending-dispatch' && (
            <div className="space-y-6">
              {/* PHẦN 1: ĐƠN GV ĐÃ DUYỆT - CHỜ QUẢN TRỊ VIÊN ĐÓNG DẤU & THÔNG BÁO SV */}
              <section className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs sm:p-6 ring-2 ring-indigo-100">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h1 className="text-xl font-bold text-slate-800">
                        Đơn GV đã duyệt — Chờ Quản trị viên đóng dấu & Trả kết quả ({stats.teacherApprovedCount})
                      </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Giáo viên chủ nhiệm đã ký số điện tử. Cán bộ Quản trị viên đối chiếu, đóng dấu và gửi thông báo hoàn thành đến sinh viên qua web.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-indigo-100 text-xs font-semibold text-slate-500 bg-indigo-50/50">
                        <th className="py-3 pr-4 pl-3 font-semibold text-slate-700">Loại đơn</th>
                        <th className="px-4 py-3">Sinh viên</th>
                        <th className="px-4 py-3">GV ký duyệt</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="py-3 pr-3 pl-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestsList.filter((r) => r.status === 'teacher_approved').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                            Hiện không có đơn nào đang chờ Quản trị viên đóng dấu.
                          </td>
                        </tr>
                      ) : (
                        requestsList
                          .filter((r) => r.status === 'teacher_approved')
                          .map((req) => (
                            <tr key={req.id} className="transition-colors hover:bg-indigo-50/40">
                              <td className="py-3.5 pr-4 pl-3 font-semibold text-slate-800 whitespace-nowrap">{req.typeName}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <p className="font-medium text-slate-800">{req.studentName} <span className="text-slate-400 font-normal">({req.studentCode})</span></p>
                                <p className="text-xs text-slate-400">{req.className}</p>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <p className="font-semibold text-purple-700 text-xs">{req.teacherApprovedBy || req.assignedTo?.name || 'GVCN'}</p>
                                <span className="text-[10px] text-slate-400">Đã ký số</span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <StatusPill status={req.status} label={req.statusLabel} />
                              </td>
                              <td className="py-3.5 pr-3 pl-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
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
                                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    Chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFinalize(req)}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 shadow-xs"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Đóng dấu & Báo SV</span>
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

              {/* PHẦN 2: ĐƠN CHỜ TIẾP NHẬN & PHÂN LUỒNG */}
              <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Danh sách đơn chờ tiếp nhận & phân luồng ({stats.pendingCount})
                    </h2>
                    <p className="text-sm text-slate-500">
                      Hồ sơ mới từ sinh viên cần điều phối tới Giảng viên chủ nhiệm hoặc Phòng ban phụ trách.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                        <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
                        <th className="px-4 py-3">Sinh viên</th>
                        <th className="px-4 py-3">Ngày tạo</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestsList.filter((r) => r.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                            Không có đơn nào đang chờ phân luồng.
                          </td>
                        </tr>
                      ) : (
                        requestsList
                          .filter((r) => r.status === 'pending')
                          .map((req) => (
                            <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                              <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800 whitespace-nowrap">{req.typeName}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <p className="font-medium text-slate-800">{req.studentName} <span className="text-slate-400 font-normal">({req.studentCode})</span></p>
                                <p className="text-xs text-slate-400">{req.className}</p>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{req.createdAt}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <StatusPill status={req.status} label={req.statusLabel} />
                              </td>
                              <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
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
                                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    Chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDispatch(req)}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
                                  >
                                    <SendHorizontal className="h-3.5 w-3.5" />
                                    <span>Phân phát</span>
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

          {/* TAB 3: CÁC LOẠI ĐƠN ĐANG CÓ (THAY CHO CHỮ KÝ CỦA TÔI) */}
          {activeTab === 'request-types' && (
            <div className="space-y-6">
              {/* Header của tab */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-6 w-6 text-[#2563EB]" />
                    <h1 className="text-xl font-bold text-slate-800">Các loại đơn đang có</h1>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Danh mục tất cả các thủ tục giấy tờ đang áp dụng trên hệ thống ({requestTypes.length} loại đơn).
                  </p>
                </div>

                {/* NÚT THÊM ĐƠN MỚI BẰNG CHỤP ẢNH / TẢI FILE */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTypeModalOpen(true);
                    setUploadedFile(null);
                    setNewTypeName('');
                    setNewTypeCode('');
                    setNewTypeDescription('');
                  }}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] transition-all hover:bg-blue-700 active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span>Thêm đơn mới (Chụp / Tải file)</span>
                </button>
              </div>

              {/* Bộ lọc loại đơn theo danh mục */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Tất cả danh mục' },
                  { id: 'Xác nhận học tập', label: 'Xác nhận học tập' },
                  { id: 'Học vụ & Đào tạo', label: 'Học vụ & Đào tạo' },
                  { id: 'Khảo thí & Điểm', label: 'Khảo thí & Điểm' },
                  { id: 'Học phí & Tài chính', label: 'Học phí & Tài chính' },
                  { id: 'Đời sống sinh viên', label: 'Đời sống sinh viên' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedTypeCategory(cat.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${selectedTypeCategory === cat.id
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Danh sách lưới các loại đơn */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredRequestTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div>
                      {/* Top card: Mã đơn, Badge danh mục và Switch bật/tắt */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#2563EB] tracking-wider uppercase">
                            {type.code}
                          </span>
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {type.category}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTypeStatus(type.id)}
                          className="cursor-pointer text-xs font-medium flex items-center gap-1"
                          title={type.isActive ? 'Đang mở (Bấm để tạm dừng)' : 'Đang đóng (Bấm để mở lại)'}
                        >
                          {type.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              Đang mở
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                              <span className="h-2 w-2 rounded-full bg-slate-400" />
                              Tạm ngưng
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Tên loại đơn */}
                      <h3 className="text-base font-bold text-slate-800 leading-snug">
                        {type.name}
                      </h3>

                      {/* Mô tả */}
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {type.description}
                      </p>
                    </div>

                    {/* Thông tin phòng ban & File mẫu đính kèm */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{type.departmentName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>SLA: {type.slaDays} ngày</span>
                        </div>
                      </div>

                      {/* File mẫu đính kèm */}
                      <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#2563EB] shrink-0">
                            {type.isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div className="truncate text-left leading-tight">
                            <p className="font-semibold text-slate-700 truncate">{type.templateFileName}</p>
                            <p className="text-[10px] text-slate-400">{type.templateFileSize}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setViewingTemplate(type)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem mẫu</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LỊCH SỬ XỬ LÝ */}
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
                      <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">Người/Phòng thụ lý</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="py-3 pr-2 pl-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requestsList.map((req) => (
                      <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800 whitespace-nowrap">{req.typeName}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{req.studentName} ({req.studentCode})</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          {req.assignedTo ? req.assignedTo.name : 'Chưa phân phát'}
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
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Xem
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

          {/* TAB 5: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin tài khoản Quản lý</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Mã quản lý:</span>{' '}
                  <span className="font-semibold text-slate-800">{user?.code || 'admincdvmhn'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Họ và tên:</span>{' '}
                  <span className="font-semibold text-slate-800">{adminName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-semibold text-slate-800">{user?.email || 'admin@caodangvietmyhanoi.edu.vn'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Bộ phận:</span>{' '}
                  <span className="font-semibold text-slate-800">Quản trị viên & Quản lý Đào tạo</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: THÊM LOẠI ĐƠN MỚI (CHỤP ẢNH TỪ CAMERA HOẶC TẢI FILE LÊN) */}
      {isAddTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Thêm loại đơn mới vào hệ thống</h3>
                <p className="text-xs text-slate-500">Chụp ảnh hoặc tải file mẫu đơn giấy lên để tự động số hóa</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsAddTypeModalOpen(false);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveNewRequestType} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              {/* VÙNG CHỤP ẢNH HOẶC TẢI FILE MẪU ĐƠN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Chụp ảnh hoặc tải file mẫu đơn lên:
                </label>

                {/* Nếu Camera đang bật */}
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#2563EB]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="rounded-full bg-white px-5 py-2 text-xs font-bold text-[#2563EB] shadow-lg hover:bg-blue-50 transition-all flex items-center gap-1.5"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Chụp ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-full bg-black/60 backdrop-blur-sm px-4 py-2 text-xs font-medium text-white hover:bg-black/80"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : uploadedFile ? (
                  /* Đã có file tải lên / vừa chụp xong */
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đã tải file mẫu thành công</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Xóa / Chọn lại
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {uploadedFile.isImage ? (
                        <div className="h-24 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img
                            src={uploadedFile.previewUrl}
                            alt="Bản xem trước mẫu đơn"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : uploadedFile.isDocx ? (
                        <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                          <FileText className="h-7 w-7 mb-0.5" />
                          <span className="text-[10px] font-bold tracking-wider">DOCX</span>
                        </div>
                      ) : (
                        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold text-xs">
                          PDF
                        </div>
                      )}

                      <div className="min-w-0 text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{uploadedFile.name}</p>
                        <p>Dung lượng: {uploadedFile.size}</p>
                        <p className="text-emerald-700 font-medium flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> File sẽ được lưu trữ tự động trên hệ thống
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Hộp Dropzone để chọn file hoặc chụp ảnh */
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:border-[#2563EB] transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,.pdf"
                      onChange={(e) => handleFileSelected(e.target.files?.[0])}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelected(e.target.files?.[0])}
                      className="hidden"
                    />

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] mb-3">
                      <FileUp className="h-6 w-6" />
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      Tải file mẫu đơn Word (.docx) / PDF / Ảnh chụp hoặc Chụp trực tiếp
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Hệ thống tự động đọc cấu trúc file Word và chuyển thành biểu mẫu nhập liệu
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Chọn file Word (.docx) / PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Chụp ảnh từ Camera</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Trạng thái bóc tách file Word */}
                {isParsingDocx && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent shrink-0" />
                    <span>Đang tự động đọc cấu trúc văn bản và bóc tách câu hỏi từ file Word...</span>
                  </div>
                )}

                {docxParseSummary && !isParsingDocx && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{docxParseSummary}</span>
                  </div>
                )}
              </div>

              {/* THÔNG TIN LOẠI ĐƠN */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Thông tin mô tả loại đơn:
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên loại đơn / thủ tục: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Đơn xin chuyển ngành, Đơn đăng ký học vượt, Đơn cấp lại thẻ SV..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã thủ tục (Gợi ý):
                    </label>
                    <input
                      type="text"
                      value={newTypeCode}
                      onChange={(e) => setNewTypeCode(e.target.value.toUpperCase())}
                      placeholder="VD: CHUYEN_NGANH"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-[#2563EB] focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Danh mục:
                    </label>
                    <select
                      value={newTypeCategory}
                      onChange={(e) => setNewTypeCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="Xác nhận học tập">Xác nhận học tập</option>
                      <option value="Học vụ & Đào tạo">Học vụ & Đào tạo</option>
                      <option value="Khảo thí & Điểm">Khảo thí & Điểm</option>
                      <option value="Học phí & Tài chính">Học phí & Tài chính</option>
                      <option value="Đời sống sinh viên">Đời sống sinh viên</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Đơn vị phụ trách xử lý:
                    </label>
                    <select
                      value={newTypeDepartment}
                      onChange={(e) => setNewTypeDepartment(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                      <option value="Giảng viên chủ nhiệm">Giảng viên chủ nhiệm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời hạn xử lý (SLA):
                    </label>
                    <select
                      value={newTypeSla}
                      onChange={(e) => setNewTypeSla(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="1">Trong 24 giờ (1 ngày)</option>
                      <option value="2">2 ngày làm việc</option>
                      <option value="3">3 ngày làm việc</option>
                      <option value="5">5 ngày làm việc</option>
                      <option value="7">7 ngày làm việc</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả & Hướng dẫn sinh viên:
                  </label>
                  <textarea
                    rows={2}
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    placeholder="Mô tả mục đích sử dụng đơn và các giấy tờ cần chuẩn bị..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. CẤU HÌNH CÁC TRƯỜNG NHẬP LIỆU (TỰ ĐỘNG BÓC TÁCH HOẶC TỰ THÊM) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3. Các trường thông tin cần điền ({parsedFields.length} trường):
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tự động trích xuất từ file Word. Sinh viên sẽ điền trực tiếp trên hệ thống các trường này.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-100 transition-colors shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm trường</span>
                  </button>
                </div>

                {parsedFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
                    Chưa có trường nhập liệu riêng. Khi bạn chọn file Word (.docx), hệ thống sẽ tự động bóc tách các dòng câu hỏi thành form tại đây.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {parsedFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 hover:border-blue-200 transition-colors"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-[140px]">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                            placeholder="Tên câu hỏi / trường nhập..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          />
                        </div>
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateCustomField(field.id, 'type', e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-[#2563EB] focus:outline-none shrink-0"
                        >
                          <option value="text">Chữ ngắn (text)</option>
                          <option value="number">Số (number)</option>
                          <option value="date">Ngày tháng (date)</option>
                          <option value="textarea">Văn bản dài (textarea)</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-slate-600 whitespace-nowrap cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateCustomField(field.id, 'required', e.target.checked)}
                            className="rounded border-slate-300 text-[#2563EB] focus:ring-0"
                          />
                          <span>Bắt buộc</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(field.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          title="Xóa trường này"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsAddTypeModalOpen(false);
                    setParsedFields([]);
                    setDocxParseSummary('');
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Lưu & Thêm loại đơn này</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM TRƯỚC MẪU ĐƠN */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{viewingTemplate.name}</h3>
                  <p className="text-xs text-slate-500">
                    Mã: <span className="font-semibold text-blue-600">{viewingTemplate.code}</span> • Đơn vị: {viewingTemplate.departmentName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewingTemplate.templateFileUrl && (
                  <a
                    href={viewingTemplate.templateFileUrl}
                    download={viewingTemplate.templateFileName || 'mau-don.pdf'}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải về</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingTemplate(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50">
              {/* Kiểm tra file mẫu để render xem trước chính xác: Ảnh, PDF hoặc Văn bản mẫu chuẩn */}
              {viewingTemplate.templateFileUrl ? (
                viewingTemplate.isImage ||
                (typeof viewingTemplate.templateFileUrl === 'string' &&
                  viewingTemplate.templateFileUrl.startsWith('data:image')) ? (
                  /* Hiển thị xem trước ảnh */
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-sm flex items-center justify-center">
                    <img
                      src={viewingTemplate.templateFileUrl}
                      alt={viewingTemplate.name}
                      className="w-auto h-auto max-h-[560px] object-contain rounded"
                    />
                  </div>
                ) : (
                  /* Hiển thị xem trước file PDF qua iframe */
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <iframe
                      src={viewingTemplate.templateFileUrl}
                      title={viewingTemplate.name}
                      className="w-full h-[560px] border-0"
                    />
                  </div>
                )
              ) : (
                /* Với các đơn mặc định chưa upload file: Render văn bản hành chính mẫu A4 chuẩn Times New Roman */
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
                  <OfficialDocumentView
                    request={{
                      id: viewingTemplate.code,
                      typeName: viewingTemplate.name,
                      typeCategory: viewingTemplate.category,
                      studentName: 'NGUYỄN VĂN TIẾN',
                      studentCode: '61112420189',
                      phone: '',
                      dob: '27/09/2006',
                      pob: 'Hà Nội',
                      idCardNumber: '001206023295',
                      idCardDate: '20/06/2021',
                      idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
                      faculty: 'Công nghệ - Thiết kế',
                      major: 'Ứng dụng phần mềm (VIS)',
                      className: 'UDPM24-01',
                      campus: 'Trịnh Văn Bô',
                      trainingSystem: 'Chính quy',
                      createdAt: new Date().toLocaleDateString('vi-VN'),
                      reason: viewingTemplate.description,
                      studentSignature: '',
                      teacherSignature: '',
                    }}
                  />
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span><strong>Tệp đính kèm:</strong> {viewingTemplate.templateFileName}</span>
                  <span><strong>Dung lượng:</strong> {viewingTemplate.templateFileSize}</span>
                </div>
                <div><strong>Mô tả thủ tục:</strong> {viewingTemplate.description}</div>
                <div><strong>Thời hạn xử lý (SLA):</strong> {viewingTemplate.slaDays} ngày làm việc kể từ khi nhận đủ hồ sơ</div>
                {viewingTemplate.fields && viewingTemplate.fields.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <strong className="text-blue-700 block mb-1">
                      Các trường số hóa tự động ({viewingTemplate.fields.length} trường):
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingTemplate.fields.map((f, i) => (
                        <span
                          key={f.id || i}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-800"
                        >
                          {f.label} ({f.type === 'textarea' ? 'Văn bản dài' : f.type === 'date' ? 'Ngày tháng' : f.type === 'number' ? 'Số' : 'Chữ'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 px-6 py-3 bg-white">
              <button
                type="button"
                onClick={() => setViewingTemplate(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÂN PHÁT ĐƠN CHO GV HOẶC PHÒNG BAN */}
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
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${dispatchType === 'lecturer'
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
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${dispatchType === 'department'
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

      {/* MODAL XEM CHI TIẾT ĐƠN */}
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
              {/* Thanh tiến trình 4 chặng theo dõi trực quan */}
              <WorkflowTimeline status={selectedRequest.status} />

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

              {/* Hiển thị xác nhận chữ ký của Giảng viên nếu đã duyệt */}
              {selectedRequest.teacherSignature && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-indigo-600" />
                      Chữ ký phê duyệt của Giảng viên chủ nhiệm
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      Đã ký số điện tử
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex h-16 w-36 items-center justify-center rounded-lg border border-indigo-200 bg-white p-1 shadow-xs">
                      <img
                        src={selectedRequest.teacherSignature}
                        alt="Chữ ký GVCN"
                        className="max-h-14 max-w-[130px] object-contain"
                      />
                    </div>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      <p className="font-bold text-slate-900">
                        {selectedRequest.teacherApprovedBy || selectedRequest.assignedTo?.name || 'Giảng viên chủ nhiệm'}
                      </p>
                      <p className="text-slate-500">Đã kiểm duyệt thông tin & đồng ý đề xuất của sinh viên.</p>
                      <p className="font-semibold text-indigo-700">Chờ Quản trị viên đối chiếu, đóng dấu và thông báo sinh viên.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin đóng dấu Quản trị viên nếu đã hoàn thành */}
              {selectedRequest.status === 'completed' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1.5 text-xs text-emerald-900">
                  <p className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Đã hoàn tất đóng dấu & Ban hành
                  </p>
                  <p>Địa điểm nhận: <strong>{selectedRequest.pickupLocation || 'Phòng 102 - Tòa nhà A'}</strong></p>
                  {selectedRequest.adminNote && <p className="italic text-slate-600">Ghi chú: "{selectedRequest.adminNote}"</p>}
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nhật ký chuyển giao hồ sơ</div>
                <div className="space-y-2">
                  {(selectedRequest.logs || []).map((log, index) => (
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setViewDocRequest(selectedRequest)}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-100"
                >
                  <Eye className="h-4 w-4" />
                  <span>Mở văn bản A4</span>
                </button>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
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

              {selectedRequest.status === 'teacher_approved' && (
                <button
                  type="button"
                  onClick={() => handleOpenFinalize(selectedRequest)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đóng dấu & Thông báo cho SV</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐÓNG DẤU & BAN HÀNH CHO SINH VIÊN */}
      {isFinalizeModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-4 flex items-center justify-between text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-base">Đóng dấu số & Ban hành cho Sinh viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmFinalize} className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1">
                <p>
                  Mã đơn: <strong className="text-slate-800">{selectedRequest.id}</strong> — Loại đơn: <strong className="text-slate-800">{selectedRequest.typeName}</strong>
                </p>
                <p>
                  Sinh viên: <strong className="text-slate-800">{selectedRequest.studentName}</strong> ({selectedRequest.studentCode}) - Lớp {selectedRequest.className}
                </p>
                <p className="text-indigo-700 font-medium">
                  ✓ Giảng viên chủ nhiệm đã duyệt & ký số điện tử.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Địa điểm nhận kết quả bản cứng (Gửi kèm thông báo đến SV):
                </label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Ví dụ: Phòng 102 - Tòa nhà A (Phòng Đào tạo)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ghi chú hướng dẫn cho sinh viên:
                </label>
                <textarea
                  rows={3}
                  value={adminFinalizeNote}
                  onChange={(e) => setAdminFinalizeNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc nhắc nhở khi sinh viên đến nhận..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác nhận Đóng dấu & Ban hành</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI ĐƠN */}
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
      {/* MODAL XEM TOÀN VĂN ĐƠN A4 CHO QUẢN TRỊ VIÊN */}
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
