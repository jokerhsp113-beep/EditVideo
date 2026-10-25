# Đối chiếu expectation – sửa đổi – nhu cầu khán giả

17/10/2026. Nội dung được đối chiếu: Video004, SCRIPT_EN_V06.md, 1.408 từ. Không đổi master. Skill/renderer được đối chiếu: profile 1.2; trạng thái hiện hành nằm trong [CURRENT_STATE_AND_QA_VI.md](CURRENT_STATE_AND_QA_VI.md). Đây là audit tài liệu, mã và script; không có private Analytics, audio V004 hay video V004 để đánh giá trải nghiệm thực tế.

## 1. Kết luận chính

Các sửa đổi đúng hướng về khả năng thực thi: hướng dẫn scene đã nối với cấu hình, cue hành động và chữ đứng ngoài camera có mã chạy/test. Chưa đạt toàn bộ expectation về một video có nhận diện, diễn xuất và sound design chuyên nghiệp: còn thiếu artwork C theo hành động, ví dụ ứng dụng trên chính Video004 và kiểm tra xem/nghe pilot. Không đồng nhất hoàn thành cấu hình với hoàn thành chất lượng sản phẩm.

Nhu cầu có căn cứ nhất cho topic này là hiểu một câu hỏi sinh hoạt cụ thể: khi tối đến, người ta có thực sự được nghỉ và được làm gì? Chưa có bằng chứng khán giả đòi hỏi rig phức tạp, nhiều motion hoặc hài kiểu sân khấu. Giọng comic monologue và C là lựa chọn sáng tạo của chủ kênh, cần thực hiện tốt; không giả là format được thị trường chứng minh tốt nhất.

## 2. Trước – sau – expectation

| Expect ban đầu | Trước nâng cấp | Sau nâng cấp | Kết luận |
|---|---|---|---|
| Một nhân vật nói chuyện trực tiếp, có cá tính | Script có C, hình chủ yếu minh họa/pose | Skill yêu cầu mục tiêu, eyeline, pose và phản ứng; chưa có clip C mới | Đúng hướng; diễn xuất chưa được chứng minh |
| Nét riêng nhìn ra cùng kênh | Concept C, Patrick Hand và nền ấm đã có | Profile/asset contract làm rõ invariant và QA | Mới chuẩn hóa mô tả; chưa có model sheet/pack đã qua composite QA |
| Chuyển động có chủ đích, vượt crop/zoom | Generic layer motion một giai đoạn | Keyframe/pivot/group/camera, world/screen | Đạt công cụ; không tự tạo staging hoặc acting |
| Hành động và câu chốt đúng nhịp lời | Cue ở điểm vào scene/layer | Cue nội bộ action/camera/audio-start, build cue log | Đạt cơ chế; chưa nghe alignment và delivery thực |
| Sound effect đúng kỹ thuật và có gu | Có một số clip/cue cũ | Có role/envelope/cue authoring và hướng dẫn nghe | Đạt điều khiển; chưa có palette âm thanh mới được nghe trong scene |
| Hình giúp người xem hiểu điều mới | Skill có viewer takeaway khá chung | Có scene contract, worked example | Chưa đủ bằng chứng với topic hiện tại; ví dụ tiền là bài tập khác, không phải scene Video004 |
| Có thể sản xuất ổn định cả tập | Nhiều module/cách dựng riêng | Generic pipeline rõ hơn, skill route thống nhất | Chưa thử trọn một đoạn mới từ skill → asset → audio → video; chưa đo công sửa tay |
| Video 8–10 phút | Script 1.408 từ | Không thay lời hoặc duration bằng nâng renderer | Vẫn cần đo audio; số từ sát mép dưới ở tốc độ tham chiếu cũ |

Lưu ý: 24 file được copy để cài/mirror skill không có nghĩa sửa nội dung 24 file. 24 tests kiểm tra các hành vi được viết test, không phải 24 bằng chứng khán giả thích.

