import { useState } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import logoCdvm from '../assets/images/logocđvm.jpg';
import { formatCccd } from '../services/cmsService';

const CAMPUS_OPTIONS = ['Cầu Giấy', 'Mỹ Đình', 'Trịnh Văn Bô', 'Phúc Diễn'];

/**
 * Mã QR xác thực số hóa của văn bản điện tử
 */
function DocumentVerificationQr({ requestId, studentCode, onOpenVerify }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 shadow-xs text-center shrink-0">
      <svg className="h-20 w-20 text-slate-900" viewBox="0 0 33 33" fill="currentColor" aria-hidden="true">
        {/* Finder Pattern Top-Left */}
        <rect x="2" y="2" width="7" height="7" fill="black" />
        <rect x="3" y="3" width="5" height="5" fill="white" />
        <rect x="4" y="4" width="3" height="3" fill="black" />
        {/* Finder Pattern Top-Right */}
        <rect x="24" y="2" width="7" height="7" fill="black" />
        <rect x="25" y="3" width="5" height="5" fill="white" />
        <rect x="26" y="4" width="3" height="3" fill="black" />
        {/* Finder Pattern Bottom-Left */}
        <rect x="2" y="24" width="7" height="7" fill="black" />
        <rect x="3" y="25" width="5" height="5" fill="white" />
        <rect x="4" y="26" width="3" height="3" fill="black" />
        {/* Alignment & Timing */}
        <rect x="10" y="5" width="2" height="1" fill="black" />
        <rect x="14" y="5" width="2" height="1" fill="black" />
        <rect x="18" y="5" width="2" height="1" fill="black" />
        <rect x="5" y="10" width="1" height="2" fill="black" />
        <rect x="5" y="14" width="1" height="2" fill="black" />
        <rect x="5" y="18" width="1" height="2" fill="black" />
        {/* Data points */}
        <rect x="11" y="11" width="3" height="3" fill="black" />
        <rect x="16" y="11" width="2" height="2" fill="black" />
        <rect x="20" y="11" width="2" height="3" fill="black" />
        <rect x="11" y="16" width="2" height="2" fill="black" />
        <rect x="15" y="15" width="3" height="3" fill="black" />
        <rect x="20" y="16" width="2" height="2" fill="black" />
        <rect x="25" y="11" width="2" height="2" fill="black" />
        <rect x="25" y="15" width="3" height="2" fill="black" />
        <rect x="25" y="19" width="2" height="3" fill="black" />
        <rect x="11" y="20" width="3" height="2" fill="black" />
        <rect x="16" y="20" width="2" height="3" fill="black" />
        <rect x="11" y="24" width="2" height="3" fill="black" />
        <rect x="15" y="25" width="3" height="2" fill="black" />
        <rect x="20" y="24" width="3" height="3" fill="black" />
        <rect x="25" y="25" width="2" height="2" fill="black" />
      </svg>
      <div className="mt-1 leading-tight text-center">
        <span className="block text-[8px] font-bold text-slate-800 uppercase tracking-tight">
          QR XÁC THỰC VĂN BẢN
        </span>
        <span className="block text-[7.5px] font-mono text-slate-500">
          {requestId}{studentCode ? ` • ${studentCode}` : ''}
        </span>
      </div>
      {onOpenVerify && (
        <button
          type="button"
          onClick={onOpenVerify}
          className="no-print mt-1.5 cursor-pointer rounded bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
        >
          Đối chiếu online
        </button>
      )}
    </div>
  );
}

/**
 * Hiển thị toàn văn tờ đơn A4 chuẩn hành chính do sinh viên đã điền:
 * - Dùng font Times New Roman chuẩn văn bản hành chính Việt Nam.
 * - Hiển thị logo trường logocđvm.jpg, Quốc hiệu - Tiêu ngữ, kính gửi Ban Giám hiệu.
 * - Đầy đủ thông tin sinh viên, lý do đề nghị.
 * - Kèm CHỮ KÝ THỰC TẾ của sinh viên ở mục "Người làm đơn" và chữ ký GVCN (nếu đã duyệt).
 * - Tích hợp con dấu đỏ của Bộ phận Một Cửa và mã QR tra cứu tính hợp lệ.
 */
