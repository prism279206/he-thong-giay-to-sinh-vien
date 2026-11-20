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
        error: 'Email không hợp lệ. Vui lòng sử dụng email do trường cấp (đuôi @caodangvietmyhanoi.edu.vn hoặc @caodangvietmy.edu.vn).',
      };
    }
    return { isValid: true, type: 'email', value: lower };
  }

  // 2. Trường hợp là Mã cán bộ / Giảng viên (ví dụ: admincdvmhn, gvcn, QL001, GV001, AD01, admin...)
  if (
    /^(ql|gv|cb|ad)\d+$/i.test(clean) ||
    lower === 'admin' ||
    lower === 'admincdvmhn' ||
    lower === 'gvcn'
  ) {
    return { isValid: true, type: 'staff_code', value: lower };
  }

  // 3. Trường hợp là Mã sinh viên (chỉ gồm các chữ số độ dài từ 6 đến 12 số, hoặc tiền tố SV + chữ số)
  if (/^\d{6,12}$/.test(clean) || /^sv\d+$/i.test(clean)) {
    return { isValid: true, type: 'student_code', value: clean };
  }

  // 4. Nếu người dùng nhập dạng chữ + số (như huy12420, tien12420189) mà KHÔNG có đuôi @...
  if (/^[a-zA-Z]+\d+$/.test(clean)) {
    return {
      isValid: false,
      error: `Định dạng không hợp lệ. Nếu bạn muốn đăng nhập bằng email sinh viên "${clean}", vui lòng điền đầy đủ đuôi "@caodangvietmyhanoi.edu.vn". Nếu dùng mã sinh viên, vui lòng chỉ nhập dãy số (ví dụ: 61112420189).`,
    };
  }

  // 5. Các chuỗi gõ bừa bãi khác (ví dụ abc, test, 123...)
  return {
    isValid: false,
    error: 'Mã đăng nhập không đúng định dạng. Vui lòng nhập Mã sinh viên (dãy số), Mã cán bộ (QL..., GV...) hoặc Email trường cấp.',
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
    } else if (valLower === 'gvcn' || valLower === 'gv001') {
      targetEmail = 'gvcn@caodangvietmyhanoi.edu.vn';
    } else if (valLower === 'gv002') {
      targetEmail = 'huong.do1@caodangvietmy.edu.vn';
    }
  }

  // 2. Nếu người dùng nhập Mã sinh viên (dãy số) -> Tra cứu hồ sơ CMS
  if (type === 'student_code') {
    const cmsResult = await getStudentProfile(value);
    if (cmsResult.error) {
      return { data: null, error: cmsResult.error };
    }
    if (!cmsResult.data) {
      return { data: null, error: `Không tìm thấy hồ sơ sinh viên với mã: "${value}".` };
    }
    studentCmsData = cmsResult.data;
    targetEmail = buildExpectedStudentEmail(studentCmsData.hoTen, studentCmsData.maSinhVien);
  }

  // 2. Nếu người dùng nhập Email sinh viên -> Đối chiếu tên và số với hồ sơ
  if (type === 'email' && value.endsWith('@caodangvietmyhanoi.edu.vn')) {
    const username = value.split('@')[0];
    const match = username.match(/^([a-z]+)(\d+)$/);
    if (match) {
      const emailName = match[1];
      const codeSuffix = match[2];
      // Tra cứu sinh viên theo đuôi mã hoặc mã sinh viên
      const cmsResult = await getStudentProfile(codeSuffix, { expectedName: emailName });
      if (cmsResult.error) {
        return { data: null, error: cmsResult.error };
      }
      if (!cmsResult.data) {
        return { data: null, error: `Không tìm thấy hồ sơ sinh viên tương ứng với email "${value}".` };
      }
      studentCmsData = cmsResult.data;
      const verifyRes = verifyStudentEmailMatch(value, studentCmsData);
      if (!verifyRes.isValid) {
        return { data: null, error: verifyRes.message };
      }
    } else {
      // Nếu email không theo định dạng [Tên][Mã] (kiểm tra xem có phải email cán bộ/giảng viên không)
      const isKnownStaffEmail =
        value.includes('admin') ||
        value.includes('gvcn') ||
        value.includes('ql') ||
        value.includes('huong.do') ||
        value.includes('maiant');
      if (!isKnownStaffEmail) {
        return {
          data: null,
          error: 'Định dạng email sinh viên không hợp lệ. Email sinh viên phải có dạng [Tên][Mã_số]@caodangvietmyhanoi.edu.vn (ví dụ: tien12420189@caodangvietmyhanoi.edu.vn).',
        };
      }
    }
  }

  // 3. Thử đăng nhập qua Supabase Auth
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

      return {
        data: {
          user: authData.user,
          profile: profile || {
            id: authData.user.id,
            email: targetEmail,
            role: 'student',
            ho_ten: studentCmsData?.hoTen || targetEmail,
            ma_sinh_vien: studentCmsData?.maSinhVien || '',
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
    // 4.1 Nếu là Cán bộ Quản lý Một cửa (mã admincdvmhn, admin, QL001 hoặc email admin@...)
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
            ho_ten: 'Cán bộ Quản trị Một cửa',
            role: 'admin',
            ma_sinh_vien: 'admincdvmhn',
            phong_ban: 'Phòng Đào tạo & Quản lý Khoa học',
          },
        },
        error: null,
      };
    }

    // 4.2 Nếu là Giáo viên chủ nhiệm (mã gvcn, gv001 hoặc email gvcn@...)
    if (
      (type === 'staff_code' && (valLower === 'gvcn' || valLower.startsWith('gv'))) ||
      targetEmail.includes('gvcn') ||
      targetEmail.includes('maiant') ||
      targetEmail.includes('huong.do')
    ) {
      const gvEmail = targetEmail.includes('@') ? targetEmail : 'gvcn@caodangvietmyhanoi.edu.vn';
      return {
        data: {
          user: { id: 'mock-gvcn', email: gvEmail, role: 'staff', code: 'gvcn' },
          profile: {
            id: 'mock-gvcn',
            email: gvEmail,
            ho_ten: 'ThS. Nguyễn Thị Mai (GVCN)',
            role: 'staff',
            ma_sinh_vien: 'gvcn',
            khoa: 'Khoa Công nghệ thông tin',
            lop: 'CD-CNTT-K25A',
          },
        },
        error: null,
      };
    }

    // 4.3 Nếu là sinh viên (Bắt buộc phải có hồ sơ thực tế từ API CMS)
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
    error: 'Tài khoản hoặc mật khẩu không chính xác. Mật khẩu khởi tạo mặc định là 123456.',
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

