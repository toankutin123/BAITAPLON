import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ListingForm } from './components/ListingForm';
import { PropertySearch } from './components/PropertySearch';
import { AIAnalyticsDashboard } from './components/AIAnalyticsDashboard';
import { Building2, Search, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold">BDS AI</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  to="/search"
                  className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Search className="w-5 h-5" />
                  Tìm kiếm
                </Link>
                <Link
                  to="/sell"
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Building2 className="w-5 h-5" />
                  Đăng bán
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="py-6">
          <Routes>
            <Route path="/" element={<AIAnalyticsDashboard />} />
            <Route path="/search" element={<PropertySearch />} />
            <Route path="/sell" element={<ListingForm />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
