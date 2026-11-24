import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Printer,
  Send,
  RotateCcw,
  CheckCircle2,
  Eye,
  Edit3,
  Upload,
  PenTool,
  RotateCcw as ResetIcon,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import logoCdvm from '../assets/images/logocđvm.jpg';
import { submitRequest, isTranscriptType } from '../services/requestService';
import { getStudentProfile, formatCccd } from '../services/cmsService';
import { triggerPrintClean } from '../utils/printHelper';

function formatDob(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

// Dữ liệu thật lấy từ API CMS của trường (lý do mặc định để trống theo yêu cầu)
const getStudentCmsData = (user) => ({
  fullName: user?.fullName || '',
  studentCode: user?.studentCode || '',
  phone: user?.phone || '',
  dob: formatDob(user?.dob) || '',
  pob: user?.pob || 'Hà Nội',
  idCardNumber: formatCccd(user?.idCardNumber) || '',
  idCardDate: user?.idCardDate || '',
  idCardPlace: user?.idCardPlace || 'Bộ Công an',
  className: user?.className || '',
  faculty: user?.faculty || '',
  major: user?.major || '',
  campus: 'Trịnh Văn Bô', // 'Cầu Giấy' | 'Mỹ Đình' | 'Trịnh Văn Bô' | 'Phúc Diễn'
  academicYear: user?.academicYear ? `${user.academicYear} (2024 - 2027)` : 'K24 (2024 - 2027)',
  trainingSystem: 'Chính quy',
  reason: '', // Mặc định để trống theo yêu cầu, không cần gợi ý
});

const CAMPUS_OPTIONS = ['Cầu Giấy', 'Mỹ Đình', 'Trịnh Văn Bô', 'Phúc Diễn'];

function getFormattedCurrentDate() {
  const now = new Date();
  return `Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`;
}

/**
 * Xử lý tách nền ảnh chữ ký (loại bỏ màu giấy trắng/xám, xuất ra PNG trong suốt).
 */
function processSignatureImage(imgElement, threshold = 205, inkColorMode = 'blue') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const maxDimension = 900;
  let width = imgElement.naturalWidth || imgElement.width;
  let height = imgElement.naturalHeight || imgElement.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imgElement, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const softEdge = 25;
  const lowerThreshold = Math.max(0, threshold - softEdge);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    if (brightness >= threshold) {
      data[i + 3] = 0;
    } else {
      let alpha = 255;
      if (brightness > lowerThreshold) {
        alpha = Math.round(((threshold - brightness) / softEdge) * 255);
      }
      data[i + 3] = alpha;

      if (inkColorMode === 'blue') {
        data[i] = 29;
        data[i + 1] = 78;
        data[i + 2] = 216;
      } else if (inkColorMode === 'black') {
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Biểu mẫu Đơn xin cấp xác nhận học sinh - sinh viên
 * - Font chữ văn bản: Đồng bộ font Times New Roman chuẩn văn bản hành chính Việt Nam.
 * - Lý do đề nghị: Mặc định để trống hoàn toàn (hiển thị dòng kẻ chấm nếu chưa nhập).
 * - Vai trò: Cố định theo tài khoản đăng nhập (chỉ tài khoản giáo viên mới ký được GVCN).
 * - Chữ ký sinh viên: Tích hợp trực tiếp ô ký tay hoặc tải ảnh chữ ký tự động tách nền ngay trong form.
 */
function StudentConfirmationForm({ onBack, user, requestType }) {
  const isTranscript = isTranscriptType(requestType);

  // Kiểm tra danh mục các trường thông tin cá nhân CMS mà mẫu đơn này thực sự yêu cầu
  const reqCmsKeys = useMemo(() => {
    if (requestType?.cmsFields && Array.isArray(requestType.cmsFields) && requestType.cmsFields.length > 0) {
      return new Set(requestType.cmsFields.map((f) => (typeof f === 'string' ? f : f.key)));
    }
    return null; // Không giới hạn cụ thể -> hiển thị đầy đủ theo mẫu chuẩn
  }, [requestType?.cmsFields]);

  // Các cờ ẩn/hiện trường thông tin tương ứng với mẫu đơn
  const showCccdFields = !isTranscript && (!reqCmsKeys || reqCmsKeys.has('idCardNumber') || reqCmsKeys.has('idCardDate') || reqCmsKeys.has('idCardPlace'));
  const showPobField = !isTranscript && (!reqCmsKeys || reqCmsKeys.has('pob'));
  const showCampusField = !isTranscript && (!reqCmsKeys || reqCmsKeys.has('campus'));
  const showTrainingSystemField = !isTranscript && (!reqCmsKeys || reqCmsKeys.has('trainingSystem'));

  const [formData, setFormData] = useState(() => getStudentCmsData(user));
  const [currentDateText] = useState(getFormattedCurrentDate);

  // Tùy chọn riêng của Đơn xin cấp bảng điểm học tập
  const [transcriptType, setTranscriptType] = useState('full_course'); // 'full_course' | 'academic_year' | 'by_semester'
  const [transcriptYear, setTranscriptYear] = useState('2024 - 2025');
  const [transcriptFromSemester, setTranscriptFromSemester] = useState('1');
  const [transcriptFromYear, setTranscriptFromYear] = useState('2024 - 2025');
  const [transcriptToSemester, setTranscriptToSemester] = useState('2');
  const [transcriptToYear, setTranscriptToYear] = useState('2024 - 2025');

  // Modal thông báo hoàn tất nộp đơn ở giữa màn hình
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Lưu trữ giá trị cho các trường câu hỏi riêng biệt theo loại đơn (bóc tách từ file Word)
  const [customFieldValues, setCustomFieldValues] = useState(() => {
    const initial = {};
    if (requestType?.fields && Array.isArray(requestType.fields)) {
      requestType.fields.forEach((f) => {
        initial[f.id] = '';
      });
    }
    return initial;
  });

  // Đồng bộ thông tin sinh viên mới nhất từ API CMS nếu có
  useEffect(() => {
    let isMounted = true;
    if (user?.studentCode) {
      getStudentProfile(user.studentCode).then((res) => {
        if (isMounted && res?.data) {
          const cms = res.data;
          setFormData((prev) => ({
            ...prev,
            fullName: cms.hoTen || prev.fullName,
            studentCode: cms.maSinhVien || prev.studentCode,
            dob: formatDob(cms.ngaySinh) || prev.dob,
            pob: cms.noiSinh || prev.pob,
            idCardNumber: formatCccd(cms.cccd) || prev.idCardNumber,
            idCardDate: cms.ngayCapCccd || prev.idCardDate,
            className: cms.lop || prev.className,
            faculty: cms.khoa || prev.faculty,
            major: cms.nganh || prev.major,
            academicYear: cms.khoaHoc ? `${cms.khoaHoc} (2024 - 2027)` : prev.academicYear,
          }));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.studentCode]);

  // Chữ ký của sinh viên trong đơn (chỉ ký trực tiếp cho lá đơn này, không lưu vĩnh viễn vào bộ nhớ để chống lộ lọt)
  const [studentSignature, setStudentSignature] = useState('');

  // Tab phương thức ký trong form: 'draw' (ký tay trực tiếp) | 'upload' (tải ảnh chữ ký đơn này)
  const [signatureMethod, setSignatureMethod] = useState('draw');

  // Trạng thái vẽ trên canvas trong form
  const formDrawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnInForm, setHasDrawnInForm] = useState(false);
  const [drawColor, setDrawColor] = useState('#1D4ED8'); // Xanh dương
  const signatureFileInputRef = useRef(null);

  // Chế độ xem trên mobile: 'edit' (nhập form) hoặc 'preview' (xem trước A4)
  const [mobileTab, setMobileTab] = useState('edit');

  // Kiểm tra phân quyền: Chỉ tài khoản giáo viên/cán bộ mới có quyền thao tác ô GVCN
  const isTeacherOrStaff = user?.role === 'teacher' || user?.role === 'staff';
  const [teacherSignature, setTeacherSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetToCms = () => {
    if (window.confirm('Khôi phục lại toàn bộ dữ liệu ban đầu từ hệ thống CMS?')) {
      setFormData(getStudentCmsData(user));
    }
  };

  const handlePrint = () => {
    triggerPrintClean();
  };

  // Canvas vẽ tay trực tiếp trong form
  const handlePointerDown = (e) => {
    const canvas = formDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawnInForm(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = formDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = formDrawCanvasRef.current;
    if (canvas) {
      setStudentSignature(canvas.toDataURL('image/png'));
    }
  };

  const handleClearFormDrawing = () => {
    const canvas = formDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnInForm(false);
    setStudentSignature('');
  };

  // Upload ảnh chữ ký từ máy và tự động tách nền
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const transparentResult = processSignatureImage(img, 205, 'blue');
        if (transparentResult) {
          setStudentSignature(transparentResult);
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.fullName.trim() || !formData.studentCode.trim()) {
      alert('Vui lòng không để trống Họ tên và Mã sinh viên.');
      return;
    }

    // Kiểm tra các trường câu hỏi riêng theo mẫu đơn (nếu có bắt buộc)
    if (requestType?.fields && requestType.fields.length > 0) {
      for (const f of requestType.fields) {
        if (f.required && !customFieldValues[f.id]?.toString().trim()) {
          alert(`Vui lòng điền mục: "${f.label}".`);
          return;
        }
      }
    }

    // Xác định lý do: nếu form đã có trường câu hỏi riêng về lý do/nội dung thì tự động kế thừa
    const customReasonField = requestType?.fields?.find((f) =>
      /lý do|mục đích|nội dung|nguyện vọng/i.test(f.label)
    );
    const resolvedReason =
      formData.reason.trim() ||
      (customReasonField ? customFieldValues[customReasonField.id]?.trim() : '') ||
      (requestType?.fields && requestType.fields.length > 0
        ? 'Theo các nội dung kê khai chi tiết trong đơn.'
        : '');

    if (!resolvedReason && (!requestType?.fields || requestType.fields.length === 0)) {
      alert(`Vui lòng nhập lý do làm ${requestType?.name ? requestType.name.toLowerCase() : 'đơn'}.`);
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newRequestId = `#2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Gom dữ liệu các trường tùy biến kèm label để hiển thị
    const customFieldsData = (requestType?.fields || []).map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      value: customFieldValues[f.id] || '',
    }));

    const newRequestPayload = {
      id: newRequestId,
      typeId: requestType?.id || (isTranscript ? 'rt-transcript' : 'rt-confirm-student'),
      typeName: requestType?.name || (isTranscript ? 'Đơn xin cấp bảng điểm học tập' : 'Đơn xin cấp xác nhận học sinh – sinh viên'),
      typeCategory: requestType?.category || (isTranscript ? 'Học vụ & Đào tạo' : 'Xác nhận học tập'),
      departmentName: requestType?.departmentName || (isTranscript ? 'Phòng Đào tạo' : 'Phòng Đào tạo & Quản lý Khoa học'),
      formCode: isTranscript ? (requestType?.formCode || '04.26-BM/CTSV/APC.') : (requestType?.formCode || null),
      formRevision: isTranscript ? (requestType?.formRevision || 'Lần ban hành/sửa đổi: 1/0') : (requestType?.formRevision || null),
      transcriptType: isTranscript ? transcriptType : null,
      transcriptYear: isTranscript && transcriptType === 'academic_year' ? transcriptYear : null,
      transcriptFromSemester: isTranscript && transcriptType === 'by_semester' ? transcriptFromSemester : null,
      transcriptFromYear: isTranscript && transcriptType === 'by_semester' ? transcriptFromYear : null,
      transcriptToSemester: isTranscript && transcriptType === 'by_semester' ? transcriptToSemester : null,
      transcriptToYear: isTranscript && transcriptType === 'by_semester' ? transcriptToYear : null,
      transcriptOptions: isTranscript
        ? {
            type: transcriptType,
            year: transcriptYear,
            fromSemester: transcriptFromSemester,
            fromYear: transcriptFromYear,
            toSemester: transcriptToSemester,
            toYear: transcriptToYear,
          }
        : null,
      studentId: user?.id || null,
      studentName: formData.fullName.trim(),
      studentCode: formData.studentCode.trim(),
      phone: formData.phone.trim(),
      dob: formData.dob.trim(),
      pob: formData.pob.trim(),
      idCardNumber: formData.idCardNumber.trim(),
      idCardDate: formData.idCardDate.trim(),
      idCardPlace: formData.idCardPlace.trim(),
      cohort: (formData.academicYear || 'K24').split(' ')[0],
      faculty: formData.faculty || 'Công nghệ - Thiết kế',
      major: formData.major.trim(),
      className: formData.className.trim(),
      campus: formData.campus,
      trainingSystem: formData.trainingSystem.trim(),
      createdAt: timeStr,
      status: 'pending',
      statusLabel: 'Chờ tiếp nhận',
      reason: resolvedReason,
      customFields: customFieldValues,
      customFieldsData: customFieldsData,
      urgency: 'normal',
      distributionStatus: 'unassigned',
      assignedTo: null,
      studentSignature: studentSignature || '',
      teacherSignature: '',
      logs: [
        {
          action: 'Nộp đơn trực tuyến',
          actor: `${formData.fullName.trim()} (Sinh viên)`,
          time: timeStr,
          note: `Sinh viên đã hoàn tất ký điện tử và gửi đơn ${requestType?.name || 'xác nhận'} đến Quản trị viên.`,
        },
      ],
    };

    setIsSubmitting(true);
    try {
      await submitRequest(newRequestPayload);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Lỗi khi nộp đơn:', err);
      alert('Có lỗi xảy ra khi gửi đơn: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thanh công cụ đầu trang */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">
              {requestType?.name || 'Đơn xin cấp xác nhận học sinh – sinh viên'}
            </h1>
            <p className="text-xs text-slate-500">
              {requestType?.departmentName ? `Tiếp nhận: ${requestType.departmentName} • ` : ''}Dữ liệu tự động điền từ CMS • Toàn bộ thông tin có thể chỉnh sửa • Bản xem trước chuẩn Times New Roman
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            title="In hoặc lưu dạng PDF"
          >
            <Printer className="h-4 w-4" />
            <span>In / Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={handleResetToCms}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            title="Khôi phục lại dữ liệu gốc từ CMS"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Lấy lại từ CMS</span>
          </button>
        </div>
      </div>

      {/* Tab chuyển đổi trên mobile: Nhập form hoặc Xem bản in A4 */}
      <div className="flex rounded-xl bg-slate-200/70 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('edit')}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            mobileTab === 'edit' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600'
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Biểu mẫu chỉnh sửa</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            mobileTab === 'preview' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Bản xem trước A4</span>
        </button>
      </div>

      {/* Bố cục 2 cột: Cột trái nhập liệu - Cột phải Live Preview A4 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: FORM NHẬP & SỬA THÔNG TIN (5 CỘT) */}
        <div
          className={`space-y-5 lg:col-span-5 ${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
          >
            {/* Banner gợi ý */}
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Thông tin cá nhân (Họ tên, MSSV, Lớp, Ngành...) đã được tự động lấy từ API CMS trường. Bạn chỉ cần điền tiếp các ô trống nội dung ở mục 3 bên dưới.
              </span>
            </div>

            {/* Nhóm 1: Thông tin cá nhân */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                1. Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Họ và tên sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Mã sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentCode}
                    onChange={(e) => handleChange('studentCode', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className={isTranscript ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-slate-600">Ngày sinh</label>
                  <input
                    type="text"
                    value={formData.dob}
                    placeholder="DD/MM/YYYY"
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Các trường Nơi sinh & CCCD được hiển thị thông minh theo mẫu đơn */}
                {showPobField && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Nơi sinh (Tỉnh/TP)</label>
                    <input
                      type="text"
                      value={formData.pob}
                      onChange={(e) => handleChange('pob', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                )}

                {showCccdFields && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Số CCCD</label>
                      <input
                        type="text"
                        value={formData.idCardNumber}
                        placeholder="12 chữ số CCCD"
                        maxLength={12}
                        onChange={(e) => handleChange('idCardNumber', e.target.value)}
                        onBlur={() => {
                          if (formData.idCardNumber) {
                            handleChange('idCardNumber', formatCccd(formData.idCardNumber));
                          }
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600">Ngày cấp CCCD</label>
                      <input
                        type="text"
                        value={formData.idCardDate}
                        placeholder="DD/MM/YYYY"
                        onChange={(e) => handleChange('idCardDate', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600">
                        Nơi cấp CCCD (mặc định Bộ Công an)
                      </label>
                      <input
                        type="text"
                        value={formData.idCardPlace}
                        onChange={(e) => handleChange('idCardPlace', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Nhóm 2: Thông tin lớp & đào tạo */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                2. Thông tin học tập
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Hiện đang học lớp</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => handleChange('className', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Ngành / Chuyên ngành</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className={isTranscript ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-slate-600">Khóa</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleChange('academicYear', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Hệ đào tạo & Cơ sở học tập chỉ hiện khi mẫu đơn có yêu cầu */}
                {showTrainingSystemField && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Hệ đào tạo</label>
                    <input
                      type="text"
                      value={formData.trainingSystem}
                      onChange={(e) => handleChange('trainingSystem', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                )}

                {showCampusField && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Cơ sở học tập
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {CAMPUS_OPTIONS.map((item) => (
                        <label
                          key={item}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-all ${
                            formData.campus === item
                              ? 'border-[#2563EB] bg-blue-50/70 font-semibold text-[#2563EB]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="campus"
                            checked={formData.campus === item}
                            onChange={() => handleChange('campus', item)}
                            className="text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nhóm 3: Lý do & Nội dung làm đơn */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  {isTranscript
                    ? '3. Nội dung xin cấp bảng điểm & Lý do'
                    : requestType?.fields && requestType.fields.length > 0
                    ? '3. Nội dung đề nghị & Lý do làm đơn'
                    : '3. Lý do đề nghị cấp giấy'}
                  <span className="text-red-500"> *</span>
                </h3>
                <span className="text-[11px] text-slate-400">Bắt buộc</span>
              </div>

              {/* TÙY CHỌN RIÊNG DÀNH CHO ĐƠN XIN CẤP BẢNG ĐIỂM */}
              {isTranscript && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Loại bảng điểm đề nghị cấp <span className="text-red-500">*</span>:
                  </label>
                  <div className="space-y-2 text-xs">
                    {/* Option 1: Toàn khóa */}
                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                        transcriptType === 'full_course'
                          ? 'border-[#2563EB] bg-blue-50/70 font-semibold text-[#2563EB]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="transcriptType"
                        value="full_course"
                        checked={transcriptType === 'full_course'}
                        onChange={() => setTranscriptType('full_course')}
                        className="text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span>Cấp bảng điểm toàn khóa</span>
                    </label>

                    {/* Option 2: Theo năm học */}
                    <div
                      className={`rounded-xl border p-2.5 transition-all ${
                        transcriptType === 'academic_year'
                          ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
                        <input
                          type="radio"
                          name="transcriptType"
                          value="academic_year"
                          checked={transcriptType === 'academic_year'}
                          onChange={() => setTranscriptType('academic_year')}
                          className="text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <span>Theo năm học</span>
                      </label>
                      {transcriptType === 'academic_year' && (
                        <div className="mt-2.5 pl-6">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Nhập năm học cần cấp:
                          </label>
                          <input
                            type="text"
                            value={transcriptYear}
                            onChange={(e) => setTranscriptYear(e.target.value)}
                            placeholder="Ví dụ: 2024 - 2025"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Option 3: Theo từng học kỳ */}
                    <div
                      className={`rounded-xl border p-2.5 transition-all ${
                        transcriptType === 'by_semester'
                          ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
                        <input
                          type="radio"
                          name="transcriptType"
                          value="by_semester"
                          checked={transcriptType === 'by_semester'}
                          onChange={() => setTranscriptType('by_semester')}
                          className="text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <span>Theo từng học kỳ</span>
                      </label>
                      {transcriptType === 'by_semester' && (
                        <div className="mt-2.5 space-y-2 pl-6">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Từ học kỳ:
                              </label>
                              <input
                                type="text"
                                value={transcriptFromSemester}
                                onChange={(e) => setTranscriptFromSemester(e.target.value)}
                                placeholder="1"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Năm học:
                              </label>
                              <input
                                type="text"
                                value={transcriptFromYear}
                                onChange={(e) => setTranscriptFromYear(e.target.value)}
                                placeholder="2024 - 2025"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Đến học kỳ:
                              </label>
                              <input
                                type="text"
                                value={transcriptToSemester}
                                onChange={(e) => setTranscriptToSemester(e.target.value)}
                                placeholder="2"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Năm học:
                              </label>
                              <input
                                type="text"
                                value={transcriptToYear}
                                onChange={(e) => setTranscriptToYear(e.target.value)}
                                placeholder="2024 - 2025"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nếu đơn có các mục câu hỏi riêng (ví dụ môn thi, ca thi) */}
              {requestType?.fields && requestType.fields.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 mb-2">
                  {requestType.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          required={field.required}
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          required={field.required}
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          required={field.required}
                        />
                      ) : (
                        <input
                          type="text"
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Ô lý do làm đơn */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTranscript ? 'Lý do xin cấp bảng điểm:' : 'Lý do đề nghị cấp giấy:'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder={
                    isTranscript
                      ? 'Nhập lý do xin cấp bảng điểm (ví dụ: Nộp hồ sơ xin việc, học chuyển tiếp, bổ túc hồ sơ cá nhân...)'
                      : 'Nhập lý do cụ thể cần làm đơn (ví dụ: Vay vốn ngân hàng chính sách, tạm hoãn nghĩa vụ quân sự, nộp hồ sơ xin việc...)'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Nhóm 4: Ô chữ ký sinh viên (cho phép tự ký hoặc tải ảnh chữ ký lên) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  4. Chữ ký người làm đơn
                </h3>
                {studentSignature && (
                  <button
                    type="button"
                    onClick={() => setStudentSignature('')}
                    className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Gỡ chữ ký</span>
                  </button>
                )}
              </div>

              {/* Các tùy chọn ký */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSignatureMethod('draw')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    signatureMethod === 'draw'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Ký trực tiếp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMethod('upload')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    signatureMethod === 'upload'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải ảnh chữ ký</span>
                </button>
              </div>

              {/* Ô ký trực tiếp bằng tay/chuột */}
              {signatureMethod === 'draw' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Màu mực:</span>
                      <button
                        type="button"
                        onClick={() => setDrawColor('#1D4ED8')}
                        className={`h-5 w-5 cursor-pointer rounded-full bg-[#1D4ED8] transition-transform ${
                          drawColor === '#1D4ED8' ? 'ring-2 ring-offset-2 ring-[#1D4ED8]' : ''
                        }`}
                        title="Mực xanh"
                      />
                      <button
                        type="button"
                        onClick={() => setDrawColor('#0F172A')}
                        className={`h-5 w-5 cursor-pointer rounded-full bg-[#0F172A] transition-transform ${
                          drawColor === '#0F172A' ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                        }`}
                        title="Mực đen"
                      />
                    </div>
                    {hasDrawnInForm && (
                      <button
                        type="button"
                        onClick={handleClearFormDrawing}
                        className="inline-flex cursor-pointer items-center gap-1 text-slate-500 hover:text-red-600"
                      >
                        <ResetIcon className="h-3 w-3" />
                        <span>Ký lại</span>
                      </button>
                    )}
                  </div>

                  <div
                    className="relative h-36 w-full touch-none overflow-hidden rounded-xl border border-slate-200 bg-white"
                    style={{
                      backgroundImage: 'repeating-conic-gradient(#f8fafc 0% 25%, #ffffff 0% 50%)',
                      backgroundSize: '12px 12px',
                    }}
                  >
                    <canvas
                      ref={formDrawCanvasRef}
                      width={500}
                      height={180}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="h-full w-full cursor-crosshair"
                    />
                    {!hasDrawnInForm && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 select-none">
                        Dùng chuột hoặc ngón tay để ký tên vào đây...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tải ảnh chữ ký lên (tự động tách nền) */}
              {signatureMethod === 'upload' && (
                <div className="space-y-2">
                  <input
                    ref={signatureFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => signatureFileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 text-center transition-all hover:border-[#2563EB] hover:bg-blue-50/30"
                  >
                    <Upload className="h-6 w-6 text-[#2563EB]" />
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Bấm để tải ảnh chữ ký từ máy
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Tự động xóa sạch nền giấy trắng/xám thành trong suốt
                    </p>
                  </div>
                </div>
              )}

              {/* Chữ ký đã lưu trong hồ sơ */}
              {signatureMethod === 'saved' && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {studentSignature ? (
                    <img
                      src={studentSignature}
                      alt="Chữ ký đã lưu"
                      className="h-12 w-28 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Chưa có chữ ký lưu</span>
                  )}
                  <span className="text-xs text-slate-600">Đang dùng mẫu chữ ký cá nhân đã lưu trong hệ thống.</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                * Chữ ký sẽ được tự động hiển thị vào mục &ldquo;Người làm đơn&rdquo; ở bản in bên cạnh.
              </p>
            </div>

            {/* Thông tin chữ ký GVCN (để trống cho sinh viên) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Chữ ký GVCN:</span>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Mục này để trống đối với sinh viên. Chỉ tài khoản được cấp phân quyền Giáo viên mới có thể thực hiện ký duyệt đơn này.
              </p>

              {isTeacherOrStaff && (
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-[11px] text-purple-700 font-medium">Tài khoản Giáo viên:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTeacherSignature((prev) =>
                        prev ? '' : 'Đã ký số: GVCN. Đỗ Thị Hương'
                      )
                    }
                    className="cursor-pointer rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700"
                  >
                    {teacherSignature ? 'Hủy chữ ký GVCN' : 'Ký duyệt đơn'}
                  </button>
                </div>
              )}
            </div>

            {/* Nút nộp đơn */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-[#1D4ED8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Đang gửi hồ sơ...' : `Nộp ${requestType?.name || 'đơn xác nhận HSSV'}`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: BẢN LIVE PREVIEW MẪU ĐƠN A4 (7 CỘT) */}
        <div
          className={`space-y-3 lg:col-span-7 ${mobileTab === 'edit' ? 'hidden lg:block' : ''}`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-700">Bản xem trước A4 (Times New Roman):</span>
            <span>Tự động cập nhật theo nội dung bên trái</span>
          </div>

          {/* Tờ giấy A4 mô phỏng - Toàn bộ dùng font Times New Roman chuẩn 13.5pt - 14pt */}
          <div
            id="a4-printable-document"
            className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-md transition-all sm:p-10 text-black leading-relaxed select-text"
            style={{
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              fontSize: '13.5pt',
              lineHeight: 1.45,
              minHeight: '850px',
            }}
          >
            {/* ================= HEADER TRÊN CÙNG ================= */}
            {isTranscript ? (
              <div>
                {/* Dòng mã biểu mẫu chuẩn mẫu gốc Word: 04.26-BM/CTSV/APC. | Lần ban hành/sửa đổi: 1/0 */}
                <div className="flex items-center justify-between border-t border-b border-black py-0.5 text-[11pt]">
                  <span className="font-normal">{requestType?.formCode || '04.26-BM/CTSV/APC.'}</span>
                  <span className="font-normal">{requestType?.formRevision || 'Lần ban hành/sửa đổi: 1/0'}</span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-4">
                  {/* Logo trường góc trái */}
                  <div className="flex flex-col items-center">
                    <img
                      src={logoCdvm}
                      alt="Logo Trường Cao đẳng Việt Mỹ Hà Nội"
                      className="h-16 w-auto max-w-[170px] object-contain sm:h-20"
                    />
                  </div>

                  {/* Quốc hiệu góc phải - Chuẩn Times New Roman 12.5pt - 13.5pt */}
                  <div className="text-center flex-1 max-w-[360px]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    <p className="text-[12.5pt] font-bold tracking-tight uppercase">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-[13.5pt] font-bold">Độc lập – Tự do – Hạnh phúc</p>
                    <div className="mx-auto mt-1 h-[1px] w-36 bg-black" />
                  </div>

                  {/* Ô vuông nhỏ góc trên bên phải (khớp 100% mẫu Word gốc) */}
                  <div className="h-11 w-9 border border-black flex items-center justify-center text-[10pt] text-slate-300 select-none">
                    {/* Ô trống theo biểu mẫu */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t-2 border-black pt-3">
                <div className="flex items-start justify-between gap-4">
                  {/* Logo trường góc trái */}
                  <div className="flex flex-col items-center">
                    <img
                      src={logoCdvm}
                      alt="Logo Trường Cao đẳng Việt Mỹ Hà Nội"
                      className="h-16 w-auto max-w-[170px] object-contain sm:h-20"
                    />
                  </div>

                  {/* Quốc hiệu góc phải - Chuẩn Times New Roman 12.5pt - 13.5pt */}
                  <div className="text-center" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    <p className="text-[12.5pt] font-bold tracking-tight uppercase">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-[13.5pt] font-bold">
                      Độc lập – Tự do – Hạnh phúc
                    </p>
                    <div className="mx-auto mt-1 h-[1px] w-36 bg-black" />
                  </div>
                </div>
              </div>
            )}

            {/* ================= TIÊU ĐỀ ĐƠN ================= */}
            <div className="mt-7 mb-5 text-center">
              <h2 className="text-[16pt] font-bold tracking-wide uppercase sm:text-[17pt]">
                {requestType?.name ? requestType.name.toUpperCase() : 'ĐƠN XIN CẤP BẢNG ĐIỂM HỌC TẬP'}
              </h2>
            </div>

            {/* ================= KÍNH GỬI ================= */}
            {isTranscript ? (
              <div className="space-y-0.5 pl-6 sm:pl-12 text-[13.5pt]">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">Kính gửi:</span>
                  <span>Phòng Đào tạo</span>
                </div>
                <p className="pl-16">Bộ phận khảo thí</p>
              </div>
            ) : (
              <div className="space-y-1 pl-4 sm:pl-8 text-[13.5pt]">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">Kính gửi:</span>
                  <span>- Ban Giám hiệu Trường Cao đẳng Việt Mỹ Hà Nội</span>
                </div>
                <p className="pl-16">- {requestType?.departmentName || 'Phòng Đào tạo & Quản lý Khoa học'}</p>
                <p className="pl-16">- Phòng Công tác Sinh viên</p>
              </div>
            )}

            {/* ================= THÂN ĐƠN ================= */}
            {isTranscript ? (
              /* THÂN ĐƠN XIN CẤP BẢNG ĐIỂM HỌC TẬP (Khớp 100% mẫu Word gốc) */
              <div className="mt-5 space-y-2 text-[13.5pt]">
                {/* Họ và tên */}
                <div>
                  <span>Họ và tên: </span>
                  <span className="font-bold">
                    {formData.fullName || '..........................................................................................'}
                  </span>
                </div>

                {/* Ngày sinh & SĐT */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span>Ngày sinh: </span>
                    <span>{formData.dob || '......................................'}</span>
                  </div>
                  <div>
                    <span>SĐT: </span>
                    <span>{formData.phone || '...........................................'}</span>
                  </div>
                </div>

                {/* Mã sinh viên & Hiện đang học lớp */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span>Mã sinh viên: </span>
                    <span className="font-bold">{formData.studentCode || '..................................'}</span>
                  </div>
                  <div>
                    <span>Hiện đang học lớp: </span>
                    <span className="font-bold">{formData.className || '.............................'}</span>
                  </div>
                </div>

                {/* Ngành & Khóa */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span>Ngành: </span>
                    <span className="font-bold">{formData.major || '.........................................'}</span>
                  </div>
                  <div>
                    <span>Khóa: </span>
                    <span className="font-bold">{formData.academicYear || '..........................................'}</span>
                  </div>
                </div>

                {/* Tùy chọn bảng điểm */}
                <div className="pt-3 space-y-1.5">
                  <p>Nay em làm đơn này gửi đến quý Phòng Ban chức năng xin được cấp bảng điểm:</p>

                  {/* 1. Toàn khóa */}
                  <div className="flex items-center gap-2.5 pl-4">
                    <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[12pt] font-bold">
                      {transcriptType === 'full_course' ? '✓' : ''}
                    </span>
                    <span>Toàn khóa</span>
                  </div>

                  {/* 2. Năm học */}
                  <div className="flex items-center gap-2.5 pl-4">
                    <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[12pt] font-bold">
                      {transcriptType === 'academic_year' ? '✓' : ''}
                    </span>
                    <span>
                      Năm học:{' '}
                      {transcriptType === 'academic_year' && transcriptYear ? (
                        <span className="font-bold underline decoration-dotted">{transcriptYear}</span>
                      ) : (
                        '......................................'
                      )}
                    </span>
                  </div>

                  {/* 3. Từ học kỳ... đến học kỳ... */}
                  <div className="flex items-baseline gap-2.5 pl-4">
                    <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[12pt] font-bold shrink-0 self-center">
                      {transcriptType === 'by_semester' ? '✓' : ''}
                    </span>
                    <span>
                      Từ học kỳ:{' '}
                      {transcriptType === 'by_semester' && transcriptFromSemester ? (
                        <span className="font-bold underline decoration-dotted">{transcriptFromSemester}</span>
                      ) : (
                        '......'
                      )}{' '}
                      năm học:{' '}
                      {transcriptType === 'by_semester' && transcriptFromYear ? (
                        <span className="font-bold underline decoration-dotted">{transcriptFromYear}</span>
                      ) : (
                        '...........'
                      )}{' '}
                      đến học kỳ:{' '}
                      {transcriptType === 'by_semester' && transcriptToSemester ? (
                        <span className="font-bold underline decoration-dotted">{transcriptToSemester}</span>
                      ) : (
                        '......'
                      )}{' '}
                      năm học:{' '}
                      {transcriptType === 'by_semester' && transcriptToYear ? (
                        <span className="font-bold underline decoration-dotted">{transcriptToYear}</span>
                      ) : (
                        '...........'
                      )}
                    </span>
                  </div>
                </div>

                {/* Lý do xin cấp bảng điểm */}
                <div className="pt-3">
                  <p className="font-bold">Lý do xin cấp bảng điểm:</p>
                  {formData.reason ? (
                    <p className="mt-1 min-h-[35px] text-justify italic indent-6 bg-transparent text-black">
                      {formData.reason}
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                    </div>
                  )}
                </div>

                <p className="pt-1">Em xin chân thành cảm ơn!</p>
              </div>
            ) : (
              /* THÂN ĐƠN XIN CẤP XÁC NHẬN HỌC SINH - SINH VIÊN */
              <div className="mt-6 space-y-2.5 text-[13.5pt]">
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <div className="flex-1 min-w-[200px]">
                    <span>Em tên là: </span>
                    <span className="font-bold">{formData.fullName || '................................'}</span>
                  </div>
                  <div>
                    <span>Mã số sinh viên: </span>
                    <span className="font-bold">{formData.studentCode || '....................'}</span>
                  </div>
                </div>

                <div>
                  <span>SĐT sinh viên: </span>
                  <span>{formData.phone || '................................................................'}</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <div className="flex-1 min-w-[180px]">
                    <span>Ngày sinh: </span>
                    <span>{formData.dob || '....................'}</span>
                  </div>
                  {showPobField && (
                    <div>
                      <span>Nơi sinh: </span>
                      <span>{formData.pob || '................................'}</span>
                    </div>
                  )}
                </div>

                {showCccdFields && (
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <div>
                      <span>Số CCCD: </span>
                      <span>{formData.idCardNumber || '....................'}</span>
                    </div>
                    <div>
                      <span>Ngày cấp: </span>
                      <span>{formData.idCardDate || '....................'}</span>
                    </div>
                    <div>
                      <span>Nơi cấp: </span>
                      <span>{formData.idCardPlace || '....................'}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <div className="flex-1 min-w-[180px]">
                    <span>Hiện là sinh viên lớp: </span>
                    <span className="font-bold">{formData.className || '....................'}</span>
                  </div>
                  <div>
                    <span>Chuyên ngành: </span>
                    <span className="font-bold">{formData.major || '................................'}</span>
                  </div>
                </div>

                {/* Cơ sở học tập checkbox */}
                {showCampusField && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span>Cơ sở học tập:</span>
                    {CAMPUS_OPTIONS.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span>{item}</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[12pt] font-bold">
                          {formData.campus === item ? '✓' : ''}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <span>Khóa: </span>
                  <span className="font-bold">{formData.academicYear || '................'}</span>
                  {showTrainingSystemField && (
                    <>
                      <span className="ml-3">Hệ đào tạo: </span>
                      <span className="font-bold">{formData.trainingSystem || '................'}</span>
                    </>
                  )}
                  <span> tại Trường Cao đẳng Việt Mỹ Hà Nội</span>
                </div>

                {/* Nếu đơn có các mục câu hỏi riêng (ví dụ môn thi, ca thi) */}
                {requestType?.fields && requestType.fields.length > 0 && (
                  <div className="pt-2 space-y-1 text-[13.5pt]">
                    {requestType.fields.map((f) => (
                      <div key={f.id} className="flex flex-wrap items-baseline gap-x-2">
                        <span>- {f.label}:</span>
                        <span className={customFieldValues[f.id] ? 'font-bold' : 'italic text-slate-500'}>
                          {customFieldValues[f.id] || '................................................................'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lý do đề nghị cấp giấy / bổ sung */}
                <div className="pt-2">
                  <p>
                    Em làm đơn này kính đề nghị nhà trường{' '}
                    {requestType?.name ? `xem xét và giải quyết ${requestType.name.toLowerCase()}` : 'cấp giấy xác nhận HSSV'}{' '}
                    với lý do:
                  </p>
                  {formData.reason ? (
                    <p className="mt-1 min-h-[40px] text-justify italic">
                      {formData.reason}
                    </p>
                  ) : (!requestType?.fields || requestType.fields.length === 0) ? (
                    <div className="space-y-2 pt-1">
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                      <div className="border-b border-dotted border-black/70 h-4"></div>
                    </div>
                  ) : null}
                </div>

                {/* Lời cam đoan */}
                <p className="pt-2 text-justify indent-8">
                  Em xin cam đoan các thông tin đã khai trên là hoàn toàn chính xác và sử dụng giấy tờ đúng mục đích. Nếu vi phạm, em xin hoàn toàn chịu trách nhiệm trước quy định của Nhà trường và pháp luật.
                </p>
                <p>Em xin chân thành cảm ơn!</p>
              </div>
            )}

            {/* ================= CHÂN TRANG CHỮ KÝ ================= */}
            {isTranscript ? (
              /* CHỮ KÝ ĐƠN XIN CẤP BẢNG ĐIỂM (3 vị trí xác nhận) */
              <div className="mt-8 pt-2">
                <div className="text-right italic text-[13.5pt] pr-2">{currentDateText}</div>

                {/* Hàng chữ ký 1: Xác nhận của GVCN & Người làm đơn */}
                <div className="mt-4 grid grid-cols-2 text-center">
                  {/* Cột chữ ký GVCN: Để trống theo yêu cầu đối với sinh viên */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-[14pt]">Xác nhận của GVCN</p>

                    <div className="my-2 flex h-24 w-full items-center justify-center">
                      {teacherSignature ? (
                        teacherSignature.startsWith('data:image') || teacherSignature.startsWith('http') ? (
                          <img
                            src={teacherSignature}
                            alt="Chữ ký GVCN"
                            className="max-h-16 max-w-[140px] object-contain"
                          />
                        ) : (
                          <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-center text-xs font-semibold text-purple-800">
                            <span>{teacherSignature}</span>
                          </div>
                        )
                      ) : (
                        <div className="h-20 w-full" />
                      )}
                    </div>
                  </div>

                  {/* Cột chữ ký Người làm đơn */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-[14pt]">Người làm đơn</p>
                    <p className="text-[12pt] italic text-slate-700">(Ký, ghi rõ họ tên)</p>

                    <div className="my-2 flex h-24 w-full items-center justify-center">
                      {studentSignature ? (
                        <img
                          src={studentSignature}
                          alt="Chữ ký sinh viên"
                          className="max-h-20 max-w-[150px] object-contain"
                        />
                      ) : (
                        <div className="h-20 w-full" />
                      )}
                    </div>

                    <p className="font-bold text-slate-900 text-[14pt]">
                      {formData.fullName || '...........................'}
                    </p>
                  </div>
                </div>

                {/* Hàng chữ ký 2: Xác nhận Bộ phận khảo thí (bên trái) */}
                <div className="mt-8 pl-6 sm:pl-10">
                  <div className="inline-block text-center min-w-[220px]">
                    <p className="font-bold text-[14pt]">Xác nhận Bộ phận khảo thí</p>
                    <div className="my-2 h-16 w-full flex items-center justify-center text-xs text-slate-300 italic font-sans">
                      (Bộ phận khảo thí ký xác nhận)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CHỮ KÝ ĐƠN XÁC NHẬN HSSV (2 cột) */
              <div className="mt-8 pt-2">
                <div className="text-right italic text-[13.5pt] pr-2">{currentDateText}</div>

                <div className="mt-4 grid grid-cols-2 text-center">
                  {/* Cột chữ ký GVCN: Để trống theo yêu cầu đối với sinh viên */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-[14pt]">Chữ ký GVCN</p>
                    <p className="text-[12pt] italic text-slate-700">(Ký và ghi rõ họ tên)</p>

                    <div className="my-2 flex h-24 w-full items-center justify-center">
                      {teacherSignature ? (
                        teacherSignature.startsWith('data:image') || teacherSignature.startsWith('http') ? (
                          <img
                            src={teacherSignature}
                            alt="Chữ ký GVCN"
                            className="max-h-20 max-w-[150px] object-contain"
                          />
                        ) : (
                          <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-center text-xs font-semibold text-purple-800">
                            <span>{teacherSignature}</span>
                          </div>
                        )
                      ) : (
                        // Để trống hoàn toàn cho sinh viên như mẫu văn bản gốc
                        <div className="h-20 w-full" />
                      )}
                    </div>
                  </div>

                  {/* Cột chữ ký Người làm đơn */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-[14pt]">Người làm đơn</p>
                    <p className="text-[12pt] italic text-slate-700">(Chữ ký, ghi rõ họ tên)</p>

                    <div className="my-2 flex h-24 w-full items-center justify-center">
                      {studentSignature ? (
                        <img
                          src={studentSignature}
                          alt="Chữ ký sinh viên"
                          className="max-h-20 max-w-[150px] object-contain"
                        />
                      ) : (
                        // Nếu chưa ký thì để trống như trên giấy trắng
                        <div className="h-20 w-full" />
                      )}
                    </div>

                    <p className="font-bold text-slate-900 text-[14pt]">
                      {formData.fullName || '...........................'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Style tối ưu cho In / Lưu PDF chuẩn A4 hành chính: Margin 0mm triệt tiêu hoàn toàn header/footer trình duyệt (URL, localhost, ngày giờ, số trang, tiêu đề) */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #a4-printable-document,
          #a4-printable-document * {
            visibility: visible !important;
          }
          #a4-printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            font-size: 13.5pt !important;
            line-height: 1.45 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal thông báo hoàn tất nộp đơn ở giữa màn hình (Dấu tick trắng trong vòng tròn xanh lá có animation) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-slate-100 flex flex-col items-center">
            {/* Vòng tròn màu xanh lá kèm dấu tích trắng animation */}
            <div
              className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30"
              style={{
                animation: 'popScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              }}
            >
              <svg
                className="h-10 w-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: 'drawCheck 0.55s cubic-bezier(0.65, 0, 0.45, 1) forwards 0.2s',
                  }}
                />
              </svg>
            </div>

            {/* Nội dung thông báo đúng yêu cầu của người dùng */}
            <h3 className="text-xl font-bold text-slate-800 tracking-tight sm:text-2xl">
              Đã hoàn tất nộp đơn
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Hồ sơ của bạn đã được gửi thành công đến Ban Quản trị để tiếp nhận và phân phối xử lý.
            </p>

            {/* Nút xác nhận đóng và trở về */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                if (onBack) onBack();
              }}
              className="mt-6 w-full cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99]"
            >
              Xác nhận
            </button>

            {/* Keyframes animation cho vòng tròn xanh và dấu tích vẽ tay */}
            <style>{`
              @keyframes popScale {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }
                65% {
                  transform: scale(1.18);
                  opacity: 1;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              @keyframes drawCheck {
                0% {
                  stroke-dashoffset: 30;
                  opacity: 0;
                }
                40% {
                  opacity: 1;
                }
                100% {
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentConfirmationForm;
