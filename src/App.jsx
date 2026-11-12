import { useState } from 'react';
import LoginPage, { DEFAULT_LOGO_SRC } from './pages/LoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (currentUser) {
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
