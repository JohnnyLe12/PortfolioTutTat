# Requirements Document

## Introduction

Phân hệ Multi-Role Ecosystem là bản mở rộng quy mô lớn của nền tảng **PortfolioTutTat** — chuyển từ hệ thống chỉ dành cho Mentee sang hệ sinh thái đa vai trò hoàn chỉnh. Hệ thống hiện tại đã triển khai xong toàn bộ Mentee Subsystem (Profile, Portfolio, Feedback, Job Application). Phân hệ mới bổ sung ba vai trò còn lại: **Buddy** (người review portfolio), **Company** (nhà tuyển dụng), và **Admin** (quản trị viên).

Phân hệ này bao gồm năm nhóm chức năng chính:
1. **Authentication & Multi-Role Signup** — mở rộng SignUpPage hỗ trợ chọn vai trò, redirect logic theo role
2. **Buddy Profile Management** — tạo và quản lý BuddyProfile riêng biệt
3. **Company Profile Management** — tạo và quản lý CompanyProfile với tabs: About, Team, Jobs, Metadata
4. **Buddy Subsystem** — Dashboard, Browse Portfolios, Feedback Workspace, Direct Messaging
5. **Company Subsystem** — Dashboard, Job Creation, Applicants Tracker
6. **Mentee Enhancements** — Buddy Chat Integration, Advanced Job Search UI

Stack kỹ thuật: TypeScript, Next.js App Router, Prisma ORM, PostgreSQL, JWT + bcrypt, Vercel Blob, Vitest + fast-check (Backend) + React + Vite + Tailwind CSS + shadcn/ui + Radix UI + Lucide icons + react-router-dom (Frontend).

---

## Glossary

- **Mentee**: Sinh viên ngành thiết kế đã đăng ký tài khoản trên PortfolioTutTat, vai trò hiện tại đã hoàn thiện đầy đủ.
- **Buddy**: Người dùng có vai trò mentor/reviewer, chủ động tìm kiếm và review portfolio của Mentee, cung cấp feedback chuyên môn.
- **Company**: Tổ chức/doanh nghiệp đăng tuyển dụng trên nền tảng, quản lý job postings và theo dõi ứng viên.
- **Admin**: Quản trị viên hệ thống, không cần tạo profile, có quyền quản lý toàn bộ nền tảng.
- **BuddyProfile**: Hồ sơ cá nhân của Buddy, chứa thông tin chuyên môn, skills, và design tools để matching với Mentee.
- **CompanyProfile**: Hồ sơ công ty, bao gồm thông tin doanh nghiệp, team members, metadata và liên kết tới jobs đã đăng.
- **Message**: Tin nhắn trực tiếp (Direct Message) giữa Buddy và Mentee trong ngữ cảnh review portfolio.
- **Feedback_Workspace**: Không gian làm việc của Buddy để review các portfolio đã bookmark/lưu.
- **Portfolio_Bookmark**: Portfolio mà Buddy đã lưu vào danh sách review của mình.
- **Applicant_Tracker**: Công cụ của Company để theo dõi ứng viên theo từng job posting.
- **Auth_System**: Hệ thống xác thực và phân quyền người dùng, mở rộng hỗ trợ multi-role signup.
- **Buddy_System**: Hệ thống con xử lý toàn bộ logic nghiệp vụ của vai trò Buddy.
- **Company_System**: Hệ thống con xử lý toàn bộ logic nghiệp vụ của vai trò Company.
- **Messaging_System**: Hệ thống con xử lý Direct Messages giữa Buddy và Mentee.
- **SignUpPage**: Trang đăng ký tài khoản mới với bước chọn vai trò.
- **CreateBuddyProfilePage**: Trang tạo hồ sơ Buddy sau khi đăng ký.
- **CreateCompanyProfilePage**: Trang tạo hồ sơ Company sau khi đăng ký.
- **Employment_Type**: Loại hình công việc: Full-time, Part-time, Internship, Contract, Freelance, Temporary, Volunteer.
- **Seniority_Level**: Cấp bậc kinh nghiệm: Internship, Entry, Assistant, Mid-Senior, Director, Executive.
- **CompletionPct**: Phần trăm hoàn thiện hồ sơ, tính dựa trên số trường đã điền.

---

## Requirements

### Requirement 1: Mở rộng Đăng ký Multi-Role

**User Story:** As a người dùng mới, I want to chọn vai trò (Mentee / Buddy / Company / Admin) khi đăng ký tài khoản, so that hệ thống có thể điều hướng tôi tới luồng phù hợp với vai trò của mình.

#### Acceptance Criteria

