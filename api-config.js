/*
  AIMLOCK JAME API CONFIG
  ------------------------------------------------------------
  GitHub Pages chỉ chạy được frontend tĩnh, không chạy được /api.
  Vì vậy file này để trống mặc định để web không báo lỗi khi mở tại:
  https://jamelock-dev.github.io/Aimlock-Jame/

  Nếu bạn đã deploy server.js lên Railway và muốn dùng key thật,
  đổi dòng bên dưới thành domain Railway của bạn, ví dụ:
  window.AIMLOCK_API_BASE_URL = "https://ten-app-cua-ban.up.railway.app";
*/
window.AIMLOCK_API_BASE_URL = window.AIMLOCK_API_BASE_URL || localStorage.getItem("AIMLOCK_API_BASE_URL") || "";
window.AIMLOCK_APP_VERSION = window.AIMLOCK_APP_VERSION || "1";
