import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import Insights from "./components/Insights";
import ProtectedRoute from "./components/ProtectedRoute";
import { fetchMe } from "./store/authSlice";

// All the pages of the Single Page Application. React Router changes the page
// without reloading the browser.
export default function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  // On page load: if a token is saved, ask the server who we are
  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

      {/* Pages that need a login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/insights" element={<Insights />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
