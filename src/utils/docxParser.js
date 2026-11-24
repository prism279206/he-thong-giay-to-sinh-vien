/**
 * docxParser.js
 * 
 * Bộ công cụ bóc tách file Word (.docx) thuần JavaScript 100% bằng Native Web APIs:
 * - Giải nén PKZip và trích xuất word/document.xml qua DecompressionStream('deflate-raw').
 * - Phân tích cấu trúc văn bản XML bằng DOMParser.
 * - Nhận diện thông minh: Tiêu đề đơn, Cơ quan tiếp nhận (Kính gửi), Danh mục,
 *   tách biệt thông tin cá nhân CMS (tự điền) và các trường câu hỏi nhập liệu đặc thù.
 * - Không phụ thuộc bất kỳ thư viện npm bên ngoài nào (Tuân thủ Quy tắc 3.6 - AGENTS.md).
 */

/**
 * Đọc file Zip và trích xuất dữ liệu của một file con bên trong (Central Directory / Local Header)
 */
function extractZipEntry(arrayBuffer, targetPath) {
  const buf = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // 1. Quét tìm End of Central Directory (EOCD): signature 0x06054b50
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, buf.length - 65536);
  for (let i = buf.length - 22; i >= minEocdSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  // 2. Tìm qua Central Directory
  if (eocdOffset !== -1) {
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    let offset = cdOffset;

    for (let i = 0; i < totalEntries && offset < eocdOffset; i++) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const compMethod = view.getUint16(offset + 10, true);
      const compSize = view.getUint32(offset + 20, true);
      const nameLen = view.getUint16(offset + 28, true);
      const extraLen = view.getUint16(offset + 30, true);
      const commentLen = view.getUint16(offset + 32, true);
      const localHeaderOffset = view.getUint32(offset + 42, true);

      const nameBytes = buf.subarray(offset + 46, offset + 46 + nameLen);
      const name = new TextDecoder('utf-8').decode(nameBytes);

      if (name === targetPath) {
        // Đọc local header để xác định data offset chính xác
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;

        return {
          compMethod,
          compSize,
          data: buf.subarray(dataOffset, dataOffset + compSize),
        };
      }

      offset += 46 + nameLen + extraLen + commentLen;
    }
  }

  // 3. Fallback quét tuần tự Local Headers nếu không đọc được EOCD
  let cur = 0;
  while (cur < buf.length - 30) {
    if (view.getUint32(cur, true) === 0x04034b50) {
      const compMethod = view.getUint16(cur + 8, true);
      const compSize = view.getUint32(cur + 18, true);
      const nameLen = view.getUint16(cur + 26, true);
      const extraLen = view.getUint16(cur + 28, true);
      const nameBytes = buf.subarray(cur + 30, cur + 30 + nameLen);
      const name = new TextDecoder('utf-8').decode(nameBytes);
      const dataOffset = cur + 30 + nameLen + extraLen;

      if (name === targetPath && compSize > 0) {
        return {
          compMethod,
          compSize,
          data: buf.subarray(dataOffset, dataOffset + compSize),
        };
      }
      cur = dataOffset + compSize;
    } else {
      cur++;
    }
  }

  return null;
}

/**
 * Giải nén deflate-raw bằng DecompressionStream
 */
async function decompressDeflateRaw(compressedUint8Array) {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressedUint8Array);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks = [];
    let totalLength = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder('utf-8').decode(result);
  }
  throw new Error('Môi trường trình duyệt không hỗ trợ DecompressionStream.');
}

/**
 * Chuyển đổi tên tiếng Việt có dấu sang mã viết hoa không dấu (slug)
 */
export function slugifyTitle(str) {
  if (!str) return 'DON_MOI';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('_')
    .toUpperCase();
}

/**
 * Chuẩn hóa chuỗi tiếng Việt thành chuỗi không dấu phục vụ so khớp nhãn
 */
export function normalizeVietnameseText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Kiểm tra xem một nhãn có phải là thông tin sinh viên có sẵn trong CMS không.
 * Nếu khớp, trả về object chứa { key, label, cmsKey } để tự động điền từ API CMS.
 */
