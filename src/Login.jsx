import { useState } from 'react';
import axios from 'axios';
import './App.css';

const LOGIN_API_URL = 'https://aqlify-backend.onrender.com/login';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setDebug('Attempting to connect to backend...');
    setLoading(true);

    // Hardcoded credentials for direct comparison
    const expectedEmail = 'expert@aqlify.com';
    const expectedPassword = 'forecast2025';

    // Check if entered credentials match expected values
    if (email.toLowerCase() === expectedEmail && password === expectedPassword) {
      setDebug('Credentials match expected values, sending to backend...');
    } else {
      setDebug(`Email match: ${email.toLowerCase() === expectedEmail}, Password match: ${password === expectedPassword}`);
    }

    try {
      const response = await axios.post(LOGIN_API_URL, { email, password });
      setDebug('Backend response received: ' + JSON.stringify(response.data));
      onLoginSuccess(response.data.userType);
    } catch (err) {
      console.error('Login error:', err);
      setDebug(`Error: ${err.message}, Status: ${err.response?.status}, Data: ${JSON.stringify(err.response?.data)}`);
      const errorMessage = err.response?.data?.detail || 'Login failed. Please try again.';
      setError(`${errorMessage} (بيانات الدخول غير صحيحة. الرجاء التحقق من البريد الإلكتروني وكلمة المرور.)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Aqlify Admin Login</h1>
        <p>تسجيل دخول مسؤول Aqlify</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email (البريد الإلكتروني)</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password (كلمة المرور)</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {debug && <div className="debug-info">{debug}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login (دخول)'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
