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
import { formatCccd } from '../services/cmsService';

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

  // Màn hình chi tiết khi đã chọn 1 loại đơn: Mở trực tiếp biểu mẫu số hoá cho tất cả các loại đơn
  if (selectedType) {
    return (
      <StudentConfirmationForm
        onBack={() => setSelectedType(null)}
        user={user}
        requestType={selectedType}
      />
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

