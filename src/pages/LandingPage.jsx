import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  MessageCircle,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-gradient-to-tr from-purple-200 via-white to-pink-200">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Dành cho sinh viên thiết kế & junior designer
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            KHỞI ĐẦU SỰ NGHIỆP 
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SÁNG TẠO CỦA BẠN
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tạo dựng những portfolio ấn tượng, nhận phản hồi từ chuyên gia và tìm được vị trí thực tập mơ ước hoặc công việc thiết kế đầu tiên — tất cả chỉ trong một nơi.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-14 rounded-xl text-lg font-medium flex items-center justify-center shadow-lg transition-all">
                Gửi Portfolio
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>

            <Link to="/jobs">
              <button className="border-2 border-gray-300 hover:bg-gray-100 px-8 h-14 rounded-xl text-lg font-medium transition-all">
                Tìm Việc
              </button>
            </Link>
          </div>

          {/* Hero Mockup */}
          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-10 border border-gray-200 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4"><img src="/Portfolio1.png" alt="Logo TÚT TÁT" className="h-full w-auto object-contain" /></div>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-400 opacity-20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mọi thứ bạn cần để thành công
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Portfolio
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Gửi những portfolio
              và giới thiệu những tác phẩm xuất sắc nhất của bạn một cách chuyên nghiệp.
            </p>

            <Link
              to="/portfolio"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Gửi Portfolio
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 2 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Buddy Nhận Xét
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Nhận lời khuyên thiết thực từ những buddy kinh nghiệm về danh mục đầu tư và sự nghiệp của bạn.
            </p>

            <Link
              to="/feedback"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Nhận Phản Hồi
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 3 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Công việc Sáng tạo
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Khám phá các cơ hội thực tập và việc làm mới ra trường từ các công ty sáng tạo.
            </p>

            <Link
              to="/jobs"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Khám phá Công việc
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-purple-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Nó hoạt động như thế nào
            </h2>

            <p className="text-xl text-gray-600">
              Bắt đầu sự nghiệp sáng tạo của bạn chỉ với 3 bước đơn giản
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                title: "Tạo hồ sơ của bạn",
                desc: "Thêm vào các kỹ năng, công cụ và sở thích sáng tạo của bạn.",
              },
              {
                title: "Gửi portfolio của bạn",
                desc: "Tải lên các dự án và nhận phản hồi từ người hướng dẫn.",
              },
              {
                title: "Tìm được công việc mơ ước",
                desc: "Ứng tuyển vào các vị trí thực tập và việc làm dành cho người mới ra trường.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-purple-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Bạn đã sẵn sàng khởi đầu sự nghiệp của mình chưa?
          </h2>

          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Tham gia cùng hàng ngàn nhà thiết kế đang xây dựng tương lai của họ với Tút Tát.
          </p>

          <Link to="/signup">
            <button className="bg-white text-indigo-700 px-8 h-14 rounded-xl text-lg font-semibold inline-flex items-center shadow-lg hover:shadow-xl transition-all">
              Bắt đầu miễn phí
              <Zap className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

