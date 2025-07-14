'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { BellIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Brain } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(desktopDropdownRef, () => setShowDesktopDropdown(false));
  useClickOutside(mobileDropdownRef, () => setShowMobileDropdown(false));

  // Helper for active state
  const isActive = (href: string) => {
    if (href === '/my-ideas') {
      return pathname.startsWith('/my-ideas') && pathname !== '/my-ideas/requests';
    }
    return pathname === href;
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand (acts as dashboard link) */}
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">IP</span>
            </div>
            <span className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors hidden sm:inline">IdeaPlate</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/my-ideas"
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/my-ideas') ? 'opacity-70 scale-95' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
              aria-disabled={isActive('/my-ideas')}
              tabIndex={isActive('/my-ideas') ? -1 : 0}
            >
              <Brain className="w-6 h-6 text-white" />
            </Link>
            <Link
              href="/share-idea"
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/share-idea') ? 'opacity-70 scale-95' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
              aria-disabled={isActive('/share-idea')}
              tabIndex={isActive('/share-idea') ? -1 : 0}
            >
              <PlusIcon className="w-6 h-6 text-white" />
            </Link>
            <Link
              href="/my-ideas/requests"
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/my-ideas/requests') ? 'opacity-70 scale-95' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
              aria-disabled={isActive('/my-ideas/requests')}
              tabIndex={isActive('/my-ideas/requests') ? -1 : 0}
            >
              <BellIcon className="w-6 h-6 text-white" />
            </Link>
            {/* Profile Dropdown */}
            <div className="relative" ref={desktopDropdownRef}>
              <div>
                <button
                  onClick={() => setShowDesktopDropdown(!showDesktopDropdown)}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <UserIcon className="w-6 h-6 text-white" />
                </button>
                {showDesktopDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-20 animate-dropdownFade">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
                        <UserIcon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-gray-900 font-semibold text-base">Profile</span>
                    </div>
                    <div className="my-2 border-t border-gray-100"></div>
                    <button
                      onClick={() => { setShowDesktopDropdown(false); window.location.href = '/profile'; }}
                      className="w-full text-left px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition rounded-lg font-medium text-base flex items-center gap-2"
                    >
                      <UserIcon className="w-5 h-5 text-blue-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setShowDesktopDropdown(false); window.location.href = '/auth'; }}
                      className="w-full text-left px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition rounded-lg font-medium text-base flex items-center gap-2 mt-1"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/my-ideas"
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/my-ideas') ? 'opacity-70 scale-95' : 'hover:shadow-lg'}`}
              aria-label="My Ideas"
              aria-disabled={isActive('/my-ideas')}
              tabIndex={isActive('/my-ideas') ? -1 : 0}
            >
              <Brain className="w-6 h-6 text-white" />
            </Link>
            <Link
              href="/share-idea"
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/share-idea') ? 'opacity-70 scale-95' : 'hover:shadow-lg'}`}
              aria-label="Share Idea"
              aria-disabled={isActive('/share-idea')}
              tabIndex={isActive('/share-idea') ? -1 : 0}
            >
              <PlusIcon className="w-6 h-6 text-white" />
            </Link>
            <Link
              href="/my-ideas/requests"
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 font-medium ${isActive('/my-ideas/requests') ? 'opacity-70 scale-95' : 'hover:shadow-lg'}`}
              aria-label="Notifications"
              aria-disabled={isActive('/my-ideas/requests')}
              tabIndex={isActive('/my-ideas/requests') ? -1 : 0}
            >
              <BellIcon className="w-6 h-6 text-white" />
            </Link>
            <div className="relative" ref={mobileDropdownRef}>
              <div>
                <button
                  onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
                  aria-label="Profile"
                >
                  <UserIcon className="w-6 h-6 text-white" />
                </button>
                {showMobileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-20 animate-dropdownFade">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-gray-900 font-semibold text-base">Profile</span>
                    </div>
                    <div className="my-2 border-t border-gray-100"></div>
                    <button
                      onClick={() => { setShowMobileDropdown(false); window.location.href = '/profile'; }}
                      className="w-full text-left px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition rounded-lg font-medium text-base flex items-center gap-2"
                    >
                      <UserIcon className="w-5 h-5 text-blue-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setShowMobileDropdown(false); window.location.href = '/auth'; }}
                      className="w-full text-left px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition rounded-lg font-medium text-base flex items-center gap-2 mt-1"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 