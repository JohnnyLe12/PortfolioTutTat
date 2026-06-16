# Requirements Document

## Introduction

Phân hệ Mentees (Mentee Subsystem) là thành phần cốt lõi của nền tảng **PortfolioTutTat** — một nền tảng web hỗ trợ sinh viên ngành thiết kế (Graphic Design, UI/UX, Multimedia, Motion Design) xây dựng portfolio chuyên nghiệp, nhận phản hồi thực tế từ Buddy/Mentor, và kết nối với các cơ hội việc làm đầu tiên.

Phân hệ này bao gồm bốn nhóm chức năng chính:
1. **Quản lý Profile** — thông tin cá nhân, chuyên ngành, social links, avatar
2. **Quản lý Portfolio/Projects** — CRUD dự án thiết kế, upload media, quản lý trạng thái
3. **Hệ thống Buddy Feedback** — gửi portfolio để nhận review, theo dõi trạng thái, xem feedback
4. **Job Application** — xem danh sách việc làm phù hợp, ứng tuyển bằng portfolio, theo dõi lịch sử

Stack kỹ thuật: React + Vite + Tailwind CSS + shadcn/ui (Frontend), PostgreSQL (Database), RESTful API (Backend), Vercel (Deploy).

---

## Glossary

- **Mentee**: Sinh viên ngành thiết kế đã đăng ký tài khoản trên PortfolioTutTat.
- **Buddy**: Người dùng có vai trò mentor/reviewer, được phân công hoặc tự nguyện review portfolio của Mentee.
- **Profile**: Trang thông tin cá nhân của Mentee, bao gồm bio, avatar, chuyên ngành, social links và danh sách kỹ năng.
- **Project**: Một dự án thiết kế do Mentee tạo ra, bao gồm tiêu đề, mô tả, media và tag kỹ năng.
- **Portfolio**: Tập hợp các Project của một Mentee, được hiển thị công khai hoặc riêng tư.
- **Feedback_Request**: Yêu cầu review mà Mentee gửi tới Buddy cho một Project cụ thể.
- **Feedback**: Nhận xét, điểm số và ghi chú mà Buddy cung cấp cho một Feedback_Request.
- **Job**: Tin tuyển dụng được đăng bởi Company trên nền tảng, dành cho sinh viên/fresher ngành thiết kế.
- **Application**: Hồ sơ ứng tuyển mà Mentee gửi cho một Job, kèm theo Portfolio.
- **Profile_System**: Hệ thống con xử lý tạo, đọc, cập nhật thông tin Profile của Mentee.
- **Portfolio_System**: Hệ thống con xử lý CRUD Project và quản lý media.
- **Feedback_System**: Hệ thống con xử lý Feedback_Request và Feedback.
- **Job_System**: Hệ thống con xử lý danh sách Job và Application.
- **Media_Service**: Dịch vụ xử lý upload, lưu trữ và phân phát file media (hình ảnh, video).
- **Auth_Service**: Dịch vụ xác thực và phân quyền người dùng.
- **Notification_Service**: Dịch vụ gửi thông báo trong ứng dụng cho Mentee.
- **Draft**: Trạng thái Project chưa được công bố, chỉ Mentee sở hữu mới xem được.
- **Public**: Trạng thái Project đã được công bố, hiển thị cho tất cả người dùng.
- **Pending_Feedback**: Trạng thái Project đang chờ hoặc đang được Buddy review.
- **Chuyên ngành**: Lĩnh vực thiết kế chính của Mentee, gồm: Graphic Design, UI/UX, Multimedia, Motion Design.

---

## Requirements

### Requirement 1: Đăng ký và Khởi tạo Profile

**User Story:** As a sinh viên thiết kế, I want to tạo profile cá nhân sau khi đăng ký tài khoản, so that tôi có thể giới thiệu bản thân và bắt đầu xây dựng portfolio trên nền tảng.

#### Acceptance Criteria

