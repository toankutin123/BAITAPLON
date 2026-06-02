import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Home, TrendingUp, BarChart3, MapPin, Building2, Bath, Bed,
  Square, Calendar, ArrowLeft, Sparkles, CheckCircle2, MessageCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { predictService, PredictionRequest } from "../services/predict.service";

export function DashboardPage() {
  const [prediction, setPrediction] = useState<{
    predicted_price: number;
    confidence: number;
    insights: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Collect form data
      const formData = new FormData(e.target as HTMLFormElement);
      const location = formData.get("location") as string;
      const propertyType = formData.get("property-type") as string;
      const areaStr = formData.get("area") as string;
      const bedroomsStr = formData.get("bedrooms") as string;
      const bathroomsStr = formData.get("bathrooms") as string;
      const yearStr = formData.get("year") as string;
      const features = Array.from(formData.getAll("features")) as string[];
      const customFeaturesStr = formData.get("custom-features") as string;

      // Parse custom features
      const customFeatures = customFeaturesStr ? customFeaturesStr.split(',').map(f => f.trim()).filter(f => f) : [];
      const allFeatures = [...features, ...customFeatures];

      // Validation
      if (!location.trim()) {
        throw new Error("Vui lòng nhập vị trí");
      }
      if (!propertyType) {
        throw new Error("Vui lòng chọn loại bất động sản");
      }
      const area = parseFloat(areaStr);
      if (isNaN(area) || area <= 0) {
        throw new Error("Diện tích phải là số dương");
      }
      const bedrooms = bedroomsStr === "5+" ? 5 : parseInt(bedroomsStr);
      if (isNaN(bedrooms) || bedrooms < 0) {
        throw new Error("Số phòng ngủ không hợp lệ");
      }
      const bathrooms = bathroomsStr === "4+" ? 4 : parseInt(bathroomsStr);
      if (isNaN(bathrooms) || bathrooms < 0) {
        throw new Error("Số phòng tắm không hợp lệ");
      }

      const request: PredictionRequest = {
        location: location.trim(),
        property_type: propertyType,
        area,
        bedrooms,
        bathrooms,
        year_built: yearStr ? parseInt(yearStr) : undefined,
        features: allFeatures || [],
      };

      const result = await predictService.predictPrice(request);
      setPrediction(result);
    } catch (error) {
      console.error("Prediction error:", error);
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra khi dự đoán giá. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Về Trang Chủ
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border p-6">
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dự Đoán Giá</span>
            </Link>
            <Link
              to="/market-analysis"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Phân Tích Thị Trường</span>
            </Link>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">BĐS Của Tôi</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Vị Trí Đã Lưu</span>
            </a>
            <Link
              to="/chat-with-admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat với Admin</span>
            </Link>
          </nav>

          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <span className="font-bold text-sm text-foreground">Mẹo Hay</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Thêm nhiều thông tin chi tiết để có dự đoán chính xác hơn
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Dự Đoán Giá AI
              </h1>
              <p className="text-foreground/70">
                Nhập thông tin bất động sản để nhận định giá tức thì từ AI
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Prediction Form */}
              <Card className="p-8 bg-white border-border shadow-lg h-fit">
                <h2 className="text-2xl font-bold text-foreground mb-6">Thông Tin Bất Động Sản</h2>

                <form onSubmit={handlePredict} className="space-y-5">
                  <div>
                    <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Vị Trí
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="property-type" className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4" />
                      Loại BĐS
                    </Label>
                    <Select name="property-type">
                      <SelectTrigger id="property-type">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Căn Hộ Chung Cư</SelectItem>
                        <SelectItem value="house">Nhà Phố</SelectItem>
                        <SelectItem value="villa">Biệt Thự</SelectItem>
                        <SelectItem value="townhouse">Nhà Liền Kề</SelectItem>
                        <SelectItem value="land">Đất Nền</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="area" className="flex items-center gap-2 mb-2">
                      <Square className="w-4 h-4" />
                      Diện Tích (m²)
                    </Label>
                    <Input
                      id="area"
                      name="area"
                      type="number"
                      placeholder="VD: 80"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms" className="flex items-center gap-2 mb-2">
                        <Bed className="w-4 h-4" />
                        Phòng Ngủ
                      </Label>
                      <Select name="bedrooms">
                        <SelectTrigger id="bedrooms">
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5+">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bathrooms" className="flex items-center gap-2 mb-2">
                        <Bath className="w-4 h-4" />
                        Phòng Tắm
                      </Label>
                      <Select name="bathrooms">
                        <SelectTrigger id="bathrooms">
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4+">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="year" className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Năm Xây Dựng
                    </Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      placeholder="VD: 2020"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Tiện Ích Thêm</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Bãi Đỗ Xe", "Sân Vườn", "Hồ Bơi", "Phòng Gym"].map((feature) => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="features" value={feature} className="rounded border-border" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="custom-features" className="text-sm">Tiện Ích Khác (phân cách bằng dấu phẩy)</Label>
                      <Input
                        id="custom-features"
                        name="custom-features"
                        placeholder="VD: Gần trường học, Gần chợ, An ninh tốt"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-opacity text-base py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Đang Phân Tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Dự Đoán Giá
                      </>
                    )}
                  </Button>
                </form>
              </Card>

              {/* Results */}
              <div className="flex flex-col gap-8">
                {prediction ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Giá Ước Tính */}
                    <Card className="p-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white border-0 shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-medium">Dự Đoán Hoàn Tất</span>
                      </div>
                      <h3 className="text-lg mb-2 opacity-90">Giá Ước Tính</h3>
                      <div className="text-5xl font-bold mb-4">
                        {(prediction.predicted_price / 1000000000).toFixed(2)} tỷ
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white rounded-full h-2" style={{ width: `${prediction.confidence * 100}%` }} />
                        </div>
                        <span>{(prediction.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm mt-2 opacity-80">Độ Tin Cậy</p>
                    </Card>

                    {/* Xu Hướng Giá */}
                    <Card className="p-8 bg-white border-border shadow-lg">
                      <h3 className="text-xl font-bold text-foreground mb-6">So Sánh Giá</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={[
                            { name: 'Giá Dự Đoán', price: prediction.predicted_price },
                            { name: 'Giá Trung Bình', price: prediction.predicted_price * 0.95 },
                            { name: 'Giá Cao Nhất', price: prediction.predicted_price * 1.15 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="name" stroke="#64748B" />
                          <YAxis
                            stroke="#64748B"
                            tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}tỷ`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${(value / 1000000000).toFixed(2)} tỷ VND`, 'Giá']}
                          />
                          <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                            <Cell fill="#3B82F6" />
                            <Cell fill="#8B5CF6" />
                            <Cell fill="#10B981" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 flex items-center gap-2 text-sm text-foreground/70">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Giá tham khảo dựa trên dữ liệu thị trường</span>
                      </div>
                    </Card>

                    {/* Thông Tin Chi Tiết */}
                    <Card className="p-6 bg-blue-50 border-blue-200">
                      <h4 className="font-bold text-foreground mb-3">Thông Tin Chi Tiết</h4>
                      <ul className="space-y-2 text-sm text-foreground/70">
                        {prediction.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-2" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="p-12 bg-white border-border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                      <Sparkles className="w-10 h-10 text-[#3B82F6]" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Sẵn Sàng Dự Đoán
                    </h3>
                    <p className="text-foreground/70 max-w-xs">
                      Điền thông tin bất động sản và nhấn "Dự Đoán Giá" để nhận định giá từ AI
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
