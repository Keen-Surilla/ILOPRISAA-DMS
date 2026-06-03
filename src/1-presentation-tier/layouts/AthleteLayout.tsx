import { Link, Outlet } from 'react-router-dom'; // Added Outlet, removed ReactNode

export default function AthleteLayout() { // Removed props
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-navy text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">ILOPRISAA</h1>
          <p className="text-sm text-blue-300 mt-1">Athlete Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link to="/athlete/dashboard" className="block px-4 py-2 rounded bg-blue-800 hover:bg-brand-blue transition">
            Dashboard
          </Link>
          <Link to="/athlete/documents" className="block px-4 py-2 rounded hover:bg-blue-800 transition">
            My Documents
          </Link>
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <button className="w-full text-left px-4 py-2 rounded text-brand-danger hover:bg-blue-800 transition">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">Welcome, Athlete</h2>
          <p className="text-gray-500">Manage your credentials and submission status here.</p>
        </header>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          {/* This Outlet is where your Dashboard page will actually appear! */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}