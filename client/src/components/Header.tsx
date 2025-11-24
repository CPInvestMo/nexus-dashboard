import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { APP_LOGO, APP_TITLE } from '../lib/const';

interface HeaderProps {
  userRole?: 'super_admin' | 'internal_admin' | 'investor';
  userName?: string;
}

export function Header({ userRole, userName }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3">
            <img src={APP_LOGO} alt="CPI Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </Link>

          {/* Right side - Notifications and User */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Info */}
            {userName && (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  {userRole && (
                    <p className="text-xs text-gray-500 capitalize">
                      {userRole.replace('_', ' ')}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
