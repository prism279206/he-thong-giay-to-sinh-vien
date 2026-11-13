import { useState } from 'react';
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
} from 'lucide-react';
import StudentConfirmationForm from './StudentConfirmationForm';

// Dữ liệu mẫu các loại đơn (sau này thay bằng requestTypeService.listActive() từ Supabase)
const MOCK_REQUEST_TYPES = [
  {
    id: 'rt-confirm-student',
    code: 'XAC_NHAN_SV',
    name: 'Đơn xin cấp xác nhận học sinh - sinh viên',
    description: 'Dùng để xác nhận đang theo học tại trường (vay vốn, tạm hoãn nghĩa vụ, bổ sung hồ sơ...).',
    badge: 'Xử lý nội bộ',
    icon: FileCheck2,
  },
  {
    id: 'rt-transcript',
    code: 'CAP_BANG_DIEM',
    name: 'Đơn xin cấp bảng điểm',
    description: 'Đề nghị cấp bảng điểm học tập các kỳ hoặc bảng điểm tổng kết có xác nhận của nhà trường.',
    badge: 'Xử lý nội bộ',
    icon: GraduationCap,
  },
  {
    id: 'rt-tuition-waiver',
    code: 'MIEN_GIAM_HOC_PHI',
    name: 'Đơn xin miễn giảm học phí',
    description: 'Dành cho sinh viên thuộc diện chính sách, hộ nghèo/cận nghèo hoặc các đối tượng được hỗ trợ.',
    badge: 'Có minh chứng đính kèm',
    icon: BadgePercent,
  },
  {
    id: 'rt-recheck-exam',
    code: 'PHUC_KHAO',
    name: 'Đơn xin phúc khảo',
    description: 'Đề nghị chấm phúc khảo bài thi kết thúc học phần trong thời hạn quy định.',
    badge: 'Xử lý nội bộ',
    icon: FileSearch,
  },
  {
    id: 'rt-defer',
    code: 'BAO_LUU',
    name: 'Đơn xin bảo lưu kết quả học tập',
    description: 'Đề nghị tạm dừng học và bảo lưu kết quả học tập theo quy chế đào tạo.',
    badge: 'Cần phê duyệt',
    icon: PauseCircle,
  },
  {
    id: 'rt-bus-pass',
    code: 'VE_THANG_XE_BUYT',
    name: 'Đăng ký vé tháng xe buýt',
    description: 'Xác nhận thông tin sinh viên để đăng ký làm thẻ vé tháng xe buýt ưu tiên.',
    badge: 'Liên kết bên thứ ba',
    icon: Bus,
  },
];

/**
 * Giao diện chọn loại đơn khi người dùng nhấn "+ Tạo đơn mới".
 * Sau này sẽ nối trực tiếp với danh sách `request_types` và bộ render `form_schema`.
 */
function RequestTypePicker({ onBack, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTypes = MOCK_REQUEST_TYPES.filter(
    (item) =>
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch)
  );

  // Màn hình chi tiết khi đã chọn 1 loại đơn
  if (selectedType) {
    if (selectedType.id === 'rt-confirm-student') {
      return (
        <StudentConfirmationForm
          onBack={() => setSelectedType(null)}
          user={user}
        />
      );
    }

    const SelectedIcon = selectedType.icon;

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
              <SelectedIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#2563EB]">
                {selectedType.badge}
              </span>
              <h2 className="mt-1.5 text-lg font-bold text-slate-800 sm:text-xl">
                {selectedType.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{selectedType.description}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-400" strokeWidth={1.6} />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Khu vực biểu mẫu nhập liệu ({selectedType.code})
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Biểu mẫu chi tiết của loại đơn này sẽ được gắn vào đây (hoặc render tự động từ{' '}
              <code>form_schema</code> khi kết nối database).
            </p>
          </div>
        </div>
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
            Vui lòng chọn đúng mẫu đơn hành chính bạn muốn nộp.
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
            const Icon = type.icon;

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
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      {type.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800 uppercase group-hover:text-[#2563EB]">
                    {type.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {type.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-[#2563EB]">
                  <span>Chọn đơn này</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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

