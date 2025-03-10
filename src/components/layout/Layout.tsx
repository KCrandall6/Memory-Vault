// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;