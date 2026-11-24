// Khóa học tính động theo quy tắc ngày 1/8 hàng năm
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

// Mẫu chữ ký trong suốt mặc định cho dữ liệu mẫu (SVG Data URL)
export const DEFAULT_MOCK_SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><path d="M20,50 Q45,15 70,45 T120,35 Q145,20 170,55 M50,45 Q75,70 110,30 T160,50" fill="none" stroke="%231D4ED8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const DEFAULT_TEACHER_SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" width="220" height="80"><path d="M25,48 Q55,20 85,42 T135,28 Q165,15 195,50 M60,42 Q90,65 125,25 T175,45" fill="none" stroke="%237C3AED" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="65" y="72" font-family="sans-serif" font-size="11" font-weight="bold" fill="%236D28D9">Đỗ Thị Hương</text></svg>';

const STORAGE_KEY = 'vmh_shared_requests_v8';

// Tự động quét dọn toàn bộ các khóa bộ nhớ cũ (v1 -> v7) để loại bỏ dữ liệu ảo
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    ['vmh_shared_requests_v1', 'vmh_shared_requests_v2', 'vmh_shared_requests_v3', 'vmh_shared_requests_v4', 'vmh_shared_requests_v5', 'vmh_shared_requests_v6', 'vmh_shared_requests_v7'].forEach((k) => {
      window.localStorage.removeItem(k);
    });
  } catch {}
}

// Dữ liệu đơn khởi tạo dùng chung giữa Sinh viên -> Quản trị (Quản trị viên) -> Giảng viên
// Mặc định khởi tạo trống trơn (không chứa đơn mẫu cũ), đơn mới do sinh viên nộp hoặc lưu từ DB
export const INITIAL_SHARED_REQUESTS = [];

/**
 * Xóa sạch danh sách đơn trong cache
 */
export function clearStoredRequests() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_requests_updated'));
    }
  } catch {}
}

/**
 * Lấy danh sách đơn từ localStorage (nếu chưa có thì lấy từ danh sách mặc định)
 */
export function getStoredRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHARED_REQUESTS));
      return INITIAL_SHARED_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Tự động khử trùng lặp (deduplicate) theo id nếu trước đó bị lưu đúp
      const seen = new Set();
      const unique = [];
      for (const item of parsed) {
        if (item && item.id && !seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      }
      return unique;
    }
    return INITIAL_SHARED_REQUESTS;
  } catch {
    return INITIAL_SHARED_REQUESTS;
  }
}

/**
 * Lưu danh sách đơn vào localStorage
 */
export function saveStoredRequests(requests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_requests_updated'));
    }
  } catch (err) {
    console.error('Lỗi khi lưu mock requests vào localStorage:', err);
  }
}

/**
 * Thêm đơn mới do sinh viên nộp
 */
export function addStudentRequest(newRequest) {
  const currentList = getStoredRequests();
  // Chặn tuyệt đối không lưu trùng lặp nếu đơn đã tồn tại
  if (currentList.some((r) => r.id === newRequest.id)) {
    return currentList;
  }
  const updated = [newRequest, ...currentList];
  saveStoredRequests(updated);

  // Gửi thông báo đến Quản trị viên
  addNotification({
    recipient: 'admin',
    title: 'Hồ sơ mới cần tiếp nhận',
    body: `Sinh viên ${newRequest.studentName} (${newRequest.studentCode}) vừa nộp ${newRequest.typeName} (Mã đơn: ${newRequest.id}).`,
    message: `Sinh viên ${newRequest.studentName} (${newRequest.studentCode}) vừa nộp ${newRequest.typeName} (Mã đơn: ${newRequest.id}).`,
    requestId: newRequest.id,
  });

  // Gửi thông báo xác nhận đến sinh viên
  addNotification({
    recipient: newRequest.studentCode,
    studentCode: newRequest.studentCode,
    title: 'Nộp đơn trực tuyến thành công',
    body: `Đơn ${newRequest.id} (${newRequest.typeName}) đã được nộp thành công và chuyển đến Quản trị viên để tiếp nhận.`,
    message: `Đơn ${newRequest.id} (${newRequest.typeName}) đã được nộp thành công và chuyển đến Quản trị viên để tiếp nhận.`,
    requestId: newRequest.id,
  });

  return updated;
}

/**
 * Xóa một lá đơn khỏi kho lưu trữ (Sinh viên hủy đơn)
 */
