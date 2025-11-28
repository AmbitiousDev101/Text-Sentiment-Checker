// client/src/App.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Define Types
interface AnalysisResult {
  _id: string;
  text: string;
  sentiment: string;
  polarity: number;
}

function App() {
  // State for Auth
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // State for App Logic
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Configuration
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };
  // NOTE: When you deploy to Render, change this URL!
  const API_URL = 'http://localhost:5000/api'; 

  // Load history when token exists
  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  // --- AUTH HANDLERS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      if (!isRegistering) {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      } else {
        alert("Registered! Please login.");
        setIsRegistering(false);
        setPassword('');
      }
    } catch (err) { alert("Authentication failed. Check credentials."); }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setHistory([]);
    setResult(null);
    setUsername('');
    setPassword('');
  };

  // --- DATA HANDLERS ---
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`, authConfig);
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAnalyze = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { text: inputText }, authConfig);
      setResult(res.data);
      fetchHistory();
    } catch (err) { alert("Analysis failed"); }
    setLoading(false);
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'text-green-400';
    if (sentiment === 'Negative') return 'text-red-400';
    return 'text-gray-400';
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!token) {
    return (
      <div className="auth-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="glass-card auth-card"
        >
          <h1 className="title">🔐 Sentinel AI</h1>
          <p className="subtitle">{isRegistering ? "Create an Account" : "Login to Access"}</p>
          
          <form onSubmit={handleAuth} className="input-group">
            <input 
              className="styled-input" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
            <input 
              className="styled-input" 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button className="analyze-btn">{isRegistering ? "Sign Up" : "Login"}</button>
          </form>
          
          <p onClick={() => setIsRegistering(!isRegistering)} className="toggle-text">
            {isRegistering ? "Already have an account? Login" : "New here? Register"}
          </p>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD SCREEN ---
  return (
    <div className="app-container">
      <div className="header-row">
        <h1 className="title">🧠 Sentiment AI</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
      
      <div className="dashboard-grid">
        {/* Left Column: Input */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="glass-card"
        >
          <div className="input-group">
            <textarea 
              className="styled-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to analyze context and emotion..."
              rows={4}
            />
            <button 
              className="analyze-btn" 
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🔍 Analyze Sentiment'}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="result-box"
              >
                <div className="result-header">
                  <span>Sentiment Result:</span>
                  <span className={`sentiment-value ${getSentimentColor(result.sentiment)}`}>
                    {result.sentiment}
                  </span>
                </div>
                <div className="polarity-bar">
                  <div 
                    className="polarity-fill" 
                    style={{ 
                      width: `${(result.polarity + 1) * 50}%`, 
                      background: result.polarity > 0 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #f87171, #ef4444)' 
                    }}
                  ></div>
                </div>
                <p className="confidence">Confidence Score: <strong>{result.polarity.toFixed(4)}</strong></p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: History */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="glass-card history-card"
        >
          <h2>📜 Your History</h2>
          <div className="history-list">
            {history.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem'}}>
                No history yet. Start analyzing!
              </p>
            ) : (
              history.map((item) => (
                <motion.div 
                  key={item._id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="history-item"
                >
                  <span className={`badge ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment}
                  </span>
                  <p className="history-text">{item.text}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;