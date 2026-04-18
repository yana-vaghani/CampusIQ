import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from './Toast';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 ml-[260px] transition-all duration-300">
        <Navbar />
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
