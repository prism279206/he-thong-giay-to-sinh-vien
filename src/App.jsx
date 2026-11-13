import { useState } from 'react';
import LoginPage, { DEFAULT_LOGO_SRC } from './pages/LoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (currentUser) {
    // Phân quyền điều hướng theo role của tài khoản:
    // 1. Admin / Quản trị viên tiếp nhận và phân phát đơn
    if (currentUser.role === 'admin') {
      return (
        <AdminDashboardPage
          user={currentUser}
          logoSrc={DEFAULT_LOGO_SRC}
          onLogout={() => setCurrentUser(null)}
        />
      );
    }

    // 2. Giáo viên / Cán bộ duyệt đơn
    if (currentUser.role === 'teacher' || currentUser.role === 'staff') {
      return (
        <TeacherDashboardPage
          user={currentUser}
          logoSrc={DEFAULT_LOGO_SRC}
          onLogout={() => setCurrentUser(null)}
        />
      );
    }

    // 3. Sinh viên
    return (
      <StudentDashboardPage
        user={currentUser}
        logoSrc={DEFAULT_LOGO_SRC}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  return <LoginPage logoSrc={DEFAULT_LOGO_SRC} onLoginSuccess={setCurrentUser} />;
}

export default App;
