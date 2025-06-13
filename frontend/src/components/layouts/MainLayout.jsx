import { useThemeStore } from '@/stores/theme.store';
import { Outlet } from 'react-router';

function MainLayout() {
  const { theme } = useThemeStore();
  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      {/* <Navbar /> */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:block w-64 bg-gray-800 text-white p-4">
          {/* <Sidebar /> */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout