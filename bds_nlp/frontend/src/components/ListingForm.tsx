import React, { useState } from 'react';
import { api } from '../services/api';
import { Building2, MapPin, Ruler, Bed, Bath, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ValuationResult {
  suggested_price: number;
  price_range_min: number;
  price_range_max: number;
  price_per_m2: number;
  market_avg_price: number;
  price_assessment: string;
  confidence_score: number;
  analysis_summary: string;
  comparable_properties: any[];
}

export const ListingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    city: 'Hà Nội',
    district: '',
    ward: '',
    street: '',
    property_type: 'house',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '1',
    price: '',
    description: '',
  });
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [listingId, setListingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.createListing({
        ...formData,
        area: parseFloat(formData.area) || null,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        floors: parseInt(formData.floors) || 1,
        price: parseInt(formData.price) || 0,
      });
      setListingId(result.id);
      
      // Get valuation
      const valResult = await api.valuateProperty({
        property_type: formData.property_type,
        city: formData.city,
        district: formData.district,
        area: parseFloat(formData.area) || undefined,
        price: parseInt(formData.price) || undefined,
      });
      setValuation(valResult);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1e9) return `${(price / 1e9).toFixed(2)} tỷ`;
    if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN');
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'below_market': return 'text-green-600 bg-green-100';
      case 'above_market': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getAssessmentText = (assessment: string) => {
    switch (assessment) {
      case 'below_market': return 'Thấp hơn thị trường';
      case 'above_market': return 'Cao hơn thị trường';
      default: return 'Hợp lý với thị trường';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Building2 className="w-8 h-8" />
        Đăng tin bán bất động sản
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="VD: Bán nhà riêng 3 tầng Quận Cầu Giấy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố *</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
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
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
                placeholder="VD: Cầu Giấy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phường/Xã</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={formData.ward}
                onChange={e => setFormData({...formData, ward: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Đường</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={formData.street}
                onChange={e => setFormData({...formData, street: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Loại hình *</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.property_type}
                onChange={e => setFormData({...formData, property_type: e.target.value})}
              >
                <option value="house">Nhà riêng</option>
                <option value="apartment">Căn hộ</option>
                <option value="villa">Biệt thự</option>
                <option value="land">Đất nền</option>
                <option value="townhouse">Nhà phố</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.area}
                onChange={e => setFormData({...formData, area: e.target.value})}
                placeholder="VD: 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số phòng ngủ</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.bedrooms}
                onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số phòng tắm</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.bathrooms}
                onChange={e => setFormData({...formData, bathrooms: e.target.value})}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số tầng</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.floors}
                onChange={e => setFormData({...formData, floors: e.target.value})}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Giá bán (VNĐ) *</label>
              <input
                type="number"
                required
                className="w-full p-2 border rounded"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="VD: 5000000000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                className="w-full p-2 border rounded h-32"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả chi tiết về bất động sản..."
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang phân tích...' : 'Phân tích và định giá'}
        </button>
      </form>

      {valuation && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Kết quả phân tích AI
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Giá đề xuất</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(valuation.suggested_price)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Khoảng giá hợp lý</p>
              <p className="text-lg font-semibold">
                {formatPrice(valuation.price_range_min)} - {formatPrice(valuation.price_range_max)}
              </p>
            </div>
            <div className="p-4 rounded-lg">
              <p className="text-sm text-gray-600">Đánh giá</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAssessmentColor(valuation.price_assessment)}`}>
                {getAssessmentText(valuation.price_assessment)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Giá/m² thị trường</p>
              <p className="font-semibold">{formatPrice(valuation.price_per_m2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Giá TB thị trường</p>
              <p className="font-semibold">{formatPrice(valuation.market_avg_price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Độ tin cậy</p>
              <p className="font-semibold">{valuation.confidence_score.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">BDS so sánh</p>
              <p className="font-semibold">{valuation.comparable_properties.length} bất động sản</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tóm tắt phân tích</h3>
            <p className="text-gray-700">{valuation.analysis_summary}</p>
          </div>

          {valuation.comparable_properties.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Bất động sản tương tự</h3>
              <div className="space-y-2">
                {valuation.comparable_properties.slice(0, 5).map((prop: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{prop.title?.slice(0, 50)}...</p>
                      <p className="text-sm text-gray-500">{prop.district}, {prop.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(prop.price)}</p>
                      <p className="text-sm text-gray-500">{prop.area}m²</p>
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
