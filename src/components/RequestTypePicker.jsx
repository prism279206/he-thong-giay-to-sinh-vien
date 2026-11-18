import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  FileCheck2,
  GraduationCap,
  BadgePercent,
  FileSearch,
  PauseCircle,
  Bus,
  ClipboardList,
  Building2,
  Clock,
  Download,
  Eye,
  FileText,
  X,
} from 'lucide-react';
import StudentConfirmationForm from './StudentConfirmationForm';
import OfficialDocumentView from './OfficialDocumentView';
import { getStoredRequestTypes } from './mockRequestsStore';

function renderCategoryIcon(category, code, className = 'h-5 w-5') {
  if (code === 'XAC_NHAN_SV' || category === 'Xác nhận học tập') return <FileCheck2 className={className} />;
  if (code === 'CAP_BANG_DIEM' || category === 'Học vụ & Đào tạo') return <GraduationCap className={className} />;
  if (code === 'MIEN_GIAM_HOC_PHI' || category === 'Học phí & Tài chính') return <BadgePercent className={className} />;
  if (code === 'PHUC_KHAO' || code === 'HOAN_THI' || category === 'Khảo thí & Điểm') return <FileSearch className={className} />;
  if (code === 'BAO_LUU') return <PauseCircle className={className} />;
  if (code === 'VE_THANG_XE_BUYT' || code === 'DANG_KY_KTX' || category === 'Đời sống sinh viên') return <Bus className={className} />;
  return <ClipboardList className={className} />;
}

/**
 * Giao diện chọn loại đơn khi người dùng nhấn "+ Tạo đơn mới".
 * Đồng bộ với danh mục loại đơn do Quản lý ban hành.
 */
function RequestTypePicker({ onBack, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Lấy danh mục các loại đơn từ kho lưu trữ (chỉ lấy các loại đang mở isActive !== false)
  const availableTypes = useMemo(() => {
    const list = getStoredRequestTypes();
    return list.filter((item) => item.isActive !== false);
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTypes = availableTypes.filter(
    (item) =>
      item.name.toLowerCase().includes(normalizedSearch) ||
      (item.code && item.code.toLowerCase().includes(normalizedSearch)) ||
      (item.description && item.description.toLowerCase().includes(normalizedSearch)) ||
      (item.departmentName && item.departmentName.toLowerCase().includes(normalizedSearch))
  );

  // Màn hình chi tiết khi đã chọn 1 loại đơn
  if (selectedType) {
    if (selectedType.id === 'rt-confirm-student' || selectedType.code === 'XAC_NHAN_SV') {
      return (
        <StudentConfirmationForm
          onBack={() => setSelectedType(null)}
          user={user}
        />
      );
    }

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedType(null)}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chọn loại đơn</span>
        </button>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              {renderCategoryIcon(selectedType.category, selectedType.code, 'h-6 w-6')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
                  {selectedType.category || 'Thủ tục hành chính'}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mã: {selectedType.code}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold text-slate-800 sm:text-xl">
                {selectedType.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{selectedType.description}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="h-4 w-4 text-[#2563EB]" />
              <span><strong>Đơn vị tiếp nhận:</strong> {selectedType.departmentName || 'Bộ phận Một cửa'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 text-[#2563EB]" />
              <span><strong>Thời hạn giải quyết (SLA):</strong> {selectedType.slaDays || 3} ngày làm việc</span>
            </div>
          </div>

          {/* Vùng xem trước và tải mẫu đơn */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {selectedType.templateFileUrl && (
              <a
                href={selectedType.templateFileUrl}
                download={selectedType.templateFileName || 'mau-don.pdf'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Tải mẫu đơn ({selectedType.templateFileName})</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Eye className="h-4 w-4 text-[#2563EB]" />
              <span>Xem trước mẫu văn bản</span>
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-400" strokeWidth={1.6} />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Khu vực biểu mẫu nhập liệu ({selectedType.code})
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Loại đơn này đã được Quản lý ban hành trên hệ thống. Sinh viên có thể tải mẫu đơn về điền, chụp ảnh hoặc nộp trực tiếp tại Bộ phận Một cửa.
            </p>
          </div>
        </div>

        {/* Modal xem trước mẫu đơn cho Sinh viên */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{selectedType.name}</h3>
                    <p className="text-xs text-slate-500">Mã: {selectedType.code} • Đơn vị: {selectedType.departmentName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
                {selectedType.templateFileUrl ? (
                  selectedType.isImage || selectedType.templateFileUrl.startsWith('data:image') ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-sm flex items-center justify-center">
                      <img
                        src={selectedType.templateFileUrl}
                        alt={selectedType.name}
                        className="w-auto h-auto max-h-[560px] object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                      <iframe
                        src={selectedType.templateFileUrl}
                        title={selectedType.name}
                        className="w-full h-[560px] border-0"
                      />
                    </div>
                  )
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
                    <OfficialDocumentView
                      request={{
                        id: selectedType.code,
                        typeName: selectedType.name,
                        typeCategory: selectedType.category,
                        studentName: user?.fullName || 'NGUYỄN VĂN TIẾN (MẪU)',
                        studentCode: user?.studentCode || '24123456',
                        phone: user?.phone || '0987654321',
                        dob: '15/08/2005',
                        pob: 'Hà Nội',
                        idCardNumber: '001205012345',
                        idCardDate: '20/08/2021',
                        idCardPlace: 'Bộ Công an',
                        faculty: user?.faculty || 'Khoa Công nghệ thông tin',
                        major: user?.major || 'Công nghệ thông tin',
                        trainingSystem: 'Chính quy',
                        createdAt: new Date().toLocaleDateString('vi-VN'),
                        reason: selectedType.description,
                        studentSignature: '',
                        teacherSignature: '',
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 px-6 py-3 bg-white">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại tổng quan</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Chọn loại đơn cần tạo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vui lòng chọn đúng mẫu đơn hành chính bạn muốn nộp ({availableTypes.length} loại đơn đang mở tiếp nhận).
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm loại đơn..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
          />
        </div>
      </div>

      {filteredTypes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">
            Không tìm thấy mẫu đơn phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTypes.map((type) => {
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type)}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
                      {renderCategoryIcon(type.category, type.code, 'h-5 w-5')}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      {type.category || 'Nội bộ'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800 uppercase group-hover:text-[#2563EB]">
                    {type.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {type.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-medium">SLA: {type.slaDays || 2} ngày</span>
                  <div className="flex items-center gap-1 font-semibold text-[#2563EB]">
                    <span>Chọn đơn này</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RequestTypePicker;

