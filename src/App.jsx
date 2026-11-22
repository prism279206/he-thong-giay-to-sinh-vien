import { useState } from 'react';
import LoginPage, { DEFAULT_LOGO_SRC, SAVED_SESSION_KEY } from './pages/LoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CampusBackdrop from './components/CampusBackdrop';

function App() {
  // Tự động khôi phục tài khoản nếu người dùng đã tích chọn "Lưu đăng nhập trên trình duyệt này"
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedSession = localStorage.getItem(SAVED_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Không thể đọc phiên đăng nhập đã lưu:', e);
    }
    return null;
  });

  // Khi người dùng bấm Đăng xuất: Xóa phiên đã lưu và quay về trang đăng nhập
  const handleLogout = () => {
    try {
      localStorage.removeItem(SAVED_SESSION_KEY);
    } catch {}
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (currentUser) {
      // Phân quyền điều hướng theo role của tài khoản:
      // 1. Admin / Quản trị viên tiếp nhận và phân phát đơn
      if (currentUser.role === 'admin') {
        return (
          <AdminDashboardPage
            user={currentUser}
            logoSrc={DEFAULT_LOGO_SRC}
            onLogout={handleLogout}
          />
        );
      }

      // 2. Giáo viên / Cán bộ duyệt đơn
      if (currentUser.role === 'teacher' || currentUser.role === 'staff') {
        return (
          <TeacherDashboardPage
            user={currentUser}
            logoSrc={DEFAULT_LOGO_SRC}
            onLogout={handleLogout}
          />
        );
      }

      // 3. Sinh viên
      return (
        <StudentDashboardPage
          user={currentUser}
          logoSrc={DEFAULT_LOGO_SRC}
          onLogout={handleLogout}
        />
      );
    }

    return <LoginPage logoSrc={DEFAULT_LOGO_SRC} onLoginSuccess={setCurrentUser} />;
  };

  return (
    <div className="relative min-h-screen">
      <CampusBackdrop />
      {renderContent()}
    </div>
  );
}

export default App;