1. WHEN a Mentee hoàn thành đăng ký tài khoản, THE Profile_System SHALL tạo một Profile mặc định liên kết với tài khoản đó với trạng thái chưa hoàn thiện.
2. WHEN a Mentee truy cập trang CreateProfilePage lần đầu, THE Profile_System SHALL hiển thị form nhập thông tin gồm: Full Name, Role, Skills (danh sách phân cách bởi dấu phẩy), Design Tools (multi-select), Interests (multi-select), và Bio (tùy chọn). IF form không thể tải do lỗi kỹ thuật, THEN THE Profile_System SHALL hiển thị thông báo lỗi và chặn truy cập cho đến khi form có thể hiển thị đúng.
3. WHEN a Mentee submit form CreateProfilePage với Full Name và Role hợp lệ, THE Profile_System SHALL lưu thông tin Profile và chuyển hướng Mentee tới DashBoardPage.
4. IF a Mentee submit form CreateProfilePage mà thiếu Full Name hoặc Role, THEN THE Profile_System SHALL hiển thị thông báo lỗi validation tại trường tương ứng và không lưu dữ liệu.
5. IF a Mentee submit form CreateProfilePage với dữ liệu không hợp lệ ở bất kỳ trường nào (kể cả khi Full Name và Role đã có), THEN THE Profile_System SHALL hiển thị thông báo lỗi tại trường vi phạm và không lưu dữ liệu.
5. THE Profile_System SHALL tính toán và lưu trữ phần trăm hoàn thiện Profile dựa trên số trường đã điền, cập nhật mỗi khi Profile được chỉnh sửa.

### Requirement 2: Xem và Cập nhật Profile

**User Story:** As a Mentee, I want to xem và chỉnh sửa thông tin profile của mình, so that tôi có thể cập nhật thông tin cá nhân, chuyên ngành và social links khi cần thiết.

#### Acceptance Criteria

