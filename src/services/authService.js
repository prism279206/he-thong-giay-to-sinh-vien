/**
 * Service xác thực người dùng (Auth Service)
 * Hỗ trợ đăng nhập linh hoạt bằng Email hoặc Mã sinh viên,
 * kiểm tra đối chiếu email trường và kết nối với Supabase Auth.
 */

import { supabase } from '../lib/supabase.js';
import {
  getStudentProfile,
  buildExpectedStudentEmail,
  verifyStudentEmailMatch,
  formatCccd,
} from './cmsService.js';

const DEFAULT_PASSWORD = '123456';

/**
 * Phân tích và kiểm tra tính hợp lệ của chuỗi đăng nhập
 * Trả về: { isValid: boolean, type?: 'email' | 'student_code' | 'staff_code', value?: string, error?: string }
 */
export function parseLoginIdentifier(input) {
  const clean = (input || '').trim();
  const lower = clean.toLowerCase();

  if (!clean) {
    return { isValid: false, error: 'Vui lòng nhập Email trường hoặc Mã sinh viên/cán bộ.' };
  }

  // 1. Trường hợp người dùng nhập Email
  if (clean.includes('@')) {
    if (!lower.endsWith('@caodangvietmyhanoi.edu.vn') && !lower.endsWith('@caodangvietmy.edu.vn')) {
      return {
        isValid: false,
        error: 'Tài khoản hoặc mật khẩu không chính xác.',
      };
    }
    return { isValid: true, type: 'email', value: lower };
  }

  // 2. Trường hợp là Mã cán bộ / Giảng viên (ví dụ: admincdvmhn, gvcn, QL001, GV001, AD01, admin, dung.dinh1, luan.dam1...)
  if (
    /^(ql|gv|cb|ad|kt)\d+$/i.test(clean) ||
    lower === 'admin' ||
    lower === 'admincdvmhn' ||
    lower === 'gvcn' ||
    lower === 'dung.dinh1' ||
    lower.startsWith('dung.dinh') ||
    lower === 'luan.dam1' ||
    lower.startsWith('luan.dam')
  ) {
    return { isValid: true, type: 'staff_code', value: lower };
  }

  // 3. Trường hợp là Mã sinh viên (chỉ gồm các chữ số độ dài từ 6 đến 12 số, hoặc tiền tố SV + chữ số)
  if (/^\d{6,12}$/.test(clean) || /^sv\d+$/i.test(clean)) {
    return { isValid: true, type: 'student_code', value: clean };
  }

  // 4. Các trường hợp gõ sai mã hoặc sai tài khoản khác
  return {
    isValid: false,
    error: 'Tài khoản hoặc mật khẩu không chính xác.',
  };
}

/**
 * Đăng nhập vào hệ thống
 * @param {string} identifier Email hoặc Mã sinh viên/cán bộ
 * @param {string} password Mật khẩu
 * @returns {Promise<{ data: { user: object, profile: object } | null, error: string | null }>}
 */