export function deleteStoredRequest(requestId) {
  const currentList = getStoredRequests();
  const updated = currentList.filter((r) => r.id !== requestId);
  saveStoredRequests(updated);
  return updated;
}

/**
 * Cán bộ Quản trị viên phân phát đơn tới các GV / Phòng ban (Hỗ trợ từ 1 đến 10 người)
 */
export function dispatchRequestByAdmin(requestId, assignedInfoOrList, urgency, deadline, note) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const rawList = Array.isArray(assignedInfoOrList)
    ? assignedInfoOrList.slice(0, 10)
    : [assignedInfoOrList];

  const assignedSigners = rawList.map((item, idx) => ({
    id: item.id || `signer_${idx + 1}`,
    name: item.name || item.fullName || 'Cán bộ xử lý',
    role: item.role || 'staff',
    email: item.email || '',
    faculty: item.faculty || item.donVi || '',
    donVi: item.donVi || item.faculty || item.department || '',
    department: item.department || item.donVi || item.faculty || '',
    displayName: item.displayName || item.label || item.name,
    type: item.type || (item.role === 'teacher' ? 'lecturer' : 'department'),
    order: idx + 1,
    status: item.status || 'pending',
    signedAt: item.signedAt || null,
    signatureUrl: item.signatureUrl || null,
    signedBy: item.signedBy || null,
    deadline: deadline || item.deadline || 'Trong 48 giờ',
    note: note || item.note || '',
  }));

  const primaryTarget = assignedSigners[0] || null;
  const signerNames = assignedSigners.map((s) => s.displayName || s.name).join(', ');

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: `Phân phát tới ${assignedSigners.length} người ký: ${signerNames}`,
          actor: 'Quản trị viên',
          time: timeStr,
          note: `Chuyển đơn tới: ${signerNames}. Ghi chú: ${note || 'Không có'}`,
        },
      ];

      return {
        ...req,
        status: 'in_progress',
        statusLabel: `Đang xử lý (Chờ ${assignedSigners.length} cán bộ ký)`,
        distributionStatus: 'assigned',
        urgency: urgency || req.urgency,
        assignedTo: primaryTarget,
        assignedSigners: assignedSigners,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    // Thông báo cho từng Cán bộ / Giảng viên được phân công
    assignedSigners.forEach((signer) => {
      const recipient = signer.email || signer.id || 'teacher';
      addNotification({
        recipient: recipient,
        title: 'Hồ sơ mới được phân công duyệt',
        body: `Quản trị viên đã chuyển đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} đến bạn để ký duyệt.`,
        message: `Quản trị viên đã chuyển đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} đến bạn để ký duyệt. Hạn xử lý: ${deadline || 'Trong 48 giờ'}.`,
        requestId,
      });
    });

    // Thông báo cập nhật tiến độ cho Sinh viên
    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'Đơn đang được xử lý',
      body: `Đơn ${requestId} của bạn đã được Quản trị viên chuyển tới ${signerNames} để thẩm định và phê duyệt.`,
      message: `Đơn ${requestId} của bạn đã được Quản trị viên chuyển tới ${signerNames} để thẩm định và phê duyệt.`,
      requestId,
    });
  }

  return updated;
}

/**
 * Cán bộ Quản trị viên từ chối đơn
 */
export function rejectRequestByAdmin(requestId, rejectReason) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Từ chối tiếp nhận',
          actor: 'Quản trị viên',
          time: timeStr,
          note: `Lý do từ chối: ${rejectReason}`,
        },
      ];

      return {
        ...req,
        status: 'rejected',
        statusLabel: 'Bị từ chối',
        distributionStatus: 'rejected',
        rejectReason,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'Đơn bị từ chối tiếp nhận',
      body: `Đơn ${requestId} (${targetReq.typeName}) đã bị từ chối tiếp nhận. Lý do: ${rejectReason}`,
      message: `Đơn ${requestId} (${targetReq.typeName}) đã bị từ chối tiếp nhận. Lý do: ${rejectReason}`,
      requestId,
    });
  }

  return updated;
}

const NOTIFICATIONS_STORAGE_KEY = 'vmh_student_notifications_v5';

const INITIAL_NOTIFICATIONS = [];

/**
 * Lấy danh sách thông báo theo đối tượng (sinh viên, quản trị viên, giảng viên)
 */
