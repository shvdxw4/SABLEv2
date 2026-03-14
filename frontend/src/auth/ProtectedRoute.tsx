import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireCreator?: boolean;
};

export default function ProtectedRoute({
  children,
  requireCreator = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm">Loading session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireCreator && user.role !== "creator") {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}