# Thiết lập dựng Medieval Life Explained — hiện hành

Cập nhật: 2026-10-22. Các mục v1/v1.2 bên dưới giữ lịch sử triển khai; đọc mục hiện hành trước. Renderer đã được nâng cấp theo mục triển khai ở cuối file. Hướng mỹ thuật vẫn là đề xuất cần pilot có C/voice thật. Không thay bản Video003 đã chốt; không thay content/audio Video004.

## Hiện hành sau Video005–006

Process chọn qua canonical index hiện là `D:/Youtube/Medieval Life Explained/content-system/CONTENT_TO_VIDEO_PROCESS_V03_VI.md`. Dùng checklist `EPISODE_PREFLIGHT_CHECKLIST_VI.md` và reference `production-preflight.md` của skill video-plan. Các tham chiếu V01/V02 ở mục lịch sử bên dưới không chọn route hiện hành. Skill video-plan có `references/visual-variety-and-reuse.md` và helper `scripts/audit_visual_reuse.py`; visual-assets có `references/alternate-views-and-coverage.md`. Thiết kế coverage theo cue trước khi chốt batch; đo baseline/sau thay trên props thật; review family và sequence, không dùng tổng ảnh làm chứng nhận.

Video004 đã có MP4 V05, không còn là trạng thái chỉ brief/chưa có art ở các ghi chú lịch sử dưới đây. Xem CURRENT_STATE_AND_QA_VI.md và hồ sơ `videos/Video004/production/asset-variety-v05/`. Các ca sửa của tập này là ví dụ, không phải quota 22 ảnh/151 shot cho tập sau.

Typography đang dùng: Patrick Hand regular từ loader, chữ gần đen #111820 với viền kem #FFF9E8 trong renderer/nhãn handwritten. Kiểm code và composite thật; palette/profile mô tả không thay được mọi màu/nhãn baked vào ảnh. Giữ chữ không hộp trang trí, nhưng vẫn dùng sơ đồ/khối khi quan hệ cần giải thích. Không migrate các episode đã duyệt chỉ để áp style.

## Đích chất lượng

Minh họa lịch sử có nhân vật dẫn chuyện, hài quan sát và hành động giải thích. Mỗi scene có một điều đáng hiểu hoặc đáng nhận ra. Nhận diện đến từ C, nét/màu/bố cục, chữ, cách phản ứng và âm thanh nhất quán. Số cut, số asset hay số hiệu ứng không chứng minh chất lượng.

Đọc `production-profile.v1.json` và dùng `SCENE_BRIEF_TEMPLATE_VI.md` cho scene. Renderer đọc cỡ chữ theo role từ profile; compiler áp canvas/palette khi chủ động chạy. Các màu/cỡ chữ/timing là giá trị thử, chưa phải chuẩn đã thông qua pilot.

## Căn cứ hiện trạng

- Đã đọc src/medieval/MedievalEpisode.tsx, contracts.ts, Video003Revision.tsx, src/design/typography.ts và plan Video003 hiện hành.
- Đã xem bảng QA ALL-CUTS-01, ALL-CUTS-05, ALL-OVERLAYS-01 và concept C. Đây là ảnh mẫu; không thay việc xem chuyển động hoặc nghe mix liên tục.
- Trước nâng cấp: generic renderer có image/text/rect, cue lời, fade, một đoạn translate/scale, audio clip có trim/gain/fade. Các thiếu sót khi đó là text role, keyframe, pivot và group/camera. Phần triển khai mới được ghi ở cuối, tách khỏi bằng chứng hiện trạng ban đầu.
- Video003 có 141 beat/191 cut/27 overlay/9 SFX; renderer riêng có chữ, mũi tên và chuyển động hạt. Các khả năng riêng này chưa tự trở thành tính năng của generic renderer.
- Chưa xác định yếu tố nào gây tụt retention; chưa đo khán giả thích phong cách đề xuất. Chưa nghe toàn bộ mix trong lần kiểm tra này.

## Cách tổ chức công việc