export function getStoredNotifications(recipient) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    if (!recipient) return list;

    if (recipient === 'admin') {
      return list.filter((n) => n.recipient === 'admin');
    }

    // Nếu recipient là đối tượng người dùng hoặc chuỗi
    let rEmail = '';
    let rId = '';
    let rName = '';
    if (typeof recipient === 'object' && recipient !== null) {
      rEmail = (recipient.email || '').toLowerCase().trim();
      rId = (recipient.staffCode || recipient.teacherCode || recipient.code || recipient.id || '').toLowerCase().trim();
      rName = (recipient.fullName || recipient.name || '').toLowerCase().trim();
    } else if (typeof recipient === 'string') {
      const s = recipient.toLowerCase().trim();
      if (s.includes('@')) rEmail = s;
      else rId = s;
    }

    return list.filter((n) => {
      const nRecip = (n.recipient || '').toLowerCase().trim();
      if (rEmail && nRecip === rEmail) return true;
      if (rId && nRecip === rId) return true;
      if (rName && nRecip === rName) return true;
      if (n.studentCode && (n.studentCode.toLowerCase().trim() === rId || n.studentCode.toLowerCase().trim() === rEmail)) return true;
      if ((rId.startsWith('gv') || rId.startsWith('kt') || rEmail.includes('huong.do') || rEmail.includes('luan.dam') || rEmail.includes('dung.dinh')) && (nRecip === 'teacher' || nRecip.startsWith('gv'))) {
        return true;
      }
      return false;
    });
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Thêm thông báo mới cho hệ thống (sinh viên / admin / giảng viên)
 */
export function addNotification(notification) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleString('vi-VN', { hour12: false }),
      isRead: false,
      ...notification,
    };
    const updated = [newNotif, ...(Array.isArray(current) ? current : [])];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_notifications_updated'));
    }
    return updated;
  } catch (err) {
    console.error('Lỗi khi thêm thông báo:', err);
  }
}

export const addStudentNotification = addNotification;

/**
 * Đánh dấu thông báo là đã đọc
 */
export function markNotificationAsRead(notifId) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const current = JSON.parse(raw);
    if (Array.isArray(current)) {
      const updated = current.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vmh_notifications_updated'));
      }
    }
  } catch (err) {
    console.error('Lỗi khi đánh dấu thông báo:', err);
  }
}

/**
 * Đánh dấu tất cả thông báo của một đối tượng là đã đọc
 */
export function markAllNotificationsAsRead(recipient) {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const current = JSON.parse(raw);
    if (Array.isArray(current)) {
      const updated = current.map((n) => {
        if (!recipient) return { ...n, isRead: true };
        if (recipient === 'admin' && n.recipient === 'admin') return { ...n, isRead: true };
        if (
          (recipient === 'teacher' || (typeof recipient === 'string' && recipient.startsWith('GV'))) &&
          (n.recipient === recipient || n.recipient === 'teacher' || (n.recipient && n.recipient.startsWith('GV')))
        ) {
          return { ...n, isRead: true };
        }
        if (n.recipient === recipient || n.studentCode === recipient) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vmh_notifications_updated'));
      }
    }
  } catch (err) {
    console.error('Lỗi khi đánh dấu tất cả thông báo:', err);
  }
}

/**
 * Giảng viên / Cán bộ ký duyệt đơn (Hỗ trợ nhiều người ký, tối đa 10 người)
 */
