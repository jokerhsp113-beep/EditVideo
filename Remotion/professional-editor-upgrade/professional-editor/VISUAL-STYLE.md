# BIY: quy chuẩn chữ và chú thích 2D

Yêu cầu người dùng ngày 13/10/2026: chữ đồng nhất, cảm giác vẽ tay; mũi tên/nét đứt hợp artwork; loại các chi tiết trang trí lạc quẻ. Áp dụng cho pipeline khoa học BIY/BIY2, InsideTheBody 002/003/004 và professional editor. Không áp dụng tự động cho project lịch sử hoặc thương hiệu khác.

## Typography

- Dùng `src/design/typography.ts`: Patrick Hand là font chính cho headline, nhãn và caption. Font được đóng gói local trong `public/fonts`, kèm giấy phép OFL.
- Noto Sans, Noto Sans Symbols 2 và Noto Sans Math chỉ bổ trợ các glyph khoa học/ký hiệu thiếu trong font chính. Không dùng font hệ thống làm giải pháp cho ký tự đã biết.
- Font load lỗi phải dừng render; không xuất bản video với fallback âm thầm. Loader sử dụng FontFace và Remotion delayRender/continueRender.
- Patrick Hand chỉ có weight 400: không giả bold. Phân cấp bằng kích thước, màu và khoảng cách. Caption phải rõ ở kích thước điện thoại; không thêm tracking rộng hoặc shadow dày.
- Chạy `python scripts/visual-refresh/check-glyphs.py` sau khi đổi text. Kiểm tra browser/render cho dấu, xuống dòng, clipping và glyph fallback. Coverage không chứng minh text-fit; chữ nằm sẵn trong PNG không nằm trong kiểm tra này.

## Mũi tên và nét đứt

- Dùng `InkArrow`, `InkLine` và `dashPattern` trong `src/design/Ink.tsx`. Đầu nét/khớp nối bo tròn, đầu mũi tên hở, đường cong nhẹ có geometry cố định.
- Animation vẽ theo đường, đầu mũi tên đi cùng endpoint; không reveal bằng cắt ngang SVG. Không random lại nét bút mỗi frame.
- Dash và gap tỷ lệ theo stroke width (1.6/2.2), không dùng nhiều chuỗi dash tùy tiện. Khoảng trống phải lớn hơn phần cap nối vào gap.
- Callout trỏ vào điểm có ý nghĩa trên artwork; normalized box không tự bảo đảm đúng semantic anchor. Connector phải tôn trọng opacity của plan.
- Giữ màu có ý nghĩa nội dung (nguy cơ, tín hiệu, trạng thái); tránh nhiều hiệu ứng trang trí cùng một beat.

## Loại chi tiết lạc phong cách

- Không shadow dày cho nhãn/chapter/caption; không sticker phản ứng tự thêm theo số thứ tự shot. `guideReaction` chỉ bật khi người dựng chủ động yêu cầu trong shot.
- Giữ artwork và nội dung cũ khi chưa có review cụ thể; không tuyên bố toàn bộ thư viện đã đẹp chỉ vì component dùng chung đã sửa.
- Xem actual frames: chú ý text/diagram/caption overlap, viền và màu khác artwork, callout lệch, marker quá to, ảnh nhỏ bị phóng lớn.

## Kiểm tra lại

```text
npm run lint
npm --prefix professional-editor-upgrade run editor:types
npm --prefix professional-editor-upgrade run editor:test
python scripts/visual-refresh/check-glyphs.py
node scripts/visual-refresh/render-review.mjs
npm --prefix professional-editor-upgrade run editor:stills
```

Composition `BIY-VisualStyle-Review` chứa chữ tiếng Việt, ký hiệu khoa học, mũi tên cong/thẳng và nét đứt. Renderer còn lấy mẫu một số cảnh legacy. Đây là kiểm tra regression và style, không thay thế review toàn bộ video hoặc thư viện raster.