export function identifyCmsField(rawLabel) {
  const norm = normalizeVietnameseText(rawLabel);

  if (
    /^(ho va ten|ho ten|ten em la|em ten la|toi ten la|ten sinh vien|ho va ten sinh vien|ho va ten hssv|ho ten hssv|ho ten hoc sinh|ten hoc sinh)\b/.test(norm) ||
    norm.includes('em ten la') ||
    norm.includes('ten em la') ||
    norm.includes('toi ten la') ||
    norm.includes('ho va ten') ||
    (norm.includes('ho ten') && !norm.includes('hoc phan')) ||
    /^ho\s*ten\b/.test(norm)
  ) {
    return { key: 'fullName', label: 'Họ và tên', cmsKey: 'hoTen' };
  }
  if (
    /^(ma sinh vien|ma so sinh vien|mssv|ma sv|ms sv|so the sinh vien|so the sv)\b/.test(norm) ||
    norm.includes('mssv') ||
    norm.includes('ma sinh vien') ||
    norm.includes('ma so sinh vien')
  ) {
    return { key: 'studentCode', label: 'Mã số sinh viên (MSSV)', cmsKey: 'maSinhVien' };
  }
  if (/^(gioi tinh|nam\/nu|nam, nu|nam nu)\b/.test(norm) || norm.includes('gioi tinh')) {
    return { key: 'gender', label: 'Giới tính', cmsKey: 'gioiTinh' };
  }
  if (/^(ngay sinh|sinh ngay|nam sinh|ngay thang nam sinh)\b/.test(norm) || norm.includes('ngay sinh')) {
    return { key: 'dob', label: 'Ngày sinh', cmsKey: 'ngaySinh' };
  }
  if (/^(noi sinh|que quan|noi cu tru|ho khau|ho khau thuong tru|dia chi thuong tru|noi o hien nay)\b/.test(norm)) {
    return { key: 'pob', label: 'Nơi sinh / Quê quán', cmsKey: 'noiSinh' };
  }
  if (/(cccd|cmnd|can cuoc|dinh danh)/.test(norm)) {
    if (/ngay cap/.test(norm))
      return { key: 'idCardDate', label: 'Ngày cấp CCCD', cmsKey: 'ngayCapCccd' };
    if (/noi cap/.test(norm))
      return { key: 'idCardPlace', label: 'Nơi cấp CCCD', cmsKey: 'noiCapCccd' };
    return { key: 'idCardNumber', label: 'Số CCCD / Định danh', cmsKey: 'cccd' };
  }
  if (/^(ngay cap|ngay cap cccd|ngay cap cmnd)\b/.test(norm) || norm.includes('ngay cap')) {
    return { key: 'idCardDate', label: 'Ngày cấp CCCD', cmsKey: 'ngayCapCccd' };
  }
  if (/^(noi cap|noi cap cccd|noi cap cmnd)\b/.test(norm) || norm.includes('noi cap')) {
    return { key: 'idCardPlace', label: 'Nơi cấp CCCD', cmsKey: 'noiCapCccd' };
  }
  if (
    /^(lop|sinh vien lop|lop hoc|lop chuyen nganh|lop sinh hoat)\b/.test(norm) &&
    !/hoc phan|mon hoc/.test(norm)
  ) {
    return { key: 'className', label: 'Lớp học', cmsKey: 'lop' };
  }
  if (/^(khoa|thuoc khoa)\b/.test(norm) && !/khoa hoc|nien khoa/.test(norm)) {
    return { key: 'faculty', label: 'Khoa đào tạo', cmsKey: 'khoa' };
  }
  if (/^(chuyen nganh|nganh|nganh hoc|nganh dao tao)\b/.test(norm)) {
    return { key: 'major', label: 'Chuyên ngành đào tạo', cmsKey: 'nganh' };
  }
  if (
    /^(so dien thoai|sdt|dien thoai|sdt lien he|dien thoai lien lac|so dt|dien thoai ca nhan)\b/.test(norm) ||
    norm.includes('sdt') ||
    norm.includes('dien thoai')
  ) {
    return { key: 'phone', label: 'Số điện thoại liên hệ', cmsKey: 'sdt' };
  }
  if (/^(khoa hoc|nien khoa)\b/.test(norm) || (/^khoa\b/.test(norm) && /k\d+|\d{4}/.test(norm))) {
    return { key: 'cohort', label: 'Khóa học', cmsKey: 'khoaHoc' };
  }
  if (/^(he dao tao|hinh thuc dao tao|bac dao tao|he hoc)\b/.test(norm)) {
    return { key: 'trainingSystem', label: 'Hệ đào tạo', cmsKey: 'trainingSystem' };
  }
  if (/^(co so|dia diem hoc tap|co so dao tao|co so hoc tap)\b/.test(norm)) {
    return { key: 'campus', label: 'Cơ sở học tập', cmsKey: 'campus' };
  }

  return null;
}