export function signAndApproveByTeacher(requestId, teacherInfoOrSig, signatureOrTeacherName, signerDetails = null) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let sigToUse = DEFAULT_TEACHER_SIGNATURE;
  let teacherName = 'Đỗ Thị Hương';
  let signerEmail = signerDetails?.email || '';
  let signerId = signerDetails?.id || signerDetails?.staffCode || '';
  let signerDept = signerDetails?.department || signerDetails?.donVi || '';

  if (typeof teacherInfoOrSig === 'string' && teacherInfoOrSig.startsWith('data:image')) {
    sigToUse = teacherInfoOrSig;
    if (typeof signatureOrTeacherName === 'string') {
      teacherName = signatureOrTeacherName;
    } else if (signatureOrTeacherName?.name) {
      teacherName = signatureOrTeacherName.name;
    }
  } else if (typeof teacherInfoOrSig === 'object' && teacherInfoOrSig !== null) {
    teacherName = teacherInfoOrSig.name || teacherName;
    signerEmail = teacherInfoOrSig.email || signerEmail;
    signerId = teacherInfoOrSig.id || teacherInfoOrSig.code || signerId;
    signerDept = teacherInfoOrSig.donVi || teacherInfoOrSig.department || signerDept;
    if (signatureOrTeacherName) sigToUse = signatureOrTeacherName;
  } else if (typeof teacherInfoOrSig === 'string') {
    teacherName = teacherInfoOrSig;
    if (signatureOrTeacherName) sigToUse = signatureOrTeacherName;
  }

  if (!sigToUse && typeof localStorage !== 'undefined') {
    sigToUse = localStorage.getItem('vmh_saved_signature') || DEFAULT_TEACHER_SIGNATURE;
  }

  let targetReq = null;
  let allSigned = false;
  let signedCount = 0;
  let totalSigners = 1;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;

      let signers = Array.isArray(req.assignedSigners) && req.assignedSigners.length > 0
        ? [...req.assignedSigners]
        : [];

      // Tìm vị trí của người ký trong danh sách assignedSigners
      let matchedIndex = -1;
      if (signers.length > 0) {
        if (signerEmail) {
          matchedIndex = signers.findIndex(
            (s) => s.email && s.email.toLowerCase() === signerEmail.toLowerCase() && s.status !== 'signed'
          );
        }
        if (matchedIndex === -1 && signerId) {
          matchedIndex = signers.findIndex(
            (s) => s.id === signerId && s.status !== 'signed'
          );
        }
        if (matchedIndex === -1 && teacherName) {
          matchedIndex = signers.findIndex(
            (s) => s.name && s.name.trim().toLowerCase() === teacherName.trim().toLowerCase() && s.status !== 'signed'
          );
        }
        // Nếu không khớp trực tiếp, lấy người đầu tiên chưa ký
        if (matchedIndex === -1) {
          matchedIndex = signers.findIndex((s) => s.status !== 'signed');
        }

        if (matchedIndex !== -1) {
          signers[matchedIndex] = {
            ...signers[matchedIndex],
            status: 'signed',
            signedAt: timeStr,
            signatureUrl: sigToUse,
            signedBy: teacherName,
          };
        }
      }

      signedCount = signers.filter((s) => s.status === 'signed').length;
      totalSigners = signers.length > 0 ? signers.length : 1;
      allSigned = signers.length > 0 ? signedCount === totalSigners : true;

      const deptLower = (signerDept || signers[matchedIndex]?.department || '').toLowerCase();
      const isKhaoThi =
        deptLower.includes('khảo thí') ||
        teacherName.toLowerCase().includes('dung') ||
        (req.typeName && req.typeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').includes('bang diem') && deptLower.includes('khảo thí'));

      const isGvcn =
        !isKhaoThi ||
        deptLower.includes('giảng viên') ||
        teacherName.toLowerCase().includes('luận') ||
        teacherName.toLowerCase().includes('hương');

      const newLogs = [
        ...(req.logs || []),
        {
          action: `${teacherName} ký duyệt đơn`,
          actor: teacherName,
          time: timeStr,
          note: `${teacherName} (${signerDept || 'Cán bộ'}) đã ký số xác nhận (${signedCount}/${totalSigners} cán bộ đã duyệt).`,
        },
      ];

      const newSignatures = [
        ...(req.signatures || []),
        {
          signerId: signerId || signers[matchedIndex]?.id,
          signerName: teacherName,
          signatureUrl: sigToUse,
          signedAt: timeStr,
          role: signers[matchedIndex]?.role || 'staff',
          department: signerDept || signers[matchedIndex]?.department || '',
        },
      ];

      return {
        ...req,
        status: allSigned ? 'teacher_approved' : 'in_progress',
        statusLabel: allSigned
          ? 'Tất cả cán bộ đã ký (Chờ Quản lý xác nhận)'
          : `Đang xử lý (${signedCount}/${totalSigners} cán bộ đã ký)`,
        distributionStatus: allSigned ? 'teacher_signed' : 'partially_signed',
        assignedSigners: signers,
        signatures: newSignatures,
        // Giữ tương thích ngược với trường teacherSignature / departmentSignature
        teacherSignature: isGvcn ? sigToUse : (req.teacherSignature || sigToUse),
        teacherApprovedAt: isGvcn ? timeStr : req.teacherApprovedAt,
        teacherApprovedBy: isGvcn ? teacherName : req.teacherApprovedBy,
        departmentSignature: isKhaoThi ? sigToUse : req.departmentSignature,
        departmentApprovedAt: isKhaoThi ? timeStr : req.departmentApprovedAt,
        departmentApprovedBy: isKhaoThi ? teacherName : req.departmentApprovedBy,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    if (allSigned) {
      addNotification({
        recipient: 'admin',
        title: 'Hồ sơ đã hoàn tất ký duyệt – Chờ xác nhận',
        body: `Tất cả cán bộ (${totalSigners}/${totalSigners}) đã ký duyệt xong đơn ${requestId} của SV ${targetReq.studentName}. Vui lòng kiểm tra và xác nhận hoàn tất.`,
        message: `Tất cả cán bộ (${totalSigners}/${totalSigners}) đã ký duyệt xong đơn ${requestId} của SV ${targetReq.studentName}. Vui lòng kiểm tra và xác nhận hoàn tất.`,
        requestId,
      });

      addNotification({
        recipient: targetReq.studentCode,
        studentCode: targetReq.studentCode,
        title: 'Tất cả cán bộ đã ký duyệt đơn',
        body: `Đơn ${requestId} của bạn đã được các Thầy/Cô và Phòng ban ký duyệt đầy đủ. Đang chờ Quản trị viên xác nhận hoàn tất.`,
        message: `Đơn ${requestId} của bạn đã được các Thầy/Cô và Phòng ban ký duyệt đầy đủ. Đang chờ Quản trị viên xác nhận hoàn tất.`,
        requestId,
      });
    } else {
      addNotification({
        recipient: 'admin',
        title: 'Hồ sơ có chữ ký mới',
        body: `${teacherName} vừa ký duyệt đơn ${requestId} của SV ${targetReq.studentName} (${signedCount}/${totalSigners} người đã ký).`,
        message: `${teacherName} vừa ký duyệt đơn ${requestId} của SV ${targetReq.studentName} (${signedCount}/${totalSigners} người đã ký).`,
        requestId,
      });

      addNotification({
        recipient: targetReq.studentCode,
        studentCode: targetReq.studentCode,
        title: 'Cập nhật tiến độ ký duyệt',
        body: `${teacherName} đã ký duyệt đơn ${requestId} của bạn (${signedCount}/${totalSigners} người đã ký).`,
        message: `${teacherName} đã ký duyệt đơn ${requestId} của bạn (${signedCount}/${totalSigners} người đã ký).`,
        requestId,
      });
    }
  }

  return updated;
}

