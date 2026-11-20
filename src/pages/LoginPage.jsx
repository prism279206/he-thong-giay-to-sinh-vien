import { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldAlert, HelpCircle, X, Info } from 'lucide-react';
import { signIn } from '../services/authService';
import { formatCccd } from '../services/cmsService';

const SAVED_IDENTIFIER_KEY = 'vmh_saved_user';

// Đường dẫn ảnh logo mặc định của trường (có thể ghi đè qua prop logoSrc từ App.jsx).
export const DEFAULT_LOGO_SRC =
    'https://sinhvien.vietmycollege.com/brand/logo-vietmy.webp';

function DefaultLogoPlaceholder() {
    return (
        <div
            className="mx-auto mb-2.5 flex h-14 w-16 items-center justify-center rounded-xl border border-dashed border-white/50 bg-white/10 text-xs font-medium text-white/90"
            title="Vị trí gán ảnh logo trường"
        >
            Logo
        </div>
    );
}

function CampusBackdrop() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden="true">
            {/* Vòng tròn trang trí nền */}
            <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full border-[26px] border-[#DCE7FB]/70 sm:h-[420px] sm:w-[420px] sm:border-[34px]" />
            <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-[#DCE7FB]/70 sm:h-80 sm:w-80" />
            <div className="absolute top-32 right-24 hidden h-8 w-8 rounded-full bg-[#D6E3FA]/80 md:block" />
            <div className="absolute bottom-28 -left-16 h-52 w-52 rounded-full bg-[#DCE7FB]/65 sm:h-64 sm:w-64" />

            {/* Hình khối tòa nhà trường mờ ở cạnh dưới */}
            <svg
                viewBox="0 0 1440 260"
                preserveAspectRatio="xMidYMax slice"
                className="absolute bottom-0 left-0 h-44 w-full text-[#C8DAFA]/55 sm:h-60"
                fill="currentColor"
            >
                <rect x="0" y="232" width="1440" height="28" opacity="0.55" />
                {/* Khối nhà trái */}
                <rect x="60" y="135" width="230" height="97" opacity="0.5" />
                <rect x="82" y="155" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="116" y="155" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="150" y="155" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="184" y="155" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="218" y="155" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="82" y="190" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="116" y="190" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="150" y="190" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="184" y="190" width="22" height="20" fill="#EDF3FF" opacity="0.8" />
                <rect x="218" y="190" width="22" height="20" fill="#EDF3FF" opacity="0.8" />

                {/* Khối nhà giữa phải */}
                <rect x="870" y="92" width="490" height="140" opacity="0.6" />
                <rect x="855" y="82" width="520" height="14" opacity="0.7" />
                <rect x="1065" y="160" width="90" height="72" opacity="0.75" />
                <rect x="900" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="942" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="984" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1026" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1170" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1212" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1254" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1296" y="116" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="900" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="942" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="984" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1026" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1170" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1212" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1254" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />
                <rect x="1296" y="156" width="28" height="24" fill="#EDF3FF" opacity="0.85" />

                {/* Khối nhà phụ bên phải */}
                <rect x="1370" y="145" width="70" height="87" opacity="0.45" />
            </svg>
        </div>
    );
}

/**
 * Trang đăng nhập đầu tiên khi mở website.
 * Logo trường có thể truyền qua prop `logoSrc` hoặc sửa `DEFAULT_LOGO_SRC`.
 */
