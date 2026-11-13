import { useState, useRef } from 'react';
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
} from 'lucide-react';
import logoCdvm from '../assets/images/logocđvm.jpg';

// Dữ liệu mô phỏng lấy từ API CMS của trường (lý do mặc định để trống theo yêu cầu)
const getMockCmsData = (user) => ({
  fullName: user?.fullName || 'Nguyễn Văn Tiến',
  studentCode: user?.studentCode || '24123456',
  phone: '0987654321',
  dob: '15/08/2005',
  pob: 'Hà Nội',
  idCardNumber: '001205012345',
  idCardDate: '20/08/2021',
  idCardPlace: 'Bộ Công an', // Nơi cấp mặc định là Bộ Công an theo yêu cầu
  className: 'CD-CNTT-K24A',
  major: 'Công nghệ thông tin',
  campus: 'Trịnh Văn Bô', // 'Cầu Giấy' | 'Mỹ Đình' | 'Trịnh Văn Bô' | 'Phúc Diễn'
  academicYear: 'K24 (2024 - 2027)',
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
function StudentConfirmationForm({ onBack, user }) {
  const [formData, setFormData] = useState(() => getMockCmsData(user));
  const [currentDateText] = useState(getFormattedCurrentDate);

  // Chữ ký của sinh viên trong đơn (ưu tiên lấy từ chữ ký đã lưu nếu có)
  const [studentSignature, setStudentSignature] = useState(
    () => localStorage.getItem('vmh_saved_signature') || ''
  );

  // Tab phương thức ký trong form: 'draw' (ký tay) | 'upload' (tải ảnh) | 'saved' (đã lưu)
  const [signatureMethod, setSignatureMethod] = useState(() =>
    localStorage.getItem('vmh_saved_signature') ? 'saved' : 'draw'
  );

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetToCms = () => {
    if (window.confirm('Khôi phục lại toàn bộ dữ liệu ban đầu từ hệ thống CMS?')) {
      setFormData(getMockCmsData(user));
    }
  };

  const handlePrint = () => {
    window.print();
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.studentCode.trim()) {
      alert('Vui lòng không để trống Họ tên và Mã sinh viên.');
      return;
    }
    if (!formData.reason.trim()) {
      alert('Vui lòng nhập lý do xin cấp giấy xác nhận.');
      return;
    }

    alert(
      `Đã nộp đơn xác nhận thành công!\nMã sinh viên: ${formData.studentCode}\nLý do: ${formData.reason}\n(Hồ sơ đã chuyển sang bước tiếp nhận của Bộ phận CTSV/GVCN).`
    );
    if (onBack) onBack();
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
              Đơn xin cấp xác nhận học sinh – sinh viên
            </h1>
            <p className="text-xs text-slate-500">
              Dữ liệu lấy từ CMS • Toàn bộ thông tin có thể chỉnh sửa • Bản xem trước chuẩn Times New Roman
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
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
              <span>
                Dữ liệu tự động điền từ CMS. Trường hợp có sai lệch, bạn hãy trực tiếp sửa lại từng mục bên dưới trước khi nộp.
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

                <div>
                  <label className="block text-xs font-medium text-slate-600">Ngày sinh</label>
                  <input
                    type="text"
                    value={formData.dob}
                    placeholder="DD/MM/YYYY"
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Nơi sinh (Tỉnh/TP)</label>
                  <input
                    type="text"
                    value={formData.pob}
                    onChange={(e) => handleChange('pob', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Số CCCD</label>
                  <input
                    type="text"
                    value={formData.idCardNumber}
                    onChange={(e) => handleChange('idCardNumber', e.target.value)}
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
              </div>
            </div>

            {/* Nhóm 2: Thông tin lớp & đào tạo */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                2. Thông tin học tập
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Lớp</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => handleChange('className', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Chuyên ngành</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Khóa</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleChange('academicYear', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Hệ đào tạo</label>
                  <input
                    type="text"
                    value={formData.trainingSystem}
                    onChange={(e) => handleChange('trainingSystem', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Chọn cơ sở học tập */}
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
              </div>
            </div>

            {/* Nhóm 3: Lý do xin xác nhận (mặc định để trống) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  3. Lý do đề nghị cấp giấy <span className="text-red-500">*</span>
                </h3>
                <span className="text-[11px] text-slate-400">Bắt buộc</span>
              </div>

              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="Nhập lý do cụ thể cần cấp giấy xác nhận HSSV (ví dụ: Vay vốn ngân hàng chính sách xã hội, tạm hoãn nghĩa vụ quân sự...)"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
                required
              />
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
                {localStorage.getItem('vmh_saved_signature') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMethod('saved');
                      setStudentSignature(localStorage.getItem('vmh_saved_signature') || '');
                    }}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                      signatureMethod === 'saved'
                        ? 'bg-white text-[#2563EB] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Chữ ký đã lưu</span>
                  </button>
                )}
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
                        prev ? '' : 'Đã ký số: GVCN. Nguyễn Thị Mai Anh'
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
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-[#1D4ED8] active:scale-[0.99]"
              >
                <Send className="h-4 w-4" />
                <span>Nộp đơn xác nhận HSSV</span>
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

          {/* Tờ giấy A4 mô phỏng - Toàn bộ dùng font Times New Roman */}
          <div
            id="a4-printable-document"
            className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-md transition-all sm:p-10 text-black leading-relaxed select-text"
            style={{
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              fontSize: '14px',
              minHeight: '850px',
            }}
          >
            {/* Header trên cùng */}
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

                {/* Quốc hiệu góc phải - Chuẩn Times New Roman */}
                <div className="text-center" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <p className="text-[13px] font-bold tracking-tight uppercase sm:text-[14px]">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-[13px] font-bold sm:text-[14px]">
                    Độc lập – Tự do – Hạnh phúc
                  </p>
                  <div className="mx-auto mt-1 h-[1px] w-32 bg-black" />
                </div>
              </div>
            </div>

            {/* Tiêu đề Đơn */}
            <div className="mt-8 mb-6 text-center">
              <h2 className="text-[16px] font-bold tracking-wide uppercase sm:text-[18px]">
                ĐƠN XIN CẤP XÁC NHẬN HỌC SINH – SINH VIÊN
              </h2>
            </div>

            {/* Kính gửi */}
            <div className="space-y-1 pl-4 sm:pl-8 text-[14px]">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Kính gửi:</span>
                <span>- Ban Giám hiệu Trường Cao đẳng Việt Mỹ Hà Nội</span>
              </div>
              <p className="pl-16">- Phòng đào tạo</p>
              <p className="pl-16">- Bộ phận CTSV</p>
            </div>

            {/* Thân đơn */}
            <div className="mt-6 space-y-2 text-[14px]">
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
                <div>
                  <span>Nơi sinh: </span>
                  <span>{formData.pob || '................................'}</span>
                </div>
              </div>

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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <span>Cơ sở học tập:</span>
                {CAMPUS_OPTIONS.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span>{item}</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[11px] font-bold">
                      {formData.campus === item ? '✓' : ''}
                    </span>
                  </span>
                ))}
              </div>

              <div className="pt-1">
                <span>Khóa: </span>
                <span className="font-bold">{formData.academicYear || '................'}</span>
                <span className="ml-3">Hệ đào tạo: </span>
                <span className="font-bold">{formData.trainingSystem || '................'}</span>
                <span> tại Trường Cao đẳng Việt Mỹ Hà Nội</span>
              </div>

              {/* Lý do đề nghị cấp giấy */}
              <div className="pt-2">
                <p>Em làm đơn này kính đề nghị nhà trường cấp giấy xác nhận HSSV với lý do:</p>
                {formData.reason ? (
                  <p className="mt-1 min-h-[50px] text-justify italic">
                    {formData.reason}
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="border-b border-dotted border-black/70 h-4"></div>
                    <div className="border-b border-dotted border-black/70 h-4"></div>
                    <div className="border-b border-dotted border-black/70 h-4"></div>
                    <div className="border-b border-dotted border-black/70 h-4"></div>
                  </div>
                )}
              </div>

              {/* Lời cam đoan */}
              <p className="pt-2 text-justify indent-8">
                Em xin cam đoan sử dụng giấy chứng nhận sinh viên đúng theo lý do đã trình bày trên.
                Nếu em tự ý nghỉ học hoặc vi phạm nội quy nhà trường bị buộc thôi học, giấy xác nhận này
                sẽ không có giá trị sử dụng.
              </p>
              <p>Em xin trân thành cảm ơn!</p>
            </div>

            {/* Chân trang chữ ký */}
            <div className="mt-8 pt-2">
              <div className="text-right italic text-[13.5px] pr-2">{currentDateText}</div>

              <div className="mt-4 grid grid-cols-2 text-center">
                {/* Cột chữ ký GVCN: Để trống theo yêu cầu đối với sinh viên */}
                <div className="flex flex-col items-center">
                  <p className="font-bold text-[14px]">Chữ ký GVCN</p>
                  <p className="text-[12px] italic text-slate-700">(Ký và ghi rõ họ tên)</p>

                  <div className="my-2 flex h-24 w-full items-center justify-center">
                    {teacherSignature ? (
                      <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-center text-xs font-semibold text-purple-800">
                        <span>{teacherSignature}</span>
                      </div>
                    ) : (
                      // Để trống hoàn toàn cho sinh viên như mẫu văn bản gốc
                      <div className="h-20 w-full" />
                    )}
                  </div>
                </div>

                {/* Cột chữ ký Người làm đơn */}
                <div className="flex flex-col items-center">
                  <p className="font-bold text-[14px]">Người làm đơn</p>
                  <p className="text-[12px] italic text-slate-700">(Chữ ký, ghi rõ họ tên)</p>

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

                  <p className="font-bold text-slate-900 text-[14px]">
                    {formData.fullName || '...........................'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentConfirmationForm;