## 3. Verify khán giả: nguồn nào nói được điều gì?

### Mở lại nguồn trong lượt này

| Bằng chứng | Access/locator | Kết luận được phép |
|---|---|---|
| [Spare time/time to sleep in the evenings](https://www.reddit.com/r/AskHistorians/comments/1g5n9oh) | Direct-open lỗi cache; search index đọc được OP | Tồn tại câu hỏi đúng premise: thiếu điện/ánh sáng có làm nghỉ/ngủ nhiều hơn? Không dùng giả định OP làm fact |
| [Candles valuable/expensive](https://www.reddit.com/r/AskHistorians/comments/s8yzy9) | Search index OP | Có người bối rối giữa nến xa xỉ và lâu đài thắp đầy nến. Script cần phân biệt, không vẽ một mức ánh sáng cho mọi tầng lớp |
| [Tasting History dinner watch](https://www.reddit.com/r/TastingHistory/comments/1k3mg08/tasting_history_is_my_dinner_watch/) | Mở lại OP và comments: aloneghost; BootsCostMonies; FantasticGlove; đoạn phản hồi về nói nhanh | Một số fan coi trọng học điều mới, mô tả dễ hình dung, cảm giác dễ chịu và xem trong sinh hoạt. OP phản đối một kiểu nói quá nhanh/cao trào liên tục. Không đại diện khán giả Medieval Life Explained |
| [Modern History TV accuracy](https://www.reddit.com/r/AskHistorians/comments/11l9w3h/how_accurate_are_modern_history_tvs_videos_on/) | Mở lại OP | Một người thích cách trình bày đời sống đồng thời muốn biết nguồn. Không kết luận kênh ấy đúng/sai lịch sử từ bài hỏi |
| [YouTube content performance](https://support.google.com/youtube/answer/16559650?hl=en) | Mở lại hướng dẫn chính thức | Appeal, engagement và satisfaction là các chiều khác nhau; hướng dẫn platform không chứng nhận một style hoặc mật độ hiệu ứng |

Nghiên cứu audience 16/10 và research packet Video004 được dùng như bằng chứng kế thừa với giới hạn đã ghi. Không lấy thêm một mẫu comment YouTube có hệ thống trong lượt này, không kiểm lại lượt xem thị trường hoặc phân tích private Studio. Không dùng số likes/search result count để tính tỷ lệ thị hiếu. Các bài Reddit là self-report/convenience sample; quan sát lại một bài cũ không làm tăng số người trong mẫu.

### Khán giả có thể thích gì và cần gì ở Video004?

| Nhu cầu/điểm tò mò | Căn cứ | Script hiện tại trả gì | Hình/âm cần làm | Chưa biết |
|---|---|---|---|---|
| Tối có cho nghỉ thật không? | OP spare-time, index | §01 trả sớm; §03–08 cho các điều kiện cụ thể | Làm rõ hết sáng/hết việc/được nghỉ là các trạng thái khác nhau | Bao nhiêu người của kênh muốn xem trọn đề tài |
| Duy trì ánh sáng thế nào? | OP candles, index | §02 rushlight, tallow, beeswax và khác điều kiện dùng | Cho thấy cơ chế giữ/điều chỉnh rushlight nếu nguồn đủ hình học; không bịa số lux/giá | Nhu cầu tutorial chi tiết hay chỉ hiểu nguyên lý |
| Việc gì còn tiếp tục? | Topic question + suy luận editorial | §03 forge, §04 care, §06 meadow watch | Hành động và hậu quả cụ thể, không chỉ biểu tượng nghề | Mức ưu tiên từng case trong nhóm xem thật |
| Tối có niềm vui không? | Các câu hỏi leisure/Oxford trong research packet, chỉ indexed | §05 tailors/music có scope festival | Shop được dùng khác đi; một nhóm chơi nhạc, không dựng cả thành phố thức hội | Case này có là phần được yêu thích nhất không |
| Nghe dễ chịu mà vẫn học được | Dinner-watch self-reports, khác kênh | Giọng companion, chi tiết có ví dụ, không lecture toàn bộ | Nhịp thay đổi theo ý; giọng rõ; âm nền/SFX có chọn lọc | Voice/tốc độ/mix nào phù hợp kênh này |
| Tin được điều vừa nghe | OP accuracy + ledger cũ | Date/place/poem/rule/case qualifications trong V06 | Scope card đúng lúc, không giả reconstruction là ảnh chứng cứ | Mức độ khán giả muốn đọc bibliography |
| C có duyên, thú vị | Expect chủ kênh; audience comedy evidence còn hạn chế | C có mong muốn nghỉ, phản ứng và sun callback | Diễn theo thought/reaction, giữ nghiêm túc ở đau khổ và cái chết | Mật độ/kiểu hài tối ưu; không suy từ tests |

“Cần” trong cột hình/âm là tiêu chí biên tập để đáp ứng lời hứa, không phải danh sách tất cả khán giả đã yêu cầu trong survey.

## 4. Audit từng phần Video004 so với cách dựng mới

| Phần | Gain người xem | Quyết định trình bày phù hợp | Rủi ro cần kiểm tra |
|---|---|---|---|
| §01 139 từ | Bớt ánh sáng không tự thành thời gian của mình | C muốn nghỉ, sun callback được setup; trả ý sớm bằng quan hệ rõ | Không biến thành tour “một đêm nông dân điển hình”; không bắt khán giả chờ hết intro mới hiểu topic |
| §02 146 từ | Ánh sáng cần vật liệu/công sức; nhìn thấy khác làm việc được | Cận prop/process và đối chiếu task; C phản ứng với “light switch ingredients” | Tránh cảnh đẹp đầy nến nhưng sai ý; không bịa cường độ sáng đo chính xác |
| §03 303 từ | Luật nghề có giới hạn; nghỉ của người này đụng việc người kia | Hai beat tách rõ: pewter rule và forge complaint; thể hiện âm thanh/khói vượt ranh giới không gian | Dài nhất, dễ thành hai hồ sơ nối nhau. Không đọc thêm nhãn lặp lời; không làm tiếng búa che giọng; defence là lập luận, không phải phán quyết |
| §04 120 từ | Về nhà/ngừng kiếm tiền chưa chắc được nghỉ | Không gian cradle/bed và hành động chăm sóc tiết chế; attribution poem | Không biến nghèo/hunger thành gag hoặc khẳng định mọi gia đình giống đoạn thơ |
| §05 225 từ | Shop có thể là nơi vui; thức chưa chắc đang lao động | Tư thế/hành động chơi nhạc thay ý định may; thay tone trước phần hậu quả chết người | Cảnh chết không thành punchline; festival/group có scope; không lẫn leisure với một nightly routine |
| §06 153 từ | Làm việc có thể là trông coi chứ không thu hoạch | Meadow-watch khác mục đích với music; chuyển cảnh cho thấy case khác | Không dựng hai nhóm gặp nhau hoặc đồng hồ chính xác ngoài điều nguồn nói |
| §07 194 từ | Có ánh sáng không đồng nghĩa được đi lại tùy ý | Biểu diễn điều kiện light/reason/reputation; London tách Oxford | Không biến quy định thành chứng cứ mọi người đều chấp hành; tránh cảnh quan to lớn không cần thiết |
| §08 128 từ | Quyền sử dụng thời gian phụ thuộc việc/nghĩa vụ/hoàn cảnh | Callback sun; nối lại những trường hợp đã xem | Không thêm bài học đạo đức mới hoặc bảng tính leisure trung bình không có nguồn |

Đây là mapping biên tập từ script đã đọc, không phải storyboard/asset mới đã sản xuất và không phải lần tái kiểm toàn bộ nguồn lịch sử. Claims kế thừa ledger V06/V05 trong episode.

## 5. Những điểm chưa khớp expectation cần nói thẳng

1. **Pilot hình khối không kiểm chứng nét riêng.** Nó chứng minh điều khiển, chưa chứng minh C có sức sống. Không được dùng mẫu này làm chuẩn mỹ thuật cuối.
2. **Worked example tiền chưa thử trên Video004.** Nó hữu ích để học diễn xuất nhưng không kiểm chứng rushlight, tiếng forge, chuyển tone care/music/death. Cần ứng dụng scene contract lên chính đoạn được chọn.
3. **Nhịp vui được hứa từ đầu nhưng trả ở phần năm.** §05 bắt đầu sau 708 từ: khoảng 4:01–4:26 nếu đọc 176–160 từ/phút, chưa cộng pause. Đây là thời gian ước tính, không điểm drop đo được. Kiểm tra cầu nối và reward ở §02/03 để body không thành một chuỗi gian khổ chờ âm nhạc; không tự sửa script đã chốt từ giả thuyết này.
4. **Runtime còn sát mép.** 1.408 từ khoảng 8:00 ở 176wpm, 8:48 ở 160wpm; nhanh hơn có thể dưới tám phút. Chỉ audio thật xác nhận. Không thêm pause vô nghĩa để lấp phút.
5. **Khán giả thích rõ ràng không kéo theo thích phức tạp.** Tăng rig hoặc camera không có ý nghĩa có thể làm khó theo dõi. Chỉ tăng mức animation ở đoạn cần thao tác/biểu cảm.
6. **Chưa xác minh toàn bộ nhu cầu trên chính kênh.** Nguồn ngoài chứng minh câu hỏi/khẩu vị có tồn tại, không chứng minh phân bố khán giả kênh. Cần feedback và performance sau này, nhưng không phải chờ dữ liệu mới sửa được lỗi craft có thể quan sát.

## 6. So với các cách trình bày liên quan

Nghiên cứu đối thủ trước đây chỉ đọc một số caption ranges, không nghe/xem toàn bộ. Tasting History cung cấp ví dụ cách một vật/việc cụ thể mang explanation và persona; Modern History TV có đời sống cụ thể và phạm vi; Ink được phân tích về câu hỏi liên hệ/callback. Đây là chức năng biên tập để học, không chứng minh pipeline, timing/acting hoặc retention của họ. Chưa có cơ sở xếp hạng video mới của mình hơn/kém họ sau nâng engine.

So với audiobook: V06 có sự kiện lịch sử nhưng C đang nói trực tiếp với người xem, không kể một tiểu sử hư cấu liên tục. So với stand-up sân khấu: có comic observations nhưng không yêu cầu mọi đoạn kết bằng punchline. Cách dựng cần hỗ trợ diễn giải lẫn phản ứng, giữ khoảng yên có ý nghĩa.

## 7. Kiểm tra tính toàn vẹn trong lượt audit này

Đọc lại script V06 và skill installed; đối chiếu report v02 với compiler hiện hành. Kiểm tra lại 24 target file trong install manifest: 0 hash mismatch. Đếm lời đọc theo whitespace trong tám section: 139/146/303/120/225/153/194/128 = 1.408 từ. Không chạy lặp lại bộ tests không thay mã; dùng kết quả 24/24 đã ghi của lượt sửa trước. Không sửa skill, engine, script hoặc audio trong lượt audit-only này; chỉ lưu bản đối chiếu.

**Đánh giá cuối:** phù hợp expectation ở cấp thiết kế hướng dẫn và cơ chế triển khai; còn thiếu chứng minh nghệ thuật/sản phẩm. Ưu tiên tiếp là scene thực của §02–03 để kiểm tra giải thích/contact/âm thanh, và một excerpt §05–06 để kiểm tra chuyển vui–nghiêm. Dùng timing tạm nếu chưa có audio, ghi đúng trạng thái; không tự tạo lịch sử để làm cảnh thú vị.