/**
 * Kiểm tra xem nhãn có phải là lý do/mục đích làm đơn chuẩn không
 * (Trường lý do đã có sẵn cố định trong mọi biểu mẫu nộp đơn, không tách thành custom field)
 */
export function isStandardReasonField(rawLabel) {
  const norm = normalizeVietnameseText(rawLabel);
  return (
    /^(ly do|muc dich|nguyen vong|ly do xin|ly do de nghi|ly do lam don|muc dich xin|de lam thu tuc|de lam giay to|de nop)\b/.test(norm) ||
    norm.startsWith('kinh de nghi nha truong') ||
    norm.startsWith('em lam don nay de') ||
    norm.startsWith('de nghi cap giay') ||
    norm.startsWith('muc dich su dung')
  );
}

/**
 * Kiểm tra các câu dẫn chuyển tiếp hoặc phần chân trang không phải là trường form
 */
function isBoilerplateLine(raw) {
  const norm = normalizeVietnameseText(raw);
  return (
    norm.startsWith('cong hoa xa hoi') ||
    norm.startsWith('doc lap') ||
    norm.startsWith('kinh gui') ||
    norm.startsWith('em xin cam doan') ||
    norm.startsWith('kinh mong') ||
    norm.startsWith('nay em lam don') ||
    norm.startsWith('em lam don nay') ||
    norm.startsWith('nguoi lam don') ||
    norm.startsWith('xac nhan cua') ||
    norm.startsWith('chu ky') ||
    norm.startsWith('ha noi') ||
    /^(ngay\s+thang\s+nam|\.{3,}|_{3,})$/.test(norm)
  );
}

/**
 * Nhận diện loại dữ liệu phù hợp cho trường input từ nhãn câu hỏi
 */
function inferFieldType(label) {
  const lower = label.toLowerCase();
  if (/(ngày|thời gian|date|tháng|năm|hạn)/i.test(lower) && !/(sinh|nơi sinh)/i.test(lower)) {
    return 'date';
  }
  if (/(điểm|số lượng|số bản|mức|tiền|kỳ|học kỳ|số tín)/i.test(lower)) {
    return 'number';
  }
  if (/(lý do|nội dung|nguyện vọng|ý kiến|giải trình|cam kết|đề nghị|mô tả)/i.test(lower)) {
    return 'textarea';
  }
  return 'text';
}

/**
 * Phân tích nội dung text thuần bóc tách từ Word thành cấu trúc form thông minh
 */