1. WHEN a người dùng truy cập SignUpPage, THE Auth_System SHALL hiển thị bước chọn vai trò với đúng bốn lựa chọn: Mentee, Buddy, Company, Admin, trong đó người dùng chỉ được chọn duy nhất một vai trò trước khi tiếp tục nhập email và password.
2. WHEN a người dùng submit form đăng ký hợp lệ (email, password, vai trò) với vai trò MENTEE, THE Auth_System SHALL tạo tài khoản và chuyển hướng tới CreateProfilePage trong vòng 3 giây.
3. WHEN a người dùng submit form đăng ký hợp lệ với vai trò BUDDY, THE Auth_System SHALL tạo tài khoản và chuyển hướng tới CreateBuddyProfilePage trong vòng 3 giây.
4. WHEN a người dùng submit form đăng ký hợp lệ với vai trò COMPANY, THE Auth_System SHALL tạo tài khoản và chuyển hướng tới CreateCompanyProfilePage trong vòng 3 giây.
5. WHEN a người dùng submit form đăng ký hợp lệ với vai trò ADMIN, THE Auth_System SHALL tạo tài khoản, bỏ qua bước tạo profile, và chuyển hướng trực tiếp tới Admin Dashboard trong vòng 3 giây.
6. IF a người dùng submit form đăng ký mà chưa chọn vai trò, THEN THE Auth_System SHALL hiển thị thông báo lỗi inline tại vị trí chọn vai trò, chỉ rõ rằng phải chọn một vai trò, và không tạo tài khoản.
7. THE Auth_System SHALL lưu vai trò đã chọn vào trường role của User record trong database khi tạo tài khoản thành công; giá trị role phải thuộc tập hợp {mentee, buddy, company, admin}.
8. IF vai trò được gửi lên không thuộc tập hợp {mentee, buddy, company, admin}, THEN THE Auth_System SHALL từ chối yêu cầu đăng ký, không tạo tài khoản, và trả về thông báo lỗi chỉ rõ vai trò không hợp lệ.
9. IF a người dùng chọn vai trò ADMIN khi đăng ký, THEN THE Auth_System SHALL yêu cầu xác thực bổ sung (mã mời hoặc phê duyệt từ Admin hiện tại) trước khi cho phép tạo tài khoản với vai trò Admin.

### Requirement 2: Tạo và Quản lý BuddyProfile

**User Story:** As a Buddy, I want to tạo và quản lý hồ sơ cá nhân chuyên môn của mình, so that Mentees có thể thấy năng lực và lĩnh vực chuyên môn của tôi khi tìm kiếm reviewer.

#### Acceptance Criteria

1. WHEN a Buddy truy cập CreateBuddyProfilePage lần đầu, THE Buddy_System SHALL hiển thị form nhập thông tin gồm: Full Name (bắt buộc, tối đa 255 ký tự), Role Title (bắt buộc, tối đa 255 ký tự), Bio (tùy chọn, tối đa 2000 ký tự), Avatar URL (tùy chọn, tối đa 500 ký tự), Major (single-select từ danh sách Chuyên ngành), Skills (multi-input, tối đa 20 items, mỗi item tối đa 100 ký tự), Design Tools (multi-select, tối đa 20 items), Interests (multi-select, tối đa 20 items), và Social Links (Behance, LinkedIn, Instagram, GitHub — mỗi URL tối đa 500 ký tự).
2. WHEN a Buddy submit form CreateBuddyProfilePage với Full Name và Role Title có ít nhất 1 ký tự không phải khoảng trắng và không vượt quá 255 ký tự, THE Buddy_System SHALL tạo BuddyProfile liên kết với User account và chuyển hướng tới Buddy Dashboard.
3. IF a Buddy submit form mà Full Name hoặc Role Title trống hoặc chỉ chứa khoảng trắng, THEN THE Buddy_System SHALL hiển thị thông báo lỗi validation tại trường tương ứng và không lưu dữ liệu.
4. THE Buddy_System SHALL tính toán và lưu trữ CompletionPct theo công thức: (số trường đã điền / 9) × 100, làm tròn xuống thành số nguyên. Một trường được coi là "đã điền" khi: trường chuỗi (fullName, roleTitle, bio, avatarUrl) có ít nhất 1 ký tự không phải khoảng trắng; trường mảng (skills, designTools, interests) có ít nhất 1 phần tử; trường enum (major) có giá trị được chọn; trường JSON socialLinks có ít nhất 1 URL hợp lệ. CompletionPct được cập nhật mỗi khi BuddyProfile được tạo hoặc chỉnh sửa.
5. WHEN a Buddy truy cập trang chỉnh sửa BuddyProfile, THE Buddy_System SHALL hiển thị form với dữ liệu hiện tại được điền sẵn và cho phép cập nhật tất cả các trường.
6. WHEN a Buddy submit form chỉnh sửa với dữ liệu hợp lệ (Full Name và Role Title có ít nhất 1 ký tự không phải khoảng trắng, tất cả URL Social Links bắt đầu bằng "https://" hoặc để trống), THE Buddy_System SHALL lưu thay đổi, tính lại CompletionPct, và hiển thị thông báo thành công.
7. IF a Buddy nhập URL Social Link không đúng định dạng (không rỗng và không bắt đầu bằng "https://"), THEN THE Buddy_System SHALL hiển thị thông báo lỗi validation tại trường đó và không lưu thay đổi.
8. IF a Buddy đã có BuddyProfile và truy cập CreateBuddyProfilePage, THEN THE Buddy_System SHALL chuyển hướng Buddy tới trang chỉnh sửa BuddyProfile hiện tại thay vì hiển thị form tạo mới.
9. IF a Buddy submit form mà bất kỳ trường nào vượt quá giới hạn ký tự cho phép (Full Name hoặc Role Title > 255, Bio > 2000, URL > 500, Skill item > 100 ký tự) hoặc trường mảng vượt quá 20 items, THEN THE Buddy_System SHALL hiển thị thông báo lỗi validation tại trường tương ứng và không lưu dữ liệu.

### Requirement 3: Tạo và Quản lý CompanyProfile

**User Story:** As a Company, I want to tạo hồ sơ công ty hoàn chỉnh với thông tin doanh nghiệp, team members, và metadata, so that Mentees có thể tìm hiểu về công ty trước khi ứng tuyển.

