import logoCdvm from '../assets/images/logocđvm.jpg';
import { formatCccd } from '../services/cmsService';

const CAMPUS_OPTIONS = ['Cầu Giấy', 'Mỹ Đình', 'Trịnh Văn Bô', 'Phúc Diễn'];

/**
 * Hiển thị toàn văn tờ đơn A4 chuẩn hành chính do sinh viên đã điền:
 * - Dùng font Times New Roman chuẩn văn bản hành chính Việt Nam.
 * - Hiển thị logo trường logocđvm.jpg, Quốc hiệu - Tiêu ngữ, kính gửi Ban Giám hiệu.
 * - Đầy đủ thông tin sinh viên, lý do đề nghị.
 * - Kèm CHỮ KÝ THỰC TẾ của sinh viên ở mục "Người làm đơn" và chữ ký GVCN (nếu đã duyệt).
 */
function OfficialDocumentView({ request }) {
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
        fontSize: '13.5pt',
        lineHeight: 1.45,
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

          {/* Quốc hiệu góc phải - Chuẩn Times New Roman 12.5pt - 13.5pt */}
          <div className="text-center" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <p className="text-[12.5pt] font-bold tracking-tight uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-[13.5pt] font-bold">Độc lập – Tự do – Hạnh phúc</p>
            <div className="mx-auto mt-1 h-[1px] w-36 bg-black" />
          </div>
        </div>
      </div>

      {/* Tiêu đề Đơn - Chuẩn 16pt - 17pt */}
      <div className="mt-8 mb-6 text-center">
        <h2 className="text-[16pt] font-bold tracking-wide uppercase sm:text-[17pt]">
          {request.typeName ? request.typeName.toUpperCase() : 'ĐƠN XIN CẤP XÁC NHẬN HỌC SINH – SINH VIÊN'}
        </h2>
      </div>

      {/* Kính gửi - Chuẩn 13.5pt - 14pt */}
      <div className="space-y-1 pl-4 sm:pl-8 text-[13.5pt]">
        <div className="flex items-baseline gap-2">
          <span className="font-bold whitespace-nowrap">Kính gửi:</span>
          <span>- Ban Giám hiệu Trường Cao đẳng Việt Mỹ Hà Nội</span>
        </div>
        <p className="pl-16">- {request.departmentName || 'Phòng Đào tạo & Quản lý Khoa học'}</p>
        <p className="pl-16">- Phòng Công tác Sinh viên</p>
      </div>

      {/* Thân đơn chi tiết sinh viên đã điền - Chuẩn 13.5pt */}
      <div className="mt-6 space-y-2.5 text-[13.5pt]">
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
              <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[12pt] font-bold">
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

        {/* Nếu đơn có các mục câu hỏi riêng (ví dụ môn thi, ca thi) */}
        {request.customFieldsData && request.customFieldsData.length > 0 && (
          <div className="pt-2 space-y-1 text-[13.5pt]">
            {request.customFieldsData.map((f, i) => (
              <div key={f.id || i} className="flex flex-wrap items-baseline gap-x-2">
                <span>- {f.label}:</span>
                <span className="font-bold text-slate-900">
                  {f.value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Lý do đề nghị cấp giấy */}
        <div className="pt-2">
          <p>
            Em làm đơn này kính đề nghị nhà trường{' '}
            {request.typeName ? `xem xét và giải quyết ${request.typeName.toLowerCase()}` : 'cấp giấy xác nhận HSSV'}{' '}
            với lý do:
          </p>
          {request.reason ? (
            <p className="mt-1 min-h-[35px] text-justify italic indent-6 bg-transparent text-black">
              {request.reason}
            </p>
          ) : (
            <div className="min-h-[35px] bg-transparent" />
          )}
        </div>

        {/* Lời cam đoan */}
        <p className="pt-2 text-justify indent-8">
          Em xin cam đoan các thông tin đã khai trên là hoàn toàn chính xác và sử dụng giấy tờ đúng mục đích. Nếu vi phạm, em xin hoàn toàn chịu trách nhiệm trước quy định của Nhà trường và pháp luật.
        </p>
        <p>Em xin trân thành cảm ơn!</p>
      </div>

      {/* Chân trang chữ ký */}
      <div className="mt-8 pt-2">
        <div className="text-right italic text-[13.5pt] pr-2">{dateDisplay}</div>

        <div className="mt-4 grid grid-cols-2 text-center">
          {/* CỘT TRÁI: CHỮ KÝ GVCN */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-[14pt]">Chữ ký GVCN</p>
            <p className="text-[12pt] italic text-slate-700">(Ký và ghi rõ họ tên)</p>

            <div className="my-2 flex h-24 w-full items-center justify-center">
              {request.teacherSignature ? (
                <div className="flex flex-col items-center">
                  <img
                    src={request.teacherSignature}
                    alt="Chữ ký GVCN"
                    className="max-h-16 max-w-[140px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-xs text-slate-300 italic font-sans">
                  (Chờ GVCN tiếp nhận & ký duyệt)
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 text-[13.5pt]">
              {request.teacherApprovedBy || request.assignedTo?.name || ''}
            </p>
          </div>

          {/* CỘT PHẢI: CHỮ KÝ NGƯỜI LÀM ĐƠN (CHỮ KÝ CỦA SINH VIÊN) */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-[14pt]">Người làm đơn</p>
            <p className="text-[12pt] italic text-slate-700">(Chữ ký, ghi rõ họ tên)</p>

            <div className="my-2 flex h-24 w-full items-center justify-center">
              {request.studentSignature ? (
                <div className="flex flex-col items-center">
                  <img
                    src={request.studentSignature}
                    alt={`Chữ ký của sinh viên ${request.studentName}`}
                    className="max-h-20 max-w-[160px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-xs text-slate-300 italic font-sans">
                  (Sinh viên chưa chèn chữ ký)
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 text-[14pt]">
              {request.studentName || '...........................'}
            </p>
          </div>
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
          #printable-official-document,
          #printable-official-document * {
            visibility: visible !important;
          }
          #printable-official-document {
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
    </>
  );
}

export default OfficialDocumentView;