1. WHEN a Mentee truy cập trang Profile của chính mình, THE Profile_System SHALL hiển thị đầy đủ: Full Name, Bio, Avatar, Chuyên ngành, danh sách Skills, danh sách Design Tools, và Social Links (Behance, LinkedIn, Instagram, GitHub).
2. WHEN a Mentee nhấn nút chỉnh sửa Profile, THE Profile_System SHALL hiển thị form chỉnh sửa với dữ liệu hiện tại được điền sẵn.
3. WHEN a Mentee submit form chỉnh sửa với dữ liệu hợp lệ, THE Profile_System SHALL lưu thay đổi và hiển thị thông báo thành công trong vòng 3 giây.
4. IF a Mentee nhập URL Social Link không đúng định dạng (không bắt đầu bằng https://), THEN THE Profile_System SHALL hiển thị thông báo lỗi validation tại trường đó và không lưu bất kỳ thay đổi nào trong form cho đến khi tất cả trường hợp lệ.
5. THE Profile_System SHALL cho phép Mentee chọn đúng một Chuyên ngành từ danh sách: Graphic Design, UI/UX, Multimedia, Motion Design.
6. THE Profile_System SHALL hiển thị phần trăm hoàn thiện Profile trên DashBoardPage, cập nhật theo thời gian thực khi Mentee thêm thông tin.

### Requirement 3: Upload và Quản lý Avatar

**User Story:** As a Mentee, I want to upload ảnh đại diện cho profile của mình, so that tôi có thể tạo ấn tượng chuyên nghiệp với Buddy và nhà tuyển dụng.

#### Acceptance Criteria

1. WHEN a Mentee chọn file ảnh để upload avatar, THE Media_Service SHALL chấp nhận các định dạng PNG, JPG, JPEG, WEBP có kích thước tối đa 5MB.
2. IF a Mentee upload file không phải định dạng ảnh hoặc vượt quá 5MB, THEN THE Media_Service SHALL từ chối file và hiển thị thông báo lỗi mô tả rõ lý do.
3. WHEN a Mentee upload avatar thành công, THE Media_Service SHALL lưu trữ file và trả về URL công khai, THE Profile_System SHALL cập nhật avatar URL trong Profile ngay lập tức.
4. WHILE a Mentee đang upload avatar, THE Profile_System SHALL hiển thị trạng thái loading và vô hiệu hóa nút upload để tránh upload trùng lặp.

### Requirement 4: Tạo Project mới

**User Story:** As a Mentee, I want to tạo và upload dự án thiết kế của mình, so that tôi có thể xây dựng portfolio và chia sẻ công việc với cộng đồng.

#### Acceptance Criteria

1. WHEN a Mentee truy cập PortfolioBuilderPage, THE Portfolio_System SHALL hiển thị form tạo Project gồm: Project Title (bắt buộc), Description (bắt buộc), Tags (danh sách kỹ năng phân cách bởi dấu phẩy), và khu vực upload media.
2. WHEN a Mentee kéo thả hoặc chọn file ảnh vào khu vực upload, THE Media_Service SHALL chấp nhận các định dạng PNG, JPG, JPEG, WEBP, GIF có kích thước tối đa 10MB mỗi file.
3. WHEN a Mentee upload media thành công, THE Portfolio_System SHALL hiển thị preview ảnh ngay lập tức trong giao diện và cho phép Mentee xóa từng ảnh trước khi lưu.
4. WHEN a Mentee nhấn "Save Project" với Project Title và ít nhất một media file hợp lệ, THE Portfolio_System SHALL lưu Project với trạng thái Draft và chuyển hướng tới PortfolioDetailPage của Project đó.
5. IF a Mentee nhấn "Save Project" mà thiếu Project Title, THEN THE Portfolio_System SHALL hiển thị thông báo lỗi validation và không lưu dữ liệu.
6. THE Portfolio_System SHALL cho phép Mentee nhập Tags dưới dạng chuỗi phân cách bởi dấu phẩy và tự động tách thành danh sách tag riêng biệt khi lưu.
7. WHEN a Mentee nhấn "Preview" trước khi lưu, THE Portfolio_System SHALL hiển thị bản xem trước Project trong modal hoặc tab mới mà không lưu dữ liệu.

### Requirement 5: Xem và Chỉnh sửa Project

**User Story:** As a Mentee, I want to xem chi tiết và chỉnh sửa các dự án đã tạo, so that tôi có thể cập nhật nội dung và quản lý portfolio của mình.

#### Acceptance Criteria

1. WHEN a Mentee truy cập PortfolioDetailPage của một Project, THE Portfolio_System SHALL hiển thị: tiêu đề, mô tả, danh sách media, tags, thông tin tác giả, lượt xem, lượt thích, và trạng thái Project.
2. WHEN a Mentee là chủ sở hữu Project và nhấn nút chỉnh sửa, THE Portfolio_System SHALL hiển thị form chỉnh sửa với dữ liệu hiện tại được điền sẵn.
3. WHEN a Mentee lưu chỉnh sửa Project với dữ liệu hợp lệ, THE Portfolio_System SHALL cập nhật Project và hiển thị thông báo thành công. IF a Mentee submit dữ liệu không hợp lệ khi chỉnh sửa Project, THEN THE Portfolio_System SHALL hiển thị thông báo lỗi tại trường vi phạm và không lưu dữ liệu.
4. THE Portfolio_System SHALL cho phép Mentee thêm hoặc xóa media files trong quá trình chỉnh sửa Project.
5. WHILE a Project có trạng thái Draft, THE Portfolio_System SHALL chỉ hiển thị Project đó cho Mentee sở hữu và không hiển thị trong danh sách công khai. THE Portfolio_System SHALL đảm bảo Mentee sở hữu luôn có thể truy cập Project Draft của mình.
6. WHILE a Project có trạng thái Public, THE Portfolio_System SHALL hiển thị Project trong danh sách portfolio công khai của Mentee và cho phép người dùng khác xem.

### Requirement 6: Quản lý Trạng thái Project

**User Story:** As a Mentee, I want to thay đổi trạng thái của dự án (Draft / Public / Pending Feedback), so that tôi có thể kiểm soát khả năng hiển thị và quy trình nhận feedback cho từng dự án.

#### Acceptance Criteria

1. THE Portfolio_System SHALL hỗ trợ ba trạng thái cho mỗi Project: Draft, Public, và Pending_Feedback.
2. WHEN a Mentee chuyển trạng thái Project từ Draft sang Public, THE Portfolio_System SHALL hiển thị Project trong danh sách portfolio công khai và cập nhật trạng thái ngay lập tức.
3. WHEN a Mentee gửi Feedback_Request cho một Project, THE Portfolio_System SHALL tự động chuyển trạng thái Project sang Pending_Feedback.
4. WHEN a Feedback_Request được Buddy đánh dấu Completed, THE Portfolio_System SHALL giữ nguyên trạng thái Project là Pending_Feedback cho đến khi Mentee chủ động thay đổi.
5. IF a Mentee cố gắng xóa một Project đang có Feedback_Request với trạng thái In_Review, THEN THE Portfolio_System SHALL hiển thị cảnh báo xác nhận và yêu cầu Mentee xác nhận trước khi xóa.
6. WHEN a Mentee xóa một Project, THE Portfolio_System SHALL xóa tất cả media liên quan khỏi Media_Service và xóa tất cả Feedback_Request liên quan. IF Media_Service tạm thời không khả dụng, THEN THE Portfolio_System SHALL chặn thao tác xóa Project và hiển thị thông báo lỗi cho đến khi Media_Service khả dụng và toàn bộ cleanup hoàn thành thành công.

### Requirement 7: Xem Danh sách Projects trên Dashboard

**User Story:** As a Mentee, I want to xem tổng quan các dự án của mình trên dashboard, so that tôi có thể nhanh chóng theo dõi portfolio và truy cập vào từng dự án.

#### Acceptance Criteria

1. WHEN a Mentee truy cập DashBoardPage, THE Portfolio_System SHALL hiển thị danh sách tối đa 3 Project gần nhất với thông tin: tiêu đề, chuyên mục, lượt thích, lượt xem.
2. WHEN a Mentee nhấn "View All" trên DashBoardPage, THE Portfolio_System SHALL chuyển hướng tới trang danh sách đầy đủ tất cả Projects của Mentee.
3. THE Portfolio_System SHALL hiển thị tổng số lượt xem và lượt thích tích lũy trên DashBoardPage dưới dạng thống kê.
4. WHEN a Mentee nhấn vào một Project trong danh sách, THE Portfolio_System SHALL chuyển hướng tới PortfolioDetailPage của Project đó.

### Requirement 8: Gửi Yêu cầu Feedback tới Buddy

**User Story:** As a Mentee, I want to gửi portfolio hoặc project của mình tới Buddy để nhận review, so that tôi có thể nhận được phản hồi chuyên môn và cải thiện chất lượng công việc.

#### Acceptance Criteria

1. WHEN a Mentee nhấn "Request Feedback" hoặc "Get Feedback" trên PortfolioDetailPage, THE Feedback_System SHALL hiển thị form gửi Feedback_Request cho phép Mentee chọn Project và nhập ghi chú tùy chọn cho Buddy.
2. WHEN a Mentee submit Feedback_Request hợp lệ, THE Feedback_System SHALL tạo Feedback_Request với trạng thái Pending, liên kết với Project được chọn, và thông báo cho Buddy được phân công.
3. IF a Mentee cố gắng gửi Feedback_Request cho một Project đang có Feedback_Request với trạng thái Pending hoặc In_Review, THEN THE Feedback_System SHALL hiển thị thông báo lỗi và không tạo Feedback_Request trùng lặp. Logic này áp dụng cho từng trạng thái riêng lẻ; nếu cả hai trạng thái cùng tồn tại do lỗi hệ thống, THE Feedback_System SHALL vẫn chặn tạo mới.
4. THE Feedback_System SHALL hỗ trợ ba trạng thái cho Feedback_Request: Pending (chờ Buddy nhận), In_Review (Buddy đang review), Completed (Buddy đã hoàn thành).
5. WHEN a Feedback_Request được tạo thành công, THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Buddy được phân công trong vòng 60 giây.

### Requirement 9: Theo dõi Trạng thái Feedback

**User Story:** As a Mentee, I want to theo dõi trạng thái các yêu cầu feedback đã gửi, so that tôi biết khi nào Buddy đang review và khi nào feedback đã sẵn sàng để xem.

#### Acceptance Criteria

1. WHEN a Mentee truy cập trang danh sách Feedback_Request, THE Feedback_System SHALL hiển thị tất cả Feedback_Request của Mentee với thông tin: tên Project, tên Buddy, ngày gửi, và trạng thái hiện tại.
2. WHEN trạng thái Feedback_Request thay đổi (Pending → In_Review hoặc In_Review → Completed), THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Mentee trong vòng 60 giây.
3. WHEN a Feedback_Request chuyển sang trạng thái Completed, THE Feedback_System SHALL hiển thị badge thông báo trên icon feedback trong navigation của Mentee.
4. THE Feedback_System SHALL cho phép Mentee lọc danh sách Feedback_Request theo trạng thái: All, Pending, In_Review, Completed.

### Requirement 10: Xem Feedback từ Buddy

**User Story:** As a Mentee, I want to xem chi tiết feedback mà Buddy đã cung cấp cho portfolio của mình, so that tôi có thể hiểu rõ điểm mạnh, điểm yếu và cải thiện công việc.

#### Acceptance Criteria

1. WHEN a Mentee truy cập MentorFeedbackPage của một Feedback_Request đã Completed, THE Feedback_System SHALL hiển thị: tên Buddy, vai trò Buddy, điểm số (1–5 sao), ngày feedback, nội dung nhận xét chi tiết, và danh sách gợi ý cải thiện. WHILE a Feedback_Request chưa ở trạng thái Completed, THE Feedback_System SHALL không hiển thị nội dung Feedback và chỉ hiển thị trạng thái hiện tại của yêu cầu.
2. THE Feedback_System SHALL hiển thị điểm trung bình tổng hợp từ tất cả Feedback đã nhận cho một Project, tính theo thang điểm 1–5 với độ chính xác một chữ số thập phân.
3. THE Feedback_System SHALL hiển thị tổng số lượt "Helpful" mà các Feedback nhận được từ cộng đồng.
4. WHEN a Mentee nhấn nút "Helpful" trên một Feedback, THE Feedback_System SHALL tăng số lượt Helpful của Feedback đó lên 1 và vô hiệu hóa nút để tránh vote trùng lặp từ cùng một Mentee.
5. WHEN a Mentee nhấn "Post Comment" với nội dung không rỗng trên MentorFeedbackPage, THE Feedback_System SHALL lưu comment của Mentee và hiển thị trong luồng thảo luận.
6. IF a Mentee nhấn "Post Comment" với nội dung rỗng, THEN THE Feedback_System SHALL không gửi comment và hiển thị thông báo yêu cầu nhập nội dung.
7. WHEN a Mentee nhấn "Request More Reviews" trên MentorFeedbackPage, THE Feedback_System SHALL chuyển hướng Mentee tới form tạo Feedback_Request mới cho Project đó.

### Requirement 11: Xem Danh sách Job phù hợp

**User Story:** As a Mentee, I want to xem danh sách việc làm phù hợp với kỹ năng và ngân sách của sinh viên, so that tôi có thể tìm kiếm cơ hội việc làm đầu tiên trong ngành thiết kế.

#### Acceptance Criteria

1. WHEN a Mentee truy cập JobListingPage, THE Job_System SHALL hiển thị danh sách Job với thông tin: tiêu đề, tên công ty, logo công ty, địa điểm, loại công việc, mức lương, ngày đăng, và danh sách kỹ năng yêu cầu.
2. THE Job_System SHALL hỗ trợ lọc Job theo loại công việc: All Types, Internship, Fresher, Freelance, Part-time.
3. WHEN a Mentee nhập từ khóa vào ô tìm kiếm, THE Job_System SHALL lọc danh sách Job theo tiêu đề hoặc tên công ty chứa từ khóa đó, cập nhật kết quả trong vòng 500ms.
4. WHEN a Mentee nhập địa điểm vào ô tìm kiếm địa điểm, THE Job_System SHALL lọc danh sách Job theo địa điểm tương ứng.
5. THE Job_System SHALL hiển thị tổng số Job phù hợp với bộ lọc hiện tại.
6. WHERE a Mentee đã hoàn thiện Profile với Chuyên ngành và Skills, THE Job_System SHALL hiển thị danh sách "Recommended Jobs" trên DashBoardPage gồm tối đa 3 Job phù hợp nhất với Chuyên ngành của Mentee. IF không có Job nào phù hợp, THEN THE Job_System SHALL hiển thị khu vực Recommended Jobs với thông báo "No recommended jobs found".

### Requirement 12: Xem Chi tiết Job

**User Story:** As a Mentee, I want to xem thông tin chi tiết của một tin tuyển dụng, so that tôi có thể đánh giá sự phù hợp trước khi quyết định ứng tuyển.

#### Acceptance Criteria

1. WHEN a Mentee nhấn vào một Job trong danh sách, THE Job_System SHALL chuyển hướng tới JobDetailPage hiển thị đầy đủ: tiêu đề, tên công ty, địa điểm, loại công việc, mức lương, mô tả vai trò, danh sách trách nhiệm, yêu cầu kỹ năng, và thông tin chi tiết công việc.
2. THE Job_System SHALL hiển thị nút "Apply for this Position" và nút "Bookmark" trên JobDetailPage.
3. WHEN a Mentee nhấn nút "Bookmark" trên JobDetailPage, THE Job_System SHALL lưu Job vào danh sách đã bookmark của Mentee và thay đổi trạng thái nút thành đã bookmark.

### Requirement 13: Ứng tuyển Job bằng Portfolio

**User Story:** As a Mentee, I want to ứng tuyển vào một vị trí công việc bằng cách sử dụng portfolio có sẵn trên nền tảng, so that tôi không cần chuẩn bị hồ sơ riêng và có thể ứng tuyển nhanh chóng.

#### Acceptance Criteria

1. WHEN a Mentee nhấn "Apply for this Position" hoặc "Apply Now" trên JobDetailPage, THE Job_System SHALL hiển thị dialog xác nhận cho phép Mentee chọn Portfolio (danh sách Project Public) để đính kèm vào Application.
2. WHEN a Mentee xác nhận ứng tuyển với Portfolio được chọn, THE Job_System SHALL tạo Application với trạng thái Submitted, liên kết với Job và Portfolio tương ứng, và hiển thị modal thành công.
3. IF a Mentee cố gắng ứng tuyển vào một Job mà Mentee đã có Application trước đó, THEN THE Job_System SHALL hiển thị thông báo lỗi và không tạo Application trùng lặp.
4. IF a Mentee chưa có Project nào với trạng thái Public khi cố gắng ứng tuyển, THEN THE Job_System SHALL hiển thị thông báo hướng dẫn Mentee publish ít nhất một Project trước khi ứng tuyển.
5. WHEN a Application được tạo thành công, THE Notification_Service SHALL gửi thông báo xác nhận trong ứng dụng tới Mentee trong vòng 60 giây.

### Requirement 14: Xem Lịch sử Ứng tuyển

**User Story:** As a Mentee, I want to xem lịch sử và trạng thái các đơn ứng tuyển đã gửi, so that tôi có thể theo dõi tiến trình tìm việc của mình.

#### Acceptance Criteria

1. WHEN a Mentee truy cập trang lịch sử ứng tuyển, THE Job_System SHALL hiển thị tất cả Application của Mentee với thông tin: tên Job, tên công ty, ngày ứng tuyển, Portfolio đã đính kèm, và trạng thái Application.
2. THE Job_System SHALL hỗ trợ bốn trạng thái Application: Submitted (đã gửi), Under_Review (đang xem xét), Accepted (được chấp nhận), Rejected (bị từ chối).
3. WHEN trạng thái Application thay đổi, THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Mentee. IF thông báo bị trễ do tải hệ thống hoặc sự cố mạng, THE Notification_Service SHALL vẫn gửi thông báo ngay khi có thể mà không hủy bỏ.
4. THE Job_System SHALL hiển thị tổng số Application trên DashBoardPage dưới dạng thống kê.
5. WHEN a Mentee nhấn vào một Application trong lịch sử, THE Job_System SHALL chuyển hướng tới JobDetailPage của Job tương ứng.

### Requirement 15: Thống kê và Activity Feed trên Dashboard

**User Story:** As a Mentee, I want to xem tổng quan hoạt động và thống kê của mình trên dashboard, so that tôi có thể theo dõi sự phát triển của portfolio và tình trạng tìm việc.

#### Acceptance Criteria

1. WHEN a Mentee truy cập DashBoardPage, THE Portfolio_System SHALL hiển thị ba chỉ số thống kê: tổng lượt xem Profile, tổng lượt thích Portfolio, và tổng số Application đã gửi.
2. WHEN a Mentee truy cập DashBoardPage, THE Portfolio_System SHALL hiển thị danh sách Recent Activity gồm tối đa 10 hoạt động gần nhất, bao gồm: lượt thích mới trên Project, Application mới được gửi, Project mới được upload, và Feedback mới nhận được. THE Portfolio_System SHALL giới hạn nghiêm ngặt ở 10 mục, không hiển thị thêm dù có nhiều hoạt động hơn.
3. THE Portfolio_System SHALL hiển thị thanh tiến trình hoàn thiện Profile với phần trăm cụ thể và gợi ý bước tiếp theo để đạt 100%.
4. WHEN a Mentee nhấn vào một mục trong Recent Activity, THE Portfolio_System SHALL chuyển hướng tới trang liên quan (Project, Job, hoặc Feedback tương ứng).

---

## Database Schema Recommendations

### Lý do chọn PostgreSQL

PostgreSQL được khuyến nghị cho PortfolioTutTat vì:
- Dữ liệu có cấu trúc rõ ràng với quan hệ chặt chẽ (User → Profile → Project → Feedback)
- Hỗ trợ JSONB cho các trường linh hoạt (social_links, tags, skills)
- ACID compliance đảm bảo tính toàn vẹn dữ liệu cho Application và Feedback
- Tích hợp tốt với các ORM phổ biến (Prisma, TypeORM, Drizzle)
- Hỗ trợ tốt trên các nền tảng cloud (Supabase, Neon, Railway)

### Schema

```sql
-- Users (Auth)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('mentee', 'buddy', 'company', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Mentee Profiles
CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name         VARCHAR(255) NOT NULL,
  role_title        VARCHAR(255),                          -- e.g. "UI/UX Designer"
  bio               TEXT,
  avatar_url        VARCHAR(500),
  major             VARCHAR(50) CHECK (major IN (
                      'Graphic Design', 'UI/UX', 'Multimedia', 'Motion Design'
                    )),
  skills            TEXT[],                                -- e.g. ['UI Design', 'Figma']
  design_tools      TEXT[],                                -- e.g. ['Figma', 'Photoshop']
  interests         TEXT[],
  social_links      JSONB DEFAULT '{}',                    -- {behance, linkedin, instagram, github}
  completion_pct    SMALLINT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  tags        TEXT[],
  status      VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'public', 'pending_feedback')),
  view_count  INTEGER DEFAULT 0,
  like_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Project Media
CREATE TABLE project_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url         VARCHAR(500) NOT NULL,
  media_type  VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name   VARCHAR(255),
  file_size   INTEGER,                                     -- bytes
  sort_order  SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Requests
CREATE TABLE feedback_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentee_id   UUID NOT NULL REFERENCES profiles(id),
  buddy_id    UUID REFERENCES profiles(id),               -- NULL until assigned
  note        TEXT,                                        -- Mentee's note to Buddy
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_review', 'completed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Feedbacks (from Buddy)
CREATE TABLE feedbacks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_request_id UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  buddy_id            UUID NOT NULL REFERENCES profiles(id),
  rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT NOT NULL,
  suggestions         TEXT[],                              -- list of improvement suggestions
  helpful_count       INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Comments (Mentee replies)
CREATE TABLE feedback_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Helpful Votes
CREATE TABLE feedback_helpful_votes (
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (feedback_id, user_id)
);

-- Jobs
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  responsibilities TEXT[],
  requirements    TEXT[],
  required_skills TEXT[],
  job_type        VARCHAR(20) NOT NULL CHECK (job_type IN (
                    'internship', 'fresher', 'freelance', 'part-time', 'full-time'
                  )),
  location        VARCHAR(255),
  is_remote       BOOLEAN DEFAULT FALSE,
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  experience_level VARCHAR(20) DEFAULT 'entry',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  mentee_id     UUID NOT NULL REFERENCES profiles(id),
  portfolio_ids UUID[],                                    -- selected project IDs
  status        VARCHAR(20) NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, mentee_id)
);

-- Bookmarked Jobs
CREATE TABLE job_bookmarks (
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  mentee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (job_id, mentee_id)
);

-- Notifications
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,                        -- e.g. 'feedback_completed', 'application_status'
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  entity_type VARCHAR(50),                                 -- 'project', 'job', 'feedback'
  entity_id   UUID,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoint List

Tất cả endpoints đều có prefix `/api/v1`. Các endpoint yêu cầu xác thực sử dụng JWT Bearer token trong header `Authorization`.

### Authentication

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/auth/login` | Đăng nhập, trả về JWT | ❌ |
| POST | `/auth/logout` | Đăng xuất, vô hiệu hóa token | ✅ |
| POST | `/auth/refresh` | Làm mới access token | ✅ |

### Profile

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/profiles/me` | Lấy profile của Mentee đang đăng nhập | ✅ |
| PUT | `/profiles/me` | Cập nhật profile (full_name, bio, major, skills, tools, social_links) | ✅ |
| POST | `/profiles/me/avatar` | Upload avatar (multipart/form-data) | ✅ |
| GET | `/profiles/:id` | Xem profile công khai của một Mentee | ❌ |
| GET | `/profiles/me/stats` | Lấy thống kê: tổng view, like, application count | ✅ |

### Projects

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/projects` | Danh sách tất cả Project của Mentee đang đăng nhập | ✅ |
| POST | `/projects` | Tạo Project mới (title, description, tags, status) | ✅ |
| GET | `/projects/:id` | Xem chi tiết một Project | ✅/❌* |
| PUT | `/projects/:id` | Cập nhật Project (title, description, tags) | ✅ |
| DELETE | `/projects/:id` | Xóa Project và media liên quan | ✅ |
| PATCH | `/projects/:id/status` | Thay đổi trạng thái Project (draft/public/pending_feedback) | ✅ |
| GET | `/projects/public/:menteeId` | Danh sách Project Public của một Mentee | ❌ |

> *Public projects có thể xem không cần auth; Draft chỉ owner mới xem được.

### Project Media

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/projects/:id/media` | Upload media file(s) cho Project (multipart/form-data) | ✅ |
| DELETE | `/projects/:id/media/:mediaId` | Xóa một media file khỏi Project | ✅ |
| PATCH | `/projects/:id/media/reorder` | Sắp xếp lại thứ tự media (body: [{id, sort_order}]) | ✅ |

### Feedback Requests

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/feedback-requests` | Danh sách Feedback_Request của Mentee (filter: status) | ✅ |
| POST | `/feedback-requests` | Tạo Feedback_Request mới (project_id, note) | ✅ |
| GET | `/feedback-requests/:id` | Xem chi tiết một Feedback_Request | ✅ |
| PATCH | `/feedback-requests/:id/status` | Cập nhật trạng thái (dành cho Buddy) | ✅ |

### Feedbacks

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/feedback-requests/:id/feedbacks` | Danh sách Feedback của một Feedback_Request | ✅ |
| POST | `/feedback-requests/:id/feedbacks` | Buddy tạo Feedback (rating, comment, suggestions) | ✅ |
| POST | `/feedbacks/:id/helpful` | Vote "Helpful" cho một Feedback | ✅ |
| DELETE | `/feedbacks/:id/helpful` | Bỏ vote "Helpful" | ✅ |
| GET | `/projects/:id/feedback-summary` | Tổng hợp feedback: avg rating, total reviews, helpful votes | ✅ |

### Feedback Comments

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/feedbacks/:id/comments` | Danh sách comment của một Feedback | ✅ |
| POST | `/feedbacks/:id/comments` | Đăng comment mới (content) | ✅ |
| DELETE | `/feedbacks/:id/comments/:commentId` | Xóa comment (chỉ tác giả) | ✅ |

### Jobs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/jobs` | Danh sách Job (filter: type, location, keyword, page, limit) | ❌ |
| GET | `/jobs/:id` | Xem chi tiết một Job | ❌ |
| GET | `/jobs/recommended` | Danh sách Job gợi ý dựa trên Profile Mentee (tối đa 10) | ✅ |
| POST | `/jobs/:id/bookmark` | Bookmark một Job | ✅ |
| DELETE | `/jobs/:id/bookmark` | Bỏ bookmark một Job | ✅ |
| GET | `/jobs/bookmarked` | Danh sách Job đã bookmark | ✅ |

### Applications

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/applications` | Lịch sử ứng tuyển của Mentee (filter: status) | ✅ |
| POST | `/applications` | Tạo Application mới (job_id, portfolio_ids) | ✅ |
| GET | `/applications/:id` | Xem chi tiết một Application | ✅ |
| PATCH | `/applications/:id/status` | Cập nhật trạng thái Application (dành cho Company) | ✅ |

### Notifications

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/notifications` | Danh sách thông báo của người dùng (filter: is_read) | ✅ |
| PATCH | `/notifications/:id/read` | Đánh dấu một thông báo đã đọc | ✅ |
| PATCH | `/notifications/read-all` | Đánh dấu tất cả thông báo đã đọc | ✅ |
| GET | `/notifications/unread-count` | Số lượng thông báo chưa đọc | ✅ |

---

*Requirements document được tạo cho phân hệ Mentee Subsystem của PortfolioTutTat. Phiên bản 1.0.*