export async function signIn(identifier, password) {
  const cleanId = (identifier || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    return { data: null, error: 'Vui lòng nhập Email trường hoặc Mã sinh viên/cán bộ.' };
  }
  if (!cleanPass) {
    return { data: null, error: 'Vui lòng nhập mật khẩu.' };
  }

  // Kiểm tra chặt chẽ định dạng đầu vào trước khi xử lý
  const parsed = parseLoginIdentifier(cleanId);
  if (!parsed.isValid) {
    return { data: null, error: parsed.error };
  }

  const { type, value } = parsed;
  let targetEmail = value;
  let studentCmsData = null;

  // 1. Nếu người dùng nhập Mã cán bộ / Giảng viên -> Chuẩn hóa sang Email trường tương ứng
  if (type === 'staff_code') {
    const valLower = value.toLowerCase();
    if (valLower === 'admincdvmhn' || valLower === 'admin' || valLower === 'ql001') {
      targetEmail = 'admin@caodangvietmyhanoi.edu.vn';
    } else if (valLower === 'gv002' || valLower === 'gvcn' || valLower === 'gv001') {
      targetEmail = 'huong.do1@caodangvietmyhanoi.edu.vn';
    } else if (valLower === 'dung.dinh1' || valLower === 'kt001' || valLower.startsWith('dung')) {
      targetEmail = 'dung.dinh1@caodangvietmyhanoi.edu.vn';
    } else if (valLower === 'luan.dam1' || valLower === 'gv003' || valLower.startsWith('luan')) {
      targetEmail = 'luan.dam1@caodangvietmyhanoi.edu.vn';
    }
  }

  // 2. Nếu người dùng nhập Mã sinh viên (dãy số) -> Tra cứu hồ sơ CMS
  if (type === 'student_code') {
    const cmsResult = await getStudentProfile(value);
    if (cmsResult.error || !cmsResult.data) {
      return { data: null, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
    }
    studentCmsData = cmsResult.data;
    targetEmail = buildExpectedStudentEmail(studentCmsData.hoTen, studentCmsData.maSinhVien);
  }

  // 3. Nếu người dùng nhập Email sinh viên -> Đối chiếu tên và số với hồ sơ
  if (type === 'email' && value.endsWith('@caodangvietmyhanoi.edu.vn')) {
    const username = value.split('@')[0];
    const match = username.match(/^([a-z]+)(\d+)$/);
    if (match) {
      const emailName = match[1];
      const codeSuffix = match[2];
      // Tra cứu sinh viên theo đuôi mã hoặc mã sinh viên
      const cmsResult = await getStudentProfile(codeSuffix, { expectedName: emailName });
      if (cmsResult.error || !cmsResult.data) {
        return { data: null, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
      }
      studentCmsData = cmsResult.data;
      const verifyRes = verifyStudentEmailMatch(value, studentCmsData);
      if (!verifyRes.isValid) {
        return { data: null, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
      }
    } else {
      // Nếu email không theo định dạng [Tên][Mã] (kiểm tra xem có phải email cán bộ/giảng viên không)
      const isKnownStaffEmail =
        value.includes('admin') ||
        value.includes('gvcn') ||
        value.includes('ql') ||
        value.includes('huong.do') ||
        value.includes('dung.dinh') ||
        value.includes('luan.dam');
      if (!isKnownStaffEmail) {
        return {
          data: null,
          error: 'Tài khoản hoặc mật khẩu không chính xác.',
        };
      }
    }
  }

  // 3. Nếu là Sinh viên đã xác thực danh tính qua CMS API -> Bắt buộc mật khẩu chính xác
  if (studentCmsData) {
    if (cleanPass !== DEFAULT_PASSWORD && cleanPass !== '123456') {
      return {
        data: null,
        error: 'Tài khoản hoặc mật khẩu không chính xác.',
      };
    }
    const studentUser = {
      id: `cms-${studentCmsData.maSinhVien}`,
      email: targetEmail,
      role: 'student',
      code: studentCmsData.maSinhVien,
    };
    const studentProfile = {
      id: `cms-${studentCmsData.maSinhVien}`,
      email: targetEmail,
      role: 'student',
      ho_ten: studentCmsData.hoTen,
      ma_sinh_vien: studentCmsData.maSinhVien,
      khoa: studentCmsData.khoa || '',
      lop: studentCmsData.lop || '',
      nganh: studentCmsData.nganh || '',
      ngay_sinh: studentCmsData.ngaySinh || '',
      noi_sinh: studentCmsData.noiSinh || '',
      cccd: studentCmsData.cccd || '',
      ngay_cap_cccd: studentCmsData.ngayCapCccd || '',
      noi_cap_cccd: studentCmsData.noiCapCccd || '',
      khoa_hoc: studentCmsData.khoaHoc || '',
      sdt: studentCmsData.sdt || '',
    };

    return {
      data: {
        user: studentUser,
        profile: studentProfile,
      },
      error: null,
    };
  }

  // 4. Nếu là Cán bộ / Giảng viên -> Đăng nhập qua Supabase Auth và lấy profile từ bảng profiles
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: cleanPass,
    });

    if (!authError && authData?.user) {
      // Đăng nhập thành công trên Supabase Auth -> Lấy profile từ bảng profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profile && profile.role) {
        return {
          data: {
            user: authData.user,
            profile: profile,
          },
          error: null,
        };
      }

      // Nếu bảng profiles chưa có dòng hoặc role bị trống -> Suy đoán chuẩn theo email/mã để cấp đúng quyền
      const emailLower = (targetEmail || '').toLowerCase();
      const valLower = (value || '').toLowerCase();

      let resolvedRole = 'student';
      let resolvedName = 'Người dùng';
      let resolvedCode = '';
      let resolvedDonVi = '';

      if (
        emailLower.includes('admin') ||
        valLower === 'admincdvmhn' ||
        valLower === 'admin' ||
        valLower === 'ql001'
      ) {
        resolvedRole = 'admin';
        resolvedName = 'Quản trị viên';
        resolvedCode = 'admincdvmhn';
        resolvedDonVi = 'Ban Tiếp nhận';
      } else if (
        emailLower.includes('huong.do') ||
        emailLower.includes('gvcn') ||
        valLower === 'gv002' ||
        valLower === 'gvcn' ||
        valLower.startsWith('gv')
      ) {
        resolvedRole = 'staff';
        resolvedName = 'Đỗ Thị Hương';
        resolvedCode = 'GV002';
        resolvedDonVi = 'Giảng viên - GVCN';
      }

      return {
        data: {
          user: authData.user,
          profile: {
            id: authData.user.id,
            email: targetEmail,
            role: resolvedRole,
            ho_ten: resolvedName,
            ma_can_bo: resolvedCode,
            don_vi: resolvedDonVi,
          },
        },
        error: null,
      };
    }
  } catch (err) {
    console.warn('Lỗi kết nối Supabase Auth, chuyển sang chế độ dự phòng:', err.message);
  }

  // 4. Chế độ dự phòng khi tài khoản chưa được tạo trên Supabase hoặc đang chạy thử nghiệm
  // Mật khẩu mặc định là 123456
  if (cleanPass === DEFAULT_PASSWORD || cleanPass === '123456') {
    // 4.1 Nếu là Quản trị viên (mã admincdvmhn, admin, QL001 hoặc email admin@...)
    const valLower = (value || '').toLowerCase();
    if (
      (type === 'staff_code' && (valLower === 'admincdvmhn' || valLower === 'admin' || valLower.startsWith('ql') || valLower.startsWith('ad'))) ||
      targetEmail.includes('admin') ||
      targetEmail.includes('ql001')
    ) {
      const adminEmail = targetEmail.includes('@') ? targetEmail : 'admin@caodangvietmyhanoi.edu.vn';
      return {
        data: {
          user: { id: 'mock-admin', email: adminEmail, role: 'admin', code: 'admincdvmhn' },
          profile: {
            id: 'mock-admin',
            email: adminEmail,
            ho_ten: 'Quản trị viên',
            role: 'admin',
            ma_can_bo: 'admincdvmhn',
            don_vi: 'Ban Tiếp nhận',
          },
        },
        error: null,
      };
    }

    // 4.2 Nếu là Giảng viên (mã GV002, gvcn hoặc email huong.do1@..., gvcn@...)
    if (
      (type === 'staff_code' && (valLower === 'gv002' || valLower === 'gvcn' || valLower.startsWith('gv'))) ||
      targetEmail.includes('huong.do') ||
      targetEmail.includes('gvcn')
    ) {
      const gvEmail = targetEmail.includes('@')
        ? targetEmail
        : 'huong.do1@caodangvietmyhanoi.edu.vn';
      return {
        data: {
          user: { id: 'mock-gv002', email: gvEmail, role: 'staff', code: 'GV002' },
          profile: {
            id: 'mock-gv002',
            email: gvEmail,
            ho_ten: 'Đỗ Thị Hương',
            role: 'staff',
            ma_can_bo: 'GV002',
            don_vi: 'Giảng viên - GVCN',
          },
        },
        error: null,
      };
    }

    // 4.3 Nếu là Cán bộ Khảo thí Đinh Thuỳ Dung (dung.dinh1@..., mã dung.dinh1, KT001)
    if (
      (type === 'staff_code' && (valLower === 'dung.dinh1' || valLower === 'kt001' || valLower.startsWith('dung'))) ||
      targetEmail.includes('dung.dinh')
    ) {
      const dungEmail = targetEmail.includes('@')
        ? targetEmail
        : 'dung.dinh1@caodangvietmyhanoi.edu.vn';
      return {
        data: {
          user: { id: 'mock-kt001', email: dungEmail, role: 'staff', code: 'dung.dinh1' },
          profile: {
            id: 'mock-kt001',
            email: dungEmail,
            ho_ten: 'Đinh Thuỳ Dung',
            role: 'staff',
            ma_can_bo: 'dung.dinh1',
            don_vi: 'Phòng Khảo thí',
          },
        },
        error: null,
      };
    }

    // 4.4 Nếu là Giảng viên Đàm Văn Luận (luan.dam1@..., mã luan.dam1, GV003)
    if (
      (type === 'staff_code' && (valLower === 'luan.dam1' || valLower === 'gv003' || valLower.startsWith('luan'))) ||
      targetEmail.includes('luan.dam')
    ) {
      const luanEmail = targetEmail.includes('@')
        ? targetEmail
        : 'luan.dam1@caodangvietmyhanoi.edu.vn';
      return {
        data: {
          user: { id: 'mock-gv003', email: luanEmail, role: 'staff', code: 'luan.dam1' },
          profile: {
            id: 'mock-gv003',
            email: luanEmail,
            ho_ten: 'Đàm Văn Luận',
            role: 'staff',
            ma_can_bo: 'luan.dam1',
            don_vi: 'Giảng viên - GVCN',
          },
        },
        error: null,
      };
    }

    // 4.5 Nếu là sinh viên (Bắt buộc phải có hồ sơ thực tế từ API CMS)
    if (studentCmsData) {
      const student = studentCmsData;
      return {
        data: {
          user: { id: `cms-${student.maSinhVien}`, email: targetEmail },
          profile: {
            id: `cms-${student.maSinhVien}`,
            email: targetEmail,
            ma_sinh_vien: student.maSinhVien,
            ho_ten: student.hoTen,
            lop: student.lop || '',
            khoa: student.khoa || '',
            nganh: student.nganh || '',
            khoa_hoc: student.khoaHoc || '',
            ngay_sinh: student.ngaySinh || '',
            cccd: formatCccd(student.cccd),
            ngay_cap_cccd: student.ngayCapCccd || '',
            noi_sinh: student.noiSinh || '',
            sdt: student.sdt || '',
            role: 'student',
          },
        },
        error: null,
      };
    }
  }

  return {
    data: null,
    error: 'Tài khoản hoặc mật khẩu không chính xác.',
  };
}