1. Giữ script đã chọn và câu hỏi/payoff làm đầu vào. Đọc canonical project index, không đoán phiên bản mới nhất theo tên file.
2. Viết scene brief theo thay đổi hiểu biết, không chia máy móc một ảnh/một câu. Chọn nhân vật, vật thể, sơ đồ hoặc bằng chứng theo ý cần giải thích.
3. Kiểm tra art direction trên composite: nhân vật, prop, nền và chữ trong cùng khung. Chốt model sheet C từ concept đã xem; không coi một câu prompt là bảo đảm đồng nhất.
4. Chuẩn bị asset tối thiểu theo hành động: tách tay/prop khi cần chuyển động độc lập; giữ điểm neo/cùng tỷ lệ cho pose swap. Không bắt mọi asset phải rig hoặc dựng lại toàn bộ.
5. Dựng animatic với voice tạm có ghi nhãn hoặc audio thật. Cue theo lời; chỉ khóa frame sau khi chọn audio và alignment đã kiểm tra.
6. Kiểm tra ý nghĩa/hành động/nhịp trước; sau đó mới thêm texture, chuyển động phụ và sound design.
7. Xem bản export, sửa findings ở đúng scene và kiểm tra lại phần bị ảnh hưởng. Giữ một finding register; không tạo thêm báo cáo trùng nhau cho mỗi bước.

Episode mới đặt tài liệu production ở canonical videos/<id>/production/. Video003 đã có tổ chức riêng 02_PLAN/03_ASSETS/04_AUDITS/06_PUBLISH; tiếp tục dùng tổ chức đó. Không chuyển hoặc ghi đè master để áp template mới.

## Nâng renderer theo thứ tự

### Ưu tiên 1 — chữ và profile dùng thật

- Thêm profile loader hoặc compiler có version; chỉ field được schema chấp nhận mới xuất ra episode props. Không truyền JSON profile này trực tiếp vào resolveEpisode vì unknown fields hiện bị chặn.
- Thêm text role/fontSize/lineHeight/alignment/padding cho layer, có mặc định giữ hành vi manifest cũ. Dùng một font viết tay hiện có, phân cấp bằng kích thước và bố cục.
- Không tăng mọi video cũ lên 1080p/30fps. Profile đề xuất 1080p/30fps cho công việc mới, cần thử chi phí render/độ nét; audio cue theo ms phải resolve theo fps của episode.
- Acceptance: props cũ vẫn resolve; text mới không bị renderer âm thầm bỏ qua; kiểm tra chữ dài, dấu/ký hiệu, composite ở 360px và overlap captions.

### Ưu tiên 2 — hành động nhiều giai đoạn

- Thêm keyframe x/y/scale/rotation/opacity, pivot và easing có tên, thời gian shot-relative rõ ràng. Schema kiểm tra thứ tự, bounds và endpoint; tuyệt đối không dùng ngẫu nhiên mỗi frame.
- Hỗ trợ group scene/camera để reframe các lớp cùng nhau. Phân biệt camera với chuyển động vật thể.
- Pose swap vẫn là lựa chọn tốt khi đủ ý; joint rig/IK/lip-sync chỉ làm khi scene chứng minh cần. Chưa có những tính năng này trong generic renderer hiện hành.
- Acceptance: tay/prop không tách khi hành động; chân không trượt vô ý; pivot không làm nhảy vị trí; cue trễ không lộ sớm; pose thay giữ đúng registration; khung cuối có thời gian đọc.

### Ưu tiên 3 — âm thanh theo scene

- Giữ voice/music/sfx tương thích; nếu thêm ambience hoặc nhóm accent, cập nhật cả schema, preflight và renderer, không chỉ thêm tên vào JSON.
- Lưu cue/action, nguồn/quyền sử dụng, trim, gain envelope và lý do cần âm. Cho phép đổi mức nhạc theo scene; không gọi cấu hình giảm volume cố định là auto-duck theo giọng.
- Kiểm tra file bị cắt ngắn, tail vượt scene, loop seam và chồng cue. Mức peak/RMS chỉ hỗ trợ kỹ thuật, không chứng minh mix dễ nghe.
- Acceptance: nghe tiếng nói cùng các track, nghe trên loa thường/tai nghe nếu có; âm hành động đúng khoảnh khắc, không che từ quan trọng, không ép SFX vào mọi cut. Ghi rõ playback nào thực sự đã làm.

### Ưu tiên 4 — thành thư viện tái sử dụng

Sau khi pilot tốt, rút ra component có ích: thẻ bằng chứng có scope; flow vật thể; so sánh; phản ứng C; camera reframe. Mỗi mẫu phải nhận dữ liệu episode và cue riêng. Không lấy nhịp của một scene làm quota cho cả kênh.

## Pilot trước khi dựng toàn tập

Chọn 45–60 giây có một lời hứa nhỏ, một thao tác/vật thể hoặc mối quan hệ, một phản ứng hài có cơ sở và một chuyển tiếp. Dùng đoạn script đã chọn, không kéo dài lời hoặc giả lịch sử để đủ bốn loại cảnh. Nếu một đoạn không có hài thì chọn đoạn khác hoặc kiểm tra hài ở excerpt riêng.

