/**
 * Tiện ích hỗ trợ in văn bản A4 sạch:
 * - Tạm thời đặt document.title rỗng hoặc dấu cách để trình duyệt không in chữ tiêu đề/đăng nhập hệ thống trên đầu trang.
 * - Tự động phục hồi lại document.title ban đầu ngay sau khi người dùng in hoặc đóng hộp thoại in.
 */
export function triggerPrintClean(customTitle = ' ') {
  const originalTitle = document.title;
  document.title = customTitle;

  const restoreTitle = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };

  window.addEventListener('afterprint', restoreTitle);
  window.print();

  // Dự phòng trường hợp trình duyệt không phát sự kiện afterprint
  setTimeout(restoreTitle, 1500);
}