/**
 * Đăng xuất khỏi hệ thống
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Bỏ qua lỗi nếu đang chạy mock
  }
  localStorage.removeItem('vmh_current_session');
  return { error: null };
}

/**
 * Lấy hồ sơ tài khoản hiện tại
 */
export async function getCurrentProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return { data: profile, error: null };
    }
  } catch (err) {
    return { data: null, error: err.message };
  }
  return { data: null, error: 'Chưa đăng nhập' };
}

/**
 * Đổi mật khẩu tài khoản đang đăng nhập
 */
export async function changePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { data: null, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch {
    // Giả lập thành công khi dev
    return { data: { success: true }, error: null };
  }
}

/**
 * Lấy danh sách đối tượng tiếp nhận & giải quyết đơn từ bảng profiles trên database Supabase.
 * Tự động phân loại:
 * - Giảng viên / GVCN: don_vi chứa 'Giảng viên' -> Nhãn hiển thị: `${ho_ten} - Giảng viên`
 * - Phòng ban: don_vi là các phòng ban khác -> Nhãn hiển thị: `${ho_ten} - ${don_vi}`
 */
export async function getDispatchTargetsFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, ho_ten, role, ma_can_bo, don_vi, email')
      .order('ho_ten', { ascending: true });

    if (!error && data && data.length > 0) {
      const lecturers = [];
      const departments = [];

      data.forEach((p) => {
        // Bỏ qua tài khoản admin không dùng để nhận giải quyết đơn
        if (
          p.role === 'admin' ||
          (p.email && p.email.toLowerCase().startsWith('admin@')) ||
          (p.ma_can_bo && p.ma_can_bo.toLowerCase() === 'admincdvmhn')
        ) {
          return;
        }

        const hoTen = (p.ho_ten || '').trim();
        const donVi = (p.don_vi || '').trim();
        const donViLower = donVi.toLowerCase();

        // Kiểm tra phân loại: nếu don_vi chứa 'giảng viên' hoặc role là teacher
        const isLecturer =
          donViLower.includes('giảng viên') ||
          donViLower.includes('giang vien') ||
          p.role === 'teacher';

        if (isLecturer) {
          // Xếp qua Giảng viên / GVCN - định dạng: `${ho_ten} - Giảng viên`
          lecturers.push({
            id: p.ma_can_bo || p.id,
            profileId: p.id,
            name: hoTen || 'Giảng viên',
            maCanBo: p.ma_can_bo || 'GV',
            donVi: 'Giảng viên',
            role: 'Giảng viên - GVCN',
            label: `${hoTen || 'Giảng viên'} - Giảng viên`,
            email: p.email,
          });
        } else {
          // Xếp qua Phòng ban Chức năng - định dạng: `${ho_ten} - ${don_vi}`
          const deptName = donVi || 'Phòng ban Chức năng';
          departments.push({
            id: p.ma_can_bo || p.id,
            profileId: p.id,
            name: hoTen || deptName,
            maCanBo: p.ma_can_bo || 'CB',
            donVi: deptName,
            role: deptName,
            label: `${hoTen || 'Cán bộ'} - ${deptName}`,
            email: p.email,
          });
        }
      });

      return {
        data: {
          lecturers,
          departments,
        },
        error: null,
      };
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách đối tượng giải quyết từ database:', err.message);
  }

  // Trường hợp database chưa có nhân sự hoặc mất kết nối, trả về mảng rỗng để đảm bảo 100% dữ liệu thật từ DB
  return {
    data: {
      lecturers: [],
      departments: [],
    },
    error: null,
  };
}

/**
 * Đăng ký lắng nghe sự kiện thay đổi dữ liệu nhân sự bảng profiles theo thời gian thực (Supabase Realtime)
 * Khi database thay đổi (thêm/sửa/xóa profile), hàm callback sẽ tự động được gọi với dữ liệu mới nhất
 */
export function subscribeDispatchTargetsChange(callback) {
  try {
    const channel = supabase
      .channel('realtime:profiles:dispatch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => {
          const res = await getDispatchTargetsFromDatabase();
          if (res?.data && typeof callback === 'function') {
            callback(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Lỗi đăng ký Realtime profiles:', err);
    return () => {};
  }
}

/**
 * Lấy danh sách giảng viên / cán bộ thực tế từ bảng profiles trên database (tương thích ngược)
 */
export async function listLecturersFromDatabase() {
  const result = await getDispatchTargetsFromDatabase();
  return {
    data: result.data?.lecturers || [],
    error: result.error,
  };
}


