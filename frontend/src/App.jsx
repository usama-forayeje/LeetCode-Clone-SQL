import AdminLayout from './components/layouts/AdminLayout';
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';
import AppRouter from './routers/AppRouter';

const layoutMap = {
  '/login': AuthLayout,
  '/register': AuthLayout,
  '/admin': AdminLayout,
  default: MainLayout,
};

function App() {

  const Layout = Object.entries(layoutMap).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || layoutMap.default;

  return (

    <AppRouter />


  )
}

export default App
