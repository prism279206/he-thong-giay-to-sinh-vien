import { useState } from 'react';
import LoginPage, { DEFAULT_LOGO_SRC } from './pages/LoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (currentUser) {
    // Phân quyền: Giáo viên/cán bộ xem TeacherDashboardPage, sinh viên xem StudentDashboardPage
    if (currentUser.role === 'teacher' || currentUser.role === 'staff') {
      return (
        <TeacherDashboardPage
          user={currentUser}
          logoSrc={DEFAULT_LOGO_SRC}
          onLogout={() => setCurrentUser(null)}
        />
      );
    }

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
