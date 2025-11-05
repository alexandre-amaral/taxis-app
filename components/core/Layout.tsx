
import React, { useState } from 'react';
import { HomeIcon, HistoryIcon, SettingsIcon, Logo } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  signOut: () => void;
  onEnableMfa: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, signOut, onEnableMfa }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Taxis</h1>
          <div>
            <button onClick={onEnableMfa} className="mr-4 text-gray-300 hover:text-white">Enable 2FA</button>
            <button onClick={signOut} className="text-gray-300 hover:text-white">Sign Out</button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
    <a
      href="#"
      className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg transition-all duration-200 text-sm sm:text-base"
      style={{
        backgroundColor: active ? 'rgba(0, 255, 255, 0.12)' : 'transparent',
        color: active ? '#00ffff' : '#fff',
        border: active ? '1px solid rgba(0, 255, 255, 0.3)' : '1px solid transparent',
        boxShadow: active ? '0 0 10px rgba(0, 255, 255, 0.15)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
        {icon}
        <span>{label}</span>
    </a>
);


export default Layout;