#### Acceptance Criteria

1. WHEN a Company truy cập CreateCompanyProfilePage lần đầu, THE Company_System SHALL hiển thị form nhập thông tin gồm bốn sections: About (Company Name bắt buộc, Summary, Products/Services, Website URL, HR Contact Email, HR Contact Phone), Team (danh sách members với Name và Role), Jobs (tự động liên kết từ jobs đã đăng), và Metadata (Employee Count, Office Address, Reference Links).
2. WHEN a Company submit form CreateCompanyProfilePage với Company Name hợp lệ, THE Company_System SHALL tạo CompanyProfile liên kết với User account và chuyển hướng tới Company Dashboard.
3. IF a Company submit form mà thiếu Company Name, THEN THE Company_System SHALL hiển thị thông báo lỗi validation và không lưu dữ liệu.
4. THE Company_System SHALL cho phép Company thêm, sửa, và xóa Team Members trong CompanyProfile. Mỗi Team Member gồm: Name (bắt buộc), Role (bắt buộc), và Avatar URL (tùy chọn).
5. WHEN a Company truy cập trang chỉnh sửa CompanyProfile, THE Company_System SHALL hiển thị form với dữ liệu hiện tại được điền sẵn theo bốn tabs: About, Team, Jobs, Metadata.
6. WHEN a Company cập nhật bất kỳ section nào với dữ liệu hợp lệ, THE Company_System SHALL lưu thay đổi và hiển thị thông báo thành công.
7. THE Company_System SHALL tự động hiển thị danh sách Jobs đã đăng bởi Company trong tab Jobs của CompanyProfile, liên kết trực tiếp tới Job detail.
8. IF a Company nhập Website URL không đúng định dạng (không bắt đầu bằng https://), THEN THE Company_System SHALL hiển thị thông báo lỗi validation tại trường đó.

### Requirement 4: Buddy Dashboard

**User Story:** As a Buddy, I want to xem tổng quan hoạt động review của mình trên dashboard, so that tôi có thể theo dõi hiệu suất và các items cần xử lý.

#### Acceptance Criteria

1. WHEN a Buddy truy cập Buddy Dashboard, THE Buddy_System SHALL hiển thị bốn chỉ số thống kê: tổng số FeedbackRequests có trạng thái Completed được assign cho Buddy (reviews đã hoàn thành), số FeedbackRequests có trạng thái Pending được assign cho Buddy (items chờ xử lý), số conversations có ít nhất một Message được gửi hoặc nhận trong 7 ngày gần nhất (active messages), và điểm trung bình helpful rating.
2. IF tổng số Feedback mà Buddy đã cung cấp lớn hơn 0, THEN THE Buddy_System SHALL tính điểm trung bình helpful rating bằng tổng số lượt Helpful vote chia cho tổng số Feedback đã cung cấp, làm tròn tới một chữ số thập phân.
3. IF tổng số Feedback mà Buddy đã cung cấp bằng 0, THEN THE Buddy_System SHALL hiển thị điểm trung bình helpful rating là 0.0.
4. WHEN a Buddy tải hoặc tải lại trang Buddy Dashboard, THE Buddy_System SHALL truy vấn dữ liệu mới nhất từ database và hiển thị số liệu thống kê phản ánh trạng thái hiện tại tại thời điểm tải trang.
5. THE Buddy_System SHALL hiển thị danh sách tối đa 5 Feedback_Requests gần nhất (sắp xếp theo ngày assign giảm dần) được assign cho Buddy, mỗi item bao gồm: tên Project, trạng thái hiện tại của FeedbackRequest (Pending, In_Review, hoặc Completed), và ngày được assign.

### Requirement 5: Buddy Browse Portfolios

**User Story:** As a Buddy, I want to khám phá các portfolios/projects của Mentee đang chờ feedback, so that tôi có thể chọn và review những portfolio phù hợp với chuyên môn của mình.

#### Acceptance Criteria

1. WHEN a Buddy truy cập trang Browse Portfolios, THE Buddy_System SHALL hiển thị danh sách tối đa 20 Projects mỗi trang của Mentee có trạng thái pending_feedback, bao gồm: tiêu đề, mô tả ngắn (tối đa 150 ký tự, cắt ngắn nếu vượt quá), tags, tên Mentee, và ngày gửi yêu cầu, sắp xếp theo ngày gửi yêu cầu mới nhất trước khi áp dụng ưu tiên skill matching.
2. THE Buddy_System SHALL sắp xếp portfolios giảm dần theo số lượng tags/skills trùng khớp với Skills và Design Tools trong BuddyProfile của Buddy, đưa portfolios có nhiều trùng khớp nhất lên đầu danh sách; portfolios có cùng số lượng trùng khớp được sắp xếp theo ngày gửi yêu cầu mới nhất.
3. WHEN a Buddy nhấn "Save" hoặc "Bookmark" trên một portfolio, THE Buddy_System SHALL lưu portfolio vào danh sách review (Portfolio_Bookmark) của Buddy và hiển thị thông báo xác nhận.
4. IF a Buddy cố gắng bookmark một portfolio đã có trong danh sách review, THEN THE Buddy_System SHALL hiển thị thông báo rằng portfolio đã được bookmark và không tạo bản ghi trùng lặp.
5. THE Buddy_System SHALL cho phép Buddy lọc portfolios theo tags, chuyên ngành (Major) của Mentee, hoặc kết hợp cả hai; khi nhiều bộ lọc được áp dụng đồng thời, kết quả hiển thị là intersection (AND logic) của tất cả bộ lọc đang active.
6. WHEN a Buddy nhấn vào một portfolio trong danh sách, THE Buddy_System SHALL hiển thị chi tiết Project bao gồm tất cả media, description đầy đủ, và tags.
7. IF không có portfolio nào có trạng thái pending_feedback hoặc không có kết quả nào phù hợp với bộ lọc hiện tại, THEN THE Buddy_System SHALL hiển thị thông báo trống cho biết không có portfolio nào khả dụng và gợi ý Buddy thử thay đổi bộ lọc.
8. IF việc tải danh sách portfolios thất bại do lỗi hệ thống, THEN THE Buddy_System SHALL hiển thị thông báo lỗi và cung cấp tùy chọn thử lại.

### Requirement 6: Buddy Feedback Workspace và Direct Messaging

**User Story:** As a Buddy, I want to quản lý danh sách portfolios đã lưu và nhắn tin trực tiếp với Mentee trong quá trình review, so that tôi có thể cung cấp feedback hiệu quả và giao tiếp rõ ràng.

#### Acceptance Criteria

1. WHEN a Buddy truy cập Feedback Workspace, THE Buddy_System SHALL hiển thị danh sách tất cả portfolios đã bookmark với thông tin: tên Project, tên Mentee, trạng thái review (Not Started, In Progress, Completed), và ngày bookmark, sắp xếp theo ngày bookmark mới nhất trước và phân trang tối đa 20 items mỗi trang.
2. WHEN a Buddy chọn một portfolio có trạng thái Not Started trong Feedback Workspace để bắt đầu review, THE Buddy_System SHALL cập nhật trạng thái FeedbackRequest liên quan sang In_Review, và THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Mentee trong vòng 60 giây.
3. WHILE a FeedbackRequest đang ở trạng thái In_Review, THE Messaging_System SHALL hiển thị giao diện chat 1-on-1 giữa Buddy và Mentee trong Feedback Workspace, liên kết với portfolio đang review.
4. WHEN a Buddy gửi tin nhắn trong chat với nội dung từ 1 đến 2000 ký tự (không tính whitespace đầu/cuối), THE Messaging_System SHALL lưu Message với senderId, receiverId, content, portfolioContextId, và createdAt, và hiển thị tin nhắn cho cả hai bên ngay lập tức.
5. WHEN a Buddy đánh dấu review là Completed cho một FeedbackRequest đang ở trạng thái In_Review, THE Buddy_System SHALL cập nhật trạng thái FeedbackRequest sang Completed, đánh dấu portfolio là approved, và THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Mentee trong vòng 60 giây.
6. IF a Buddy cố gắng gửi tin nhắn rỗng hoặc chỉ chứa whitespace, THEN THE Messaging_System SHALL không gửi tin nhắn và hiển thị thông báo yêu cầu nhập nội dung.
7. WHEN a Buddy hoặc Mentee mở giao diện chat của một portfolio, THE Messaging_System SHALL hiển thị tối đa 50 tin nhắn gần nhất theo thứ tự thời gian (cũ nhất trước) và cho phép tải thêm tin nhắn cũ hơn.
8. IF a Buddy cố gắng đánh dấu Completed cho một FeedbackRequest không ở trạng thái In_Review, THEN THE Buddy_System SHALL không thay đổi trạng thái và hiển thị thông báo lỗi cho biết review phải ở trạng thái In_Review trước khi hoàn thành.
9. IF a Buddy gửi tin nhắn vượt quá 2000 ký tự, THEN THE Messaging_System SHALL không gửi tin nhắn và hiển thị thông báo cho biết nội dung vượt quá giới hạn cho phép.

### Requirement 7: Company Dashboard

**User Story:** As a Company, I want to xem tổng quan hoạt động tuyển dụng trên dashboard, so that tôi có thể theo dõi tình hình các job postings và ứng viên.

#### Acceptance Criteria

1. WHEN a Company truy cập Company Dashboard, THE Company_System SHALL hiển thị ba chỉ số thống kê: tổng số jobs có trạng thái isActive=true thuộc sở hữu của Company, tổng số applications đã nhận trên tất cả jobs (bao gồm cả active và inactive jobs) của Company, và số applicants mới trong tuần hiện tại.
2. THE Company_System SHALL tính số applicants mới trong tuần dựa trên các Applications có createdAt trong 7 ngày gần nhất tính từ thời điểm hiện tại, thuộc tất cả jobs của Company.
3. WHEN a Company truy cập Company Dashboard, THE Company_System SHALL tính toán và hiển thị số liệu thống kê dựa trên dữ liệu hiện tại tại thời điểm trang được tải, đảm bảo các chỉ số phản ánh trạng thái mới nhất.
4. THE Company_System SHALL hiển thị danh sách tối đa 5 jobs của Company được sắp xếp theo createdAt giảm dần (mới nhất trước), mỗi job hiển thị title và tổng số applications đã nhận cho job đó.
5. IF a Company chưa có job nào hoặc chưa nhận application nào, THEN THE Company_System SHALL hiển thị giá trị 0 cho các chỉ số thống kê tương ứng và hiển thị danh sách jobs trống.

### Requirement 8: Job Creation và Posting

**User Story:** As a Company, I want to tạo và đăng tin tuyển dụng chi tiết, so that tôi có thể thu hút ứng viên phù hợp từ cộng đồng Mentees.

#### Acceptance Criteria

1. WHEN a Company truy cập trang tạo Job mới, THE Company_System SHALL hiển thị form với các trường: Title (bắt buộc, tối đa 255 ký tự), Job Description (bắt buộc, tối đa 5000 ký tự), Salary Range gồm Min và Max (per month hoặc per year, giá trị từ 0 đến 999,999,999), Number of Open Slots (bắt buộc, số nguyên dương từ 1 đến 1000), Location/Office Address (tối đa 500 ký tự), Employment Type (single-select), Seniority Level (single-select), Minimum Years of Experience (số nguyên không âm, từ 0 đến 50), Required Skills (multi-input, tối đa 20 skills, mỗi skill tối đa 100 ký tự), và Management Requirements.
2. THE Company_System SHALL hỗ trợ bảy Employment Types: Full-time, Part-time, Internship, Contract, Freelance, Temporary, Volunteer.
3. THE Company_System SHALL hỗ trợ sáu Seniority Levels: Internship, Entry, Assistant, Mid-Senior, Director, Executive.
4. WHEN a Company bật toggle Management Requirements, THE Company_System SHALL hiển thị trường bổ sung "Minimum Managed Employees" (số nguyên dương từ 1 đến 10000) và yêu cầu Company nhập giá trị.
5. WHEN a Company submit form tạo Job với Title (1–255 ký tự), Job Description (1–5000 ký tự), và Number of Open Slots (1–1000) hợp lệ, THE Company_System SHALL tạo Job với trạng thái active và hiển thị thông báo thành công.
6. IF a Company submit form mà thiếu Title, Job Description, hoặc Number of Open Slots, THEN THE Company_System SHALL hiển thị thông báo lỗi validation tại trường tương ứng và không tạo Job.
7. IF a Company nhập Salary Min lớn hơn Salary Max, THEN THE Company_System SHALL hiển thị thông báo lỗi validation tại trường Salary Range và không tạo Job.
8. WHEN a Job được tạo thành công, THE Company_System SHALL tự động hiển thị Job trong tab Jobs của CompanyProfile và trong danh sách Job công khai.
9. IF a Company chỉ nhập Salary Min hoặc chỉ nhập Salary Max (một trong hai trường trống), THEN THE Company_System SHALL chấp nhận giá trị đã nhập và tạo Job với salary range mở (không yêu cầu cả hai trường phải có giá trị đồng thời).
10. IF a Company nhập Number of Open Slots là số không phải số nguyên dương (nhỏ hơn 1, số thập phân, hoặc ký tự không phải số), THEN THE Company_System SHALL hiển thị thông báo lỗi validation tại trường Number of Open Slots và không tạo Job.

### Requirement 9: Company Applicants Tracker

**User Story:** As a Company, I want to xem và quản lý danh sách ứng viên cho từng job posting, so that tôi có thể đánh giá hồ sơ và đưa ra quyết định tuyển dụng.

#### Acceptance Criteria

1. WHEN a Company truy cập trang Applicants Tracker, THE Company_System SHALL hiển thị danh sách tất cả active jobs với số lượng applicants cho mỗi job, sắp xếp theo ngày tạo job mới nhất trước.
2. WHEN a Company chọn một Job cụ thể trong Applicants Tracker, THE Company_System SHALL hiển thị danh sách ứng viên đã apply với thông tin: tên Mentee, ngày apply, trạng thái Application, và link tới Portfolio đính kèm, sắp xếp theo ngày apply mới nhất trước.
3. WHEN a Company nhấn vào tên một ứng viên, THE Company_System SHALL hiển thị full profile của Mentee bao gồm: thông tin cá nhân, skills, design tools, và danh sách Projects.
4. WHEN a Company nhấn vào Portfolio đính kèm của ứng viên, THE Company_System SHALL mở PortfolioDetailPage của Project tương ứng.
5. THE Company_System SHALL cho phép Company cập nhật trạng thái Application theo luồng một chiều: Submitted → Under_Review → Accepted hoặc Rejected. THE Company_System SHALL chỉ cho phép chuyển trạng thái sang bước kế tiếp hợp lệ trong luồng (Submitted chỉ sang Under_Review, Under_Review chỉ sang Accepted hoặc Rejected).
6. IF a Company cố gắng cập nhật trạng thái Application sang một trạng thái không hợp lệ theo luồng (ví dụ: Submitted trực tiếp sang Accepted, hoặc Rejected quay lại Under_Review), THEN THE Company_System SHALL hiển thị thông báo lỗi mô tả trạng thái hiện tại và các trạng thái hợp lệ tiếp theo, và không thay đổi trạng thái Application.
7. WHEN a Company cập nhật trạng thái Application thành công, THE Notification_Service SHALL gửi thông báo trong ứng dụng tới Mentee trong vòng 60 giây. IF Notification_Service không thể gửi thông báo do lỗi hệ thống, THEN THE Company_System SHALL vẫn hoàn tất việc cập nhật trạng thái và gửi lại thông báo khi Notification_Service khả dụng.
8. IF một Job không có ứng viên nào, THEN THE Company_System SHALL hiển thị thông báo trạng thái trống cho Job đó khi Company chọn xem danh sách applicants.

### Requirement 10: Mentee Buddy Chat Integration

**User Story:** As a Mentee, I want to nhắn tin trực tiếp với Buddy đang review portfolio của mình, so that tôi có thể trao đổi và làm rõ feedback trong thời gian thực.

#### Acceptance Criteria

1. WHILE a Mentee có FeedbackRequest ở trạng thái In_Review, THE Messaging_System SHALL hiển thị giao diện chat trên trang Feedback tracking của Mentee, cho phép nhắn tin 1-on-1 với Buddy đang review portfolio tương ứng.
2. WHEN a Mentee gửi tin nhắn trong chat với nội dung từ 1 đến 2000 ký tự, THE Messaging_System SHALL lưu Message và hiển thị cho cả Mentee và Buddy trong vòng 2 giây.
3. WHILE a FeedbackRequest không ở trạng thái In_Review, THE Messaging_System SHALL ẩn giao diện chat và chỉ hiển thị trạng thái hiện tại của FeedbackRequest.
4. WHEN a Mentee mở giao diện chat của một FeedbackRequest đang In_Review, THE Messaging_System SHALL hiển thị lịch sử tin nhắn đầy đủ theo thứ tự thời gian (cũ nhất trước).
5. IF a Mentee cố gắng gửi tin nhắn rỗng hoặc chỉ chứa khoảng trắng, THEN THE Messaging_System SHALL không gửi tin nhắn và hiển thị thông báo yêu cầu nhập nội dung.
6. IF a Mentee gửi tin nhắn nhưng hệ thống không thể lưu hoặc gửi do lỗi kỹ thuật, THEN THE Messaging_System SHALL hiển thị thông báo lỗi cho Mentee, giữ nguyên nội dung tin nhắn trong ô nhập để Mentee có thể thử gửi lại.

### Requirement 11: Advanced Job Search UI cho Mentee

**User Story:** As a Mentee, I want to tìm kiếm việc làm với bộ lọc nâng cao đa tiêu chí, so that tôi có thể nhanh chóng tìm được cơ hội phù hợp với kỹ năng và sở thích.

#### Acceptance Criteria

1. WHEN a Mentee truy cập trang Job Search nâng cao, THE Job_System SHALL hiển thị layout ba tầng: thanh tìm kiếm rộng ở trên cùng (tìm theo job titles, skills, company keywords với tối đa 100 ký tự), hàng category quick tags ở giữa (Software, Semiconductor, Marketing, Design, Sales, và các danh mục khác dựa trên required skills của Job), và thanh Advanced Filters có thể mở rộng ở dưới.
2. WHEN a Mentee nhập từ khóa có độ dài tối thiểu 2 ký tự vào thanh tìm kiếm chính, THE Job_System SHALL lọc danh sách Job theo title, required skills, hoặc company name chứa từ khóa, cập nhật kết quả trong vòng 500ms.
3. WHEN a Mentee nhấn vào một category quick tag, THE Job_System SHALL lọc danh sách Job theo những Job có required skills thuộc category tương ứng, highlight tag đã chọn, và bỏ highlight tag đang chọn trước đó (chỉ cho phép chọn một tag tại một thời điểm).
4. WHEN a Mentee mở Advanced Filters, THE Job_System SHALL hiển thị các dropdown/checkbox: Location (text input), Employment Type (multi-select từ danh sách: Internship, Fresher, Freelance, Part-time, Full-time), Seniority Level (multi-select từ danh sách experienceLevel hiện có), Salary Range (min-max slider với khoảng từ 0 đến 100,000,000 VND), và Remote checkbox.
5. THE Job_System SHALL cho phép Mentee kết hợp nhiều bộ lọc đồng thời (keyword, category tag, và advanced filters) và hiển thị kết quả là intersection (AND logic) của tất cả bộ lọc đang active.
6. WHEN a Mentee thay đổi bất kỳ bộ lọc nào, THE Job_System SHALL cập nhật danh sách kết quả và hiển thị tổng số jobs phù hợp trong vòng 500ms.
7. THE Job_System SHALL cho phép Mentee xóa tất cả bộ lọc bằng một nút "Clear All Filters", reset tất cả filter về trạng thái mặc định, và hiển thị lại toàn bộ danh sách jobs từ trang đầu tiên.
8. IF không có Job nào phù hợp với bộ lọc hiện tại, THEN THE Job_System SHALL hiển thị thông báo cho Mentee biết không có kết quả và gợi ý điều chỉnh bộ lọc.

### Requirement 12: Phân quyền API theo Role

**User Story:** As a hệ thống, I want to bảo vệ tất cả API endpoints theo vai trò người dùng, so that chỉ những người dùng có quyền phù hợp mới có thể truy cập tài nguyên tương ứng.

#### Acceptance Criteria

1. WHEN một request tới endpoint dưới /api/buddy/** được nhận, THE Auth_System SHALL kiểm tra x-user-role header từ middleware.ts và chỉ cho phép truy cập khi role là "buddy" hoặc "admin".
2. WHEN một request tới endpoint dưới /api/company/** được nhận, THE Auth_System SHALL kiểm tra x-user-role header từ middleware.ts và chỉ cho phép truy cập khi role là "company" hoặc "admin".
3. IF một người dùng có role không nằm trong danh sách role được phép của endpoint cố gắng truy cập endpoint được bảo vệ theo role, THEN THE Auth_System SHALL trả về HTTP 403 Forbidden với response body theo format { success: false, error: { message, code } } trong đó message chỉ rõ role hiện tại không có quyền truy cập resource được yêu cầu.
4. WHILE người dùng có role "admin", THE Auth_System SHALL cho phép truy cập tất cả các role-restricted API endpoints mà không kiểm tra role restriction cụ thể của endpoint đó.
5. THE Auth_System SHALL thực hiện kiểm tra role tại tầng route handler trong vòng 100ms sau khi nhận request, sử dụng giá trị x-user-role header đã được forward bởi middleware.ts.
6. IF x-user-role header không tồn tại hoặc có giá trị rỗng trên một request tới role-restricted endpoint, THEN THE Auth_System SHALL trả về HTTP 401 Unauthorized với response body theo format { success: false, error: { message, code } } cho biết thông tin xác thực không hợp lệ.
7. THE Auth_System SHALL chỉ chấp nhận các giá trị role hợp lệ: "mentee", "buddy", "company", "admin". IF x-user-role header chứa giá trị không nằm trong danh sách trên, THEN THE Auth_System SHALL trả về HTTP 403 Forbidden.

### Requirement 13: Mentee Portfolio Approval cho Job Application

**User Story:** As a Mentee, I want to submit portfolio đã được Buddy duyệt vào job applications, so that tôi có thể ứng tuyển với portfolio có chất lượng đã được xác nhận.

#### Acceptance Criteria

1. WHEN a FeedbackRequest cho một portfolio được đánh dấu Completed bởi Buddy, THE Feedback_System SHALL cập nhật trường is_approved của portfolio đó thành true trong vòng 5 giây, cho phép Mentee sử dụng portfolio với trạng thái "Buddy Approved" trong job applications.
2. WHILE a portfolio chưa có FeedbackRequest nào với trạng thái Completed (is_approved = false), THE Job_System SHALL vẫn cho phép Mentee ứng tuyển bằng portfolio đó và hiển thị badge "Unreviewed" kề bên tên portfolio trong portfolio selector.
3. WHILE a portfolio có ít nhất một FeedbackRequest với trạng thái Completed (is_approved = true), THE Job_System SHALL hiển thị badge "Buddy Approved" kề bên tên portfolio trong dialog chọn portfolio khi ứng tuyển.
4. THE Job_System SHALL chỉ hiển thị các portfolio có trạng thái Public trong danh sách portfolio selector khi Mentee ứng tuyển job, mỗi portfolio kèm badge trạng thái approval tương ứng (Buddy Approved hoặc Unreviewed).
5. IF Feedback_System không thể cập nhật trạng thái is_approved sau khi FeedbackRequest được đánh dấu Completed (do lỗi database hoặc lỗi hệ thống), THEN THE Feedback_System SHALL giữ nguyên trạng thái is_approved hiện tại của portfolio và ghi log lỗi để retry, không ảnh hưởng đến trạng thái Completed của FeedbackRequest.

---

## Database Schema Recommendations

### Models mới cần thêm vào Prisma Schema

```prisma
// ─── New Enums ─────────────────────────────────────────────────────────────────

enum EmploymentType {
  full_time
  part_time
  internship
  contract
  freelance
  temporary
  volunteer
}

enum SeniorityLevel {
  internship
  entry
  assistant
  mid_senior
  director
  executive
}

// ─── New Models ────────────────────────────────────────────────────────────────

model BuddyProfile {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @unique @map("user_id") @db.Uuid
  fullName      String   @map("full_name") @db.VarChar(255)
  roleTitle     String   @map("role_title") @db.VarChar(255)
  bio           String?  @db.Text
  avatarUrl     String?  @map("avatar_url") @db.VarChar(500)
  major         Major?
  skills        String[]
  designTools   String[] @map("design_tools")
  interests     String[]
  socialLinks   Json     @default("{}") @map("social_links")
  completionPct Int      @default(0) @map("completion_pct") @db.SmallInt
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioBookmarks PortfolioBookmark[]

  @@map("buddy_profiles")
}

model CompanyProfile {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @unique @map("user_id") @db.Uuid
  companyName     String   @map("company_name") @db.VarChar(255)
  summary         String?  @db.Text
  productsServices String? @map("products_services") @db.Text
  websiteUrl      String?  @map("website_url") @db.VarChar(500)
  hrContactEmail  String?  @map("hr_contact_email") @db.VarChar(255)
  hrContactPhone  String?  @map("hr_contact_phone") @db.VarChar(50)
  employeeCount   String?  @map("employee_count") @db.VarChar(50)  // e.g. "50-100", "100-500"
  officeAddress   String?  @map("office_address") @db.Text
  referenceLinks  Json     @default("[]") @map("reference_links")  // [{url, label}]
  teamMembers     Json     @default("[]") @map("team_members")     // [{name, role, avatarUrl}]
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("company_profiles")
}

model Message {
  id                 String   @id @default(uuid()) @db.Uuid
  senderId           String   @map("sender_id") @db.Uuid
  receiverId         String   @map("receiver_id") @db.Uuid
  content            String   @db.Text
  portfolioContextId String?  @map("portfolio_context_id") @db.Uuid
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz

  sender   User     @relation("MessagesSent", fields: [senderId], references: [id])
  receiver User     @relation("MessagesReceived", fields: [receiverId], references: [id])
  project  Project? @relation(fields: [portfolioContextId], references: [id], onDelete: SetNull)

  @@index([senderId, receiverId])
  @@index([portfolioContextId])
  @@map("messages")
}

model PortfolioBookmark {
  id        String   @id @default(uuid()) @db.Uuid
  buddyId   String   @map("buddy_id") @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  buddy   BuddyProfile @relation(fields: [buddyId], references: [id], onDelete: Cascade)
  project Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([buddyId, projectId])
  @@map("portfolio_bookmarks")
}
```

### Modifications cần thêm vào Models hiện có

```prisma
// Thêm vào model User:
model User {
  // ... existing fields ...
  buddyProfile    BuddyProfile?
  companyProfile  CompanyProfile?
  messagesSent    Message[] @relation("MessagesSent")
  messagesReceived Message[] @relation("MessagesReceived")
}

// Thêm vào model Job (fields mới):
model Job {
  // ... existing fields ...
  openSlots             Int?           @map("open_slots")
  employmentType        EmploymentType? @map("employment_type")
  seniorityLevel        SeniorityLevel? @map("seniority_level")
  minExperienceYears    Int?           @map("min_experience_years")
  requiresManagement    Boolean        @default(false) @map("requires_management")
  minManagedEmployees   Int?           @map("min_managed_employees")
  salaryPeriod          String?        @map("salary_period") @db.VarChar(20) // "monthly" | "yearly"
  category              String?        @db.VarChar(100)  // "Software", "Design", etc.
}

// Thêm vào model Project:
model Project {
  // ... existing fields ...
  isApproved        Boolean          @default(false) @map("is_approved")
  messages          Message[]
  portfolioBookmarks PortfolioBookmark[]
}
```

---

## API Endpoint List

### Buddy Endpoints (prefix: /api/buddy)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|--------|------|------|
| GET | `/api/buddy/profile/me` | Lấy BuddyProfile của Buddy đang đăng nhập | ✅ | buddy |
| POST | `/api/buddy/profile` | Tạo BuddyProfile mới | ✅ | buddy |
| PUT | `/api/buddy/profile/me` | Cập nhật BuddyProfile | ✅ | buddy |
| GET | `/api/buddy/dashboard/stats` | Lấy thống kê Dashboard | ✅ | buddy |
| GET | `/api/buddy/portfolios/browse` | Danh sách portfolios pending_feedback (sorted by skill match) | ✅ | buddy |
| POST | `/api/buddy/portfolios/bookmark` | Bookmark một portfolio vào review list | ✅ | buddy |
| DELETE | `/api/buddy/portfolios/bookmark/:projectId` | Xóa bookmark | ✅ | buddy |
| GET | `/api/buddy/workspace` | Danh sách portfolios đã bookmark (Feedback Workspace) | ✅ | buddy |
| PATCH | `/api/buddy/workspace/:feedbackRequestId/start` | Bắt đầu review (status → In_Review) | ✅ | buddy |
| PATCH | `/api/buddy/workspace/:feedbackRequestId/complete` | Hoàn thành review (status → Completed) | ✅ | buddy |

### Company Endpoints (prefix: /api/company)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|--------|------|------|
| GET | `/api/company/profile/me` | Lấy CompanyProfile của Company đang đăng nhập | ✅ | company |
| POST | `/api/company/profile` | Tạo CompanyProfile mới | ✅ | company |
| PUT | `/api/company/profile/me` | Cập nhật CompanyProfile | ✅ | company |
| GET | `/api/company/dashboard/stats` | Lấy thống kê Dashboard | ✅ | company |
| POST | `/api/company/jobs` | Tạo Job mới (extended fields) | ✅ | company |
| PUT | `/api/company/jobs/:id` | Cập nhật Job | ✅ | company |
| DELETE | `/api/company/jobs/:id` | Xóa Job (cascade applications) | ✅ | company |
| GET | `/api/company/jobs` | Danh sách Jobs của Company | ✅ | company |
| GET | `/api/company/jobs/:id/applicants` | Danh sách ứng viên cho một Job | ✅ | company |
| PATCH | `/api/company/applications/:id/status` | Cập nhật trạng thái Application | ✅ | company |

### Messaging Endpoints (prefix: /api/messages)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|--------|------|------|
| GET | `/api/messages/:portfolioContextId` | Lấy lịch sử chat theo portfolio context | ✅ | buddy, mentee |
| POST | `/api/messages` | Gửi tin nhắn mới | ✅ | buddy, mentee |
| GET | `/api/messages/conversations` | Danh sách conversations đang active | ✅ | buddy, mentee |

### Job Search mở rộng (public endpoints cập nhật)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/jobs` | Danh sách Jobs với advanced filters (keyword, category, employmentType, seniorityLevel, salaryMin, salaryMax, location, isRemote) | ❌ |
| GET | `/api/jobs/categories` | Danh sách categories khả dụng | ❌ |

---

## Notes

- Tất cả Buddy endpoints yêu cầu `x-user-role === 'buddy'` hoặc `'admin'`
- Tất cả Company endpoints yêu cầu `x-user-role === 'company'` hoặc `'admin'`
- Messaging endpoints yêu cầu user là sender hoặc receiver của conversation
- BuddyProfile và CompanyProfile sử dụng quan hệ 1-1 với User (similar to existing Profile model)
- Message model sử dụng portfolioContextId để liên kết chat với portfolio đang review
- Job model mở rộng thêm fields mới nhưng giữ backward compatible với existing data
- PortfolioBookmark sử dụng unique constraint (buddyId, projectId) để tránh duplicate
- Cascade delete: xóa User → xóa BuddyProfile/CompanyProfile; xóa Project → xóa Messages liên quan (SetNull cho portfolioContextId)
