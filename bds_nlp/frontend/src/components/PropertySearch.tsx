import React, { useState } from 'react';
import { api } from '../services/api';
import { Search, MapPin, DollarSign, Home, TrendingUp, Star, AlertCircle } from 'lucide-react';

interface Property {
  listing_id: number;
  title: string;
  price: number;
  area: number;
  price_per_m2: number;
  city: string;
  district: string;
  ward: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  match_score: number;
  recommendation_type: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string;
  rank: number;
}

export const PropertySearch: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    city: 'Hà Nội',
    district: '',
    property_type: '',
    budget_max: '',
    min_area: '',
    min_bedrooms: 0,
    min_bathrooms: 0,
  });
  const [results, setResults] = useState<{ recommendations: Property[], alternative_suggestions: Property[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.searchProperties({
        ...searchParams,
        budget_max: searchParams.budget_max ? parseInt(searchParams.budget_max) : undefined,
        min_area: searchParams.min_area ? parseFloat(searchParams.min_area) : undefined,
        location_weight: 0.40,
        price_weight: 0.30,
        area_weight: 0.15,
        amenities_weight: 0.15,
        max_results: 20,
      });
      setResults(response);
      setExpanded(response.search_expanded);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1e9) return `${(price / 1e9).toFixed(2)} tỷ`;
    if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getRecTypeText = (type: string) => {
    const types: Record<string, string> = {
      exact_match: 'Phù hợp chính xác',
      similar_area: 'Khu vực tương tự',
      under_market_value: 'Giá dưới thị trường',
      good_value: 'Giá tốt',
      expanded_search: 'Mở rộng tìm kiếm',
      alternative: 'Lựa chọn thay thế',
    };
    return types[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Search className="w-8 h-8" />
        Tìm kiếm bất động sản thông minh
      </h1>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
            <select
              className="w-full p-2 border rounded"
              value={searchParams.city}
              onChange={e => setSearchParams({...searchParams, city: e.target.value})}
            >
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={searchParams.district}
              onChange={e => setSearchParams({...searchParams, district: e.target.value})}
              placeholder="VD: Cầu Giấy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Loại hình</label>
            <select
              className="w-full p-2 border rounded"
              value={searchParams.property_type}
              onChange={e => setSearchParams({...searchParams, property_type: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="house">Nhà riêng</option>
              <option value="apartment">Căn hộ</option>
              <option value="villa">Biệt thự</option>
              <option value="land">Đất nền</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ngân sách tối đa (VNĐ)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={searchParams.budget_max}
              onChange={e => setSearchParams({...searchParams, budget_max: e.target.value})}
              placeholder="VD: 5000000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Diện tích tối thiểu (m²)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={searchParams.min_area}
              onChange={e => setSearchParams({...searchParams, min_area: e.target.value})}
              placeholder="VD: 60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số phòng ngủ tối thiểu</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={searchParams.min_bedrooms}
              onChange={e => setSearchParams({...searchParams, min_bedrooms: parseInt(e.target.value) || 0})}
              min="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm với AI'}
        </button>
      </form>

      {results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Tìm thấy {results.recommendations.length} kết quả phù hợp
            </h2>
            {expanded && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Tìm kiếm đã được mở rộng
              </span>
            )}
          </div>

          <div className="space-y-4">
            {results.recommendations.map((prop) => (
              <div key={prop.listing_id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold ${getScoreColor(prop.match_score)}`}>
                    {prop.match_score.toFixed(0)}%
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{prop.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {prop.ward}, {prop.district}, {prop.city}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {getRecTypeText(prop.recommendation_type)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500">Giá</p>
                        <p className="font-bold text-green-600">{formatPrice(prop.price)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Diện tích</p>
                        <p className="font-semibold">{prop.area}m²</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Giá/m²</p>
                        <p className="font-semibold">{formatPrice(prop.price_per_m2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phòng ngủ/Tắm</p>
                        <p className="font-semibold">{prop.bedrooms}/{prop.bathrooms}</p>
                      </div>
                    </div>

                    {prop.strengths.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-700">Ưu điểm:</p>
                        <ul className="text-sm text-green-600">
                          {prop.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    )}

                    {prop.weaknesses.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-700">Nhược điểm:</p>
                        <ul className="text-sm text-red-600">
                          {prop.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
                      {prop.reasons}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.alternative_suggestions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Home className="w-6 h-6" />
                Lựa chọn thay thế
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.alternative_suggestions.map((prop) => (
                  <div key={prop.listing_id} className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-400">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{prop.title}</h3>
                        <p className="text-sm text-gray-500">{prop.district}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(prop.price)}</p>
                        <p className="text-sm text-gray-500">{prop.area}m²</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getScoreColor(prop.match_score)} text-white`}>
                        {prop.match_score.toFixed(0)}% phù hợp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
