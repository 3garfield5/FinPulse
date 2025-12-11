// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isAuthReady } = useAuth();

  // Пока не знаем, авторизован ли юзер — вообще ничего не делаем / показываем лоадер
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
