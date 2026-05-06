import { Outlet } from "react-router-dom";

export function Root() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
