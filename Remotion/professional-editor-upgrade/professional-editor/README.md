# Science Video Editor — bộ nâng cấp repo

Bộ này bổ sung skill, catalog asset, engine dựng bằng dữ liệu và ba motion study cho Built Into You. Đây là nền tảng làm việc có thể kiểm thử, không phải chứng nhận năng lực tương đương editor 5 năm. Các composition và asset cũ được giữ nguyên.

## Những gì đã triển khai

- Skill tại `.agents/skills/science-video-editor/`, với hướng dẫn biên tập, hình ảnh, motion, âm thanh, review và cập nhật dựa trên lỗi thật.
- Schema version 1 và compiler dùng chung cho renderer/CLI. Anchor thiếu hoặc mơ hồ không được tự đặt timecode.
- Layer cha–con, pivot, attachment point; action có lý do, continuity giữa scene, camera có chủ đích.
- Audio trim, fade, gain và giảm nhạc dưới voice; công cụ đo âm thanh tổng, không sửa source.
- Catalog của engine mới quét thư viện media chuẩn ở `public/`, ghi hash, kích thước, thời lượng nếu probe được, trạng thái duyệt, nguồn và cờ kiểm tra. Media mới hoặc chưa được duyệt vẫn là `draft`; kỹ thuật kiểm kê không xác nhận giấy phép hay chất lượng nghệ thuật.
- Sáu SVG có style thống nhất, tách rời cell/virus/receptor để animate; ba demo mechanism, comparison, evidence và reel 32 giây.

## Sử dụng

Chạy từ thư mục repo Remotion, dùng `--prefix` để gọi đúng package nâng cấp:

```powershell
npm --prefix professional-editor-upgrade run editor:assets
npm --prefix professional-editor-upgrade run editor:check
npm --prefix professional-editor-upgrade run editor:test
npm --prefix professional-editor-upgrade run editor:stills
npm --prefix professional-editor-upgrade run editor:preview
npm --prefix professional-editor-upgrade run editor:studio
```

`editor:assets` cần Python và Pillow. Node tools dùng dependency Remotion đã cài ở repo cha. Không thêm dịch vụ, API trả phí hay tải asset bên ngoài.

Lệnh `editor:studio` mở Remotion Studio với entry riêng của engine mới. Chọn thư mục `Professional-Editor`: `ProEditor-Mechanism`, `ProEditor-Comparison`, `ProEditor-Evidence`, `ProEditor-Reel`. Entry này chưa được đăng ký vào `src/Root.tsx` của video cũ.

Skill nguồn nằm tại `professional-editor-upgrade/.agents/skills/science-video-editor/`; bản mirror ở `.agents/skills/science-video-editor/` giúp Codex phát hiện từ repo. Sau khi cập nhật nguồn, đồng bộ bằng `npm --prefix professional-editor-upgrade run editor:sync-skill`. Gọi bằng `$science-video-editor` hoặc mở skill nguồn trực tiếp. Skill không được cài toàn cục.

## Một project thật

1. Tạo `professional-editor/projects/<id>/brief.json`: khán giả, takeaway, format, tone, VO, giới hạn nguồn và yêu cầu chất lượng.
2. Tạo `edit-plan.json` theo `engine/edit-plan.schema.json`; dùng ví dụ để hiểu contract, không sao chép ý khoa học hoặc thời lượng máy móc.
3. Thêm voiceover thật và word captions cùng recording. Anchor trùng cần `occurrence`; sau khi sửa audio phải remap captions.
4. Chọn asset theo hành động cần thể hiện. Chỉnh tay metadata tại `library/asset-overrides.json`, không chỉnh catalog sinh tự động.
5. Chạy `node professional-editor/tools/validate-project.mjs professional-editor/projects/<id>/edit-plan.json`.
6. Đăng ký composition mới bằng `compilePlan`, `PlanView` và catalog. Preview CLI hiện chỉ render các demo đã đăng ký; không tự render file project bất kỳ.
7. Review animatic, hoàn thiện asset/motion/mix, xem và nghe bản render. Lưu lỗi/timecode và kết quả tại `reviews/`.

## Asset và yêu cầu chất lượng

`professional-editor/library/asset-catalog.json` được tạo từ toàn bộ loại media hỗ trợ dưới `public/`; đường dẫn asset tương đối với thư mục đó nên renderer và validator cùng đọc đúng một thư viện. `professional-editor/reports/legacy-asset-catalog.json` là ảnh chụp kiểm kê cũ và không còn là nguồn hiện hành. Không gán license cho asset cũ bằng suy đoán.

File cũ không bị thay thế hàng loạt. Catalog không tự suy ra giấy phép hoặc chất lượng nghệ thuật. `draft` được phép trong preview; `rejected` không được dùng. Asset đã duyệt phải gắn exact SHA-256, người review và bằng chứng. Đổi nội dung làm mất hiệu lực duyệt.

Các `sfx/pop.wav`, `chime.wav`, `whoosh.wav` được gắn cờ placeholder. Không dùng chúng trong bản final của engine mới. Cần tuyển chọn nguồn SFX thật hoặc làm sound design riêng rồi nghe kiểm định; bộ nâng cấp này không giả vờ đã cung cấp một thư viện âm thanh premium.

SVG mới là minh họa khái niệm, không phải mô hình giải phẫu chính xác. Chúng có nguồn xác định nhưng vẫn cần duyệt style và tính phù hợp trước sản xuất. Các demo không có VO hay mix và vẫn là `draft`.

## Migration và giới hạn

`biy`, `biy2`, các widget `code_*` và video hiện có vẫn dùng engine cũ. Bộ mới không tự chuyển mọi widget cũ. Di chuyển từng cảnh đã review, giữ timing và ý nghĩa, bổ sung widget còn thiếu có kiểm thử. Dữ liệu cũ và heuristic như periodic pulse không bị thay đổi ngầm.

Engine mới không tự thêm pop/pulse mỗi 2 giây. Cảnh tĩnh được review theo mục đích đọc/hiểu. Một camera move hay SFX phải có lý do nội dung.

Các kiểm tra bounds chỉ lấy mẫu; text-fit chỉ là ước lượng. Cần xem actual render và nghe actual mix. Không có phép đo tự động nào ở đây chứng minh giữ chân khán giả hoặc độ đúng khoa học.

## Lộ trình tiếp theo theo đầu ra

| Mốc | Đầu ra nghiệm thu |
|---|---|
| Foundation | Skill, catalog, compiler, kiểm thử, ba demo chạy được |
| Production pilot | Một đoạn 30–45 giây từ script/VO thật, so sánh trước/sau và review |
| Asset/sound library | Các asset dùng thật được duyệt với nguồn, phiên bản và clip nghe thử |
| Migration | Các cảnh/video cần dùng chuyển sang engine chung, không mất widget hoặc override |
| Evaluation | Video mới chưa có trong bộ mẫu; review comprehension và feedback khán giả |

Không phát triển UI timeline đầy đủ trước khi pilot đạt chất lượng. Quy trình này cải tiến repo theo bằng chứng trong phiên làm việc; không tự tạo automation nền.


## Shared 2D visual style

See [VISUAL-STYLE.md](VISUAL-STYLE.md) for bundled handwriting, annotation components and render verification. Run `node scripts/visual-refresh/render-review.mjs` from the Remotion repository root to review legacy scenes and `BIY-VisualStyle-Review`.
