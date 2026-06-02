import { useState } from 'react';
import { aiApi, formatPrice } from '../services/aiApi';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  CheckCircle,
  AlertTriangle,
  Building2,
} from 'lucide-react';

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
  trend_direction: string;
}

interface Props {
  propertyData?: {
    city: string;
    district?: string;
    property_type: string;
    area?: number;
    price?: number;
  };
  onValuationComplete?: (result: ValuationResult) => void;
}

export function AIValuationWidget({ propertyData, onValuationComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [formData, setFormData] = useState({
    city: propertyData?.city || 'Hà Nội',
    district: propertyData?.district || '',
    property_type: propertyData?.property_type || 'house',
    area: propertyData?.area?.toString() || '',
    price: propertyData?.price?.toString() || '',
    bedrooms: '',
    bathrooms: '',
  });

  const handleValuate = async () => {
    setLoading(true);
    try {
      const res = await aiApi.valuateProperty({
        city: formData.city,
        district: formData.district || undefined,
        property_type: formData.property_type,
        area: formData.area ? parseFloat(formData.area) : undefined,
        price: formData.price ? parseInt(formData.price) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      });
      setResult(res);
      onValuationComplete?.(res);
    } catch (error) {
      console.error('Valuation error:', error);
    }
    setLoading(false);
  };

  const getAssessmentStyle = (assessment: string) => {
    switch (assessment) {
      case 'below_market':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'above_market':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getAssessmentText = (assessment: string) => {
    switch (assessment) {
      case 'below_market':
        return 'Thấp hơn thị trường';
      case 'above_market':
        return 'Cao hơn thị trường';
      default:
        return 'Hợp lý với thị trường';
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold">Định giá AI</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          className="p-2 border rounded-lg text-sm"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        >
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
        </select>
        <select
          className="p-2 border rounded-lg text-sm"
          value={formData.property_type}
          onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
        >
          <option value="house">Nhà riêng</option>
          <option value="apartment">Căn hộ</option>
          <option value="villa">Biệt thự</option>
          <option value="land">Đất nền</option>
        </select>
        <input
          type="number"
          placeholder="Diện tích (m²)"
          className="p-2 border rounded-lg text-sm"
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
        />
        <input
          type="number"
          placeholder="Giá (VNĐ)"
          className="p-2 border rounded-lg text-sm"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
      </div>

      <button
        onClick={handleValuate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Đang phân tích...' : 'Phân tích định giá'}
      </button>

      {result && (
        <div className="mt-4 space-y-4">
          {/* Price Assessment */}
          <div className={`p-4 rounded-lg border ${getAssessmentStyle(result.price_assessment)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Đánh giá giá</span>
              {result.price_assessment === 'below_market' && <TrendingDown className="w-4 h-4" />}
              {result.price_assessment === 'above_market' && <TrendingUp className="w-4 h-4" />}
              {result.price_assessment === 'fair' && <CheckCircle className="w-4 h-4" />}
            </div>
            <p className="text-lg font-bold">{getAssessmentText(result.price_assessment)}</p>
          </div>

          {/* Suggested Price */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Giá đề xuất</p>
            <p className="text-2xl font-bold text-blue-700">{formatPrice(result.suggested_price)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Khoảng: {formatPrice(result.price_range_min)} - {formatPrice(result.price_range_max)}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Giá/m² TB</p>
              <p className="font-semibold">{formatPrice(result.price_per_m2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Độ tin cậy</p>
              <p className="font-semibold">{result.confidence_score?.toFixed(0)}%</p>
            </div>
          </div>

          {/* Comparable Count */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <span>{result.comparable_properties?.length || 0} bất động sản so sánh</span>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">{result.analysis_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
