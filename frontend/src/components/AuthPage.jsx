import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearAuthError, loginUser, registerUser } from "../store/authSlice";

// Login and Register screen (one page, switches between the two modes)
export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error: serverError } = useSelector((state) => state.auth);

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState(""); // validation message from this form
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";
  const loading = status === "loading";
  const error = formError || serverError; // show the form message or the server message

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setFormError("");
    dispatch(clearAuthError());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLogin && !form.name.trim()) return setFormError("Please enter your name.");
    if (!form.email.trim()) return setFormError("Please enter your email.");
    if (form.password.length < 6) return setFormError("Password must be at least 6 characters.");
    setFormError("");

    // Redux thunk calls the API and saves the user + JWT token in the store
    const action = isLogin ? loginUser(form) : registerUser(form);
    const result = await dispatch(action);
    if (result.meta.requestStatus === "fulfilled") navigate("/dashboard", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand">
          <div className="logo">₹</div>
          <span>SpendWise</span>
        </div>
        <div className="auth-hero-text">
          <h1>Know where your pocket money goes.</h1>
          <p>Track daily expenses, set a monthly budget and see your spending by category, all in one place.</p>
          <ul>
            <li>🎯 Monthly budget with warnings</li>
            <li>📊 Spending by category chart</li>
            <li>🔒 Your data is private to your account</li>
          </ul>
        </div>
        <span className="auth-hero-foot">Student Expense Tracker · MERN Stack</span>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <h2>{isLogin ? "Welcome back 👋" : "Create your account"}</h2>
            <p className="muted">{isLogin ? "Log in to see your expenses." : "It takes less than a minute."}</p>
          </div>

          {!isLogin && (
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" />
            </label>
          )}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
          </label>

          <label>
            Password
            <div className="password-input">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button type="button" className="link" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn primary block" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>

          <p className="auth-switch">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button type="button" className="link" onClick={switchMode}>
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>

          {isLogin && (
            <p className="demo-hint">
              Demo account: <b>demo@student.com</b> / <b>demo123</b>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
