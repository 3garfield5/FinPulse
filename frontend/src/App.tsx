import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import News from "./pages/News";
import PublicNews from "./pages/PublicNews";
import PublicNewsItem from "./pages/PublicNewsItem";
import MoexMarket from "./pages/MoexMarket";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminUsers from "./pages/AdminUsers";
import FilesPage from "./pages/Files";
import NotFound from "./pages/NotFound";

import Navbar from "./components/Navbar";
import { RequirePermission } from "./context/guards";

function Forbidden() {
  return <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">403 Forbidden</div>;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="p-6">
        <Routes>
          {/* public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/news/public" element={<PublicNews />} />
          <Route path="/news/public/:slug" element={<PublicNewsItem />} />
          <Route path="/market/moex" element={<MoexMarket />} />

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

          <Route
            path="/files"
            element={
              <RequirePermission permission="chat:use">
                <FilesPage />
              </RequirePermission>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
