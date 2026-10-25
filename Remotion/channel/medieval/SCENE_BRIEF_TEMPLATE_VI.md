# Scene brief — dùng trước khi viết timeline

Đây là hồ sơ đạo diễn, **không phải JSON props mà renderer hiện tại đọc được**. Một scene có thể cần vài shot. Không cần đủ mọi chế độ hình hoặc có C trong mọi scene.

- Episode / script version / plan version:
- Scene ID và các shot liên quan:
- Lời dẫn nguyên văn / paragraph ID:
- Câu hỏi đang giữ người xem:
- Sau scene, người xem hiểu thêm điều cụ thể gì:
- Căn cứ lịch sử / claim IDs / phần tái dựng hoặc ẩn dụ:
- Chế độ hình phù hợp và lý do:
- Bố cục đầu: ai/vật gì ở đâu, điểm nhìn chính, quan hệ không gian:
- Hành động hoặc thay đổi giải thích ý tưởng:
- Chuẩn bị → hành động → phản ứng → kết quả:
- C muốn gì / nhìn về đâu / key pose nào giúp đọc ý định / giữ yên chỗ nào:
- Kỹ thuật tối thiểu đủ dùng: hold/cut, pose swap, tách bộ phận hay rig; lý do:
- Điểm tiếp xúc cần giữ: bàn tay/đạo cụ, chân/sàn, vật chứa/vật được rót:
- Cái gì phải được nhìn thấy trước; cái gì phải chờ lời mới lộ:
- Cue nguyên văn / occurrence / timestamp thực nếu đã có audio:
- Beat trong chuyển động: phrase → keyframe/camera/audio; offset; frame cố định nào phải xem lại khi đổi voice:
- Với từng shot/beat: phần narration được phủ / thông tin nhìn thấy mới / framing / trạng thái đầu–thay đổi–kết quả / lý do giữ yên nếu có:
- Camera: hold/cut/reframe; nếu di chuyển, nó giúp người xem thấy gì:
- Chữ xuất hiện: nội dung chính xác / vai trò / thời điểm / cách bỏ đi:
- World hay screen space; chữ cần đứng ngoài camera không:
- Âm thanh: hành động hoặc không gian gì cần nghe; lúc nào nên yên:
- Asset IDs / path thật / pose / pivot / layer cần tách / phiên bản:
- Canvas / tỷ lệ C / baseline / registration / grip; dữ liệu đo thật hay mới yêu cầu:
- Nếu chưa có layer: phương án pose swap hoặc cut thay thế và giới hạn:
- Asset demand theo beat: pose/view/expression/prop-state/parts cần giao; cái gì dùng lại và khác gì ở lần dùng này:
- Family/role của ảnh; góc/chi tiết/hành động mới so với lần xuất hiện trước; callback giữ lại vì payoff gì:
- Kiểm coverage trước batch và sau integration: cue/shot nào còn thiếu view/state; asset chọn thật đã vào props chưa:
- Báo cáo reuse baseline/sau sửa khi đã resolve timing; đoạn dùng lâu/cặp liền/family nào cần xem theo ngữ cảnh; không tự pass bằng count:
- Count riêng: raster deliverables / native components và content states / timeline instances; cap user đặt nếu có, không suy từ count sơ bộ:
- Cách nối scene kế tiếp:
- Kiểm tra trên composite: điểm nhìn, chữ, continuity, lịch sử, cue:
- Kiểm tra trên video: động tác, nhịp câu chốt, giọng/âm thanh:
- Profile ID/version / voice và word-map version / build fingerprint / phần phải biên dịch lại:
- Findings: vị trí → lỗi → sửa → kiểm tra lại; chưa kiểm tra ghi rõ:
- Animatic: actual clip path hoặc chưa có / voice tạm hay take được chọn / mục đích kiểm của excerpt:
- Kết quả trước polish: meaning/staging/reveal đạt chưa / sửa ở script, asset, timing, sound hay tool / phần phải xem-nghe lại:

Không dùng cột "đã duyệt" thay cho bằng chứng. Không tự chèn pause, đổi lời, đổi tốc độ voice để ép scene vừa timeline. Đề xuất thay đổi và ghi phạm vi nếu phát hiện xung đột.