/**
 * Quản trị viên xóa chữ ký của Giảng viên / Cán bộ để yêu cầu ký lại
 */
export function resetTeacherSignatureByAdmin(requestId, adminName = 'Quản trị viên') {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetReq = null;
  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Xóa chữ ký & Mở lại quyền ký',
          actor: adminName,
          time: timeStr,
          note: `${adminName} đã xóa chữ ký và mở lại quyền để các cán bộ ký lại.`,
        },
      ];

      const resetSigners = Array.isArray(req.assignedSigners)
        ? req.assignedSigners.map((s) => ({
            ...s,
            status: 'pending',
            signedAt: null,
            signatureUrl: null,
            signedBy: null,
          }))
        : [];

      return {
        ...req,
        status: 'in_progress',
        statusLabel: 'Đang xử lý (Chờ ký lại)',
        distributionStatus: 'assigned',
        assignedSigners: resetSigners,
        signatures: [],
        teacherSignature: '',
        teacherApprovedAt: null,
        teacherApprovedBy: null,
        departmentSignature: '',
        departmentApprovedAt: null,
        departmentApprovedBy: null,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  if (targetReq) {
    const recipients = Array.isArray(targetReq.assignedSigners) && targetReq.assignedSigners.length > 0
      ? targetReq.assignedSigners.map((s) => s.email || s.id)
      : [targetReq.assignedTo?.id || 'teacher'];

    recipients.forEach((recip) => {
      addNotification({
        recipient: recip,
        title: 'Yêu cầu ký lại đơn từ Quản trị viên',
        body: `Quản trị viên đã xóa chữ ký đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} và mở lại để bạn ký lại.`,
        message: `Quản trị viên đã xóa chữ ký đơn ${requestId} (${targetReq.typeName}) của SV ${targetReq.studentName} và mở lại để bạn ký lại.`,
        requestId,
      });
    });

    addNotification({
      recipient: targetReq.studentCode,
      studentCode: targetReq.studentCode,
      title: 'Hồ sơ đang được điều chỉnh chữ ký',
      body: `Đơn ${requestId} đang được Giảng viên cập nhật lại chữ ký theo điều phối của Quản trị viên.`,
      message: `Đơn ${requestId} đang được Giảng viên cập nhật lại chữ ký theo điều phối của Quản trị viên.`,
      requestId,
    });
  }

  return updated;
}

