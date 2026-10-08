# BUILT INTO YOU — V001 · Remotion build

Dựng video từ 9 file audio ElevenLabs + 161 asset đã key nền, bám đúng shot plan
trong `Built Into You/Video001/Create_data/Image/*.md`.

## Luồng dữ liệu

```
Create_data/Image/*.md ──parse_assets.py──► scripts/biy/asset_map.json  (mã A1/B2… → tên asset)
Create_data/Image/0X/*.jpeg ──key_assets.py──► public/biy/assets/sXX/*.png  (đã xoá nền magenta)
Create_data/Audio/Audio0X.mp3 ──make_captions.py──► public/biy/captions/sXX.json  (Caption[] từng chữ)
                                                  └► public/biy/captions/sXX.paragraphs.json
src/biy/timeline/sXX.ts  ──anchor khớp caption──►  shot bám đúng lời đọc
```

Không có timecode nào viết tay: mỗi shot khai báo **anchor** là cụm từ trong lời đọc,
lúc chạy sẽ tra ra mili-giây từ caption. Thu lại audio → chỉ cần chạy lại
`make_captions.py`, toàn bộ timing tự dịch theo.

## Lệnh

```bash
# 1. asset: đọc ledger rồi key nền magenta (chạy lại khi có asset mới)
python scripts/biy/parse_assets.py
python scripts/biy/key_assets.py

# 2. caption: transcribe + căn chỉnh về đúng chữ trong script v4
python scripts/biy/make_captions.py            # cả 9 section
python scripts/biy/make_captions.py 06         # chỉ 1 section

# 3. kiểm tra mọi anchor còn khớp lời đọc (chạy sau mỗi lần sửa timeline)
python scripts/biy/check_timeline.py

# 4. dựng
npx remotion studio                            # xem/sửa trực tiếp
npx remotion still src/index.ts BIY-S01 out/x.png --frame=900
npx remotion render src/index.ts BIY-S01 out/biy/S01.mp4
npx remotion render src/index.ts BIY-FULL out/biy/BIY-V001.mp4
```

## Composition

| id | nội dung |
|---|---|
| `BIY-FULL` | cả 9 section, có khoảng lặng 0.7s giữa các section (12:07) |
| `BIY-S00` … `BIY-S08` | từng section, bật sẵn overlay debug hiện shot đang chạy |

Props: `showCaptions` (phụ đề dưới), `debug` (tên shot + cảnh báo anchor hỏng).

## Cách viết một shot

```ts
{
  id: "1.13",
  anchor: "Around eighty to ninety percent",   // shot bắt đầu ở đây
  push: 4,                                     // camera push 4% suốt shot
  layers: [
    { id: "stat", kind: "number", text: "80–90%", x: 960, y: 520,
      enter: "POP", until: 1.4, props: { size: 300 } },
    { id: "map", src: "s01/asset_east_asia_map_v01", x: 770, y: 590, w: 980,
      enter: "FADE", delay: 1.4 },
  ],
}
```

- `at: "cụm từ"` — layer xuất hiện đúng lúc đọc tới cụm đó (luật đồng bộ ngữ nghĩa).
- `delay` — giây tính từ đầu shot, dùng khi không cần bám chữ.
- `until` — giây, layer biến mất sau đó.
- `enter`: `POP` · `DRAW` · `SLIDE` · `FADE` · `NONE`.
- `state`: `STATIC` · `ALIVE` (dao động ±0.35°) · `ACTIVE` (pulse một lần).
- `props.toX/toY/travel` — layer di chuyển (vi khuẩn vào bếp, núm vặn lăn đi).

`kind` dựng bằng code, không cần ảnh: `text` `number` `card` `windows` `grid`
`columns` `gauge` `scale` `bodyWindow` `strike` `bubble` `odor` `slash` `arrow`
`dot` `tether` `warning`.

## Luật đã cài sẵn trong engine

- Bỏ global wobble; chỉ còn STATIC / ALIVE / ACTIVE.
- Grid dân số luôn là **nhân bản một pose đã duyệt**, không sinh ảnh đám đông.
- 1.7–1.11, 2.6–2.12, 3.7–3.10, 4.6–4.10, 6.4–6.7, 7.4–7.9 dùng chung một canvas
  cơ chế: đổi state chứ không render lại.
- Mỗi section có `leadInMs` rất ngắn (200–300ms) chỉ để frame 0 không bị cụt
  phụ âm đầu. **Không có khoảng lặng mở đầu**: shot đầu tiên luôn chiếm frame 0
  và đã dựng sẵn hình, không pop từ màn trắng.
- Shot `0.P` (payoff preview không lời) trong file 00 đã bị CẮT — 0.9s im lặng
  trước câu đầu là dead air, và nếu cho chạy đè lên câu đầu thì phạm luật đồng bộ
  ngữ nghĩa. Payoff đó do mục 1 giao ở ~0:24.

## Ba luật chống frame trắng (đã cài trong engine)

1. **Shot chạy tới đúng frame bắt đầu của shot kế** — `duration = startFrame(i+1) - startFrame(i)`.
   Làm tròn `from` và `duration` độc lập sẽ thủng 1 frame ở những chỗ ngẫu nhiên,
   và vị trí lỗ đổi mỗi lần timing thay đổi.
2. **Layer nền của mỗi shot dựng tức thì** — layer đầu tiên không `at`, không `delay`
   sẽ bỏ hiệu ứng nếu hiệu ứng đó bắt đầu từ vô hình (`FADE`, `DRAW`).
3. **POP/SLIDE không bắt đầu từ opacity 0** (0.55 và 0.5) — khi cả shot cùng POP
   thì frame đầu sẽ trắng.

Kiểm tra bằng cách giải nén toàn bộ frame rồi đo ink, đừng lấy mẫu thưa:
lỗi 1 frame không hiện ra ở mức 1–2 frame/giây.

## Lưu ý về asset

`key_assets.py` chạy hai ngưỡng alpha:
- sàn **120** — ảnh nguồn có vệt hồng nhạt (rgb ~255,80,250) ở góc, nếu để sàn thấp
  thì vệt này sống sót và hiện thành đốm hồng trên video;
- crop theo alpha **> 180** — nếu crop theo ngưỡng thấp, khung PNG giữ gần nguyên
  ảnh gốc, chủ thể nằm lệch góc trên-trái và mọi toạ độ/kích thước trong timeline
  đều sai (đây là lý do các ring không khoanh trúng cửa sổ).

Sau khi đổi ngưỡng, `h` trong timeline = chiều cao thật của chủ thể. Nếu re-key
lại bằng ngưỡng khác thì phải chỉnh lại size trong timeline.

## Còn nợ

- Claim ledger chưa pass: các số `560M`, `1 IN 5`, evidence chip đang hiển thị
  nhãn `SOURCE PENDING` / `EVIDENCE PENDING`. Gỡ nhãn khi nguồn được xác minh.
- Cold open đang dùng cấu hình tạm: `FP_WINDOW=2`, `NB_WINDOW=1`, `LIT=[4,5,6]`
  (khai báo ở đầu `timeline/s00.ts`).
- Audio06 vẫn là bản đọc `CASP` theo kiểu đánh vần; script v4 đã sửa thành
  `Casp twelve`, render lại rồi chạy `make_captions.py 06`.
