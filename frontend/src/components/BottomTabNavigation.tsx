import React from 'react';
import { useRouter, useNavigate } from '@tanstack/react-router';
import { Home, Users, Activity, Clock, BookOpen } from 'lucide-react';

const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Teams', icon: Users, path: '/teams' },
  { label: 'New Match', icon: Activity, path: '/setup' },
  { label: 'History', icon: Clock, path: '/history' },
  { label: 'Rules', icon: BookOpen, path: '/rules' },
];

const BottomTabNavigation: React.FC = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 shadow-navy-lg"
      style={{ background: 'oklch(0.18 0.06 240)', borderTop: '1px solid oklch(0.28 0.07 240)' }}
    >
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            (tab.path === '/' && (currentPath === '/' || currentPath === '/history'))
              ? true
              : tab.path !== '/' && currentPath.startsWith(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => navigate({ to: tab.path })}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 relative"
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'oklch(0.65 0.18 45)' }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? 'oklch(0.65 0.18 45)' : 'oklch(0.6 0.03 240)' }}
              />
              <span
                className="text-xs mt-0.5 font-medium"
                style={{
                  color: isActive ? 'oklch(0.65 0.18 45)' : 'oklch(0.6 0.03 240)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNavigation;
