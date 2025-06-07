'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  KeyIcon, 
  CalendarIcon, 
  CreditCardIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Rooms', href: '/rooms', icon: KeyIcon },
  { name: 'Guests', href: '/guests', icon: UsersIcon },
  { name: 'Reservations', href: '/reservations', icon: CalendarIcon },
  { name: 'Billing', href: '/billing', icon: CreditCardIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white shadow-md">
        <div className="flex items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <span className="ml-3 text-lg font-semibold text-primary-600">HotelEase</span>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
            <span className="text-xl font-bold text-white">HotelEase</span>
            <button
              type="button"
              className="text-white hover:text-gray-200"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
        <div className="flex items-center justify-center h-16 px-6">
          <span className="text-2xl font-bold text-primary-600">HotelEase</span>
        </div>
        <div className="mt-6 flex flex-col flex-1">
          <nav className="flex-1 px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                H
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Hotel Admin</p>
              <p className="text-xs font-medium text-gray-500">Staff</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content padding for desktop */}
      <div className="hidden lg:block lg:pl-64" />
    </>
  );
}
