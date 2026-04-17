import { Link } from "react-router";
import { motion } from "motion/react";
import { TrendingUp, Brain, MapPin, LineChart, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
              Trang Chủ
            </Link>
            <Link to="#features" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
              Tính Năng
            </Link>
            <Link to="#pricing" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
              Bảng Giá
            </Link>
            <Link to="#login" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
              Đăng Nhập
            </Link>
          </div>

          <Link to="/dashboard">
            <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-opacity">
              Bắt Đầu
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white -z-10" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-sm font-medium text-foreground">Trí Tuệ Nhân Tạo Cho Bất Động Sản Việt Nam</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Dự Đoán Giá Bất Động Sản
              <br />
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                Chính Xác với AI
              </span>
            </h1>

            <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              Sử dụng sức mạnh của trí tuệ nhân tạo để đưa ra quyết định đầu tư bất động sản thông minh.
              Nhận dự đoán giá chính xác, phân tích thị trường và thông tin đầu tư trong vài giây.
            </p>

            <div className="flex items-center gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-opacity text-base px-8 py-6">
                  Dự Đoán Ngay
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/market-analysis">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 border-2">
                  Phân Tích Thị Trường
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-12 mt-16">
              <div>
                <div className="text-3xl font-bold text-foreground">98.5%</div>
                <div className="text-sm text-foreground/60">Độ Chính Xác</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-foreground/60">Dự Đoán</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">15M+</div>
                <div className="text-sm text-foreground/60">Dữ Liệu</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tính Năng Mạnh Mẽ Cho Quyết Định Thông Minh
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Mọi thứ bạn cần để định hướng thị trường bất động sản một cách tự tin
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "Dự Đoán Giá Thông Minh",
                description: "Thuật toán AI phân tích hàng ngàn dữ liệu để dự đoán giá bất động sản chính xác",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: LineChart,
                title: "Phân Tích Xu Hướng Thị Trường",
                description: "Thông tin thời gian thực về biến động thị trường và xu hướng giá tại khu vực của bạn",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: TrendingUp,
                title: "Thông Tin Đầu Tư",
                description: "Khám phá cơ hội đầu tư tiềm năng cao với khuyến nghị dựa trên dữ liệu",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: MapPin,
                title: "Phân Tích Vị Trí",
                description: "Phân tích sâu các yếu tố khu vực ảnh hưởng đến giá trị bất động sản",
                gradient: "from-green-500 to-emerald-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="p-8 rounded-2xl border border-border bg-gradient-to-b from-white to-gray-50/50 hover:shadow-xl transition-all duration-300 h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Why Choose EstateAI?
              </h2>
              <p className="text-lg text-foreground/70 mb-6 leading-relaxed">
                EstateAI combines cutting-edge machine learning with comprehensive real estate data
                to deliver insights that were once only available to institutional investors.
              </p>
              <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
                Whether you're a first-time buyer, seasoned investor, or real estate agent,
                our platform empowers you to make informed decisions backed by data.
              </p>
              <div className="space-y-4">
                {["Property Buyers", "Real Estate Investors", "Real Estate Agents", "Market Analysts"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] p-1">
                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl font-bold bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent mb-4">
                      15M+
                    </div>
                    <div className="text-xl text-foreground/80">
                      BĐS Đã Phân Tích
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-20 px-6 bg-white">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Chào Mừng Trở Lại
              </h2>
              <p className="text-foreground/70">
                Đăng nhập để truy cập bảng điều khiển
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-8 shadow-lg">
              <form className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ban@example.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Mật Khẩu
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="text-sm text-foreground/70">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <a href="#" className="text-sm text-[#3B82F6] hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <Link to="/dashboard" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-opacity">
                    Đăng Nhập
                  </Button>
                </Link>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-foreground/60">Hoặc đăng nhập với</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng nhập với Google
                </Button>

                <p className="text-center text-sm text-foreground/70">
                  Chưa có tài khoản?{" "}
                  <a href="#" className="text-[#3B82F6] hover:underline font-medium">
                    Đăng ký
                  </a>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F2557] text-white py-12 px-6">
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
                Trí tuệ nhân tạo cho bất động sản Việt Nam - Quyết định thông minh hơn.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Sản Phẩm</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Tính Năng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bảng Giá</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tài Liệu</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Công Ty</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Về Chúng Tôi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tuyển Dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên Hệ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Pháp Lý</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Chính Sách Bảo Mật</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều Khoản Dịch Vụ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính Sách Cookie</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/70">
              © 2026 EstateAI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
