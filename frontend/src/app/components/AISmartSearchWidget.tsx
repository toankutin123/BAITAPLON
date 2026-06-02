import { useState } from 'react';
import { aiApi, formatPrice } from '../services/aiApi';
import { Search, MapPin, Star, Filter, ChevronRight } from 'lucide-react';

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
  match_score: number;
  recommendation_type: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string;
}

interface Props {
  onPropertySelect?: (property: Property) => void;
}

export function AISmartSearchWidget({ onPropertySelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    recommendations: Property[];
    alternative_suggestions: Property[];
  } | null>(null);
  const [formData, setFormData] = useState({
    city: 'Hà Nội',
    district: '',
    property_type: '',
    budget_max: '',
    min_area: '',
    min_bedrooms: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await aiApi.searchProperties({
        city: formData.city,
        district: formData.district || undefined,
        property_type: formData.property_type || undefined,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : undefined,
        min_area: formData.min_area ? parseFloat(formData.min_area) : undefined,
        min_bedrooms: formData.min_bedrooms ? parseInt(formData.min_bedrooms) : undefined,
      });
      setResults(res);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
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
    <div className="bg-white rounded-xl border shadow-sm">
      {/* Search Form */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Tìm kiếm thông minh</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            className="p-2 border rounded-lg text-sm"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          >
            <option value="Hà Nội">Hà Nội</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
          </select>
          <input
            type="text"
            placeholder="Quận/Huyện"
            className="p-2 border rounded-lg text-sm"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          />
          <input
            type="number"
            placeholder="Ngân sách tối đa (VNĐ)"
            className="p-2 border rounded-lg text-sm"
            value={formData.budget_max}
            onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
          />
          <input
            type="number"
            placeholder="Diện tích tối thiểu (m²)"
            className="p-2 border rounded-lg text-sm"
            value={formData.min_area}
            onChange={(e) => setFormData({ ...formData, min_area: e.target.value })}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Đang tìm...' : 'Tìm kiếm AI'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              Tìm thấy {results.recommendations.length} kết quả phù hợp
            </p>
          </div>

          {/* Main Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.recommendations.slice(0, 5).map((prop, idx) => (
              <div
                key={prop.listing_id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPropertySelect?.(prop)}
              >
                <div className="flex gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${getScoreColor(prop.match_score)}`}>
                    {prop.match_score.toFixed(0)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{prop.title}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{prop.district}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-green-600">{formatPrice(prop.price)}</span>
                      <span className="text-xs text-gray-500">{prop.area}m²</span>
                    </div>
                  </div>
                </div>
                {prop.strengths.length > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    {prop.strengths[0]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Alternatives */}
          {results.alternative_suggestions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Lựa chọn thay thế</p>
              <div className="space-y-2">
                {results.alternative_suggestions.slice(0, 3).map((prop) => (
                  <div
                    key={prop.listing_id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => onPropertySelect?.(prop)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded text-white ${getScoreColor(prop.match_score)}`}>
                        {prop.match_score.toFixed(0)}%
                      </span>
                      <span className="text-sm truncate">{prop.title}</span>
                    </div>
                    <span className="text-sm font-medium ml-2">{formatPrice(prop.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="p-8 text-center text-gray-500">
          <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nhập tiêu chí tìm kiếm để bắt đầu</p>
        </div>
      )}
    </div>
  );
}
