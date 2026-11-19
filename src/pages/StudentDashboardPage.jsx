import { useState, useMemo, useEffect } from 'react';
import {
  Home,
  FileText,
  PenTool,
  User,
  LogOut,
  Search,
  Bell,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  History,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { DEFAULT_LOGO_SRC } from './LoginPage';
import RequestTypePicker from '../components/RequestTypePicker';
import SignatureManager from '../components/SignatureManager';
import OfficialDocumentView from '../components/OfficialDocumentView';
import {
  getStoredRequests,
  getStoredNotifications,
  markNotificationAsRead,
} from '../components/mockRequestsStore';

// Menu điều hướng bên trái (đã bỏ mục Tạo đơn theo yêu cầu)
const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: Home },
  { id: 'my-requests', label: 'Đơn của tôi', icon: FileText },
  { id: 'signature', label: 'Chữ ký cá nhân', icon: PenTool },
  { id: 'profile', label: 'Thông tin cá nhân', icon: User },
];

const STATUS_BADGE_MAP = {
  pending: {
    pillClass: 'bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
    defaultLabel: 'Chờ tiếp nhận',
  },
  in_progress: {
    pillClass: 'bg-blue-50 text-[#2563EB]',
    dotClass: 'bg-[#2563EB]',
    defaultLabel: 'Đang xử lý',
  },
  teacher_approved: {
    pillClass: 'bg-indigo-50 text-indigo-700',
    dotClass: 'bg-indigo-500 animate-pulse',
    defaultLabel: 'GV đã duyệt (Chờ Một cửa đóng dấu)',
  },
  completed: {
    pillClass: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
    defaultLabel: 'Đã hoàn thành',
  },
  rejected: {
    pillClass: 'bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
    defaultLabel: 'Bị từ chối',
  },
  submitted: {
    pillClass: 'bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
    defaultLabel: 'Chờ tiếp nhận',
  },
  processing: {
    pillClass: 'bg-blue-50 text-[#2563EB]',
    dotClass: 'bg-[#2563EB]',
    defaultLabel: 'Đang xử lý',
  },
};

function CampusIllustration() {
  return (
    <svg
      viewBox="0 0 360 175"
      className="h-36 w-auto shrink-0 select-none lg:h-44"
      fill="none"
      aria-hidden="true"
    >
      {/* Mây nền nhẹ */}
      <ellipse cx="185" cy="145" rx="155" ry="20" fill="#E4EEFF" />
      <path d="M55 58c0-10 9-18 20-18 8 0 15 4 18 11 10 1 17 8 17 17H55V58z" fill="#EEF4FF" />
      <path d="M275 48c0-8 7-14 16-14 6 0 12 3 14 9 8 1 14 6 14 14h-44v-9z" fill="#EEF4FF" />

      {/* Thân tòa nhà trường */}
      <rect x="75" y="75" width="70" height="72" rx="3" fill="#BBD2FA" />
      <rect x="225" y="75" width="70" height="72" rx="3" fill="#BBD2FA" />
      <rect x="135" y="45" width="100" height="102" rx="3" fill="#D2E2FC" />
      <path d="M128 48L185 16L242 48H128Z" fill="#7CA8F8" />

      {/* Đồng hồ mái */}
      <circle cx="185" cy="40" r="11" fill="#FFFFFF" stroke="#6B9BF5" strokeWidth="2.5" />
      <path d="M185 34v6l4 2" stroke="#4D82EE" strokeWidth="2" strokeLinecap="round" />

      {/* Cửa sổ hai cánh */}
      <rect x="88" y="90" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="112" y="90" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="88" y="114" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="112" y="114" width="14" height="16" rx="2" fill="#FFFFFF" />

      <rect x="244" y="90" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="268" y="90" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="244" y="114" width="14" height="16" rx="2" fill="#FFFFFF" />
      <rect x="268" y="114" width="14" height="16" rx="2" fill="#FFFFFF" />

      {/* Cửa sổ khối giữa và cổng vòm */}
      <rect x="150" y="65" width="16" height="18" rx="2" fill="#FFFFFF" />
      <rect x="177" y="65" width="16" height="18" rx="2" fill="#FFFFFF" />
      <rect x="204" y="65" width="16" height="18" rx="2" fill="#FFFFFF" />
      <rect x="150" y="92" width="16" height="18" rx="2" fill="#FFFFFF" />
      <rect x="204" y="92" width="16" height="18" rx="2" fill="#FFFFFF" />
      <path d="M170 147v-26c0-8 7-15 15-15s15 7 15 15v26h-30z" fill="#6395F2" />

      {/* Cây xanh */}
      <rect x="44" y="118" width="5" height="29" rx="2" fill="#8FB3F5" />
      <circle cx="46" cy="105" r="19" fill="#9EC2FA" />
      <circle cx="32" cy="126" r="12" fill="#B8D4FC" />

      <rect x="315" y="114" width="5" height="33" rx="2" fill="#8FB3F5" />
      <circle cx="317" cy="99" r="22" fill="#8BB6F8" />
      <circle cx="334" cy="122" r="13" fill="#B8D4FC" />
    </svg>
  );
}

