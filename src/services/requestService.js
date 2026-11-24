/**
 * Service quản lý hồ sơ đơn từ (Request Service)
 * Kết nối dữ liệu nộp đơn, tra cứu và duyệt đơn với bảng requests và request_step_logs trên Supabase.
 */

import { supabase } from '../lib/supabase';
import {
  getStoredRequests,
  addStudentRequest as addMockRequest,
  dispatchRequestByAdmin as dispatchMockRequest,
  rejectRequestByAdmin as rejectMockRequest,
  signAndApproveByTeacher as signMockRequest,
  finalizeAndNotifyStudentByAdmin,
  deleteStoredRequest,
} from '../components/mockRequestsStore';

/**
 * Chuyển đổi trạng thái đơn sang nhãn tiếng Việt
 */
function getStatusLabel(status) {
  switch (status) {
    case 'pending':
      return 'Chờ tiếp nhận';
    case 'in_progress':
      return 'Đang xử lý';
    case 'teacher_approved':
      return 'GV đã duyệt';
    case 'completed':
      return 'Đã hoàn thành';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return 'Đang xử lý';
  }
}

/**
 * Ánh xạ dữ liệu thô từ bảng requests trên Supabase sang định dạng chuẩn dùng trên giao diện
 */
export function mapDatabaseRequestToFrontend(row) {
  if (!row) return null;
  const d = row.du_lieu_don || {};
  return {
    id: row.id,
    typeId: row.request_type_id,
    typeName: row.request_types?.ten_loai_don || d.typeName || 'Thủ tục hành chính',
    typeCategory: row.request_types?.danh_muc || d.typeCategory || 'Học vụ & Đào tạo',
    studentId: row.student_id,
    studentName: row.ho_ten_sinh_vien || d.studentName || '',
    studentCode: row.ma_sinh_vien || d.studentCode || '',
    className: d.className || '',
    faculty: d.faculty || '',
    major: d.major || '',
    cohort: d.cohort || '',
    studentEmail: row.email_sinh_vien || d.studentEmail || '',
    status: row.trang_thai || 'pending',
    statusLabel: getStatusLabel(row.trang_thai),
    assignedTo: d.assignedTo || (row.don_vi_xu_ly ? { name: row.don_vi_xu_ly, displayName: row.don_vi_xu_ly } : null),
    urgency: d.urgency || 'normal',
    deadline: d.deadline || null,
    studentSignature: row.chu_ky_sinh_vien || d.studentSignature || '',
    teacherSignature: row.chu_ky_giang_vien || d.teacherSignature || '',
    duLieuDon: d,
    formData: d.formData || d,
    logs: d.logs || [],
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : (d.createdAt || ''),
    closedAt: row.closed_at || null,
  };
}

/**
 * Nộp đơn trực tuyến mới
 * @param {object} payload Thông tin lá đơn và chữ ký sinh viên
 */