Đầu ra: scene brief, danh sách asset thật, animatic có voice, bản polish có âm thanh, findings với trước/sau và giới hạn kiểm tra. Nếu đầu vào thiếu audio hoặc artwork, chỉ ghi rõ phần nào đang tạm; không gọi pilot hoàn tất.

Nghiệm thu theo câu hỏi:

- Mở cảnh cho thấy đang nói về việc gì? Chi tiết mới và payoff có xuất hiện rõ?
- C đang muốn/làm/phản ứng điều gì, hay chỉ đứng cạnh nhãn? Scene không cần C có giải thích tốt hơn không?
- Mỗi motion có quan hệ với ý nghĩa? Giữ tĩnh có tốt hơn không?
- Điểm nhìn có bị nền/chữ/SFX cạnh tranh? Có đọc được trên điện thoại?
- C/prop/nền có ổn định giữa các cut? Động tác có tiếp xúc và trước/sau rõ?
- Có hình nào làm một ẩn dụ trông như sự kiện hoặc biến dữ liệu chưa biết thành con số chính xác?
- Nghe mix có hiểu giọng dễ dàng và nhận đúng phản ứng/câu chốt không?

Ghi meets inspected requirement / needs revision / not evaluated, kèm vị trí. Không chấm điểm retention tưởng tượng. Sau pilot mới quyết định khóa profile, mở rộng component và dựng cả tập.

## Công cụ và trạng thái triển khai

Tiếp tục dùng Remotion hiện có cho timeline/composite/render. Chuẩn bị artwork theo nhu cầu scene bằng công cụ sẵn có; chưa có căn cứ phải mua hoặc cài editor mới. Video003 vẫn dùng renderer riêng đã chốt. Wrapper scripts/medieval/render.mjs vẫn là đường preflight cho generic renderer, không được coi là wrapper cho mọi composition.

Đã triển khai thêm trong renderer/schema:

- Text: textRole headline/keyLabel/scopeNote, fontSize override, lineHeight, align, padding. Role lấy cỡ từ profile và scale theo chiều cao episode; props compile có cỡ cụ thể giúp giữ snapshot đã chọn. Font/role chưa cung cấp tự fit hoặc phát hiện overflow; cần kiểm tra composite.
- Motion: keyframes shot/layer-relative với x/y/scale/rotate/opacity và easing linear/smooth/ease-in/ease-out/hold. Easing trên keyframe đích điều khiển segment đi vào nó. Thiếu field thì kế thừa trạng thái trước. Keyframe đầu phải ở 0; keyframe cuối ở trong lifetime (nhỏ hơn exclusive end). Không dùng motion cũ và keyframes đồng thời trên cùng layer.
- Layer group: kind group; parentId phải trỏ group trong shot, không vòng lặp. x/y của con là tâm trong hệ tọa độ top-left của parent box; thời gian con vẫn tương đối với shot, phải nằm trong thời gian parent. z chỉ có nghĩa trong cùng nhóm. pivotX/Y chuẩn hóa 0–1 là transform-origin trong box, không thay ý nghĩa x/y tâm layer. Điểm tiếp xúc vẫn cần người dựng thiết kế và xem kiểm tra; không có IK tự động.
- Camera: reason bắt buộc, keyframes tương đối shot, x/y là offset pixel; pivot mặc định giữa canvas. Camera áp lên toàn bộ layer của shot, gồm chữ; HUD cố định riêng chưa được bổ sung. Giữ camera tĩnh nếu không có lý do reframe.
- Audio: bổ sung role ambience/action/editorial-accent; loop cho music hoặc ambience; gainEnvelope điểm {frame,gain}, gain 0–1, bắt đầu frame 0, thứ tự tăng và nằm trong clip. Gain cuối cùng = volume × fade × envelope. Đây là automation do người dựng viết, không phải auto-duck hoặc mix đã được nghe.

Lệnh chạy trong root Remotion:

```powershell
node scripts/medieval/compile-profile.mjs examples/medieval/style-upgrade-v02.input.json examples/medieval/style-upgrade-v02.props.json
node scripts/medieval/preflight.mjs examples/medieval/style-upgrade-v02.props.json
node scripts/medieval/render.mjs examples/medieval/style-upgrade-v02.props.json out/medieval/style-upgrade-current.mp4
node --test scripts/medieval/contracts.test.mjs scripts/medieval/style-upgrade.test.mjs scripts/medieval/animation-direction.test.mjs
```