function LoginPage({ logoSrc = DEFAULT_LOGO_SRC, onLoginSuccess }) {
    const [identifier, setIdentifier] = useState(
        () => localStorage.getItem(SAVED_IDENTIFIER_KEY) || ''
    );
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() =>
        Boolean(localStorage.getItem(SAVED_IDENTIFIER_KEY))
    );
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedIdentifier = identifier.trim();
        if (!trimmedIdentifier || !password) {
            setError('Vui lòng nhập đầy đủ mã sinh viên/email trường và mật khẩu.');
            return;
        }

        setIsLoading(true);

        const res = await signIn(trimmedIdentifier, password);
        setIsLoading(false);

        if (res.error) {
            setError(res.error);
            return;
        }

        if (rememberMe) {
            localStorage.setItem(SAVED_IDENTIFIER_KEY, trimmedIdentifier);
        } else {
            localStorage.removeItem(SAVED_IDENTIFIER_KEY);
        }

        if (res.data?.profile) {
            const prof = res.data.profile;
            const mappedUser = {
                id: prof.id,
                email: prof.email,
                fullName: prof.ho_ten || prof.full_name || 'Người dùng',
                studentCode: prof.ma_sinh_vien || prof.student_code || '',
                role: prof.role === 'staff' ? 'teacher' : (prof.role || 'student'),
                className: prof.lop || prof.class_name || '',
                faculty: prof.khoa || prof.faculty || '',
                major: prof.nganh || prof.major || '',
                dob: prof.ngay_sinh || prof.dob || '',
                pob: prof.noi_sinh || prof.pob || '',
                idCardNumber: formatCccd(prof.cccd || prof.id_card_number || ''),
                idCardDate: prof.ngay_cap_cccd || prof.id_card_date || '',
                idCardPlace: prof.noi_cap_cccd || prof.id_card_place || 'Bộ Công an',
                academicYear: prof.khoa_hoc || prof.academic_year || '',
                phone: prof.sdt || prof.phone || '',
            };
            if (onLoginSuccess) {
                onLoginSuccess(mappedUser);
            }
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#F4F7FF] via-[#EDF3FF] to-[#DFEAFF] px-4 py-8">
            <CampusBackdrop />

            <main className="relative z-10 w-full max-w-[440px] rounded-[22px] bg-white p-4 shadow-[0_18px_50px_-14px_rgba(30,64,175,0.18)] ring-1 ring-slate-100 sm:p-5">
                {/* Banner xanh đầu thẻ chứa logo trường */}
                <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#1B66EA] via-[#1757D8] to-[#1142B8] px-6 py-7 text-center text-white sm:py-8">
                    <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full border-[18px] border-white/10" />
                    <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full border-[22px] border-white/10" />

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        {logoSrc ? (
                            <img
                                src={logoSrc}
                                alt="Logo Cao đẳng Việt Mỹ Hà Nội"
                                className="h-24 w-auto max-w-[260px] object-contain sm:h-28"
                            />
                        ) : (
                            <DefaultLogoPlaceholder />
                        )}
                    </div>
                </div>

                {/* Nội dung form đăng nhập */}
                <div className="px-2 pt-6 pb-3 sm:px-4 sm:pt-7 sm:pb-4">
                    <div className="text-center">
                        <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                            Đăng nhập hệ thống
                        </h1>
                        <p className="mt-1.5 text-sm text-slate-500">
                            Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-left text-sm text-red-700"
                        >
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="login-identifier" className="sr-only">
                                Mã sinh viên hoặc email trường
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <User className="h-5 w-5" strokeWidth={1.75} />
                                </span>
                                <input
                                    id="login-identifier"
                                    type="text"
                                    autoComplete="username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Mã SV / GV / QL hoặc email trường"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#1D63EB] focus:ring-4 focus:ring-blue-500/12 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="login-password" className="sr-only">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <Lock className="h-5 w-5" strokeWidth={1.75} />
                                </span>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mật khẩu"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#1D63EB] focus:ring-4 focus:ring-blue-500/12 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? (
                                        <Eye className="h-5 w-5" strokeWidth={1.75} />
                                    ) : (
                                        <EyeOff className="h-5 w-5" strokeWidth={1.75} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5 text-xs sm:text-sm">
                            <label className="inline-flex cursor-pointer items-center gap-2 select-none text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1D63EB] focus:ring-[#1D63EB]"
                                />
                                <span>Ghi nhớ</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="font-medium text-[#1D63EB] hover:underline cursor-pointer"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-1 flex w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#2371EC] to-[#195EE0] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(29,99,235,0.55)] transition-all hover:from-[#1B63D8] hover:to-[#1450C4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>
                </div>
            </main>

            {/* Modal hướng dẫn khi quên mật khẩu */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-slate-800">
                                <HelpCircle className="h-5 w-5 text-[#2563EB]" />
                                <h3 className="font-bold text-base">Hướng dẫn cấp lại mật khẩu</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-blue-900">
                                <p className="font-semibold flex items-center gap-1.5">
                                    <Info className="h-4 w-4 text-[#2563EB] shrink-0" />
                                    Quy định bảo mật của nhà trường:
                                </p>
                                <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                                    Để bảo vệ hồ sơ và dữ liệu cá nhân của sinh viên, hệ thống <strong>không cho phép tự cấp lại mật khẩu qua email</strong>.
                                </p>
                            </div>

                            <p className="leading-relaxed">
                                Sinh viên hoặc Cán bộ quên mật khẩu vui lòng thực hiện một trong các cách sau:
                            </p>

                            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                                <li>
                                    <strong>Cách 1:</strong> Liên hệ trực tiếp <strong>Bộ phận Một cửa / Phòng Đào tạo (P.102)</strong> trong giờ hành chính để cán bộ xác minh CCCD/thẻ sinh viên và đặt lại mật khẩu.
                                </li>
                                <li>
                                    <strong>Cách 2:</strong> Báo với <strong>Giáo viên chủ nhiệm (GVCN)</strong> của lớp để GVCN gửi yêu cầu đặt lại mật khẩu cho cán bộ quản trị.
                                </li>
                                <li>
                                    <strong>Mật khẩu mặc định sau khi được cấp lại:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-700">123456</code>.
                                </li>
                            </ul>
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginPage;
