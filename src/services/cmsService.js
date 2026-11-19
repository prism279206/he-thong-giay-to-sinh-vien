/**
 * Service tích hợp API hồ sơ sinh viên của Trường Cao đẳng Việt Mỹ (Cơ sở Hà Nội)
 * Tài liệu: https://hanoi.vietmycollege.com/api/integrations/student-profile
 */

const CMS_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CMS_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_CMS_API_BASE_URL) ||
  'https://hanoi.vietmycollege.com/api/integrations/student-profile';

const CMS_BEARER_TOKEN =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_VIETMY_API_KEY || import.meta.env?.VITE_CMS_BEARER_TOKEN)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_VIETMY_API_KEY || process.env?.VITE_CMS_BEARER_TOKEN)) ||
  '';

/**
 * Danh sách sinh viên mẫu chuẩn theo schema của trường
 * Dùng khi trường chưa cấp mã khóa thật hoặc khi chạy offline / dev
 */
const MOCK_STUDENTS = {
  '61112420189': {
    hoTen: 'Nguyễn Văn Tiến',
    maSinhVien: '61112420189',
    sdt: '0987654321',
    cccd: '001204012345',
    ngayCapCccd: '2021-06-20',
    ngaySinh: '2006-05-15',
    noiSinh: 'Hà Nội',
    khoaHoc: '2024-2027',
    lop: 'Cao đẳng CNTT K24',
    khoa: 'Khoa Công nghệ',
    nganh: 'Công nghệ thông tin',
    updatedAt: new Date().toISOString(),
  },
  '12420189': {
    hoTen: 'Nguyễn Văn Tiến',
    maSinhVien: '61112420189',
    sdt: '0987654321',
    cccd: '001204012345',
    ngayCapCccd: '2021-06-20',
    ngaySinh: '2006-05-15',
    noiSinh: 'Hà Nội',
    khoaHoc: '2024-2027',
    lop: 'Cao đẳng CNTT K24',
    khoa: 'Khoa Công nghệ',
    nganh: 'Công nghệ thông tin',
    updatedAt: new Date().toISOString(),
  },
  '24123456': {
    hoTen: 'Trần Văn Minh',
    maSinhVien: '24123456',
    sdt: '0912345678',
    cccd: '001204056789',
    ngayCapCccd: '2022-01-10',
    ngaySinh: '2006-08-20',
    noiSinh: 'Bắc Ninh',
    khoaHoc: '2024-2027',
    lop: 'CD-CNTT-K24A',
    khoa: 'Khoa Công nghệ thông tin',
    nganh: 'Công nghệ thông tin',
    updatedAt: new Date().toISOString(),
  },
  SV00123: {
    hoTen: 'Nguyễn Văn A',
    maSinhVien: 'SV00123',
    sdt: '0901234567',
    cccd: '001200001234',
    ngayCapCccd: '',
    ngaySinh: '2006-01-02',
    noiSinh: '',
    khoaHoc: '2024-2027',
    lop: 'Cao đẳng CNTT K24',
    khoa: 'Khoa Công nghệ',
    nganh: 'Công nghệ thông tin',
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Chuẩn hóa tên tiếng Việt sang không dấu viết thường
 * Ví dụ: "Nguyễn Văn Tiến" -> "tien"
 */
export function extractCleanStudentName(fullName) {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  const firstName = words[words.length - 1];

  return firstName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

/**
 * Lấy phần số của email từ mã sinh viên:
 * Quy tắc trường Cao đẳng Việt Mỹ Hà Nội:
 * Mã sinh viên 11 số (ví dụ: "61112420189") -> bỏ tiền tố mã trường "611", lấy "12420189"
 * Nếu mã đã là đuôi số 8 ký tự ("12420189") -> giữ nguyên "12420189"
 */
export function extractStudentCodeSuffix(studentCode) {
  if (!studentCode) return '';
  const cleanCode = studentCode.trim();
  // Nếu có tiền tố 611 của trường CĐ Việt Mỹ Hà Nội (mã 11 số)
  if (cleanCode.startsWith('611') && cleanCode.length > 6) {
    return cleanCode.slice(3);
  }
  // Nếu có tiền tố chữ như SV (ví dụ SV00123)
  if (/^[a-zA-Z]+/.test(cleanCode)) {
    return cleanCode.replace(/^[a-zA-Z]+/, '');
  }
  return cleanCode;
}

/**
 * Tìm kiếm sinh viên trong kho dữ liệu mẫu theo:
 * - Mã sinh viên đầy đủ (ví dụ: 61112420189)
 * - Đuôi mã sinh viên dùng trong email (ví dụ: 12420189)
 */
export function findMockStudent(studentCodeOrSuffix) {
  if (!studentCodeOrSuffix) return null;
  const clean = studentCodeOrSuffix.trim().toLowerCase();

  // 1. Khớp theo key chính xác
  if (MOCK_STUDENTS[clean]) {
    return MOCK_STUDENTS[clean];
  }

  // 2. Khớp theo maSinhVien
  const exact = Object.values(MOCK_STUDENTS).find(
    (s) => s.maSinhVien.toLowerCase() === clean
  );
  if (exact) return exact;

  // 3. Khớp theo đuôi mã dùng trong email
  const bySuffix = Object.values(MOCK_STUDENTS).find(
    (s) => extractStudentCodeSuffix(s.maSinhVien).toLowerCase() === clean
  );
  if (bySuffix) return bySuffix;

  // 4. Khớp đuôi chuỗi
  const byEnd = Object.values(MOCK_STUDENTS).find(
    (s) =>
      s.maSinhVien.toLowerCase().endsWith(clean) ||
      clean.endsWith(s.maSinhVien.toLowerCase())
  );
  if (byEnd) return byEnd;

  return null;
}

/**
 * Tự động tạo email trường cho sinh viên theo đúng quy tắc:
 * [Tên không dấu][Mã số từ ký tự thứ 4]@caodangvietmyhanoi.edu.vn
 * Ví dụ: "Nguyễn Văn Tiến", "61112420189" -> "tien12420189@caodangvietmyhanoi.edu.vn"
 */
export function buildExpectedStudentEmail(fullName, studentCode) {
  const namePart = extractCleanStudentName(fullName);
  const codePart = extractStudentCodeSuffix(studentCode);
  return `${namePart}${codePart}@caodangvietmyhanoi.edu.vn`;
}

/**
 * Đối chiếu email người dùng nhập với hồ sơ sinh viên
 * Đảm bảo tên và mã số trong email trùng khớp với hồ sơ
 */
export function verifyStudentEmailMatch(inputEmail, studentProfile) {
  const cleanInput = (inputEmail || '').trim().toLowerCase();
  const { hoTen, maSinhVien } = studentProfile;

  if (!cleanInput.endsWith('@caodangvietmyhanoi.edu.vn')) {
    return {
      isValid: false,
      message: 'Email phải có đuôi @caodangvietmyhanoi.edu.vn của Trường Cao đẳng Việt Mỹ Hà Nội.',
    };
  }

  const username = cleanInput.split('@')[0];
  const match = username.match(/^([a-z]+)(\d+)$/);
  if (!match) {
    return {
      isValid: false,
      message: 'Định dạng email sinh viên không hợp lệ: phải có dạng [Tên][Mã số]@caodangvietmyhanoi.edu.vn',
    };
  }

  const [, emailName, emailCodeNumber] = match;
  const expectedName = extractCleanStudentName(hoTen);
  const expectedCodeNumber = extractStudentCodeSuffix(maSinhVien);
  const expectedFullEmail = `${expectedName}${expectedCodeNumber}@caodangvietmyhanoi.edu.vn`;

  if (emailName !== expectedName) {
    return {
      isValid: false,
      message: `Tên trong email ("${emailName}") không khớp với tên sinh viên trong hồ sơ ("${expectedName}").`,
      expectedEmail: expectedFullEmail,
    };
  }

  if (emailCodeNumber !== expectedCodeNumber) {
    return {
      isValid: false,
      message: `Dãy số trong email ("${emailCodeNumber}") không khớp với mã sinh viên ("${expectedCodeNumber}").`,
      expectedEmail: expectedFullEmail,
    };
  }

  return {
    isValid: true,
    message: 'Email hợp lệ và trùng khớp với hồ sơ!',
    expectedEmail: expectedFullEmail,
  };
}

/**
 * Lấy hồ sơ của một sinh viên theo mã sinh viên hoặc đuôi mã trong email
 * @param {string} studentCode Mã sinh viên (ví dụ: "61112420189" hoặc "12420189")
 * @param {object} [options] Tùy chọn bổ sung (ví dụ: expectedName)
 * @returns {Promise<{ data: object|null, error: string|null, isMock: boolean }>}
 */
export async function getStudentProfile(studentCode, _options = {}) {
  const cleanCode = (studentCode || '').trim();
  if (!cleanCode) {
    return { data: null, error: 'Mã sinh viên không được để trống.', isMock: false };
  }

  // 1. Nếu đã có mã khóa (Bearer Token) cấu hình trong .env -> Gọi API thật của trường
  if (CMS_BEARER_TOKEN && CMS_BEARER_TOKEN !== '$TOKEN') {
    try {
      // Gọi API trường với mã sinh viên
      let response = await fetch(`${CMS_API_BASE_URL}/students/${cleanCode}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CMS_BEARER_TOKEN}`,
          Accept: 'application/json',
        },
      });

      // Nếu mã là đuôi 8 chữ số (từ email) và chưa tìm thấy -> thử tra cứu tiếp bằng mã 11 số (thêm tiền tố 611)
      if (response.status === 404 && cleanCode.length === 8 && !cleanCode.startsWith('611')) {
        const fullCode = `611${cleanCode}`;
        const retryResponse = await fetch(`${CMS_API_BASE_URL}/students/${fullCode}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${CMS_BEARER_TOKEN}`,
            Accept: 'application/json',
          },
        });
        if (retryResponse.ok) {
          response = retryResponse;
        }
      }

      const contentType = response.headers.get('content-type') || '';

      // Trường hợp máy chủ trường trả về JSON chuẩn
      if (contentType.includes('application/json')) {
        if (response.ok) {
          const json = await response.json();
          if (json.data) {
            return { data: json.data, error: null, isMock: false };
          }
        }

        if (response.status === 404) {
          // Nếu API trường hoạt động và trả về không tìm thấy
          // Kiểm tra xem có trong danh sách mock dự phòng không
          const foundMock = findMockStudent(cleanCode);
          if (foundMock) {
            return { data: foundMock, error: null, isMock: true };
          }
          return { data: null, error: `Không tìm thấy hồ sơ sinh viên với mã: "${cleanCode}" trên hệ thống nhà trường.`, isMock: false };
        }

        if (response.status === 401) {
          return {
            data: null,
            error: 'Khóa API không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại mã khóa.',
            isMock: false,
          };
        }
      } else {
        // Máy chủ trường trả về HTML 404 (chưa kích hoạt route API trên domain)
        return {
          data: null,
          error: `Máy chủ API của trường (${CMS_API_BASE_URL}) hiện đang trả về lỗi 404 (The page could not be found). Tuyến API này chưa được phía kỹ thuật của trường kích hoạt trên hệ thống thật.`,
          isMock: false,
        };
      }
    } catch (err) {
      console.warn('Không thể kết nối đến máy chủ trường, tự động chuyển sang chế độ dự phòng:', err.message);
    }
  }

  // 2. Chế độ dự phòng (Mock Provider): Trả về dữ liệu mẫu chuẩn theo docs trường
  const foundStudent = findMockStudent(cleanCode);
  if (foundStudent) {
    return {
      data: foundStudent,
      error: null,
      isMock: true,
    };
  }

  // Nếu không tìm thấy hồ sơ sinh viên hợp lệ -> Báo lỗi từ chối, tuyệt đối không tự bịa sinh viên ảo
  return {
    data: null,
    error: `Không tìm thấy hồ sơ sinh viên với mã: "${cleanCode}". Vui lòng kiểm tra lại chính xác mã sinh viên của trường.`,
    isMock: false,
  };
}

/**
 * Kiểm tra trạng thái máy chủ API của trường
 */
export async function checkCmsApiHealth() {
  if (!CMS_BEARER_TOKEN || CMS_BEARER_TOKEN === '$TOKEN') {
    return {
      online: false,
      configured: false,
      message: 'Chưa cấu hình mã khóa (Bearer Token) trong biến môi trường VITE_VIETMY_API_KEY.',
    };
  }

  try {
    const res = await fetch(`${CMS_API_BASE_URL}/health`, {
      headers: { Authorization: `Bearer ${CMS_BEARER_TOKEN}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { online: true, configured: true, data };
    }
    return { online: false, configured: false, status: res.status };
  } catch (err) {
    return { online: false, configured: false, error: err.message };
  }
}

