import { useState, useRef } from 'react';
import {
  Upload,
  PenTool,
  RotateCcw,
  Check,
  Trash2,
  Download,
  Sliders,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'vmh_saved_signature';

/**
 * Xử lý xóa màu nền giấy trắng/xám của ảnh chữ ký và xuất ra ảnh trong suốt.
 */
function processSignatureImage(imgElement, threshold, inkColorMode) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Giới hạn kích thước tối đa để xử lý cực nhanh và vừa vặn khung chữ ký
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

  // Phạm vi làm mềm biên viền để chữ ký không bị răng cưa
  const softEdge = 25;
  const lowerThreshold = Math.max(0, threshold - softEdge);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Tính độ sáng theo chuẩn mắt nhìn (Luminance)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    if (brightness >= threshold) {
      // Nền giấy trắng/xám -> trong suốt hoàn toàn
      data[i + 3] = 0;
    } else {
      // Vùng nét mực
      let alpha = 255;
      if (brightness > lowerThreshold) {
        // Làm mờ chuyển tiếp ở mép viền nét vẽ
        alpha = Math.round(((threshold - brightness) / softEdge) * 255);
      }
      data[i + 3] = alpha;

      // Tùy chọn chuyển đổi màu mực
      if (inkColorMode === 'blue') {
        data[i] = 29; // R
        data[i + 1] = 78; // G
        data[i + 2] = 216; // B (Xanh dương chuẩn văn bản)
      } else if (inkColorMode === 'black') {
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42; // Đen đậm
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Trình quản lý chữ ký cá nhân:
 * 1. Upload ảnh chụp trên giấy + tự động xóa sạch nền (dùng Canvas không cần thư viện ngoài)
 * 2. Ký trực tiếp bằng tay/chuột trên màn hình
 * 3. Lưu trữ và xuất file PNG trong suốt
 */
function SignatureManager() {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'draw'
  const [savedSignature, setSavedSignature] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  // Trạng thái cho chế độ upload ảnh
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState('');
  const [threshold, setThreshold] = useState(205); // Ngưỡng lọc nền (0 - 255)
  const [inkColorMode, setInkColorMode] = useState('blue'); // 'original' | 'blue' | 'black'
  const fileInputRef = useRef(null);

  // Trạng thái cho chế độ vẽ trực tiếp
  const drawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawColor, setDrawColor] = useState('#1D4ED8'); // Xanh dương hoặc đen

  const applyProcessing = (img, newThreshold, newColorMode) => {
    if (!img) return;
    const result = processSignatureImage(img, newThreshold, newColorMode);
    if (result) setProcessedImage(result);
  };

  const handleThresholdChange = (val) => {
    const num = Number(val);
    setThreshold(num);
    applyProcessing(originalImage, num, inkColorMode);
  };

  const handleInkColorModeChange = (mode) => {
    setInkColorMode(mode);
    applyProcessing(originalImage, threshold, mode);
  };

  // Xử lý khi chọn file ảnh từ máy
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn định dạng file ảnh (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        applyProcessing(img, threshold, inkColorMode);
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  // Khởi tạo Canvas vẽ tay
  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Xử lý vẽ tay (Pointer events hỗ trợ cả cảm ứng điện thoại và chuột máy tính)
  const handlePointerDown = (e) => {
    const canvas = drawCanvasRef.current;
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
    setHasDrawn(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
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
    setIsDrawing(false);
  };

  // Lưu chữ ký đã hoàn thiện
  const handleSaveSignature = () => {
    let finalDataUrl = '';

    if (activeMode === 'upload') {
      if (!processedImage) {
        alert('Vui lòng tải ảnh chữ ký lên trước khi lưu.');
        return;
      }
      finalDataUrl = processedImage;
    } else {
      if (!hasDrawn || !drawCanvasRef.current) {
        alert('Vui lòng ký vào khung vẽ trước khi lưu.');
        return;
      }
      finalDataUrl = drawCanvasRef.current.toDataURL('image/png');
    }

    setSavedSignature(finalDataUrl);
    localStorage.setItem(STORAGE_KEY, finalDataUrl);
    alert('Đã lưu mẫu chữ ký cá nhân thành công!');
  };

  // Xóa chữ ký đã lưu
  const handleDeleteSavedSignature = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mẫu chữ ký hiện tại?')) {
      setSavedSignature('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giới thiệu */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Quản lý chữ ký cá nhân</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tải ảnh chữ ký đã ký trên giấy hoặc vẽ trực tiếp. Hệ thống tự động xóa sạch nền giấy
              trắng để tạo chữ ký trong suốt dùng khi nộp đơn.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
            <Sparkles className="h-3.5 w-3.5" />
            Tự động tách nền
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Bộ công cụ tạo chữ ký (8 cột) */}
        <div className="space-y-5 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            {/* Chuyển đổi tab: Upload ảnh hoặc Vẽ tay */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  activeMode === 'upload'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Tải ảnh & Xóa nền</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('draw')}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  activeMode === 'draw'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <PenTool className="h-4 w-4" />
                <span>Ký trực tiếp trên màn hình</span>
              </button>
            </div>

            {/* CHẾ ĐỘ 1: Tải ảnh & Tự động xóa nền */}
            {activeMode === 'upload' && (
              <div className="mt-6 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!originalImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition-all hover:border-[#2563EB] hover:bg-blue-50/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Bấm vào đây để tải ảnh chữ ký
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Chụp chữ ký trên giấy trắng rõ nét (PNG, JPG, JPEG)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Khung xem trước chữ ký đã xóa nền */}
                    <div>
                      <div className="flex items-center justify-between pb-2 text-xs font-medium text-slate-500">
                        <span>Kết quả chữ ký (nền caro là vùng trong suốt):</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer text-[#2563EB] hover:underline"
                        >
                          Chọn ảnh khác
                        </button>
                      </div>

                      <div
                        className="flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-4"
                        style={{
                          backgroundImage:
                            'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%)',
                          backgroundSize: '16px 16px',
                        }}
                      >
                        {processedImage && (
                          <img
                            src={processedImage}
                            alt="Chữ ký đã tách nền"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>
                    </div>

                    {/* Thanh điều khiển ngưỡng tách nền & màu mực */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="h-3.5 w-3.5 text-[#2563EB]" />
                            Độ nhạy xóa nền (Ngưỡng lọc):
                          </span>
                          <span className="text-slate-500">{threshold}</span>
                        </div>
                        <input
                          type="range"
                          min="120"
                          max="245"
                          step="1"
                          value={threshold}
                          onChange={(e) => handleThresholdChange(e.target.value)}
                          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#2563EB]"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                          <span>Giữ nhiều nét mờ hơn</span>
                          <span>Xóa sạch bóng/vết tối hơn</span>
                        </div>
                      </div>

                      {/* Chọn màu nét mực sau khi tách */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <span className="font-semibold text-slate-700">Màu nét chữ:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleInkColorModeChange('blue')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                              inkColorMode === 'blue'
                                ? 'bg-[#2563EB] text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            Mực xanh chuẩn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInkColorModeChange('black')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                              inkColorMode === 'black'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            Mực đen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInkColorModeChange('original')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                              inkColorMode === 'original'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            Giữ màu gốc
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHẾ ĐỘ 2: Vẽ trực tiếp bằng tay/chuột */}
            {activeMode === 'draw' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Màu mực:</span>
                    <button
                      type="button"
                      onClick={() => setDrawColor('#1D4ED8')}
                      className={`h-6 w-6 cursor-pointer rounded-full bg-[#1D4ED8] transition-transform ${
                        drawColor === '#1D4ED8' ? 'ring-2 ring-offset-2 ring-[#1D4ED8]' : ''
                      }`}
                      title="Mực xanh"
                    />
                    <button
                      type="button"
                      onClick={() => setDrawColor('#0F172A')}
                      className={`h-6 w-6 cursor-pointer rounded-full bg-[#0F172A] transition-transform ${
                        drawColor === '#0F172A' ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                      }`}
                      title="Mực đen"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={clearDrawCanvas}
                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-slate-500 hover:text-red-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Xóa làm lại</span>
                  </button>
                </div>

                <div
                  className="relative h-56 w-full touch-none overflow-hidden rounded-xl border border-slate-200"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%)',
                    backgroundSize: '16px 16px',
                  }}
                >
                  <canvas
                    ref={drawCanvasRef}
                    width={700}
                    height={280}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="h-full w-full cursor-crosshair"
                  />
                  {!hasDrawn && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 select-none">
                      Ký tên trực tiếp tại đây bằng chuột hoặc ngón tay...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nút Xác nhận lưu */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSignature}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
              >
                <Check className="h-4 w-4" />
                <span>Lưu chữ ký này</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Xem chữ ký đang được lưu (4 cột) */}
        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase">Chữ ký hiện tại của bạn</h2>
            <p className="mt-1 text-xs text-slate-500">
              Chữ ký này sẽ được sử dụng để tự động chèn vào các biểu mẫu thủ tục.
            </p>

            <div
              className="mt-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-4"
              style={{
                backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%)',
                backgroundSize: '16px 16px',
              }}
            >
              {savedSignature ? (
                <img
                  src={savedSignature}
                  alt="Chữ ký đã lưu"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <PenTool className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  <span>Chưa có chữ ký nào được lưu</span>
                </div>
              )}
            </div>

            {savedSignature && (
              <div className="mt-4 flex gap-2">
                <a
                  href={savedSignature}
                  download="chu-ky-ca-nhan.png"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải ảnh PNG</span>
                </a>
                <button
                  type="button"
                  onClick={handleDeleteSavedSignature}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                  title="Xóa chữ ký"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-xs text-slate-600">
            <h3 className="font-semibold text-blue-900">Mẹo để ảnh tách nền đẹp nhất:</h3>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600">
              <li>Dùng bút mực xanh hoặc đen đậm nét trên giấy trắng tinh.</li>
              <li>Khi chụp, tránh để bóng bàn tay hoặc điện thoại đè lên chữ ký.</li>
              <li>Điều chỉnh thanh trượt độ nhạy nếu chữ ký bị đứt nét hoặc dính vết ố.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignatureManager;
