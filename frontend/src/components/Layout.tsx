import React from 'react';
import { Toaster } from "@/components/ui/sonner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-xl">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">AI Search Agent</h1>
          </div>
          <nav className="flex items-center gap-4">
            {/* Optional nav items */}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