export function analyzeDocumentStructure(rawText, defaultFileName = '') {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Nhận diện Tiêu đề đơn (Thường là chữ in hoa bắt đầu bằng ĐƠN, GIẤY, BẢN, PHIẾU...)
  let detectedTitle = '';
  for (const line of lines) {
    if (line.startsWith('|') || line.startsWith('#') || line.includes('`')) continue;
    const normLine = normalizeVietnameseText(line);
    if (normLine.startsWith('cong hoa') || normLine.startsWith('doc lap')) continue;
    if (/^\s*(?:ĐƠN|GIẤY|BẢN|PHIẾU|DON|GIAY|BAN|PHIEU)\b/i.test(line)) {
      detectedTitle = line.replace(/^[#*\s-]+|[#*\s-]+$/g, '').trim();
      break;
    }
  }

  // Nhận diện mã biểu mẫu (Form Code) và phiên bản (Revision) ở đầu văn bản (ví dụ: 04.26-BM/CTSV/APC.)
  let detectedFormCode = '';
  let detectedFormRevision = '';
  for (const line of lines.slice(0, 15)) {
    const codeMatch = line.match(/(\d{1,3}\.\d{1,3}-BM\/[A-Za-z0-9/._-]+|BM\/[A-Za-z0-9/._-]+|[A-Za-z0-9._-]+-BM\/[A-Za-z0-9/._-]+)/i);
    if (codeMatch && !detectedFormCode) {
      detectedFormCode = codeMatch[1].trim();
    }
    const revMatch = line.match(/(?:Lần ban hành(?:\/sửa đổi)?|Ban hành|Sửa đổi|Phiên bản)\s*[:/]\s*([0-9/]+)/i);
    if (revMatch && !detectedFormRevision) {
      detectedFormRevision = `Lần ban hành/sửa đổi: ${revMatch[1]}`;
    }
  }

  // Nếu chưa tìm thấy bằng từ khóa ĐƠN/GIẤY, tìm dòng viết hoa đầu tiên ở đầu văn bản (bỏ qua quốc hiệu)
  if (!detectedTitle) {
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const line = lines[i];
      if (line.startsWith('|') || line.startsWith('#') || line.includes('`')) continue;
      const normLine = normalizeVietnameseText(line);
      if (normLine.startsWith('cong hoa') || normLine.startsWith('doc lap') || normLine.startsWith('ha noi') || normLine.startsWith('ngay thang')) continue;
      if (line === line.toUpperCase() && line.length >= 8 && line.length <= 80 && /[A-Za-zÀ-Ỹà-ỹ]/.test(line)) {
        detectedTitle = line.trim();
        break;
      }
    }
  }

  // Nếu vẫn không thấy, lấy tên file làm tên đơn mặc định
  if (!detectedTitle && defaultFileName) {
    detectedTitle = defaultFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();
    detectedTitle = detectedTitle.charAt(0).toUpperCase() + detectedTitle.slice(1);
  }

  // Nhận diện đơn xin cấp bảng điểm học tập (chuẩn hóa tiếng Việt NFD/NFC)
  const normTitle = normalizeVietnameseText(detectedTitle || defaultFileName);
  const isTranscriptDoc = normTitle.includes('bang diem') || normTitle.includes('transcript');
  if (isTranscriptDoc) {
    if (!detectedFormCode) detectedFormCode = '04.26-BM/CTSV/APC.';
    if (!detectedFormRevision) detectedFormRevision = 'Lần ban hành/sửa đổi: 1/0';
  }

  // 2. Nhận diện Đơn vị xử lý (Kính gửi: ...)
  let detectedDepartment = 'Phòng Đào tạo';
  for (let i = 0; i < lines.length; i++) {
    if (/kính gửi/i.test(lines[i])) {
      const scope = lines.slice(i, Math.min(lines.length, i + 5)).join(' ');
      if (/khảo thí/i.test(scope)) {
        detectedDepartment = 'Phòng Khảo thí';
      } else if (/công tác sinh viên|ctsv|xe buýt|ký túc xá|ktx/i.test(scope)) {
        detectedDepartment = 'Phòng Công tác sinh viên';
      } else if (/giảng viên chủ nhiệm|gvcn|giáo viên chủ nhiệm/i.test(scope)) {
        detectedDepartment = 'Giảng viên - GVCN';
      } else {
        detectedDepartment = 'Phòng Đào tạo';
      }
      break;
    }
  }

  // 3. Phân loại danh mục (Category)
  let detectedCategory = 'Học vụ & Đào tạo';
  const titleAndDept = (detectedTitle + ' ' + detectedDepartment).toLowerCase();
  if (/phúc khảo|thi lại|hoãn thi|điểm|khảo thí/i.test(titleAndDept)) {
    detectedCategory = 'Khảo thí & Điểm';
  } else if (/xác nhận|tốt nghiệp|bảng điểm|chứng nhận/i.test(titleAndDept)) {
    detectedCategory = 'Xác nhận học tập';
  } else if (/học phí|miễn giảm|vay vốn|tiền|tài chính/i.test(titleAndDept)) {
    detectedCategory = 'Học phí & Tài chính';
  } else if (/xe buýt|thẻ|ktx|ký túc xá|đời sống|công tác/i.test(titleAndDept)) {
    detectedCategory = 'Công tác sinh viên';
  }

  // 4. Bóc tách các trường: Phân loại rạch ròi giữa CMS Fields (tự điền từ API) và Custom Fields (chừa ô trống)
  const detectedCmsFields = [];
  const customFields = [];
  const seenCmsKeys = new Set();
  const seenCustomLabels = new Set();

  for (const line of lines) {
    // Tìm các cụm có dạng: "Tên nhãn: ........" hoặc "Tên nhãn: ________" hoặc "Tên nhãn: [khoảng trống]"
    const matches = [
      ...line.matchAll(
        /(?:^|[.;\t•\n]+|\s+)([A-ZÀ-Ỹa-zà-ỹ0-9\s/()_-]+?)\s*[:：]\s*(?:[._{}—–-]{2,}|\s{2,}|$)/g
      ),
    ];

    for (const match of matches) {
      let rawLabel = match[1].trim().replace(/^[-*•\s\d.)]+/, '').trim();
      if (rawLabel.length < 2 || rawLabel.length > 60) continue;
      if (isBoilerplateLine(rawLabel)) continue;

      // 4.1. Bỏ qua các nhãn lý do/mục đích làm đơn chuẩn (vì form mặc định đã luôn có ô nhập lý do riêng)
      if (isStandardReasonField(rawLabel)) continue;

      // 4.2. Kiểm tra xem có phải thông tin sinh viên từ CMS không
      const cmsMatch = identifyCmsField(rawLabel);
      if (cmsMatch) {
        if (!seenCmsKeys.has(cmsMatch.key)) {
          seenCmsKeys.add(cmsMatch.key);
          detectedCmsFields.push({
            key: cmsMatch.key,
            label: cmsMatch.label,
            cmsKey: cmsMatch.cmsKey,
            originalText: rawLabel,
          });
        }
        // Trường này đã có trong CMS -> TỰ ĐỘNG ĐIỀN, KHÔNG đưa vào danh sách bắt sinh viên gõ lại
        continue;
      }

      // 4.3. Các ô trống còn lại (ví dụ Môn thi, Mã học phần, Điểm số, Ca thi...) -> Đưa vào danh sách Custom Fields
      const normLabel = normalizeVietnameseText(rawLabel);
      if (seenCustomLabels.has(normLabel)) continue;
      seenCustomLabels.add(normLabel);

      const fieldType = inferFieldType(rawLabel);
      const fieldId = `field_${customFields.length + 1}_${Math.random().toString(36).slice(2, 6)}`;
      const formattedLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

      customFields.push({
        id: fieldId,
        label: formattedLabel,
        type: fieldType,
        required: true,
        placeholder:
          fieldType === 'textarea'
            ? `Nhập chi tiết ${formattedLabel.toLowerCase()}...`
            : `Nhập ${formattedLabel.toLowerCase()}...`,
      });
    }
  }

  // 5. Nếu là đơn bảng điểm, thiết lập bộ 7 trường CMS chuẩn theo mẫu Word gốc
  if (isTranscriptDoc) {
    detectedCmsFields.length = 0;
    detectedCmsFields.push(
      { key: 'fullName', label: 'Họ và tên', cmsKey: 'hoTen' },
      { key: 'studentCode', label: 'Mã số sinh viên', cmsKey: 'maSinhVien' },
      { key: 'dob', label: 'Ngày sinh', cmsKey: 'ngaySinh' },
      { key: 'phone', label: 'Số điện thoại', cmsKey: 'sdt' },
      { key: 'className', label: 'Hiện đang học lớp', cmsKey: 'lop' },
      { key: 'major', label: 'Ngành', cmsKey: 'nganh' },
      { key: 'cohort', label: 'Khóa', cmsKey: 'khoaHoc' }
    );
    customFields.length = 0;
  } else if (detectedCmsFields.length === 0) {
    // Nếu trong file không đề cập trực tiếp CMS fields, mặc định hệ thống liên kết bộ trường cơ bản
    detectedCmsFields.push(
      { key: 'fullName', label: 'Họ và tên', cmsKey: 'hoTen' },
      { key: 'studentCode', label: 'Mã số sinh viên', cmsKey: 'maSinhVien' },
      { key: 'dob', label: 'Ngày sinh', cmsKey: 'ngaySinh' },
      { key: 'className', label: 'Lớp học', cmsKey: 'lop' },
      { key: 'major', label: 'Chuyên ngành', cmsKey: 'nganh' }
    );
  }

  return {
    title: detectedTitle || 'Đơn đề nghị mới',
    department: detectedDepartment,
    category: detectedCategory,
    formCode: detectedFormCode || null,
    formRevision: detectedFormRevision || null,
    formType: isTranscriptDoc ? 'transcript' : 'standard',
    cmsFields: detectedCmsFields,
    customFields,
    rawText,
    summary:
      customFields.length === 0
        ? `Đã nhận diện đơn "${detectedTitle || 'Đơn mới'}". Giữ nguyên vẹn 100% mẫu gốc của trường: toàn bộ thông tin sinh viên (${detectedCmsFields.length} mục) tự động lấy từ CMS, sinh viên chỉ điền lý do và ký nộp.`
        : `Đã tự động liên kết ${detectedCmsFields.length} mục với CMS và bóc tách ${customFields.length} ô trống cho sinh viên tự điền.`,
  };
}

