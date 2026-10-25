import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";

// Top bar with page links, the user's name and the log out button
export default function Navbar({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    dispatch(logout());
    navigate("/login", { replace: true });
  }

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="logo">₹</div>
          <span>SpendWise</span>
        </div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/insights">Insights</NavLink>
        </div>
        <div className="user-area">
          <div className="user-chip">
            <span className="avatar">{initials}</span>
            <span className="user-text">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
