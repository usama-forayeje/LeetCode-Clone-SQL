import { Outlet } from "react-router";


const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* <AdminSidebar /> */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;