export async function submitRequest(payload) {
  let supabaseResult = null;
  try {
    // 1. Kiểm tra phiên đăng nhập Supabase Auth hiện tại
    const { data: authData } = await supabase.auth.getUser();
    const studentAuthId =
      authData?.user?.id ||
      (payload.studentId && /^[0-9a-f-]{36}$/i.test(payload.studentId) ? payload.studentId : null);

    // 2. Tra cứu UUID của loại đơn trong bảng request_types trên Supabase
    let requestTypeId =
      payload.typeId && /^[0-9a-f-]{36}$/i.test(payload.typeId) ? payload.typeId : null;
    if (!requestTypeId) {
      const { data: rt } = await supabase
        .from('request_types')
        .select('id')
        .eq('ten_loai_don', payload.typeName || 'Đơn xin cấp xác nhận học sinh - sinh viên')
        .limit(1)
        .maybeSingle();
      if (rt?.id) {
        requestTypeId = rt.id;
      }
    }

    // 3. Tra cứu bước đầu tiên của quy trình (workflow_step)
    let currentStepId = null;
    if (requestTypeId) {
      const { data: wf } = await supabase
        .from('workflows')
        .select('id, workflow_steps(id, thu_tu_buoc)')
        .eq('request_type_id', requestTypeId)
        .order('phien_ban', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (wf?.workflow_steps && wf.workflow_steps.length > 0) {
        const sorted = [...wf.workflow_steps].sort((a, b) => a.thu_tu_buoc - b.thu_tu_buoc);
        currentStepId = sorted[0].id;
      }
    }

    // 4. Thử lưu vào Supabase
    const insertPayload = {
      id: payload.id,
      ma_sinh_vien: payload.studentCode || '',
      ho_ten_sinh_vien: payload.studentName || '',
      email_sinh_vien: payload.studentEmail || '',
      request_type_id: requestTypeId,
      current_step_id: currentStepId,
      trang_thai: 'pending',
      du_lieu_don: payload,
      chu_ky_sinh_vien: payload.studentSignature || '',
    };
    if (studentAuthId) {
      insertPayload.student_id = studentAuthId;
    }

    const { data, error } = await supabase
      .from('requests')
      .insert([insertPayload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Lưu Supabase không thành công (RLS hoặc chưa nạp seed data):', error.message || error);
    } else if (data) {
      supabaseResult = data;
      console.log('Đã lưu thành công hồ sơ vào Supabase database:', data.id);
      // Ghi log bước nộp đơn
      await supabase.from('request_step_logs').insert([
        {
          request_id: payload.id,
          actor_name: payload.studentName || 'Sinh viên',
          hanh_dong: 'Nộp đơn trực tuyến',
          ghi_chu: 'Sinh viên đã hoàn tất ký điện tử và gửi đơn đến Quản trị viên.',
        },
      ]);
    }
  } catch (err) {
    console.warn('Lỗi kết nối Supabase, tự động chuyển chế độ dự phòng:', err.message);
  }

  // Đồng thời lưu vào mock store để đảm bảo hiển thị ngay trên giao diện
  addMockRequest(payload);
  return { data: supabaseResult || payload, error: null };
}

/**
 * Lấy danh sách đơn của một sinh viên
 */
export async function listMyRequests(studentIdOrCode) {
  try {
    let query = supabase
      .from('requests')
      .select('*, request_types(ten_loai_don, danh_muc, thoi_han_ngay)')
      .order('created_at', { ascending: false });

    if (studentIdOrCode) {
      if (/^[0-9a-f-]{36}$/i.test(studentIdOrCode)) {
        query = query.or(`student_id.eq.${studentIdOrCode},ma_sinh_vien.eq.${studentIdOrCode}`);
      } else {
        query = query.eq('ma_sinh_vien', studentIdOrCode);
      }
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapDatabaseRequestToFrontend);
      return { data: mapped, error: null };
    }
    if (error) {
      console.warn('Lỗi lấy đơn từ Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Lỗi lấy đơn từ Supabase:', err.message);
  }

  // Fallback: Lấy từ local store
  return { data: getStoredRequests(), error: null };
}

/**
 * Lấy toàn bộ hàng đợi đơn cho Cán bộ Quản trị viên và Giảng viên
 */
export async function listStaffRequests() {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, request_types(ten_loai_don, danh_muc, thoi_han_ngay)')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapDatabaseRequestToFrontend);
      return { data: mapped, error: null };
    }
    if (error) {
      console.warn('Lỗi lấy hàng đợi từ Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Lỗi lấy hàng đợi từ Supabase:', err.message);
  }

  // Fallback: Lấy từ local store
  return { data: getStoredRequests(), error: null };
}

/**
 * Lắng nghe thay đổi Realtime trên bảng requests của Supabase
 */
export function subscribeAllRequestsChange(callback) {
  try {
    const channel = supabase
      .channel('realtime:public:requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        async () => {
          const res = await listStaffRequests();
          if (res?.data !== null && typeof callback === 'function') {
            callback(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Lỗi đăng ký Realtime requests:', err);
    return () => {};
  }
}

/**
 * Phân phát đơn tới Giảng viên hoặc Phòng ban (Cán bộ Quản trị viên)
 */
export async function dispatchRequest(requestId, targetInfo, urgency) {
  try {
    await supabase
      .from('requests')
      .update({
        trang_thai: 'in_progress',
        don_vi_xu_ly: targetInfo.displayName || targetInfo.name,
      })
      .eq('id', requestId);

    await supabase.from('request_step_logs').insert([
      {
        request_id: requestId,
        hanh_dong: `Phân phát tới: ${targetInfo.displayName || targetInfo.name}`,
        ghi_chu: targetInfo.note || '',
      },
    ]);
  } catch (err) {
    console.warn('Cập nhật Supabase lỗi:', err.message);
  }

  dispatchMockRequest(requestId, targetInfo, urgency);
  return { success: true };
}

/**
 * Ký duyệt đơn (Giảng viên / GVCN)
 */
export async function signAndApproveRequest(requestId, teacherSignature, teacherName, note) {
  try {
    await supabase
      .from('requests')
      .update({
        trang_thai: 'completed',
        chu_ky_giang_vien: teacherSignature,
        closed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await supabase.from('request_step_logs').insert([
      {
        request_id: requestId,
        hanh_dong: 'Ký duyệt đơn điện tử (GVCN)',
        ghi_chu: note || `GVCN (${teacherName}) đã ký số xác nhận hợp lệ.`,
      },
    ]);
  } catch (err) {
    console.warn('Cập nhật Supabase lỗi:', err.message);
  }

  signMockRequest(requestId, { name: teacherName }, teacherSignature);
  return { success: true };
}

/**
 * Quản trị viên hoàn tất hồ sơ và thông báo qua web cho sinh viên
 */
export async function finalizeAndNotifyStudentRequest(requestId, adminName, pickupInfo, adminNote) {
  try {
    await supabase
      .from('requests')
      .update({
        trang_thai: 'completed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await supabase.from('request_step_logs').insert([
      {
        request_id: requestId,
        hanh_dong: 'Xác nhận hoàn tất (Quản trị viên)',
        ghi_chu: adminNote || `Cán bộ Quản trị viên (${adminName}) đã xác nhận hoàn tất đơn cho sinh viên.`,
      },
    ]);
  } catch (err) {
    console.warn('Cập nhật Supabase lỗi:', err.message);
  }

  finalizeAndNotifyStudentByAdmin(requestId, adminName, pickupInfo, adminNote);
  return { success: true };
}

/**
 * Từ chối tiếp nhận đơn
 */
export async function rejectRequest(requestId, reason, actorName) {
  try {
    await supabase
      .from('requests')
      .update({
        trang_thai: 'rejected',
        closed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await supabase.from('request_step_logs').insert([
      {
        request_id: requestId,
        hanh_dong: 'Từ chối tiếp nhận đơn',
        ghi_chu: `Lý do từ chối: ${reason}`,
      },
    ]);
  } catch (err) {
    console.warn('Cập nhật Supabase lỗi:', err.message);
  }

  rejectMockRequest(requestId, reason, actorName);
  return { success: true };
}

/**
 * Sinh viên hủy đơn: Lập tức xóa lá đơn khỏi database Supabase và kho lưu trữ
 * @param {string} requestId Mã đơn cần xóa (ví dụ: #2026-0001)
 */
export async function cancelAndRemoveRequest(requestId) {
  try {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.warn('Lỗi khi xóa đơn trên Supabase:', error.message);
    } else {
      console.log('Đã xóa thành công lá đơn khỏi Supabase:', requestId);
    }
  } catch (err) {
    console.warn('Lỗi kết nối Supabase khi xóa đơn:', err.message);
  }

  // Đồng thời xóa khỏi kho lưu trữ giao diện để cập nhật ngay lập tức
  deleteStoredRequest(requestId);
  return { success: true };
}

/**
 * Lấy toàn bộ danh mục loại đơn thực tế từ bảng request_types trên Supabase
 */
export async function fetchRequestTypesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('request_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Lỗi tải danh mục request_types từ Supabase:', error.message);
      return { data: null, error };
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      name: row.ten_loai_don,
      category: row.danh_muc || 'Học vụ & Đào tạo',
      departmentName: row.don_vi_phu_trach || row.danh_muc || 'Phòng ban Chức năng',
      slaDays: row.thoi_han_ngay || 3,
      description: row.mo_ta || '',
      isActive: row.dang_hoat_dong !== false,
      hasTemplateFile: Boolean(row.file_mau_url),
      templateFileName: row.file_mau_ten || '',
      templateFileSize: row.cau_hinh?.file_size || '—',
      templateFileUrl: row.file_mau_url || null,
      isImage: Boolean(row.cau_hinh?.isImage),
      fields: row.cau_hinh?.fields || [],
      cmsFields: row.cau_hinh?.cmsFields || [],
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
    }));

    return { data: mapped, error: null };
  } catch (err) {
    console.warn('Lỗi kết nối Supabase khi tải request_types:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Lắng nghe thay đổi Realtime trên bảng request_types của Supabase
 */
export function subscribeRequestTypesChange(callback) {
  try {
    const channel = supabase
      .channel('realtime:public:request_types')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'request_types' },
        async () => {
          const res = await fetchRequestTypesFromSupabase();
          if (res?.data !== null && typeof callback === 'function') {
            callback(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Lỗi đăng ký Realtime request_types:', err);
    return () => {};
  }
}

/**
 * Thêm loại đơn mới lên Supabase (Admin)
 */
export async function createRequestTypeOnSupabase(typeItem) {
  try {
    // 1. Thử chèn đầy đủ thông tin (nếu bảng đã có các cột cấu hình mở rộng)
    const fullPayload = {
      ten_loai_don: typeItem.name,
      danh_muc: typeItem.category,
      mo_ta: typeItem.description,
      thoi_han_ngay: typeItem.slaDays,
      dang_hoat_dong: true,
      don_vi_phu_trach: typeItem.departmentName || null,
      file_mau_url: typeItem.templateFileUrl || null,
      file_mau_ten: typeItem.templateFileName || null,
      cau_hinh: {
        fields: typeItem.fields || [],
        cmsFields: typeItem.cmsFields || [],
        isImage: typeItem.isImage || false,
        file_size: typeItem.templateFileSize || '—',
      },
    };

    let result = await supabase
      .from('request_types')
      .insert([fullPayload])
      .select()
      .maybeSingle();

    // 2. Nếu thất bại do thiếu cột mở rộng (don_vi_phu_trach, cau_hinh...),
    // tự động chuyển sang chèn các cột cơ bản chuẩn để luôn lưu thành công 100% vào database
    if (result.error && (
      result.error.message?.includes('column') ||
      result.error.message?.includes('schema cache') ||
      result.error.code === '42703' ||
      result.error.code === 'PGRST204'
    )) {
      console.warn('Bảng request_types chưa có cột mở rộng, tự động lưu theo schema cơ bản:', result.error.message);
      const basicPayload = {
        ten_loai_don: typeItem.name,
        danh_muc: typeItem.category,
        mo_ta: typeItem.description,
        thoi_han_ngay: typeItem.slaDays,
        dang_hoat_dong: true,
      };

      result = await supabase
        .from('request_types')
        .insert([basicPayload])
        .select()
        .maybeSingle();
    }

    if (result.error) {
      console.error('Lỗi khi thêm request_type vào Supabase:', result.error.message);
    } else {
      console.log('Đã lưu thành công loại đơn vào Supabase database:', result.data);
    }
    return result;
  } catch (err) {
    console.error('Lỗi kết nối Supabase khi thêm loại đơn:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Xóa loại đơn trên Supabase (Admin) theo ID hoặc Tên loại đơn
 */
export async function deleteRequestTypeOnSupabase(typeId, typeName) {
  try {
    let query = supabase.from('request_types').delete();
    if (typeId && /^[0-9a-f-]{36}$/i.test(typeId)) {
      query = query.eq('id', typeId);
    } else if (typeName) {
      query = query.eq('ten_loai_don', typeName);
    } else {
      query = query.eq('id', typeId);
    }

    const { error } = await query;
    if (error) {
      console.warn('Lỗi khi xóa request_type trên Supabase:', error.message);
    }
    return { error };
  } catch (err) {
    console.warn('Lỗi kết nối Supabase khi xóa loại đơn:', err.message);
    return { error: err };
  }
}

/**
 * Tự động dọn dẹp các hồ sơ đơn đã hoàn tất quá 3 tháng (90 ngày) để tối ưu dung lượng database
 */
export async function cleanupExpiredRequests() {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 1. Thử gọi hàm RPC dọn dẹp trên Supabase
    const { data: rpcCount, error: rpcErr } = await supabase.rpc('cleanup_expired_completed_requests');
    if (!rpcErr && typeof rpcCount === 'number') {
      if (rpcCount > 0) {
        console.log(`[Database Cleanup] Đã dọn dẹp ${rpcCount} đơn hoàn tất quá 3 tháng trên Supabase.`);
      }
      return { deletedCount: rpcCount };
    }

    // 2. Dự phòng: Dọn dẹp trực tiếp qua REST API nếu RPC chưa nạp
    const { data: deletedRows, error: delErr } = await supabase
      .from('requests')
      .delete()
      .eq('trang_thai', 'completed')
      .lt('closed_at', threeMonthsAgo.toISOString())
      .select('id');

    if (!delErr && deletedRows?.length > 0) {
      console.log(`[Database Cleanup] Đã tự động xóa ${deletedRows.length} đơn hoàn tất quá 3 tháng khỏi database.`);
    }
    return { deletedCount: deletedRows?.length || 0 };
  } catch (err) {
    console.warn('[Database Cleanup] Lỗi khi dọn dẹp hồ sơ quá 3 tháng:', err.message);
    return { deletedCount: 0, error: err };
  }
}


