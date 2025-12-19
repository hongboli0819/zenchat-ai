import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-border/40 flex items-center px-6">
        <h1 className="text-lg font-bold text-primary">XLSX Data Importer</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};



