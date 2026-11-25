import { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { signIn } from '../services/authService';
import { formatCccd } from '../services/cmsService';

export const SAVED_IDENTIFIER_KEY = 'vmh_saved_user';
export const SAVED_SESSION_KEY = 'vmh_saved_session';

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
        Boolean(localStorage.getItem(SAVED_SESSION_KEY) || localStorage.getItem(SAVED_IDENTIFIER_KEY))
    );
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

        if (res.data?.profile) {
            const prof = res.data.profile;
            const mappedUser = {
                id: prof.id,
                email: prof.email,
                fullName: prof.ho_ten || prof.full_name || 'Người dùng',
                studentCode: prof.ma_sinh_vien || prof.student_code || '',
                staffCode: prof.ma_can_bo || prof.ma_sinh_vien || '',
                teacherCode: prof.ma_can_bo || prof.ma_sinh_vien || '',
                code: prof.ma_can_bo || prof.ma_sinh_vien || '',
                role: prof.role === 'staff' ? 'teacher' : (prof.role || 'student'),
                department: prof.don_vi || '',
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

            // Nếu tích chọn "Lưu đăng nhập trên trình duyệt này" -> lưu toàn bộ phiên để lần sau vào thẳng không cần đăng nhập
            if (rememberMe) {
                localStorage.setItem(SAVED_IDENTIFIER_KEY, trimmedIdentifier);
                localStorage.setItem(SAVED_SESSION_KEY, JSON.stringify(mappedUser));
            } else {
                localStorage.removeItem(SAVED_IDENTIFIER_KEY);
                localStorage.removeItem(SAVED_SESSION_KEY);
            }

            if (onLoginSuccess) {
                onLoginSuccess(mappedUser);
            }
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-8">
            <main className="relative z-10 w-full max-w-[440px] rounded-[22px] bg-white p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-100 sm:p-5">
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
                                    placeholder="Mã sinh viên hoặc email trường"
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

                        <div className="flex items-center pt-0.5 text-xs sm:text-sm">
                            <label className="inline-flex cursor-pointer items-center gap-2 select-none text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1D63EB] focus:ring-[#1D63EB]"
                                />
                                <span>Lưu đăng nhập trên trình duyệt này</span>
                            </label>
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
        </div>
    );
}

export default LoginPage;
