import { useState, useMemo, useEffect, useRef } from 'react';
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
  Upload,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_LOGO_SRC } from './LoginPage';
import SignatureManager from '../components/SignatureManager';
import OfficialDocumentView from '../components/OfficialDocumentView';
import { triggerPrintClean } from '../utils/printHelper';
import {
  getStoredRequests,
  saveStoredRequests,
  signAndApproveByTeacher,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../components/mockRequestsStore';
import {
  listStaffRequests,
  subscribeAllRequestsChange,
  signAndApproveRequest,
} from '../services/requestService';

/**
 * Xử lý tách nền ảnh chữ ký của Giảng viên (tách nền trắng/xám xuất PNG trong suốt)
 */
function processSignatureImage(imgElement, threshold = 205, inkColorMode = 'blue') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const maxDimension = 900;
  let width = imgElement.naturalWidth || imgElement.width;
  let height = imgElement.naturalHeight || imgElement.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imgElement, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const softEdge = 25;
  const lowerThreshold = Math.max(0, threshold - softEdge);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    if (brightness >= threshold) {
      data[i + 3] = 0;
    } else {
      let alpha = 255;
      if (brightness > lowerThreshold) {
        alpha = Math.round(((threshold - brightness) / softEdge) * 255);
      }
      data[i + 3] = alpha;

      if (inkColorMode === 'blue') {
        data[i] = 29;
        data[i + 1] = 78;
        data[i + 2] = 216;
      } else if (inkColorMode === 'black') {
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

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
  'Khoa Công nghệ thông tin',
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
  { value: 'teacher_approved', label: 'GV đã duyệt (Chờ Quản lý xác nhận)' },
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
        <span>GV đã duyệt (Chờ Quản lý xác nhận)</span>
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
 * Kiểm tra xem một hồ sơ đơn có được phân công cho cán bộ/giảng viên hiện tại hay không.
 * Nếu chưa được phân phát (chờ tiếp nhận) hoặc không được phân công cho người này thì KHÔNG hiển thị.
 */
function isRequestAssignedToUser(req, user) {
  if (!req || !user) return false;

  // 1. Nếu đơn chưa được phân phát (chờ tiếp nhận / unassigned) -> Cán bộ/GV KHÔNG được thấy
  if (!req.assignedSigners && !req.assignedTo) {
    return false;
  }
  if (req.distributionStatus === 'unassigned') {
    return false;
  }
  if (req.status === 'pending' && (!req.assignedSigners || req.assignedSigners.length === 0) && !req.assignedTo) {
    return false;
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const userCode = (user.staffCode || user.teacherCode || user.code || user.id || '').toLowerCase().trim();
  const userName = (user.fullName || '').toLowerCase().trim();
  const userDept = (user.department || user.donVi || '').toLowerCase().trim();

  // 2. Kiểm tra trong danh sách nhiều người ký (assignedSigners)
  if (Array.isArray(req.assignedSigners) && req.assignedSigners.length > 0) {
    return req.assignedSigners.some((signer) => {
      const sEmail = (signer.email || '').toLowerCase().trim();
      const sId = (signer.id || '').toLowerCase().trim();
      const sName = (signer.name || signer.displayName || '').toLowerCase().trim();
      const sDept = (signer.department || signer.donVi || signer.faculty || '').toLowerCase().trim();

      if (userEmail && sEmail && userEmail === sEmail) return true;
      if (userCode && sId && userCode === sId) return true;
      if (userName && sName && (userName === sName || sName.includes(userName) || userName.includes(sName))) return true;
      if (userDept && sDept && (userDept.includes(sDept) || sDept.includes(userDept))) return true;

      return false;
    });
  }

  // 3. Kiểm tra người được phân công đơn lẻ (assignedTo)
  if (req.assignedTo) {
    const target = req.assignedTo;
    const tEmail = (target.email || '').toLowerCase().trim();
    const tId = (target.id || '').toLowerCase().trim();
    const tName = (target.name || target.displayName || '').toLowerCase().trim();
    const tDept = (target.donVi || target.department || target.faculty || '').toLowerCase().trim();

    if (userEmail && tEmail && userEmail === tEmail) return true;
    if (userCode && tId && userCode === tId) return true;
    if (userName && tName && (userName === tName || tName.includes(userName) || userName.includes(tName))) return true;
    if (userDept && tDept && (userDept.includes(tDept) || tDept.includes(userDept))) return true;
  }

  return false;
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

  // Quản lý chữ ký điện tử của Giảng viên khi duyệt đơn
  const [teacherSignature, setTeacherSignature] = useState('');
  const [signatureMethod, setSignatureMethod] = useState('draw'); // 'draw' | 'upload'
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawColor, setDrawColor] = useState('#1D4ED8'); // Mặc định xanh dương (#1D4ED8)
  const teacherCanvasRef = useRef(null);
  const teacherFileInputRef = useRef(null);
  const [showConfirmSignModal, setShowConfirmSignModal] = useState(false);

  // Hàm tải dữ liệu hồ sơ thực tế từ Supabase database
  const loadRequestsFromSupabase = async () => {
    try {
      const res = await listStaffRequests();
      if (res?.data !== null && Array.isArray(res.data)) {
        setRequestsList(res.data);
        saveStoredRequests(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải requests từ Supabase (Teacher):', err);
    }
  };

  // Quản lý thông báo phân công cho Giảng viên
  const [showTeacherNotifications, setShowTeacherNotifications] = useState(false);
  const [teacherNotifications, setTeacherNotifications] = useState(() =>
    getStoredNotifications(user)
  );

  // Tự động đồng bộ danh sách đơn và thông báo khi chuyển tab hoặc khi có cập nhật
  useEffect(() => {
    loadRequestsFromSupabase();
    setTeacherNotifications(getStoredNotifications(user));
  }, [activeTab, user]);

  useEffect(() => {
    loadRequestsFromSupabase();

    // Lắng nghe Realtime bảng requests trên Supabase
    const unsub = subscribeAllRequestsChange((freshRequests) => {
      if (Array.isArray(freshRequests)) {
        setRequestsList(freshRequests);
        saveStoredRequests(freshRequests);
      }
    });

    const syncData = () => {
      setRequestsList(getStoredRequests());
      setTeacherNotifications(getStoredNotifications(user));
    };
    window.addEventListener('vmh_notifications_updated', syncData);
    window.addEventListener('vmh_requests_updated', syncData);
    window.addEventListener('storage', syncData);
    return () => {
      if (unsub) unsub();
      window.removeEventListener('vmh_notifications_updated', syncData);
      window.removeEventListener('vmh_requests_updated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, [user]);

  const teacherUnreadCount = useMemo(() => {
    return teacherNotifications.filter((n) => !n.isRead).length;
  }, [teacherNotifications]);

  // Lọc danh sách hồ sơ được phân công cho tài khoản cán bộ này
  // (Nếu chưa được phân phát hoặc không được phân công thì KHÔNG hiển thị)
  const myAssignedRequests = useMemo(() => {
    return requestsList.filter((req) => isRequestAssignedToUser(req, user));
  }, [requestsList, user]);

  // Thống kê số lượng đơn động của cán bộ này
  const stats = useMemo(() => {
    const pendingCount = myAssignedRequests.filter((r) => {
      const signers = Array.isArray(r.assignedSigners) && r.assignedSigners.length > 0
        ? r.assignedSigners
        : r.assignedTo ? [r.assignedTo] : [];

      const userEmail = (user?.email || '').toLowerCase().trim();
      const userCode = (user?.staffCode || user?.teacherCode || user?.code || user?.id || '').toLowerCase().trim();
      const userName = (user?.fullName || '').toLowerCase().trim();

      const mySlot = signers.find((s) => {
        const sEmail = (s.email || '').toLowerCase().trim();
        const sId = (s.id || '').toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        return (userEmail && sEmail && userEmail === sEmail) || (userCode && sId && userCode === sId) || (userName && sName && userName === sName);
      });

      const isSignedByMe = mySlot ? mySlot.status === 'signed' : Boolean(r.teacherSignature);
      return !isSignedByMe && (r.status === 'pending' || r.status === 'in_progress');
    }).length;

    const completedCount = myAssignedRequests.filter((r) => {
      return r.status === 'completed' || r.status === 'teacher_approved';
    }).length;

    const overdueCount = myAssignedRequests.filter((r) => r.status === 'overdue').length;

    return { pendingCount, completedCount, overdueCount };
  }, [myAssignedRequests, user]);

  // Danh sách hồ sơ đã hoàn tất / phê duyệt (lấy trực tiếp từ hồ sơ phân công của cán bộ này)
  const historyRequests = useMemo(() => {
    return myAssignedRequests.filter(
      (r) =>
        r.status === 'completed' ||
        r.status === 'teacher_approved' ||
        r.status === 'rejected'
    );
  }, [myAssignedRequests]);

  // Tên giáo viên và avatar
  const teacherName = user?.fullName || 'Giảng viên';
  const teacherInitial = user?.department?.includes('Khảo thí') ? 'KT' : 'GV';

  // Lọc danh sách theo từ khóa và các tiêu chí dropdown
  const filteredRequests = useMemo(() => {
    return myAssignedRequests.filter((req) => {
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
    myAssignedRequests,
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

  // Mở modal duyệt đơn và làm mới trạng thái chữ ký
  const handleOpenDetailModal = (req) => {
    setSelectedRequest(req);
    setTeacherSignature('');
    setHasDrawn(false);
    setSignatureMethod('draw');
  };

  const handleCloseDetailModal = () => {
    setSelectedRequest(null);
    setTeacherSignature('');
    setHasDrawn(false);
    setShowConfirmSignModal(false);
  };

  // Canvas vẽ tay trực tiếp của Giảng viên
  const handlePointerDown = (e) => {
    const canvas = teacherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = teacherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = teacherCanvasRef.current;
    if (canvas) {
      setTeacherSignature(canvas.toDataURL('image/png'));
    }
  };

  const handleClearDrawing = () => {
    const canvas = teacherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setTeacherSignature('');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const transparentResult = processSignatureImage(img, 205, 'blue');
        if (transparentResult) {
          setTeacherSignature(transparentResult);
          setHasDrawn(true);
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSavedSignature = () => {
    const saved = localStorage.getItem('vmh_saved_signature');
    if (saved) {
      setTeacherSignature(saved);
      setHasDrawn(true);
    } else {
      alert('Bạn chưa lưu chữ ký cá nhân trong tab "Chữ ký cá nhân". Vui lòng vẽ trực tiếp hoặc tải ảnh chữ ký vào khung.');
    }
  };

  // Bước 1: Khi GV ấn nút xác nhận ký -> kiểm tra chữ ký & mở modal xác nhận 2 lần
  const handleApproveRequest = () => {
    if (!teacherSignature || !teacherSignature.trim()) {
      alert('Vui lòng ký tên vào khung chữ ký trước khi ấn xác nhận phê duyệt đơn!');
      return;
    }
    setShowConfirmSignModal(true);
  };

  // Bước 2: Khi GV xác nhận chắc chắn muốn ký (không thể tự ý ký lại sau bước này)
  const handleExecuteApprove = async (reqId) => {
    const signerDetails = {
      name: teacherName,
      email: user?.email || '',
      id: user?.staffCode || user?.teacherCode || user?.code || user?.id || 'CB001',
      department: user?.department || '',
      donVi: user?.department || '',
    };

    // Lưu chữ ký và cập nhật trực tiếp lên Supabase database
    await signAndApproveRequest(reqId, teacherSignature, teacherName, undefined, signerDetails);

    const updated = signAndApproveByTeacher(
      reqId,
      signerDetails,
      teacherSignature,
      signerDetails
    );
    setRequestsList(updated);
    setActionSuccessMsg(
      `Đã ký số phê duyệt đơn ${reqId}! Chữ ký của bạn (${teacherName}) đã được áp dụng vào văn bản.`
    );
    setTimeout(() => setActionSuccessMsg(''), 4500);
    handleCloseDetailModal();
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
    <div className="flex min-h-screen bg-slate-900/5 text-slate-800">
      {/* Sidebar cho Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/95 shadow-sm lg:block">
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
            {/* Chuông thông báo phân công cho Giảng viên */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTeacherNotifications((prev) => !prev)}
                className="relative cursor-pointer rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {teacherUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-xs ring-2 ring-white leading-none">
                    {teacherUnreadCount > 99 ? '99+' : teacherUnreadCount}
                  </span>
                )}
              </button>

              {/* Popover danh sách thông báo phân công cho Giảng viên */}
              {showTeacherNotifications && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#2563EB]" />
                      <h4 className="text-sm font-bold text-slate-800">Thông báo phân công</h4>
                    </div>
                    {teacherNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          markAllNotificationsAsRead(teacherId);
                          setTeacherNotifications(getStoredNotifications(teacherId));
                        }}
                        className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {teacherNotifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Chưa có thông báo phân công nào gửi về.
                      </p>
                    ) : (
                      teacherNotifications.map((notif) => (
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
                                  setTeacherNotifications(getStoredNotifications(teacherId));
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
                                  setTeacherNotifications(getStoredNotifications(teacherId));
                                  setShowTeacherNotifications(false);
                                  setActiveTab('pending-requests');
                                }}
                                className="cursor-pointer font-semibold text-[#2563EB] hover:underline"
                              >
                                Mở hồ sơ &rarr;
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

            {/* Thông tin Giảng viên */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-xs">
                {teacherInitial}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{teacherName}</p>
                <p className="text-xs text-slate-500">{user?.department || user?.title || 'Giảng viên'}</p>
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
                        <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
                        <th className="px-4 py-3">Sinh viên</th>
                        <th className="px-4 py-3">Ngày tạo</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                            Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800 whitespace-nowrap">
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
                                  onClick={() => handleOpenDetailModal(req)}
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
                      <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">Lớp / Ngành</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800">{req.typeName}</td>
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
                              onClick={() => handleOpenDetailModal(req)}
                              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                req.status === 'teacher_approved'
                                  ? 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : req.status === 'completed'
                                  ? 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                  : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                              }`}
                            >
                              {req.status === 'teacher_approved' ? 'Đã duyệt' : req.status === 'completed' ? 'Xem đơn' : 'Duyệt đơn'}
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
            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Lịch sử xử lý đơn từ</h1>
                  <p className="text-sm text-slate-500">
                    Toàn bộ lịch sử duyệt, chuyển tiếp hoặc từ chối đơn sinh viên được ghi nhật ký bất biến trên cơ sở dữ liệu.
                  </p>
                </div>
              </div>

              {historyRequests.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <History className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">Chưa có lịch sử xử lý đơn từ nào</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                    Cơ sở dữ liệu trên Supabase đang trống hoặc chưa có hồ sơ nào được phê duyệt/hoàn tất. Toàn bộ nhật ký xử lý thực tế sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                        <th className="py-3 pr-4 pl-2 font-semibold text-slate-700">Loại đơn</th>
                        <th className="px-4 py-3">Sinh viên</th>
                        <th className="px-4 py-3">Lớp / Ngành</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="py-3 pr-2 pl-4 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyRequests.map((req) => (
                        <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-800">{req.typeName}</td>
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
                                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Tab Chữ ký cá nhân (Tái sử dụng SignatureManager cho Giáo viên) */}
          {activeTab === 'signature' && <SignatureManager />}

          {/* Tab Thông tin cá nhân */}
          {activeTab === 'profile' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs sm:p-8">
              <h1 className="text-lg font-bold text-slate-800">Thông tin Cán bộ / Giảng viên</h1>
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Họ và tên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{teacherName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mã cán bộ / Giảng viên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {user?.staffCode || user?.teacherCode || user?.code || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Đơn vị / Phòng ban / Khoa</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {user?.department || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Chức vụ / Vai trò</p>
                  <p className="mt-0.5 font-semibold text-[#2563EB]">
                    {user?.title || user?.department || 'Cán bộ xử lý'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Email công vụ</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {user?.email || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* MODAL XEM CHI TIẾT & KÝ DUYỆT ĐƠN CHO GIÁO VIÊN */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px] overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#2563EB]">{selectedRequest.id}</span>
                <h3 className="mt-0.5 text-base sm:text-lg font-bold text-slate-800">
                  {selectedRequest.typeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chi tiết sinh viên */}
            <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
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

            {/* TIẾN ĐỘ KÝ DUYỆT CỦA CÁC BÊN (NẾU ĐƠN CÓ NHIỀU NGƯỜI KÝ) */}
            {(() => {
              const signers = Array.isArray(selectedRequest.assignedSigners) && selectedRequest.assignedSigners.length > 0
                ? selectedRequest.assignedSigners
                : selectedRequest.assignedTo
                ? [selectedRequest.assignedTo]
                : [];

              if (signers.length > 1) {
                const signedCount = signers.filter((s) => s.status === 'signed').length;
                return (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>Tiến độ ký duyệt ({signedCount}/{signers.length} cán bộ đã ký):</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        signedCount === signers.length ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {signedCount === signers.length ? 'Đã hoàn tất ký' : 'Đang tiếp nhận ký'}
                      </span>
                    </div>
                    <div className="space-y-1.5 divide-y divide-blue-100/70 text-xs">
                      {signers.map((s, idx) => (
                        <div key={s.id || idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-800">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-800">{s.displayName || s.name}</span>
                          </div>
                          <div>
                            {s.status === 'signed' ? (
                              <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã ký ({s.signedAt || 'Đã duyệt'})
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Chờ ký
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* KHU VỰC KÝ CHỮ KÝ ĐIỆN TỬ */}
            {(() => {
              const signers = Array.isArray(selectedRequest.assignedSigners) && selectedRequest.assignedSigners.length > 0
                ? selectedRequest.assignedSigners
                : selectedRequest.assignedTo
                ? [selectedRequest.assignedTo]
                : [];

              const mySlot = signers.find((s) => {
                if (user?.email && s.email && s.email.toLowerCase() === user.email.toLowerCase()) return true;
                if (user?.staffCode && (s.id === user.staffCode || s.maCanBo === user.staffCode)) return true;
                if (user?.teacherCode && (s.id === user.teacherCode || s.maCanBo === user.teacherCode)) return true;
                if (user?.code && (s.id === user.code || s.maCanBo === user.code)) return true;
                if (user?.fullName && s.name && s.name.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return true;
                return false;
              });

              const isSignedByMe = mySlot
                ? mySlot.status === 'signed'
                : (selectedRequest.status === 'teacher_approved' || selectedRequest.status === 'completed' || (!!selectedRequest.teacherSignature && !mySlot));

              const savedSig = mySlot?.signatureUrl || selectedRequest.teacherSignature || selectedRequest.departmentSignature;

              if (isSignedByMe) {
                return (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Bạn ({teacherName}) đã ký duyệt thành công</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Chữ ký số của bạn đã được ghi nhận vào hồ sơ.
                    </p>
                    {savedSig && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <span className="text-xs text-slate-500">Chữ ký của bạn:</span>
                        <div className="h-12 w-28 bg-white border border-emerald-200 rounded p-1 flex items-center justify-center">
                          <img
                            src={savedSig}
                            alt="Chữ ký đã lưu"
                            className="max-h-10 max-w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200/70 leading-relaxed">
                      * <strong>Quy định bảo mật:</strong> Sau khi đã ký, bạn <strong>không thể tự ý ký lại</strong>. Nếu muốn ký lại thì phải liên hệ Quản trị viên để xóa chữ ký này, sau đó bạn mới có thể ký lại được.
                    </p>
                  </div>
                );
              }

              // Chưa ký -> Hiển thị form ký
              return (
                <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/40 p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-[#2563EB]" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Chữ ký của bạn ({teacherName}) <span className="text-red-500">*</span>
                      </h4>
                    </div>

                    {/* Nút chọn phương thức ký */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setSignatureMethod('draw')}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          signatureMethod === 'draw'
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ký tay
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMethod('upload')}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          signatureMethod === 'upload'
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tải ảnh chữ ký
                      </button>
                    </div>
                  </div>

                  {/* Phương thức 1: Ký tay trực tiếp trên Canvas */}
                  {signatureMethod === 'draw' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Vẽ chữ ký trực tiếp bằng chuột hoặc màn hình cảm ứng:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">Mực:</span>
                          <button
                            type="button"
                            onClick={() => setDrawColor('#1D4ED8')}
                            className={`h-4 w-4 rounded-full bg-blue-700 ring-2 cursor-pointer ${
                              drawColor === '#1D4ED8' ? 'ring-offset-1 ring-blue-500' : 'ring-transparent'
                            }`}
                            title="Mực xanh"
                          />
                          <button
                            type="button"
                            onClick={() => setDrawColor('#0F172A')}
                            className={`h-4 w-4 rounded-full bg-slate-900 ring-2 cursor-pointer ${
                              drawColor === '#0F172A' ? 'ring-offset-1 ring-slate-700' : 'ring-transparent'
                            }`}
                            title="Mực đen"
                          />
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner">
                        <canvas
                          ref={teacherCanvasRef}
                          width={500}
                          height={140}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="h-32 w-full touch-none cursor-crosshair bg-white"
                        />
                        {!hasDrawn && !teacherSignature && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 italic">
                            (Ký tên của {teacherName} tại đây)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleClearDrawing}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-red-600 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Xóa vẽ lại</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleLoadSavedSignature}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                          title="Dùng chữ ký đã lưu trong tab Chữ ký cá nhân"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Nạp chữ ký cá nhân đã lưu</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phương thức 2: Tải ảnh chữ ký từ máy và tự động tách nền */}
                  {signatureMethod === 'upload' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={teacherFileInputRef}
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => teacherFileInputRef.current?.click()}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-white/80 p-4 transition-colors hover:bg-blue-50/50"
                      >
                        <Upload className="h-6 w-6 text-[#2563EB]" />
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          Nhấn để tải ảnh chữ ký từ máy tính
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Hệ thống tự động tách nền giấy trắng/xám thành PNG trong suốt
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {teacherSignature ? (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đã nạp ảnh chữ ký thành công
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa chọn ảnh chữ ký</span>
                        )}

                        <button
                          type="button"
                          onClick={handleLoadSavedSignature}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Nạp chữ ký cá nhân đã lưu</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hiển thị xem trước chữ ký nếu đã có */}
                  {teacherSignature && (
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-12 w-24 items-center justify-center rounded bg-slate-50 border border-slate-100 p-1">
                          <img
                            src={teacherSignature}
                            alt="Chữ ký Giảng viên"
                            className="max-h-10 max-w-full object-contain"
                          />
                        </div>
                        <div className="text-[11px]">
                          <p className="font-bold text-slate-800">Chữ ký đã sẵn sàng</p>
                          <p className="text-slate-500 font-sans">{teacherName}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherSignature('');
                          setHasDrawn(false);
                          if (teacherCanvasRef.current) {
                            const ctx = teacherCanvasRef.current.getContext('2d');
                            if (ctx) ctx.clearRect(0, 0, teacherCanvasRef.current.width, teacherCanvasRef.current.height);
                          }
                        }}
                        className="cursor-pointer text-xs font-semibold text-red-500 hover:underline"
                      >
                        Hủy chữ ký
                      </button>
                    </div>
                  )}

                  {/* Cảnh báo nếu chưa có chữ ký */}
                  {!teacherSignature && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200/70 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Bắt buộc phải có chữ ký mới có thể ấn xác nhận phê duyệt đơn.</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Các hành động xử lý của Giáo viên / Cán bộ */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setViewDocRequest(selectedRequest)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 py-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100"
              >
                <Eye className="h-4 w-4" />
                <span>Mở xem toàn văn bản đơn A4</span>
              </button>

              {/* Chỉ hiển thị nút ký duyệt nếu người dùng hiện tại chưa ký */}
              {(() => {
                const signers = Array.isArray(selectedRequest.assignedSigners) && selectedRequest.assignedSigners.length > 0
                  ? selectedRequest.assignedSigners
                  : selectedRequest.assignedTo
                  ? [selectedRequest.assignedTo]
                  : [];

                const mySlot = signers.find((s) => {
                  if (user?.email && s.email && s.email.toLowerCase() === user.email.toLowerCase()) return true;
                  if (user?.staffCode && (s.id === user.staffCode || s.maCanBo === user.staffCode)) return true;
                  if (user?.teacherCode && (s.id === user.teacherCode || s.maCanBo === user.teacherCode)) return true;
                  if (user?.code && (s.id === user.code || s.maCanBo === user.code)) return true;
                  if (user?.fullName && s.name && s.name.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return true;
                  return false;
                });

                const isSignedByMe = mySlot
                  ? mySlot.status === 'signed'
                  : (selectedRequest.status === 'teacher_approved' || selectedRequest.status === 'completed' || (!!selectedRequest.teacherSignature && !mySlot));

                if (isSignedByMe) return null;

                return (
                  <>
                    <button
                      type="button"
                      disabled={!teacherSignature}
                      onClick={handleApproveRequest}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-sm ${
                        teacherSignature
                          ? 'cursor-pointer bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          : 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {teacherSignature
                          ? `Xác nhận ký duyệt đơn (${teacherName})`
                          : 'Vui lòng ký tên trước khi xác nhận'}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Đã gửi thông báo yêu cầu bổ sung thông tin tới sinh viên ${selectedRequest.studentName}.`);
                          handleCloseDetailModal();
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
                          handleCloseDetailModal();
                        }}
                        className="cursor-pointer rounded-xl border border-red-200 bg-red-50/60 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Từ chối đơn
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN 2 LẦN TRƯỚC KHI KÝ DUYỆT */}
      {showConfirmSignModal && selectedRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-base text-slate-800">Xác nhận ký duyệt hồ sơ</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5">
              <p>
                Bạn đang chuẩn bị ký phê duyệt đơn: <strong className="text-slate-800">{selectedRequest.typeName}</strong> (Mã đơn: <strong className="text-[#2563EB]">{selectedRequest.id}</strong>) của sinh viên <strong className="text-slate-800">{selectedRequest.studentName}</strong>.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Lưu ý quan trọng:</strong> Sau khi bạn xác nhận, bạn sẽ <strong>KHÔNG THỂ tự ý ký lại</strong> hay sửa đổi chữ ký. Nếu muốn ký lại thì phải liên hệ Quản trị viên để xóa chữ ký này, khi đó bạn mới có thể ký lại được.
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1">Chữ ký sẽ áp dụng vào hồ sơ:</p>
                <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <img src={teacherSignature} alt="Chữ ký của bạn" className="max-h-12 max-w-[160px] object-contain" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSignModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Hủy / Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={() => handleExecuteApprove(selectedRequest.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] rounded-xl hover:bg-[#1D4ED8] shadow-sm cursor-pointer"
              >
                Tôi chắc chắn, Xác nhận ký
              </button>
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
                  onClick={() => triggerPrintClean()}
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
