import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import type { Role } from "../../types";
export function RoleGuard({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { access, user } = useAuthStore();
  const loc = useLocation();
  if (!access || !user)
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
