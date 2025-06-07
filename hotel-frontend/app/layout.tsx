import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ApolloWrapper } from '@/lib/apollo-provider';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: 'HotelEase Management System',
  description: 'A modern hotel management system for room, guest, reservation, and billing management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-gray-50">
        <ApolloWrapper>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
          <Toaster position="top-right" />
        </ApolloWrapper>
      </body>
    </html>
  );
}
