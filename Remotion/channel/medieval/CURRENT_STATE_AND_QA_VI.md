# Trạng thái hiện hành — Medieval Life Explained

Cập nhật 18/10/2026. Các ghi chú brief-only/ngày 17/10 trong lịch sử không mô tả bản render hiện tại. Không thay source, audio hoặc master của các episode trong lượt cập nhật skill này.

## Điểm vào cho tập mới

Đọc canonical `D:/Youtube/Medieval Life Explained/content-system/PROJECT_CONTENT_INDEX.json`, route `production_workflow` tới CONTENT_TO_VIDEO_PROCESS_V02_VI.md. Dùng scene brief hiện hành và hai skill video-plan/visual-assets. Không chọn manifest cũ chỉ vì tên có CURRENT; đối chiếu selected script, audio, props và trạng thái kiểm thật.

Mạch làm: scene/khám phá → coverage theo cue → hình/voice → animatic → đo/xem lặp và sửa → polish → kiểm MP4. Số asset xuất phát từ view/action/state cần thấy, không từ quota. Cùng nhân vật/bối cảnh có thể quay lại; phải review việc lặp bố cục và ý hình ảnh. Quy trình chi tiết nằm trong process, tránh duy trì hai bản hướng dẫn song song ở đây.

## Renderer và style dùng thật

Generic renderer có text roles, keyframe, pivot/group, camera/world-screen, audio roles/gain envelopes và cue compiler. Không có auto-acting, IK hoặc auto-duck theo giọng. Profile vẫn là `production-profile.v1.json`, nội dung 1.2-draft; art direction toàn kênh không tự được chứng nhận bởi một tập. Font loader, runtime code và selected props mới xác định hình thực tế.

Video004 dùng Patrick Hand regular, chữ #111820 viền #FFF9E8, nhãn handwritten không hộp trang trí. Một scene có sơ đồ quan hệ vẫn được dùng khối có nghĩa. Kiểm độ đọc trên composite và khung xuất; đổi profile không tự recolor PNG hoặc tạo pose. Giữ composition Video003 đã duyệt riêng.

## Bằng chứng Video004

- Script V06 và audio Audio001.mp3 giữ nguyên trong vòng V05.
- Bản render: `D:/Youtube/Medieval Life Explained/videos/Video004/final/VIDEO004_V05_VARIETY_1080p30.mp4`.
- Props: `examples/medieval/video004-v05.props.json`, Studio `VIDEO004-V05-VARIETY`.
- 151 shot, 69 asset hình thực dùng (68 PNG/1 SVG). Thêm 22 PNG, thay 74 shot; số lượng không là quota cho tập sau.
- Hồ sơ nguồn/cue/ảnh chọn/audit tại `videos/Video004/production/asset-variety-v05/`.
- Master 1920×1080/30fps, 458,197 giây, H.264/yuv420p + AAC; giải mã toàn file đạt, 9 khung từ MP4 đã được xem. Audio config và ID/mốc cắt so với V04 khớp. Không gọi đó là xem/nghe duyệt liên tục toàn tập.

Audit cũ so layer gồm ID cho kết quả 3 → 0 cặp trùng. Helper mới bỏ qua tên layer và nhận diện file alias cho 4 → 1 cặp cần review: S011-B02/S011-B03 dùng cùng phòng có khói cho hai câu liên quan, 6,50 giây liên tục và khác camera. Review theo ý nghĩa/transition; không tự fail và không dùng số 0 làm chứng nhận.

## Kiểm lượt cập nhật skill

Hai skill qua quick_validate. Helper chạy trên V04/V05 và map family của V05. Sáu regression tests kiểm union thời gian/parent lifetime, alias file, đổi tên layer, layer ẩn, timing chưa resolve, file thiếu/ngoài public root và family-span khác exposure. Đây là kiểm kỹ thuật helper, không chứng minh mỹ thuật hay retention. Receipt cài đặt và audit cập nhật được route từ canonical index.

Các kiểm engine 24/24 và fixture style-upgrade v02 được ghi nhận ở lượt 17/10; không được báo là vừa chạy lại trong lượt sửa skill. Fixture 6 giây không có C/voice vẫn là dependency kỹ thuật, không là pilot mỹ thuật mới. Các nguồn trước cập nhật được giữ trong snapshot của đợt thay skill.

## Giới hạn còn lại

Chưa forward-test toàn quy trình V02 bằng một episode mới. Chưa chứng minh thị hiếu/retention hoặc đã nghe lại toàn mix V05 trong lượt sửa hình. Pose raster và reframe không phải rig/diễn xuất liên tục; model sheet hoặc action phức tạp chỉ được coi usable sau khi có file và kiểm đúng contact/sequence. Quyền nguồn chưa được giải quyết thêm bởi kiểm kỹ thuật. Tiếp tục xử lý findings tại đúng scene, tránh mở rộng engine khi lỗi nằm ở staging hoặc asset.
