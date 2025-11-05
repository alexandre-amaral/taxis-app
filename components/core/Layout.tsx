
import React, { useState } from 'react';
import { HomeIcon, HistoryIcon, SettingsIcon, Logo } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  signOut: () => void;
  onEditPreferences?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, signOut, onEditPreferences }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold font-display">Taxis</h1>
          <div className="flex items-center gap-4">
            {onEditPreferences && (
              <button
                onClick={onEditPreferences}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00ffff',
                  border: '1px solid rgba(0, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Preferences
              </button>
            )}
            <button
              onClick={signOut}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
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
