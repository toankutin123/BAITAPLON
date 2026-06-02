import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, MapPin, DollarSign, Home, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardData {
  total_listings: number;
  active_listings: number;
  new_listings_today: number;
  avg_price: number;
  avg_price_change_pct: number;
  top_districts: any[];
  rising_areas: any[];
  declining_areas: any[];
  top_searched_areas: any[];
  market_health_score: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AIAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Hà Nội');

  useEffect(() => {
    loadDashboard();
  }, [selectedCity]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await api.getDashboard(selectedCity);
      setData(result);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    if (!price) return '0';
    if (price >= 1e9) return `${(price / 1e9).toFixed(2)} tỷ`;
    if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN');
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthText = (score: number) => {
    if (score >= 80) return 'Rất tốt';
    if (score >= 60) return 'Khá tốt';
    if (score >= 40) return 'Trung bình';
    return 'Cần cải thiện';
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          AI Analytics Dashboard
        </h1>
        <select
          className="p-2 border rounded-lg"
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
        >
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <Home className="w-5 h-5" />
            <span className="text-sm">Tổng tin đăng</span>
          </div>
          <p className="text-2xl font-bold mt-2">{data.total_listings.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Giá TB</span>
          </div>
          <p className="text-2xl font-bold mt-2">{formatPrice(data.avg_price)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Tin mới hôm nay</span>
          </div>
          <p className="text-2xl font-bold mt-2">{data.new_listings_today}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <Activity className="w-5 h-5" />
            <span className="text-sm">Sức khỏe thị trường</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold">{data.market_health_score.toFixed(0)}</span>
            <span className={`px-2 py-1 rounded text-xs ${getHealthColor(data.market_health_score)}`}>
              {getHealthText(data.market_health_score)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Districts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top quận huyện theo giá
          </h2>
          {data.top_districts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.top_districts.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `${(v/1e9).toFixed(1)}T`} />
                <YAxis dataKey="district" type="category" width={100} />
                <Tooltip formatter={(value: any) => formatPrice(value)} />
                <Bar dataKey="avg_price" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Rising/Declining Areas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <TrendingDown className="w-5 h-5 text-red-500" />
            Xu hướng khu vực
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-green-600 mb-2">Đang tăng giá</h3>
              {data.rising_areas.length > 0 ? (
                <ul className="space-y-2">
                  {data.rising_areas.slice(0, 5).map((area: any, i: number) => (
                    <li key={i} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span>{area.area}</span>
                      <span className="text-green-600 font-medium">+{area.price_change_pct?.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Không có dữ liệu</p>
              )}
            </div>
            <div>
              <h3 className="font-medium text-red-600 mb-2">Đang giảm giá</h3>
              {data.declining_areas.length > 0 ? (
                <ul className="space-y-2">
                  {data.declining_areas.slice(0, 5).map((area: any, i: number) => (
                    <li key={i} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span>{area.area}</span>
                      <span className="text-red-600 font-medium">{area.price_change_pct?.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Không có dữ liệu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* District Rankings Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Bảng xếp hạng quận huyện</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Quận</th>
                <th className="text-right py-2">Giá TB</th>
                <th className="text-right py-2">Giá/m²</th>
                <th className="text-right py-2">Số tin</th>
                <th className="text-right py-2">Thay đổi</th>
                <th className="text-center py-2">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {data.top_districts.map((district: any, i: number) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{district.district}</td>
                  <td className="text-right">{formatPrice(district.avg_price)}</td>
                  <td className="text-right">{formatPrice(district.avg_price_per_m2)}/m²</td>
                  <td className="text-right">{district.listing_count}</td>
                  <td className="text-right">
                    <span className={district.price_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {district.price_change_pct >= 0 ? '+' : ''}{district.price_change_pct?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    {district.trend === 'rising' && <TrendingUp className="w-5 h-5 text-green-500 inline" />}
                    {district.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-500 inline" />}
                    {district.trend === 'stable' && <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Health Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Khu vực được tìm kiếm nhiều
          </h3>
          {data.top_searched_areas.length > 0 ? (
            <ul className="space-y-2">
              {data.top_searched_areas.slice(0, 5).map((area: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{area.area}</span>
                  <span className="text-gray-500">{area.search_count} lượt</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            BDS được đề xuất nhiều nhất
          </h3>
          <p className="text-gray-500 text-sm">Tính năng đang phát triển</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cảnh báo thị trường
          </h3>
          <p className="text-gray-500 text-sm">Không có cảnh báo</p>
        </div>
      </div>
    </div>
  );
};
