import campusBackdropGif from '../assets/images/campus-backdrop.gif';

/**
 * Hình nền động khuôn viên trường (GIF):
 * - Hiển thị rõ nét hoàn toàn (100% sắc nét, không áp filter mờ lên ảnh)
 * - Chỉ viền 4 cạnh hơi mờ nhẹ (inner shadow) để tạo độ sâu tự nhiên
 */
function CampusBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Ảnh GIF sắc nét, giữ nguyên màu sắc gốc rực rỡ */}
      <img
        src={campusBackdropGif}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Viền ngoài 4 cạnh hơi mờ nhẹ để tạo khung viền thanh lịch */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(15,23,42,0.25)]" />
    </div>
  );
}

export default CampusBackdrop;

