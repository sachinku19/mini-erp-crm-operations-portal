import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "../components/common/CommandPalette";

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="app-layout">
      {/* Global Command Center (Ctrl+K) */}
      <CommandPalette />
      {/* Navigation sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main body wrapper */}
      <div className={`main-wrapper ${isCollapsed ? "collapsed" : ""}`}>
        <Topbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Dynamic page viewport */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
