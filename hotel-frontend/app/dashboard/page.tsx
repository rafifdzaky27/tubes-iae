'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  KeyIcon, 
  CalendarIcon, 
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon 
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Stat card component
const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
  <div className="card flex items-center">
    <div className="rounded-full bg-primary-100 p-3 mr-4">
      <Icon className="h-8 w-8 text-primary-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <div className="flex items-center">
        <h3 className="text-2xl font-bold mr-2">{value}</h3>
        {change && (
          <span className={`flex items-center text-xs font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'increase' ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {change}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  // Mock data for demonstration
  const [stats, setStats] = useState({
    totalGuests: 124,
    availableRooms: 15,
    activeReservations: 32,
    pendingPayments: 8
  });
  
  // Occupancy data for doughnut chart
  const occupancyData = {
    labels: ['Occupied', 'Available'],
    datasets: [
      {
        data: [45, 15],
        backgroundColor: ['#0284c7', '#e0f2fe'],
        borderColor: ['#0284c7', '#e0f2fe'],
        borderWidth: 1,
      },
    ],
  };
  
  // Revenue data for bar chart
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [12500, 19000, 15000, 21000, 18000, 24000],
        backgroundColor: '#0284c7',
      },
    ],
  };
  
  // Recent activity mock data
  const recentActivity = [
    { id: 1, type: 'reservation', guest: 'John Doe', room: '101', action: 'Check-in', time: '2 hours ago' },
    { id: 2, type: 'payment', guest: 'Jane Smith', room: '205', action: 'Payment received', time: '5 hours ago' },
    { id: 3, type: 'reservation', guest: 'Robert Brown', room: '310', action: 'Check-out', time: '1 day ago' },
    { id: 4, type: 'guest', guest: 'Alice Johnson', action: 'New guest registered', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Guests" 
          value={stats.totalGuests} 
          icon={UserGroupIcon} 
          change="12%" 
          changeType="increase" 
        />
        <StatCard 
          title="Available Rooms" 
          value={stats.availableRooms} 
          icon={KeyIcon} 
          change="3" 
          changeType="decrease" 
        />
        <StatCard 
          title="Active Reservations" 
          value={stats.activeReservations} 
          icon={CalendarIcon} 
          change="8%" 
          changeType="increase" 
        />
        <StatCard 
          title="Pending Payments" 
          value={stats.pendingPayments} 
          icon={CreditCardIcon} 
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Room Occupancy</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={occupancyData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
          <div className="h-64">
            <Bar 
              data={revenueData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: false,
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{activity.guest}</div>
                    {activity.room && <div className="text-sm text-gray-500">Room {activity.room}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activity.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