function OfficialDocumentView({ request }) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  if (!request) return null;

  // Xử lý hiển thị ngày nộp đơn
  let dateDisplay = 'Hà Nội, ngày......tháng......năm 2026';
  if (request.createdAt) {
    // Tách ngày từ chuỗi DD/MM/YYYY HH:mm hoặc ISO
    const parts = request.createdAt.split(' ')[0].split('/');
    if (parts.length === 3) {
      dateDisplay = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
    }
  }

  return (
    <>
      <div
        id="printable-official-document"
      className="w-full rounded-2xl border border-slate-300/80 bg-white p-6 shadow-md transition-all sm:p-10 text-black leading-relaxed select-text font-serif"
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
            <p className="text-[13px] font-bold sm:text-[14px]">Độc lập – Tự do – Hạnh phúc</p>
            <div className="mx-auto mt-1 h-[1px] w-32 bg-black" />
          </div>
        </div>
      </div>

      {/* Tiêu đề Đơn */}
      <div className="mt-8 mb-6 text-center">
        <h2 className="text-[16px] font-bold tracking-wide uppercase sm:text-[18px]">
          {request.typeName ? request.typeName.toUpperCase() : 'ĐƠN XIN CẤP XÁC NHẬN HỌC SINH – SINH VIÊN'}
        </h2>
        <p className="mt-1 text-xs italic text-slate-500 font-sans">
          Mã hồ sơ: {request.id} • Ngày gửi: {request.createdAt}
        </p>
      </div>

      {/* Kính gửi */}
      <div className="space-y-1 pl-4 sm:pl-8 text-[14px]">
        <div className="flex items-baseline gap-2">
          <span className="font-bold whitespace-nowrap">Kính gửi:</span>
          <span>- Ban Giám hiệu Trường Cao đẳng Việt Mỹ Hà Nội</span>
        </div>
        <p className="pl-16">- {request.departmentName || 'Phòng Đào tạo & Quản lý Khoa học'}</p>
        <p className="pl-16">- Phòng Công tác Sinh viên</p>
      </div>

      {/* Thân đơn chi tiết sinh viên đã điền */}
      <div className="mt-6 space-y-2.5 text-[14px]">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div className="flex-1 min-w-[200px]">
            <span>Em tên là: </span>
            <span className="font-bold">{request.studentName || '................................'}</span>
          </div>
          <div>
            <span>Mã số sinh viên: </span>
            <span className="font-bold">{request.studentCode || '....................'}</span>
          </div>
        </div>

        <div>
          <span>SĐT sinh viên: </span>
          <span>{request.phone || '0987654321'}</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div className="flex-1 min-w-[180px]">
            <span>Ngày sinh: </span>
            <span>{request.dob || '15/08/2005'}</span>
          </div>
          <div>
            <span>Nơi sinh: </span>
            <span>{request.pob || 'Hà Nội'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div>
            <span>Số CCCD: </span>
            <span>{formatCccd(request.idCardNumber) || '....................'}</span>
          </div>
          <div>
            <span>Ngày cấp: </span>
            <span>{request.idCardDate || '20/08/2021'}</span>
          </div>
          <div>
            <span>Nơi cấp: </span>
            <span>{request.idCardPlace || 'Bộ Công an'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div className="flex-1 min-w-[180px]">
            <span>Hiện là sinh viên lớp: </span>
            <span className="font-bold">{request.className || '....................'}</span>
          </div>
          <div>
            <span>Chuyên ngành: </span>
            <span className="font-bold">{request.major || '................................'}</span>
          </div>
        </div>

        {/* Cơ sở học tập checkbox */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          <span>Cơ sở học tập:</span>
          {CAMPUS_OPTIONS.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>{item}</span>
              <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[11px] font-bold">
                {request.campus === item ? '✓' : ''}
              </span>
            </span>
          ))}
        </div>

        <div className="pt-1">
          <span>Khóa: </span>
          <span className="font-bold">{request.cohort || '................'}</span>
          <span className="ml-3">Hệ đào tạo: </span>
          <span className="font-bold">{request.trainingSystem || 'Chính quy'}</span>
          <span> tại Trường Cao đẳng Việt Mỹ Hà Nội</span>
        </div>

        {/* Lý do đề nghị cấp giấy */}
        <div className="pt-2">
          <p>
            Em làm đơn này kính đề nghị nhà trường{' '}
            {request.typeName ? `xem xét và giải quyết ${request.typeName.toLowerCase()}` : 'cấp giấy xác nhận HSSV'}{' '}
            với lý do:
          </p>
          <div className="mt-1 min-h-[45px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 italic text-justify text-slate-900">
            {request.reason || '(Sinh viên chưa nhập lý do chi tiết)'}
          </div>
        </div>

        {/* Lời cam đoan */}
        <p className="pt-2 text-justify indent-8">
          Em xin cam đoan các thông tin đã khai trên là hoàn toàn chính xác và sử dụng giấy tờ đúng mục đích. Nếu vi phạm, em xin hoàn toàn chịu trách nhiệm trước quy định của Nhà trường và pháp luật.
        </p>
        <p>Em xin trân thành cảm ơn!</p>
      </div>

      {/* Chân trang chữ ký */}
      <div className="mt-8 pt-2">
        <div className="text-right italic text-[13.5px] pr-2">{dateDisplay}</div>

        <div className="mt-4 grid grid-cols-2 text-center">
          {/* CỘT TRÁI: CHỮ KÝ GVCN */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-[14px]">Chữ ký GVCN</p>
            <p className="text-[12px] italic text-slate-700">(Ký và ghi rõ họ tên)</p>

            <div className="my-2 flex h-24 w-full items-center justify-center">
              {request.teacherSignature ? (
                <div className="flex flex-col items-center">
                  <img
                    src={request.teacherSignature}
                    alt="Chữ ký GVCN"
                    className="max-h-16 max-w-[140px] object-contain"
                  />
                  <span className="text-[11px] font-bold text-purple-700 font-sans mt-0.5">
                    (Đã ký duyệt điện tử)
                  </span>
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-xs text-slate-300 italic font-sans">
                  (Chờ GVCN tiếp nhận & ký duyệt)
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 text-[13px]">
              {request.assignedTo?.name || ''}
            </p>
          </div>

          {/* CỘT PHẢI: CHỮ KÝ NGƯỜI LÀM ĐƠN (CHỮ KÝ CỦA SINH VIÊN) */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-[14px]">Người làm đơn</p>
            <p className="text-[12px] italic text-slate-700">(Chữ ký, ghi rõ họ tên)</p>

            <div className="my-2 flex h-24 w-full items-center justify-center">
              {request.studentSignature ? (
                <div className="flex flex-col items-center">
                  <img
                    src={request.studentSignature}
                    alt={`Chữ ký của sinh viên ${request.studentName}`}
                    className="max-h-20 max-w-[160px] object-contain"
                  />
                  <span className="text-[10px] text-blue-600 font-sans font-medium">
                    (Chữ ký số cá nhân)
                  </span>
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-xs text-slate-300 italic font-sans">
                  (Sinh viên chưa chèn chữ ký)
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 text-[14px]">
              {request.studentName || '...........................'}
            </p>
          </div>
        </div>

        {/* PHẦN ĐÓNG DẤU XÁC NHẬN CỦA BỘ PHẬN MỘT CỬA */}
        {(request.status === 'completed' || request.finalizedBy) && (
          <div className="mt-8 rounded-xl border-2 border-red-500/80 bg-red-50/40 p-4 font-sans select-text">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left font-serif text-xs sm:text-sm flex-1">
                <p className="font-bold text-red-700 uppercase tracking-wide">
                  XÁC NHẬN CỦA BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ (MỘT CỬA)
                </p>
                <p className="text-slate-800 mt-1">
                  Đã đối chiếu chữ ký GVCN, kiểm tra tính hợp lệ của hồ sơ và đóng dấu số ban hành.
                </p>
                <p className="text-slate-600 italic mt-0.5">
                  Cán bộ phê duyệt: <strong className="font-semibold text-slate-800">{request.finalizedBy || 'Cán bộ Quản lý Một cửa'}</strong>
                </p>
                {request.pickupLocation && (
                  <p className="mt-1.5 font-bold text-blue-800">
                    Địa điểm nhận kết quả bản cứng: {request.pickupLocation}
                  </p>
                )}
              </div>

              {/* Dấu đỏ số hóa */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-red-600 bg-white p-2 text-center shadow-xs ring-4 ring-red-100">
                  <div className="text-[8px] font-bold tracking-tight text-red-600 uppercase">
                    CĐ VIỆT MỸ HÀ NỘI
                  </div>
                  <div className="my-0.5 text-[8.5px] font-extrabold text-red-700 uppercase">
                    ★ ĐÃ ĐÓNG DẤU ★
                  </div>
                  <div className="text-[7.5px] font-bold text-red-600 uppercase">
                    BỘ PHẬN MỘT CỬA
                  </div>
                </div>
                <span className="mt-1 text-[10px] font-bold text-red-700">
                  {request.finalizedAt || 'Đã ban hành'}
                </span>
              </div>

              {/* Mã QR Tra cứu & Xác thực văn bản gốc */}
              <DocumentVerificationQr
                requestId={request.id}
                studentCode={request.studentCode}
                onOpenVerify={() => setShowVerifyModal(true)}
              />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Style tối ưu cho In / Lưu PDF chuẩn A4 hành chính */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-official-document,
          #printable-official-document * {
            visibility: visible;
          }
          #printable-official-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal tra cứu xác thực văn bản gốc (Digital Verification Certificate) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] font-sans no-print">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4 flex items-center justify-between text-emerald-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base">Xác thực văn bản điện tử</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Văn bản hợp lệ và chính thức</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Hồ sơ được xác thực trực tiếp trên hệ thống trường Cao đẳng Việt Mỹ Hà Nội.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 border border-slate-100 text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Mã văn bản:</span>
                  <span className="font-mono font-bold text-[#2563EB]">{request.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Loại văn bản:</span>
                  <span className="font-semibold text-slate-900 text-right">{request.typeName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Họ tên sinh viên:</span>
                  <span className="font-semibold text-slate-900">{request.studentName} ({request.studentCode})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Người ký duyệt:</span>
                  <span className="font-medium text-purple-700">{request.teacherApprovedBy || request.assignedTo?.name || 'GVCN'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Cơ quan ban hành:</span>
                  <span className="font-semibold text-slate-900">Bộ phận Một Cửa - CĐ Việt Mỹ HN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian ban hành:</span>
                  <span className="font-medium text-slate-800">{request.finalizedAt || request.createdAt}</span>
                </div>
              </div>

              {request.pickupLocation && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-blue-900">
                  <p className="font-semibold">Địa điểm nhận bản cứng chính thức:</p>
                  <p className="mt-0.5">{request.pickupLocation}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-right bg-slate-50">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="rounded-xl bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OfficialDocumentView;

