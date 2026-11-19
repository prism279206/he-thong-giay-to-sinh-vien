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
} from '../components/mockRequestsStore';

/**
 * Nộp đơn trực tuyến mới
 * @param {object} payload Thông tin lá đơn và chữ ký sinh viên
 */
export async function submitRequest(payload) {
  try {
    // 1. Thử lưu vào Supabase
    const { data, error } = await supabase
      .from('requests')
      .insert([
        {
          id: payload.id,
          student_id: payload.studentId || null,
          request_type_id: payload.typeId || 'a0000000-0000-0000-0000-000000000001',
          current_step_id: 'c0000000-0000-0000-0000-000000000001',
          trang_thai: 'pending',
          du_lieu_don: payload,
          chu_ky_sinh_vien: payload.studentSignature || '',
        },
      ])
      .select()
      .single();

    if (!error && data) {
      // Ghi log bước nộp đơn
      await supabase.from('request_step_logs').insert([
        {
          request_id: payload.id,
          hanh_dong: 'Nộp đơn trực tuyến',
          ghi_chu: 'Sinh viên đã hoàn tất ký điện tử và gửi đơn đến Ban Tiếp nhận Một cửa.',
        },
      ]);
    }
  } catch (err) {
    console.warn('Lưu Supabase chưa khả dụng, tự động lưu vào store dự phòng:', err.message);
  }

  // Đồng thời lưu vào mock store để đảm bảo hiển thị ngay trên giao diện
  addMockRequest(payload);
  return { data: payload, error: null };
}

/**
 * Lấy danh sách đơn của một sinh viên
 */
export async function listMyRequests(studentId) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, request_types(ten_loai_don)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

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
 * Lấy toàn bộ hàng đợi đơn cho Cán bộ Một cửa và Giảng viên
 */
export async function listStaffRequests() {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, request_types(ten_loai_don), profiles(ho_ten, ma_sinh_vien, lop)')
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
 * Phân phát đơn tới Giảng viên hoặc Phòng ban (Cán bộ Một cửa)
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
 * Cán bộ Quản lý Một cửa hoàn tất hồ sơ và thông báo qua web cho sinh viên
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
        hanh_dong: 'Đóng dấu & Ban hành (Một cửa)',
        ghi_chu: adminNote || `Cán bộ Một cửa (${adminName}) đã đóng dấu và hoàn tất đơn cho sinh viên.`,
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