/**
 * Hàm chính: Đọc file Word (.docx) và trích xuất thành biểu mẫu hoàn chỉnh
 * @param {File|ArrayBuffer} fileOrBuffer File người dùng tải lên
 * @returns {Promise<Object>} Cấu trúc biểu mẫu bóc tách được
 */
export async function parseDocxFile(fileOrBuffer) {
  let arrayBuffer;
  let fileName = '';

  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
    fileName = fileOrBuffer.name || '';
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Dữ liệu tải lên không hợp lệ, cần file hoặc ArrayBuffer.');
  }

  // 1. Trích xuất file word/document.xml từ gói zip
  const docXmlEntry = extractZipEntry(arrayBuffer, 'word/document.xml');
  if (!docXmlEntry) {
    throw new Error('Không tìm thấy nội dung văn bản (word/document.xml) trong file Word này.');
  }

  // 2. Giải nén nội dung XML
  let xmlString = '';
  if (docXmlEntry.compMethod === 8) {
    xmlString = await decompressDeflateRaw(docXmlEntry.data);
  } else if (docXmlEntry.compMethod === 0) {
    xmlString = new TextDecoder('utf-8').decode(docXmlEntry.data);
  } else {
    throw new Error(`Định dạng nén Word không được hỗ trợ (Method ${docXmlEntry.compMethod}).`);
  }

  // 3. Phân tích các đoạn văn bản (paragraphs <w:p> & text <w:t>)
  const extractedLines = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      const trimmed = pText.trim();
      if (trimmed) {
        extractedLines.push(trimmed);
      }
    }
  } else {
    // Regex fallback
    const pMatches = xmlString.match(/<w:p\b[^>]*>.*?<\/w:p>/gs) || [];
    for (const p of pMatches) {
      const tMatches = [...p.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs)].map((m) =>
        m[1].replace(/<[^>]+>/g, '')
      );
      const text = tMatches.join('').trim();
      if (text) extractedLines.push(text);
    }
  }

  const fullText = extractedLines.join('\n');

  // 4. Nhận diện cấu trúc form
  const analysis = analyzeDocumentStructure(fullText, fileName);

  return {
    success: true,
    fileName,
    ...analysis,
  };
}