function StatusBadge({ statusKey, label }) {
  const style = STATUS_BADGE_MAP[statusKey] || STATUS_BADGE_MAP.submitted;
  const displayLabel = label || style.defaultLabel || 'Chờ xử lý';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.pillClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} />
      <span>{displayLabel}</span>
    </span>
  );
}

/**
 * Trang tổng quan của sinh viên hiển thị ngay sau khi đăng nhập thành công.
 */
function StudentDashboardPage({ user, logoSrc = DEFAULT_LOGO_SRC, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewFullDoc, setViewFullDoc] = useState(false);

  // Đọc danh sách đơn từ localStorage dùng chung (đồng bộ với Một cửa và Giảng viên)
  const [storedRequests, setStoredRequests] = useState(() => getStoredRequests());
  const [notifications, setNotifications] = useState(() =>
    getStoredNotifications(user?.studentCode)
  );

  useEffect(() => {
    setStoredRequests(getStoredRequests());
    setNotifications(getStoredNotifications(user?.studentCode));
  }, [activeTab, user?.studentCode]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Lọc đơn của sinh viên hiện tại
  const myRequests = useMemo(() => {
    const myCode = user?.studentCode || '61112420189';
    const list = storedRequests.filter(
      (r) => !r.studentCode || r.studentCode === myCode || r.studentName === user?.fullName
    );
    return list.length > 0 ? list : storedRequests;
  }, [storedRequests, user]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRequests = useMemo(() => {
    return myRequests.filter((req) => {
      const match =
        req.id.toLowerCase().includes(normalizedQuery) ||
        (req.typeName && req.typeName.toLowerCase().includes(normalizedQuery)) ||
        (req.statusLabel && req.statusLabel.toLowerCase().includes(normalizedQuery));
      return match;
    });
  }, [myRequests, normalizedQuery]);

  const stats = useMemo(() => {
    const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
    const inProgressCount = myRequests.filter(
      (r) => r.status === 'in_progress' || r.status === 'teacher_approved'
    ).length;
    const completedCount = myRequests.filter((r) => r.status === 'completed').length;
    const totalSent = myRequests.length;
    return { pendingCount, inProgressCount, completedCount, totalSent };
  }, [myRequests]);

  const userInitial = (user?.fullName || 'S').trim().charAt(0).toUpperCase();

  const handleSelectNav = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleMarkNotifRead = (id) => {
    markNotificationAsRead(id);
    setNotifications(getStoredNotifications(user?.studentCode));
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Logo trường lấy từ LoginPage */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-6">
          <img
            src={logoSrc}
            alt="Logo Cao đẳng Việt Mỹ Hà Nội"
            className="h-11 w-auto max-w-[115px] object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-slate-800">Student Portal</p>
            <p className="truncate text-[11px] text-slate-500">Việt Mỹ Hà Nội</p>
          </div>
        </div>

        {/* Danh sách mục điều hướng (đã bỏ Tạo đơn) */}
        <nav className="space-y-1.5" aria-label="Menu sinh viên">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (activeTab === 'create-request' && item.id === 'overview');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
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

      {/* Nút Đăng xuất dưới cùng */}
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

  const renderRequestsTable = (requests) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
            <th className="py-3 pr-4 pl-2">Mã đơn</th>
            <th className="px-4 py-3">Loại đơn</th>
            <th className="px-4 py-3">Ngày tạo</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="py-3 pr-2 pl-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                Không có đơn nào khớp với từ khóa tìm kiếm.
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                <td className="py-3.5 pr-4 pl-2 font-semibold text-slate-700">{req.id}</td>
                <td className="px-4 py-3.5 text-slate-700">{req.typeName}</td>
                <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{req.createdAt}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <StatusBadge
                    statusKey={req.status || req.statusKey}
                    label={req.statusLabel}
                  />
                </td>
                <td className="py-3.5 pr-2 pl-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(req)}
                    className="cursor-pointer rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-blue-50"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F7FE] text-slate-800">
      {/* Sidebar cho màn hình lớn */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-gradient-to-b from-[#F8FAFF] to-[#EEF4FF] lg:block">
        <div className="sticky top-0 h-screen">{renderSidebarContent()}</div>
      </aside>

      {/* Sidebar dạng ngăn kéo cho điện thoại / tablet */}
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

      {/* Khu vực nội dung bên phải */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thanh Header trên cùng */}
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

            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đơn từ..."
                className="w-full rounded-xl border border-slate-200/80 bg-[#F4F7FE] py-2 pr-4 pl-10 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {/* Chuông thông báo trực tiếp qua Web */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative cursor-pointer rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Popover danh sách thông báo */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#2563EB]" />
                      <h4 className="text-sm font-bold text-slate-800">Thông báo từ Nhà trường</h4>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
                      {notifications.length} tin
                    </span>
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Bạn chưa có thông báo nào từ nhà trường.
                      </p>
                    ) : (
                      notifications.map((notif) => (
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
                                onClick={() => handleMarkNotifRead(notif.id)}
                                className="cursor-pointer text-[10px] font-semibold text-[#2563EB] hover:underline"
                              >
                                Đã xem
                              </button>
                            )}
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-600">{notif.message}</p>
                          {notif.pickupLocation && (
                            <div className="mt-1.5 rounded-lg bg-white/80 p-2 font-medium text-emerald-700 border border-emerald-100">
                              📍 Địa điểm: {notif.pickupLocation}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">{notif.createdAt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white shadow-xs">
                {userInitial}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500">SV: {user?.studentCode}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        {/* Nội dung chính theo tab đang chọn */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
          {activeTab === 'create-request' && (
            <RequestTypePicker onBack={() => setActiveTab('overview')} user={user} />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Banner chào mừng + nút Tạo đơn mới */}
              <section className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#F6F9FF] via-[#EFF4FF] to-[#E9F0FF] p-6 ring-1 ring-blue-100/70 md:flex-row md:items-center md:px-8 md:py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
                    Xin chào, {user?.fullName}!
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                    Chúc bạn một ngày học tập thật tốt!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create-request')}
                    className="mt-5 inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_-8px_rgba(37,99,235,0.65)] transition-all hover:from-[#1D4ED8] hover:to-[#1E40AF] active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Tạo đơn mới</span>
                    <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="hidden md:block">
                  <CampusIllustration />
                </div>
              </section>

              {/* 3 thẻ thống kê trạng thái đơn */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalSent}</p>
                    <p className="text-sm text-slate-500">Đơn đã gửi</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.inProgressCount}</p>
                    <p className="text-sm text-slate-500">Đơn đang xử lý</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.completedCount}</p>
                    <p className="text-sm text-slate-500">Đơn đã hoàn thành</p>
                  </div>
                </div>
              </section>

              {/* Bảng Đơn gần đây */}
              <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <History className="h-5 w-5 text-[#2563EB]" />
                    <h2 className="text-base font-bold text-slate-800 sm:text-lg">Đơn gần đây</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('my-requests')}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {renderRequestsTable(filteredRequests)}
              </section>
            </div>
          )}

          {activeTab === 'my-requests' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Đơn của tôi</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Danh sách toàn bộ hồ sơ thủ tục bạn đã tạo (dữ liệu mẫu).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create-request')}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo đơn mới</span>
                </button>
              </div>
              {renderRequestsTable(filteredRequests)}
            </section>
          )}

          {activeTab === 'signature' && <SignatureManager />}

          {activeTab === 'profile' && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs sm:p-8">
              <h1 className="text-lg font-bold text-slate-800">Thông tin cá nhân</h1>
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Họ và tên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{user?.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mã sinh viên</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{user?.studentCode}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email trường</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{user?.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Vai trò</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{user?.role}</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal xem nhanh chi tiết đơn */}
      {selectedRequest && !viewFullDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-[#2563EB]">{selectedRequest.id}</p>
                <h3 className="mt-1 text-base font-bold text-slate-800">
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

            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-slate-500 font-medium">Trạng thái xử lý:</span>
                <StatusBadge
                  statusKey={selectedRequest.status || selectedRequest.statusKey}
                  label={selectedRequest.statusLabel}
                />
              </div>

              {/* Thông báo trả kết quả từ Bộ phận Một cửa nếu đơn đã hoàn thành */}
              {selectedRequest.status === 'completed' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Hồ sơ đã được phê duyệt & đóng dấu ban hành!
                  </p>
                  <p className="text-slate-700">
                    Địa điểm nhận kết quả bản cứng: <strong className="text-emerald-800">{selectedRequest.pickupLocation || 'Phòng 102 - Tòa nhà A (Bộ phận Một Cửa)'}</strong>
                  </p>
                  {selectedRequest.adminNote && (
                    <p className="italic text-slate-600 bg-white/70 p-2 rounded-lg border border-emerald-100">
                      Ghi chú: "{selectedRequest.adminNote}"
                    </p>
                  )}
                </div>
              )}

              {/* Thông báo nếu GV đã duyệt nhưng Một cửa đang thụ lý đóng dấu */}
              {selectedRequest.status === 'teacher_approved' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-800">
                    <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                    Giáo viên chủ nhiệm đã duyệt & ký số
                  </p>
                  <p className="text-slate-600">
                    Hồ sơ đã được chuyển tự động về Bộ phận Một Cửa để đối chiếu và đóng dấu số. Hệ thống sẽ gửi thông báo đến bạn ngay khi Một Cửa ban hành.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ngày tạo đơn:</span>
                  <span className="font-medium text-slate-700">{selectedRequest.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-500">Lý do xin cấp:</span>
                  <p className="mt-1 font-medium text-slate-800">{selectedRequest.reason || selectedRequest.note}</p>
                </div>
              </div>

              {/* Nhật ký quy trình hồ sơ */}
              {selectedRequest.logs && selectedRequest.logs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiến trình giải quyết</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedRequest.logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-xs">
                        <span className="font-bold text-[#2563EB] shrink-0">{log.action}:</span>
                        <div className="text-slate-600 min-w-0">
                          <span>{log.actor} ({log.time})</span>
                          {log.note && <span className="block text-[11px] italic text-slate-500 mt-0.5">"{log.note}"</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              {(selectedRequest.teacherSignature || selectedRequest.status === 'completed') && (
                <button
                  type="button"
                  onClick={() => setViewFullDoc(true)}
                  className="flex-1 cursor-pointer rounded-xl bg-[#2563EB] py-2.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] shadow-sm"
                >
                  Xem văn bản có chữ ký & dấu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM VĂN BẢN ĐẦY ĐỦ CÓ CHỮ KÝ VÀ DẤU */}
      {viewFullDoc && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Văn bản chính thức có chữ ký số & con dấu - {selectedRequest.id}
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
                  onClick={() => setViewFullDoc(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto bg-slate-100">
              <OfficialDocumentView request={selectedRequest} />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setViewFullDoc(false)}
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

export default StudentDashboardPage;

