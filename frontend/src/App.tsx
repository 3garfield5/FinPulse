import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import News from "./pages/News";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminUsers from "./pages/AdminUsers";

import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { RequirePermission, RequireRole } from "./context/guards";

function Forbidden() {
  return <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">403 Forbidden</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="p-6">
        <Routes>
          {/* public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/403" element={<Forbidden />} />

          <Route
            path="/chat"
            element={
              <RequirePermission permission="chat:use">
                <Chat />
              </RequirePermission>
            }
          />

          <Route
            path="/news"
            element={
              <RequirePermission permission="news:list">
                <News />
              </RequirePermission>
            }
          />

          <Route
            path="/profile"
            element={
              <RequirePermission permission="profile:read_own">
                <Profile />
              </RequirePermission>
            }
          />

          {/* admin */}
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/users" replace />
            } 
          />

          <Route
            path="/admin/users"
            element={
              <RequirePermission permission="admin_users:assign_role">
                <AdminUsers />
              </RequirePermission>
            }
          />
        </Routes>
      </main>
    </AuthProvider>
  );
}