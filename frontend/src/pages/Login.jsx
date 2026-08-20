import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // student, manager, admin
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [managerId, setManagerId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.clear();
  }, []);

  // Sync mouse parallax
  useEffect(() => {
    const handleMouseMove = (event) => {
      const x = (window.innerWidth / 2 - event.clientX);
      const y = (window.innerHeight / 2 - event.clientY);
      
      document.querySelectorAll('.floating-food').forEach((food, index) => {
        const speed = (index + 1) * 0.008;
        food.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });

      const plate = document.querySelector('.plate');
      if (plate) {
        plate.style.transform = `translate(${x * -0.015}px, ${y * -0.015}px) rotate(${x * 0.01}deg)`;
      }

      const loginCard = document.querySelector('.login-card');
      if (loginCard && window.innerWidth >= 900) {
        const rect = loginCard.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rotateX = (event.clientY - centerY) / 80;
        const rotateY = (centerX - event.clientX) / 80;
        loginCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };

    const handleMouseLeave = () => {
      const loginCard = document.querySelector('.login-card');
      if (loginCard) {
        loginCard.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    const card = document.querySelector('.login-card');
    if (card) card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (card) card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { role, password };
      if (role === 'student') payload.emailOrRoll = emailOrRoll;
      else if (role === 'manager') payload.managerId = managerId;
      else if (role === 'admin') payload.email = adminEmail;

      const res = await axios.post('/api/auth/login', payload);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (role === 'student') navigate('/student/dashboard');
        else if (role === 'manager') navigate('/manager/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setRole('student');
    setEmailOrRoll('demo@foodback.com');
    setPassword('123456');
    setError('');
  };

  return (
    <div className="min-h-screen relative z-10 flex items-center justify-center font-sans overflow-hidden">
      
      {/* Floating food elements from user HTML */}
      <div className="floating-food food-1">🍛</div>
      <div className="floating-food food-2">🍕</div>
      <div className="floating-food food-3">🥗</div>
      <div className="floating-food food-4">🍜</div>
      <div className="floating-food food-5">🥘</div>
      <div className="floating-food food-6">🍔</div>
      <div className="floating-food food-7">🍰</div>
      <div className="floating-food food-8">🥤</div>

      <main className="app-container">
        
        {/* LEFT HERO */}
        <section className="hero-section">
          
          <div className="brand">
            <div className="brand-icon">
              <i className="fa-solid fa-utensils"></i>
            </div>
            <div className="brand-name">
              Food<span>back</span>
            </div>
          </div>

          <div className="hero-content">
            <div className="mini-badge">
              <span className="live-dot"></span>
              SMART MESS MANAGEMENT
            </div>
            
            <h1>
              Your mess.<br/>
              <span>Your voice.</span><br/>
              <strong>Better food.</strong>
            </h1>
            
            <p>
              One intelligent platform for meals,
              attendance, feedback, complaints and
              everything your mess needs.
            </p>
            
            <div className="features">
              <div className="feature">
                <div className="feature-icon orange"><i className="fa-solid fa-bowl-food"></i></div>
                <div><strong>Daily Menu</strong><small>Know what's cooking</small></div>
              </div>
              <div className="feature">
                <div className="feature-icon yellow"><i className="fa-solid fa-star"></i></div>
                <div><strong>Give Feedback</strong><small>Make meals better</small></div>
              </div>
              <div className="feature">
                <div className="feature-icon green"><i className="fa-solid fa-chart-simple"></i></div>
                <div><strong>Smart Analytics</strong><small>Better mess decisions</small></div>
              </div>
            </div>
          </div>

          {/* FLOATING FOOD DASHBOARD */}
          <div className="food-showcase">
            <div className="plate">
              <div className="plate-inner">
                <div className="rice"></div>
                <div className="curry"></div>
                <div className="vegetable"></div>
                <div className="salad"></div>
                <div className="roti"></div>
              </div>
            </div>
            
            <div className="menu-card card-float" style={{animationDelay: '0s'}}>
              <div className="menu-header">
                <div><span>Today's Menu</span><strong>Thursday</strong></div>
                <div className="menu-check"><i className="fa-solid fa-check"></i></div>
              </div>
              <div className="menu-items">
                <div><span>🍚</span>Rice</div>
                <div><span>🍛</span>Dal Tadka</div>
                <div><span>🥔</span>Aloo Sabji</div>
                <div><span>🥗</span>Fresh Salad</div>
              </div>
            </div>

            <div className="rating-card card-float" style={{animationDelay: '1s'}}>
              <div className="rating-star"><i className="fa-solid fa-star"></i></div>
              <div><strong>4.8</strong><span>Student rating</span></div>
            </div>

            <div className="satisfaction-card card-float" style={{animationDelay: '2s'}}>
              <div className="satisfaction-icon"><i className="fa-solid fa-face-smile"></i></div>
              <div><strong>92%</strong><span>Happy students</span></div>
            </div>
          </div>

          <div className="hero-footer">
            <span><i className="fa-solid fa-shield-halved"></i>Secure & private</span>
            <span><i className="fa-solid fa-bolt"></i>Fast & simple</span>
            <span><i className="fa-solid fa-heart"></i>Made for students</span>
          </div>
        </section>

        {/* LOGIN FORM SECTION */}
        <section className="login-section relative z-20">
          <div className="login-card">
            
            <div className="mobile-brand mb-6">
              <div className="brand-icon">
                <i className="fa-solid fa-utensils"></i>
              </div>
              <span>Food<span>back</span></span>
            </div>

            <div className="login-heading">
              <div className="welcome-pill">👋 Welcome back</div>
              <h2>Sign in to <span>Foodback</span></h2>
              <p>Manage your mess experience from one place.</p>
            </div>

            {/* Role Tabs */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl mt-6 border border-white/10">
              {['student', 'manager', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                    role === r
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-2">
              
              {role === 'student' && (
                <div className="field">
                  <label>Email or Roll Number</label>
                  <div className="input-wrapper group">
                    <div className="input-icon"><i className="fa-regular fa-user"></i></div>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 2026S001" 
                      value={emailOrRoll} 
                      onChange={e => setEmailOrRoll(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {role === 'manager' && (
                <div className="field">
                  <label>Manager ID</label>
                  <div className="input-wrapper group">
                    <div className="input-icon"><i className="fa-solid fa-key"></i></div>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. manager1" 
                      value={managerId} 
                      onChange={e => setManagerId(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {role === 'admin' && (
                <div className="field">
                  <label>Admin Email</label>
                  <div className="input-wrapper group">
                    <div className="input-icon"><i className="fa-regular fa-envelope"></i></div>
                    <input 
                      type="email" 
                      required 
                      placeholder="admin@foodback.com" 
                      value={adminEmail} 
                      onChange={e => setAdminEmail(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <div className="label-row">
                  <label>Password</label>
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
                <div className="input-wrapper group">
                  <div className="input-icon"><i className="fa-solid fa-lock"></i></div>
                  <input 
                    type="password" 
                    required 
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              <div className="remember-row">
                <label className="remember">
                  <input type="checkbox" />
                  <span className="custom-checkbox"></span>
                  <span>Remember me</span>
                </label>
              </div>

              <button type="submit" disabled={loading} className={`login-button ${loading ? 'loading opacity-70' : ''}`}>
                <span className="button-text">{loading ? 'Signing in...' : 'Sign in to Foodback'}</span>
                <span className="button-icon">
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
                </span>
              </button>
            </form>

            <div className="divider"><span>OR</span></div>

            <button type="button" onClick={handleDemo} className="demo-button">
              <div className="demo-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
              <div className="demo-text">
                <strong>Try Demo Account</strong>
                <span>Explore Foodback instantly</span>
              </div>
              <i className="fa-solid fa-chevron-right demo-arrow"></i>
            </button>

            {role === 'student' && (
              <div className="register">
                <span>New to Foodback?</span>
                <Link to="/register">Create your account <i className="fa-solid fa-arrow-up-right-from-square"></i></Link>
              </div>
            )}

            <div className="security">
              <i className="fa-solid fa-lock"></i>
              Your information is protected with secure authentication.
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