/**
 * Quản trị viên kiểm tra và xác nhận hoàn tất kết quả cho Sinh viên:
 * Lúc này đơn mới chính thức "completed" và gửi thông báo qua web cho sinh viên.
 */
export function finalizeAndNotifyStudentByAdmin(
  requestId,
  adminNameOrOptions = 'Quản trị viên',
  pickupInfo = '',
  adminNote = ''
) {
  const currentList = getStoredRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let targetAdminName = 'Quản trị viên';
  let targetPickup = 'Phòng 102 - Tòa nhà A (Phòng Đào tạo)';
  let targetNote = '';

  if (typeof adminNameOrOptions === 'object' && adminNameOrOptions !== null) {
    targetAdminName = adminNameOrOptions.adminName || targetAdminName;
    targetPickup = adminNameOrOptions.pickupLocation || adminNameOrOptions.pickupInfo || targetPickup;
    targetNote = adminNameOrOptions.adminNote || targetNote;
  } else if (typeof adminNameOrOptions === 'string') {
    targetAdminName = adminNameOrOptions || targetAdminName;
    if (pickupInfo) targetPickup = pickupInfo;
    if (adminNote) targetNote = adminNote;
  }

  let targetReq = null;

  const updated = currentList.map((req) => {
    if (req.id === requestId) {
      targetReq = req;
      const newLogs = [
        ...(req.logs || []),
        {
          action: 'Xác nhận hoàn tất (Quản trị viên)',
          actor: targetAdminName,
          time: timeStr,
          note: targetNote || `Đã kiểm tra chữ ký GVCN và xác nhận hoàn tất đơn cho sinh viên. Địa điểm nhận: ${targetPickup}`,
        },
      ];

      return {
        ...req,
        status: 'completed',
        statusLabel: 'Đã hoàn thành',
        distributionStatus: 'resolved',
        finalizedAt: timeStr,
        finalizedBy: targetAdminName,
        pickupLocation: targetPickup,
        adminNote: targetNote,
        logs: newLogs,
      };
    }
    return req;
  });

  saveStoredRequests(updated);

  // Gửi thông báo đến sinh viên qua web
  if (targetReq) {
    addStudentNotification({
      studentCode: targetReq.studentCode,
      title: 'Hồ sơ đã được phê duyệt hoàn tất',
      message: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản trị viên xác nhận hoàn tất. Bạn có thể đến ${targetPickup} để nhận kết quả hoặc tra cứu trực tuyến.`,
      body: `Đơn ${targetReq.id} (${targetReq.typeName}) của bạn đã được GVCN ký duyệt và Ban Quản trị viên xác nhận hoàn tất.`,
      pickupLocation: targetPickup,
      requestId: targetReq.id,
    });
  }

  return updated;
}

export const REQUEST_TYPES_STORAGE_KEY = 'vmh_request_types_store_v6';

// Danh mục loại đơn mặc định: Trống trơn để đồng bộ 100% từ bảng request_types trên Supabase
export const INITIAL_REQUEST_TYPES = [];

/**
 * Lấy danh sách các loại đơn từ localStorage
 */
export function getStoredRequestTypes() {
  try {
    const raw = localStorage.getItem(REQUEST_TYPES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUEST_TYPES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Xóa sạch toàn bộ bộ nhớ cache các loại đơn cũ trong localStorage
 */
export function clearStoredRequestTypes() {
  try {
    localStorage.removeItem(REQUEST_TYPES_STORAGE_KEY);
    localStorage.removeItem('vmh_request_types_store_v5');
    localStorage.removeItem('vmh_request_types_store_v4');
    localStorage.removeItem('vmh_request_types_store_v3');
    localStorage.removeItem('vmh_request_types_store_v2');
    localStorage.setItem(REQUEST_TYPES_STORAGE_KEY, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_request_types_updated'));
    }
  } catch (err) {
    console.warn('Lỗi khi xóa bộ nhớ loại đơn cũ:', err);
  }
}

/**
 * Lưu danh sách các loại đơn vào localStorage
 */
export function saveStoredRequestTypes(types) {
  try {
    localStorage.setItem(REQUEST_TYPES_STORAGE_KEY, JSON.stringify(types));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vmh_request_types_updated'));
    }
  } catch (err) {
    console.error('Lỗi khi lưu danh sách loại đơn vào localStorage:', err);
  }
}