Compiler và render wrapper từ chối ghi đè output có sẵn: dùng tên version mới khi chạy lại. Compiler giữ giá trị explicit và chỉ điền default thiếu; không tự đổi fps/retime frame có sẵn. Không bỏ fps ở input đã có frame timing thuộc một fps khác. File props mẫu là technical fixture sáu giây không có voice/art lịch sử, không phải pilot mỹ thuật 45–60 giây. Trong Studio chọn MEDIEVAL-STYLE-UPGRADE để xem mẫu mới; MEDIEVAL-EPISODE vẫn giữ fixture mặc định cũ và nhận props episode riêng.

Chưa triển khai: model sheet mới, rig/IK/lip-sync, asset mới, pilot C với narration, nghe mix và chứng minh thị hiếu khán giả. Không coi nâng engine là hoàn thành những phần này.

## Cập nhật v1.2 — sau audit animation

Process vận hành sau content hiện được lưu ở `D:/Youtube/Medieval Life Explained/content-system/CONTENT_TO_VIDEO_PROCESS_V01_VI.md`, được route bằng `production_workflow` trong canonical index. Video004 có `production/SCENE_VALIDATION_BRIEFS_V01_VI.md` và state JSON; đó là hai excerpt brief, không phải animatic. Vòng mới là scene → draft art/voice → playable animatic → sửa meaning/staging/timing → polish → kiểm export; dùng một finding register, không thêm approval gate.

Skill video-plan hiện có reference animation-direction-and-build; skill visual-assets có animation-asset-contract. Đó là hướng dẫn đã cập nhật, không phải bộ artwork C đã tạo. Scene brief bổ sung ý định/eyeline/key pose, lựa chọn mức animation, grip/registration và provenance.

Đã bổ sung `space: world|screen` trên root layer. Screen roots render ở lớp phủ trên world và đứng ngoài camera; group con kế thừa space, không được override. Không đặt một layer con của group world thành screen. Camera chỉ ảnh hưởng world roots; `z` sắp xếp trong từng không gian/nhóm.

Compiler hỗ trợ `at` thay `frame` cho keyframe layer/camera, kèm `occurrence` và `offsetFrames`. Keyframe đầu vẫn dùng frame 0. Cue layer xuất ra frame tương đối thời điểm vào layer; cue camera tương đối shot. Cue audio dùng `at` + `cueShotId` thay `fromFrame`, xuất frame tương đối episode. Không ghi đồng thời hai kiểu thời gian trên cùng điểm. Cue/offset phải ở trong shot, keyframe phải ở trong lifetime và giữ thứ tự; thiếu/ambiguous cue phải lỗi. `offsetFrames` chỉ điều khiển điểm cue, không tự làm các đoạn cố định khác dịch theo.

`build` là metadata bên ngoài `episode`, chứa profile ID/version, fingerprint fps/word-map/voice config và danh sách cue đã resolve. Fingerprint không phải hash file audio, không xác minh alignment và không tự phát hiện audio cùng tên đã thay bytes. Khi đổi audio, kiểm tra/regenerate word map, cập nhật version và recompile. Preflight hiện kiểm tra schema/files/audio bounds, không coi fingerprint là chứng nhận source freshness.

| Profile field | Consumer thực tế | Giới hạn |
|---|---|---|
| canvas | compile-profile điền khi thiếu | Không retime timeline đã có; explicit values giữ nguyên |
| palette.paper / ink | compiler cho background / text thiếu màu | Không recolor ảnh hoặc mọi rect |
| typography.sizesAt1080 | compiler và renderer role fallback | Không tự wrap/fit/kiểm tra tràn |
| typography.fontFile / weight | Mô tả font đang dùng; loader nằm src/design/typography.ts | Đổi profile không tự đổi font loader |
| safeInsetPixels | Chỉ đạo layout / QA | Chưa có validator hình học tự động |
| art / motion timing trials / sound palette | Người dựng, asset brief và QA | Không tự tạo pose, auto-acting hoặc auto-mix |

Mẫu v02: compile `examples/medieval/style-upgrade-v02.input.json` thành props cùng tên version; chạy preflight; mở MEDIEVAL-STYLE-UPGRADE. Script `node scripts/medieval/verify-style-render.mjs v02` render technical fixture bằng API với public tối thiểu, không thay thế wrapper final. Output có sẵn không ghi đè. Chỉ giữ mẫu cuối v02; các audit/result cũ được gộp vào [CURRENT_STATE_AND_QA_VI.md](CURRENT_STATE_AND_QA_VI.md). Lệnh compile minh họa cách tạo props khi output chưa tồn tại; file props hiện hành đã có, không cần chạy compile lại khi chỉ xem mẫu.
