import { useState, useEffect } from 'react';
import Login from './Login';
import ForecastingTool from './ForecastingTool';
import './App.css';

const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'admin' or 'demo'

  useEffect(() => {
    const sessionTimestamp = localStorage.getItem('aqlify-session-timestamp');
    const savedUserType = localStorage.getItem('aqlify-user-type');
    if (sessionTimestamp && savedUserType) {
      const lastLoginTime = parseInt(sessionTimestamp, 10);
      if (Date.now() - lastLoginTime < SESSION_DURATION) {
        setIsAuthenticated(true);
        setUserType(savedUserType);
      } else {
        // Session expired
        localStorage.removeItem('aqlify-session-timestamp');
        localStorage.removeItem('aqlify-user-type');
        setIsAuthenticated(false);
        setUserType(null);
      }
    }
  }, []);

  const handleLoginSuccess = (type) => {
    localStorage.setItem('aqlify-session-timestamp', Date.now().toString());
    localStorage.setItem('aqlify-user-type', type);
    setIsAuthenticated(true);
    setUserType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('aqlify-session-timestamp');
    // Optional: Clear all app-related local storage on logout
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('aqlify-')) {
        localStorage.removeItem(key);
      }
    });
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <ForecastingTool onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
