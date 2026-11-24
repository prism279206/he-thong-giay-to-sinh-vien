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
      lop: payload.className || '',
      khoa: payload.faculty || '',
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
      .select('*, request_types(ten_loai_don)')
      .order('created_at', { ascending: false });

    if (studentIdOrCode) {
      if (/^[0-9a-f-]{36}$/i.test(studentIdOrCode)) {
        query = query.or(`student_id.eq.${studentIdOrCode},ma_sinh_vien.eq.${studentIdOrCode}`);
      } else {
        query = query.eq('ma_sinh_vien', studentIdOrCode);
      }
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return { data, error: null };
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
      .select('*, request_types(ten_loai_don)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return { data, error: null };
    }
  } catch (err) {
    console.warn('Lỗi lấy hàng đợi từ Supabase:', err.message);
  }

  // Fallback: Lấy từ local store
  return { data: getStoredRequests(), error: null };
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
        current_step_id: 'c0000000-0000-0000-0000-000000000003',
      })
      .eq('id', requestId);

    await supabase.from('request_step_logs').insert([
      {
        request_id: requestId,
        hanh_dong: `Phân phát tới: ${targetInfo.name}`,
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
 * Thêm loại đơn mới lên Supabase (Admin)
 */
export async function createRequestTypeOnSupabase(typeItem) {
  try {
    const { data, error } = await supabase
      .from('request_types')
      .insert([
        {
          ten_loai_don: typeItem.name,
          danh_muc: typeItem.category,
          mo_ta: typeItem.description,
          thoi_han_ngay: typeItem.slaDays,
          dang_hoat_dong: true,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Lỗi khi thêm request_type vào Supabase:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.warn('Lỗi kết nối Supabase khi thêm loại đơn:', err.message);
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


