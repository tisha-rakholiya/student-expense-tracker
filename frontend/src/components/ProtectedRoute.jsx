import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";

// Guard for pages that need a login.
// Not logged in -> redirect to /login. Logged in -> show the navbar and the page.
export default function ProtectedRoute() {
  const { user, status } = useSelector((state) => state.auth);

  if (status === "checking") return <div className="splash">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar user={user} />
      <Outlet />
    </>
  );
}
