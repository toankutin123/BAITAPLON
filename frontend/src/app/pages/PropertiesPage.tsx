import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";

import {
  TrendingUp, Search, Filter, Grid3x3, List, MapPin, Bed, Bath,
  Ruler, Heart, Phone, Eye, ArrowUpDown, ChevronDown, Building2,
  DollarSign, Home, Star
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

// Mock Data
const mockProperties = [
  {
    id: 1,
    title: "Căn Hộ Vinhomes Central Park - View Sông Tuyệt Đẹp",
    type: "Căn Hộ",
    price: 5200000000,
    area: 80,
    bedrooms: 2,
    bathrooms: 2,
    location: "Quận 1, TP.HCM",
    address: "123 Nguyễn Huệ, Phường Bến Nghé",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    status: "Đang bán",
    featured: true,
    views: 1234,
    postedBy: "Công ty BĐS ABC",
    postedDate: "2 ngày trước",
    verified: true,
  },
  {
    id: 2,
    title: "Nhà Phố Thảo Điền - Khu Cao Cấp An Ninh",
    type: "Nhà Phố",
    price: 12500000000,
    area: 150,
    bedrooms: 4,
    bathrooms: 3,
    location: "Quận 2, TP.HCM",
    address: "456 Đường Thảo Điền",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
    status: "Đang bán",
    featured: false,
    views: 856,
    postedBy: "Nguyễn Văn A",
    postedDate: "5 ngày trước",
    verified: true,
  },
  {
    id: 3,
    title: "Biệt Thự Phú Mỹ Hưng - Sân Vườn Rộng Rãi",
    type: "Biệt Thự",
    price: 25000000000,
    area: 300,
    bedrooms: 5,
    bathrooms: 4,
    location: "Quận 7, TP.HCM",
    address: "789 Nguyễn Lương Bằng",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
    status: "Đang bán",
    featured: true,
    views: 2341,
    postedBy: "Công ty BĐS XYZ",
    postedDate: "1 ngày trước",
    verified: true,
  },
  {
    id: 4,
    title: "Căn Hộ The Sun Avenue - Giá Tốt Quận Bình Thạnh",
    type: "Căn Hộ",
    price: 3800000000,
    area: 65,
    bedrooms: 2,
    bathrooms: 1,
    location: "Bình Thạnh, TP.HCM",
    address: "28 Mai Chí Thọ",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    status: "Đang bán",
    featured: false,
    views: 678,
    postedBy: "Trần Thị B",
    postedDate: "3 ngày trước",
    verified: false,
  },
  {
    id: 5,
    title: "Đất Nền Nhà Bè - Tiềm Năng Sinh Lời Cao",
    type: "Đất Nền",
    price: 4500000000,
    area: 100,
    bedrooms: 0,
    bathrooms: 0,
    location: "Nhà Bè, TP.HCM",
    address: "Đường Nguyễn Bình",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    status: "Đang bán",
    featured: false,
    views: 445,
    postedBy: "Lê Văn C",
    postedDate: "1 tuần trước",
    verified: true,
  },
  {
    id: 6,
    title: "Căn Hộ Masteri Thảo Điền - Full Nội Thất Cao Cấp",
    type: "Căn Hộ",
    price: 6800000000,
    area: 90,
    bedrooms: 3,
    bathrooms: 2,
    location: "Quận 2, TP.HCM",
    address: "159 Xa lộ Hà Nội",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    status: "Đang bán",
    featured: true,
    views: 1567,
    postedBy: "Công ty BĐS DEF",
    postedDate: "4 ngày trước",
    verified: true,
  },
];

export function PropertiesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dự Đoán AI
              </Button>
            </Link>
            <Link to="/market-analysis">
              <Button variant="outline" size="sm">
                Phân Tích Thị Trường
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" size="sm">
                Công Cụ Tính Toán
              </Button>
            </Link>
            <Link to="/admin/add-property">
              <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                Đăng Tin
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-[#0F2557] to-[#1e3a8a] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">
            Tìm Bất Động Sản Mơ Ước
          </h1>
          <p className="text-white/80 mb-6">
            Hơn {mockProperties.length} bất động sản đang chờ bạn khám phá
          </p>

          {/* Search Bar */}
          <Card className="p-4 bg-white">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                  <Input
                    placeholder="Tìm theo khu vực, dự án, tên đường..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Loại</SelectItem>
                  <SelectItem value="apartment">Căn Hộ</SelectItem>
                  <SelectItem value="house">Nhà Phố</SelectItem>
                  <SelectItem value="villa">Biệt Thự</SelectItem>
                  <SelectItem value="land">Đất Nền</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                <Search className="w-4 h-4 mr-2" />
                Tìm Kiếm
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters & Sort Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Bộ Lọc
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Khoảng Giá</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Từ" type="number" />
                      <Input placeholder="Đến" type="number" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Diện Tích</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Từ" type="number" />
                      <Input placeholder="Đến" type="number" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Số Phòng Ngủ</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Áp Dụng</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sắp Xếp
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Mới Nhất</DropdownMenuItem>
                <DropdownMenuItem>Giá Thấp - Cao</DropdownMenuItem>
                <DropdownMenuItem>Giá Cao - Thấp</DropdownMenuItem>
                <DropdownMenuItem>Diện Tích Lớn Nhất</DropdownMenuItem>
                <DropdownMenuItem>Xem Nhiều Nhất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="secondary" className="px-4 py-2">
              {mockProperties.length} kết quả
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Properties Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/properties/${property.id}`}>
                  <Card className="bg-white border-border overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {property.featured && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Nổi Bật
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Badge variant="secondary" className="absolute bottom-3 left-3">
                        {property.status}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {property.type}
                        </Badge>
                        {property.verified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            ✓ Đã Xác Minh
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-[#3B82F6] transition-colors">
                        {property.title}
                      </h3>

                      <div className="flex items-center gap-1 text-sm text-foreground/70 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{property.location}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-1 text-sm text-foreground/70">
                            <Bed className="w-4 h-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-1 text-sm text-foreground/70">
                            <Bath className="w-4 h-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-foreground/70">
                          <Ruler className="w-4 h-4" />
                          <span>{property.area}m²</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-foreground">
                            {(property.price / 1000000000).toFixed(1)} tỷ
                          </div>
                          <div className="text-xs text-foreground/60">
                            ≈ {(property.price / property.area / 1000000).toFixed(1)} tr/m²
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-foreground/60">
                          <Eye className="w-4 h-4" />
                          {property.views}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
                            {property.postedBy.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">
                              {property.postedBy}
                            </div>
                            <div className="text-xs text-foreground/60">
                              {property.postedDate}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {mockProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/properties/${property.id}`}>
                  <Card className="bg-white border-border overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="flex gap-6 p-6">
                      {/* Image */}
                      <div className="relative w-80 h-56 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {property.featured && (
                          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 border-0">
                            <Star className="w-3 h-3 mr-1" />
                            Nổi Bật
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{property.type}</Badge>
                            {property.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                ✓ Đã Xác Minh
                              </Badge>
                            )}
                            <Badge variant="secondary">{property.status}</Badge>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>

                        <h3 className="font-bold text-2xl text-foreground mb-2 group-hover:text-[#3B82F6] transition-colors">
                          {property.title}
                        </h3>

                        <div className="flex items-center gap-2 text-foreground/70 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{property.address}</span>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                          {property.bedrooms > 0 && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <Bed className="w-5 h-5" />
                              <span>{property.bedrooms} phòng ngủ</span>
                            </div>
                          )}
                          {property.bathrooms > 0 && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <Bath className="w-5 h-5" />
                              <span>{property.bathrooms} phòng tắm</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-foreground/70">
                            <Ruler className="w-5 h-5" />
                            <span>{property.area}m²</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                              {(property.price / 1000000000).toFixed(1)} tỷ VND
                            </div>
                            <div className="text-sm text-foreground/60">
                              ≈ {(property.price / property.area / 1000000).toFixed(1)} triệu/m²
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-foreground/60">
                              <Eye className="w-4 h-4" />
                              {property.views} lượt xem
                            </div>
                            <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                              <Phone className="w-4 h-4 mr-2" />
                              Liên Hệ
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                            {property.postedBy.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {property.postedBy}
                            </div>
                            <div className="text-xs text-foreground/60">
                              Đăng {property.postedDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Trước
          </Button>
          {[1, 2, 3, 4, 5].map((page) => (
            <Button
              key={page}
              variant={page === 1 ? "default" : "outline"}
              size="sm"
            >
              {page}
            </Button>
          ))}
          <Button variant="outline" size="sm">
            Sau
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F2557] text-white py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">EstateAI</span>
              </div>
              <p className="text-white/70 text-sm">
                Nền tảng bất động sản thông minh với AI
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Sản Phẩm</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/properties" className="hover:text-white transition-colors">Mua Bán BĐS</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dự Đoán AI</Link></li>
                <li><Link to="/market-analysis" className="hover:text-white transition-colors">Phân Tích Thị Trường</Link></li>
                <li><Link to="/calculator" className="hover:text-white transition-colors">Công Cụ Tính Toán</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Hỗ Trợ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Trung Tâm Trợ Giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hướng Dẫn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên Hệ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Liên Hệ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Email: support@estateai.vn</li>
                <li>Hotline: 1900 xxxx</li>
                <li>Địa chỉ: TP. Hồ Chí Minh</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
            © 2026 EstateAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
