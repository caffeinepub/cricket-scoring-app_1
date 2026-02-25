import React from 'react';
import { Outlet } from '@tanstack/react-router';
import BottomTabNavigation from './BottomTabNavigation';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.97 0.005 240)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-navy-md" style={{ background: 'oklch(0.22 0.07 240)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/cricket-logo.dim_256x256.png"
              alt="Cricket Logo"
              className="w-9 h-9 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-display text-xl font-bold leading-none" style={{ color: 'oklch(0.65 0.18 45)' }}>
                CricketPro
              </h1>
              <p className="text-xs font-medium" style={{ color: 'oklch(0.75 0.03 240)' }}>
                Tournament Manager
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'oklch(0.65 0.18 45 / 0.15)',
                color: 'oklch(0.65 0.18 45)',
                border: '1px solid oklch(0.65 0.18 45 / 0.3)',
              }}
            >
              LIVE
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomTabNavigation />

      {/* Footer */}
      <footer
        className="text-center py-3 text-xs pb-24"
        style={{ color: 'oklch(0.55 0.03 240)', background: 'oklch(0.97 0.005 240)' }}
      >
        Built with{' '}
        <span style={{ color: 'oklch(0.65 0.18 45)' }}>♥</span>{' '}
        using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'cricketpro-app')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
          style={{ color: 'oklch(0.65 0.18 45)' }}
        >
          caffeine.ai
        </a>{' '}
        © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Layout;
