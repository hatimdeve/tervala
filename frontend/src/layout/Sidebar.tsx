import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function Sidebar() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const location = useLocation();

  // Ouvre le sous-menu si on est sur une route admin
  React.useEffect(() => {
    if (location.pathname.startsWith("/admin/")) {
      setIsAdminOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="sidebar">
      {/* Section Administration */}
      <div>
        <div
          className="sidebar-link"
          onClick={() => setIsAdminOpen((open) => !open)}
          style={{ cursor: "pointer", fontWeight: location.pathname.startsWith("/admin") ? "bold" : "normal" }}
        >
          <span className="icon">{/* ton icône */}</span>
          Administration
          <span style={{ marginLeft: 8 }}>{isAdminOpen ? "▼" : "▶"}</span>
        </div>
        {isAdminOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/admin/organizations"
              className={({ isActive }: { isActive: boolean }) => isActive ? "active-sub" : ""}
              style={{ marginLeft: 24, display: "block" }}
            >
              Organizations
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }: { isActive: boolean }) => isActive ? "active-sub" : ""}
              style={{ marginLeft: 24, display: "block" }}
            >
              Users
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar; 