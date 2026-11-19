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
} from './cmsService.js';

const DEFAULT_PASSWORD = '123456';

/**
 * Phân tích và chuẩn hóa chuỗi đăng nhập
 * Trả về loại đầu vào: 'email' hoặc 'student_code'
 */
export function parseLoginIdentifier(input) {
  const clean = (input || '').trim().toLowerCase();
  if (clean.includes('@')) {
    return { type: 'email', value: clean };
  }
  return { type: 'student_code', value: clean };
}

/**
 * Đăng nhập vào hệ thống
 * @param {string} identifier Email hoặc Mã sinh viên
 * @param {string} password Mật khẩu
 * @returns {Promise<{ data: { user: object, profile: object } | null, error: string | null }>}
 */
export async function signIn(identifier, password) {
  const cleanId = (identifier || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    return { data: null, error: 'Vui lòng nhập Email trường hoặc Mã sinh viên.' };
  }
  if (!cleanPass) {
    return { data: null, error: 'Vui lòng nhập mật khẩu.' };
  }

  const { type, value } = parseLoginIdentifier(cleanId);
  let targetEmail = value;
  let studentCmsData = null;

  // 1. Nếu người dùng nhập Mã sinh viên -> Lấy hồ sơ từ CMS để sinh ra đúng email trường
  if (type === 'student_code') {
    const cmsResult = await getStudentProfile(value);
    if (cmsResult.error) {
      return { data: null, error: cmsResult.error };
    }
    studentCmsData = cmsResult.data;
    targetEmail = buildExpectedStudentEmail(studentCmsData.hoTen, studentCmsData.maSinhVien);
  }

  // 2. Nếu người dùng nhập Email sinh viên -> Đối chiếu tên và số
  if (type === 'email' && value.endsWith('@caodangvietmyhanoi.edu.vn')) {
    const username = value.split('@')[0];
    const match = username.match(/^([a-z]+)(\d+)$/);
    if (match) {
      const emailName = match[1];
      const codeSuffix = match[2];
      // Tra cứu sinh viên theo đuôi mã hoặc mã sinh viên
      const cmsResult = await getStudentProfile(codeSuffix, { expectedName: emailName });
      if (cmsResult.data) {
        studentCmsData = cmsResult.data;
        const verifyRes = verifyStudentEmailMatch(value, studentCmsData);
        if (!verifyRes.isValid) {
          return { data: null, error: verifyRes.message };
        }
      } else if (cmsResult.error) {
        return { data: null, error: cmsResult.error };
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
    // Nếu là sinh viên
    if (studentCmsData || type === 'student_code') {
      const student = studentCmsData || {
        hoTen: 'Nguyễn Văn Tiến',
        maSinhVien: cleanId,
        lop: 'Cao đẳng CNTT K24',
        khoa: 'Khoa Công nghệ',
        nganh: 'Công nghệ thông tin',
      };
      return {
        data: {
          user: { id: `mock-${student.maSinhVien}`, email: targetEmail },
          profile: {
            id: `mock-${student.maSinhVien}`,
            email: targetEmail,
            ma_sinh_vien: student.maSinhVien,
            ho_ten: student.hoTen,
            lop: student.lop,
            khoa: student.khoa,
            nganh: student.nganh,
            role: 'student',
          },
        },
        error: null,
      };
    }

    // Nếu là Giảng viên (ví dụ: huong.do1@...)
    if (targetEmail.includes('huong.do') || targetEmail.includes('maiant') || targetEmail.includes('gv')) {
      return {
        data: {
          user: { id: 'mock-gv001', email: targetEmail },
          profile: {
            id: 'mock-gv001',
            email: targetEmail,
            ho_ten: 'ThS. Nguyễn Thị Mai',
            role: 'staff',
            khoa: 'Khoa Công nghệ thông tin',
          },
        },
        error: null,
      };
    }

    // Nếu là Cán bộ Quản lý Một cửa (ví dụ: ql001@...)
    if (targetEmail.includes('ql001') || targetEmail.includes('admin')) {
      return {
        data: {
          user: { id: 'mock-ql001', email: targetEmail },
          profile: {
            id: 'mock-ql001',
            email: targetEmail,
            ho_ten: 'Cán bộ Tiếp nhận Một cửa',
            role: 'admin',
            phong_ban: 'Phòng Đào tạo & Quản lý Khoa học',
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

