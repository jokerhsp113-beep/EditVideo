import array
import json
import math
from pathlib import Path
import wave
import struct

ROOT=Path(__file__).resolve().parents[2]
plan=json.loads((ROOT/"examples/medieval/video003-v02.json").read_text(encoding="utf-8"))["plan"]
audit=json.loads((ROOT/"examples/medieval/video003-v02-audit.json").read_text(encoding="utf-8"))
OUT=ROOT/"out/medieval/revision-v02"
OUT.mkdir(parents=True,exist_ok=True)
def tc(t):
    return f"{int(t//60):02}:{t%60:05.2f}"
def read(file):
    with wave.open(str(ROOT/"public"/file),"rb") as w:
        if w.getnchannels()!=1 or w.getsampwidth()!=2 or w.getframerate()!=48000:
            raise ValueError("Expected mono 48 kHz PCM16")
        return array.array("h",w.readframes(w.getnframes()))
def db(value):
    return round(20*math.log10(max(value,1e-12)),2)
voice=read(plan["voice"])
levels=[]
for cue in plan["sfx"]:
    effect=read(cue["file"])
    start=round(cue["start"]/plan["fps"]*48000)
    segment=voice[start:start+len(effect)]
    peak=max(abs(v+effect[i]*cue["volume"]) for i,v in enumerate(segment))/32768
    levels.append(dict(time=tc(cue["start"]/plan["fps"]),
        effectPeakDbfs=db(max(abs(v) for v in effect)*cue["volume"]/32768),
        effectRmsDbfs=db((sum(v*v for v in effect)/len(effect))**.5*cue["volume"]/32768),
        voiceRmsDbfs=db((sum(v*v for v in segment)/len(segment))**.5/32768),
        mixedPeakDbfs=db(peak)))
    if peak>=1:
        raise ValueError("Clipping at "+str(cue))

def coverage(file):
    data=file.read_bytes()
    u16=lambda n:struct.unpack_from(">H",data,n)[0]
    u32=lambda n:struct.unpack_from(">I",data,n)[0]
    tables={data[12+i*16:16+i*16].decode():u32(20+i*16) for i in range(u16(4))}
    base=tables["cmap"]
    chars=set()
    for i in range(u16(base+2)):
        record=base+4+i*8
        if u16(record) not in (0,3):
            continue
        off=base+u32(record+4)
        fmt=u16(off)
        if fmt==4:
            count=u16(off+6)//2
            ends=off+14
            starts=ends+count*2+2
            deltas=starts+count*2
            ranges=deltas+count*2
            for j in range(count):
                end=u16(ends+j*2)
                start=u16(starts+j*2)
                delta=u16(deltas+j*2)
                offset=u16(ranges+j*2)
                for code in range(start,min(end,65534)+1):
                    glyph=u16(ranges+j*2+offset+(code-start)*2) if offset else (code+delta)%65536
                    if glyph:
                        chars.add(code)
        elif fmt==12:
            for j in range(u32(off+12)):
                start,end,glyph=struct.unpack_from(">III",data,off+16+j*12)
                chars.update(range(start if glyph else start+1,end+1))
    return chars
glyphs=coverage(ROOT/"public/fonts/PatrickHand-Regular.ttf")
characters=set("".join(line for definition in plan["definitions"].values()
                       for c in definition["cards"] for line in c["lines"]))
missing=sorted(characters-{chr(code) for code in glyphs})
if missing:
    raise ValueError("Missing handwriting glyphs: "+str(missing))
(OUT/"AUDIO_AND_FONT_QA.json").write_text(json.dumps(dict(missingGlyphs=missing,sfxLevels=levels),indent=2),encoding="utf-8")

why={
 "E01_intro":"Chỉ gọi tên nghĩa vụ trong mở đầu; sơ đồ đầy đủ dành cho đoạn giải thích sau.",
 "E02_week":"Định vị một hồ sơ cụ thể; số ngày và ngoại lệ hiện theo từng cụm lời.",
 "E02_autumn":"Cho thấy yêu cầu hai người, rồi đối chiếu với ruộng nhà còn chờ.",
 "E03_one_hugh":"Chốt câu đùa bằng chính C và nhãn ngắn; bỏ hình người sơ đồ.",
 "E04_reconstruction":"Đặt phạm vi tái dựng một lần, không lặp lại thành caption liên tục.",
 "E05_shared_space":"Tổng kết công dụng căn phòng sau khi đã thấy đồ chơi bị dọn đi.",
 "E07_crop_states":"Nối các công việc với giai đoạn của cây trồng.",
 "E08_resources_status":"Phân biệt giàu nghèo với tự do pháp lý; không dùng mũi tên nhân quả.",
 "E01_effort_recipients":"Giải thích ai nhận công sức; chỉ quay lại khi ý này được triển khai.",
 "E04_diet":"Giữ địa điểm bằng chứng và giới hạn suy luận về bữa ăn.",
 "E09_before":"Phân biệt hạt giống với phần để ăn.",
 "E10_hugh_produce":"Trình bày lượng nghĩa vụ dễ đọc, bỏ biểu tượng trứng lơ lửng.",
 "E11_abbot_claims":"Giới thiệu vị lãnh chúa là viện phụ, tránh mặc định lâu đài/hiệp sĩ.",
 "E09_transfer":"Hạt minh họa thực sự di chuyển từ giống sang thức ăn.",
 "E09_after":"Giữ trạng thái sau chuyển hạt, không nháy lại cùng thẻ ở câu tiếp.",
 "E12_sale_inputs":"Phần còn lại và mũi tên liên quan chỉ hiện khi lời tới phần tiền còn.",
 "E04_famine":"Đánh dấu cuộc khủng hoảng so sánh, giữ xuyên chuỗi thay vì bật lại mỗi câu.",
 "E13_power_relation":"Panel riêng giữ mặt nhân vật rõ; tiền công, giá và kết quả hiện nối tiếp.",
 "E13_shortfall":"Dành cả mệnh đề để đọc so sánh lượng mang về với nhu cầu.",
 "E14_not_offered":"Phân biệt có lúa trong kho với có lúa được đem bán.",
 "E16_portable":"Phần bỏ lại chỉ hiện khi lời nói tới nhà, ruộng và người quen.",
 "E17_location_services":"Nêu riêng Walter Hull, rồi cho thấy nghĩa vụ còn theo sau.",
 "E18_conditions":"Chỉ xuất hiện khi lời thực sự chuyển sang việc kiếm bữa ăn.",
 "E19_limited_right":"Chỉ rõ thắng lợi liên quan bờ và hàng rào, không xóa mọi nghĩa vụ.",
 "E20_support":"Hai lần dùng có vai trò khác nhau: đổi quyền thuê lấy hỗ trợ, rồi trách nhiệm của người kế nhiệm.",
 "E04_stanton":"Nêu hồ sơ Stanton riêng, không biến thành kết thúc chắc chắn của nhân vật tái dựng.",
}
sound_why=[
 "Một tiếng gõ khô nhỏ chốt nhịp ‘chỉ một Hugh’, không thêm vào các câu đùa khác theo công thức.",
 "Âm sượt ngắn bám hành động dọn đồ chơi để đổi công dụng căn phòng.",
 "Tiếng chạm trầm bám việc đặt bó lúa xuống.",
 "Âm giấy ngắn nhấn callback gà xuất hiện trong sổ nghĩa vụ.",
 "Âm sượt đi với chuyển hạt giống, giúp cảm nhận thay đổi công dụng.",
 "Tiếng chạm gốm ngắn chốt câu đùa về mảnh nồi.",
 "Tiếng kim loại nhỏ đúng lúc nhận tiền.",
 "Âm vải ngắn đúng hành động gấp đồ.",
 "Âm giấy nhỏ đánh dấu thẻ một vụ việc được ghi chép, không dùng tiếng búa tòa án.",
]
text=f"""# Video003 v02 — audit và sửa dựng

## Những nhận xét được xác nhận

V01 là lượt ghép đầu còn dùng overlay PNG cũ (Arial) và quy tắc hiện chữ ở 38% mỗi beat. Quy tắc đó không biết ý câu: có lần chữ hiện sớm, lặp liên tiếp, xuất hiện ở nội dung không liên quan hoặc chỉ còn rất ít thời gian đọc. Việc chia đều mọi ảnh còn đưa đạo cụ rời vào chỗ không cần thiết. Các lỗi này có thật; kiểm preflight và vài still ở lượt trước chưa đủ để phát hiện hết.

| Nhận xét | Sửa ở v02 |
|---|---|
| Mở đầu từ tốn | Tăng 7% riêng 32,94 giây đầu bằng atempo, giữ cao độ và toàn bộ từ; mở ngay bằng hành động gặt, thêm thay khung ở nhịp phản ứng Hugh. Tiết kiệm khoảng 2,15 giây. |
| Font không đúng bản cập nhật | Chuyển sang text SVG native dùng Patrick Hand local. Renderer chờ tải font; không dùng chữ nằm sẵn trong PNG cũ. |
| Dấu nối, chấm phẩy và câu văn trên màn hình | Viết lại thành nhãn hoặc hai dòng có chức năng. Không còn dấu chấm phẩy, ‘ — ’ hoặc ‘ - ’ trong các dòng chữ hiển thị. |
| Mũi tên khó nhìn | Nét xanh/nâu 9px tại khung 1080, viền sáng 17px, đầu nét hở cùng hệ InkArrow; vẽ theo đường. Bỏ mũi tên không có quan hệ hợp lý, như giữa tài sản và địa vị. |
| Thiếu animation/SFX | Thêm draw-on ở sơ đồ, chuyển hạt giống thực sự và crop theo động tác/phản ứng ở các cảnh được chọn; 9 cue âm thanh có lý do bên dưới. Không giả chuyển động tay/chân trên hình đã gộp. |
| Vật lạc quẻ ở ~0:22 | Đó là hình người sơ đồ E03_spare_worker. Đã bỏ toàn bộ. Dùng hình C hiện có với phản ứng gần hơn và nhãn ‘Only one Hugh’. Không cần gen thêm ảnh. |
| Chữ lặp và timing không đúng ý | Từ 75 lượt overlay xuống 27. Bỏ các lần chỉ nhắc lại lời, giữ scope/case cần thiết. Các phần của sơ đồ hiện theo cue được đối chiếu ASR. |
| Ô chữ dài hoặc không vừa | Đo từng dòng bằng chính font Patrick Hand, xuống dòng và tính kích thước card. Kiểm fit/safe region không có lỗi. |
| Lỗi khác | Dời nhãn khỏi mặt/đầu ở đoạn địa vị, gia cầm, vụ Hugh Cross, bữa ăn và rời nhà. Bỏ trứng rời. Đưa so sánh tiền công/giá lúa sang panel riêng. Bỏ đạo cụ đồ chơi rời khỏi đoạn kết. |

## Vì sao giữ những chữ này

Chữ phục vụ một trong ba việc: xác định hồ sơ/phạm vi, nêu giá trị cần so sánh, hoặc làm quan hệ khó thấy trở nên rõ. Những câu chỉ kể lại hành động đang thấy và đang nghe được bỏ. Các chi tiết minh họa hạt lúa vẫn được ghi là minh họa, không phải số đo lịch sử. Các hồ sơ Hugh Miller, Walter Hull, Hugh Cross và Stanton vẫn là các trường hợp khác nhau.

| Thời điểm v02 | Overlay | Cụm lời để vào | Lý do |
|---|---|---|---|
"""
for o in plan["overlays"]:
    text+=f"| {tc(o['start']/plan['fps'])}–{tc(o['end']/plan['fps'])} | {o['variant']} | {o['cue']} | {why[o['variant']]} |\n"
text+="\n## SFX: vị trí và chức năng\n\nCác âm ngắn được tạo nguyên bản bằng tổng hợp, dùng như nhấn âm tiết/tiếp xúc, không giả là thu âm hiện trường thời Trung cổ. Chúng thấp hơn voice. Không thêm nhạc nền hoặc âm hài vào đoạn nạn đói và tử vong.\n\n| Thời điểm v02 | Cue | Vì sao thêm |\n|---|---|---|\n"
for s,reason in zip(plan["sfx"],sound_why):
    text+=f"| {tc(s['start']/plan['fps'])} | {s['cue']} | {reason} |\n"
text+=f"""
## Kiểm tra và giới hạn

- Timeline: {len(plan['shots'])} beat, {sum(len(s['cuts']) for s in plan['shots'])} lượt hình, 27 lượt overlay. Audio sửa dài {audit['duration']:.3f} giây (~9:30,3); output 720p/24fps.
- Kiểm fit và ký tự trong toàn bộ text native: không overflow, không thiếu glyph Patrick Hand.
- Kiểm mức audio bằng dữ liệu PCM: 9 cửa sổ chứa SFX không clipping; peak lớn nhất trong các cửa sổ mix là {max(x['mixedPeakDbfs'] for x in levels):.2f} dBFS. Đây là kiểm kỹ thuật, không thay thế nghe cảm nhận.
- Đã mở rà bảng ảnh giữa của toàn bộ 191 lượt hình và trạng thái hiện đủ của cả 27 overlay, không chỉ vài still mẫu. Đã sửa tiếp nhãn chạm phần đầu ở bữa ăn và cảnh rời nhà. Chữ, mũi tên và nhịp hiện nội dung không còn dựa vào overlay PNG cũ.
- Đã kiểm ba trạng thái trước, trong và sau chuyển hạt. Kiểm dữ liệu bảo toàn 80 hạt minh họa, không trùng tọa độ ở hai đầu: phần giống 60 → 40, phần ăn 20 → 40. Đây là sơ đồ minh họa, không phải lượng lịch sử.
- Chưa có thử nghiệm khán giả hoặc bằng chứng tăng retention. Cần xem/nghe toàn video mới để đánh giá cảm giác, đặc biệt SFX có tự nhiên hay không.
- V01, audio gốc, storyboard và asset gốc được giữ nguyên. Bản v02 là bản sửa dựng để review, chưa tự coi là bản phát hành cuối.

Manifest dựng: examples/medieval/video003-v02.json. Audit máy theo cue: examples/medieval/video003-v02-audit.json. Renderer: src/medieval/Video003Revision.tsx. Composition VIDEO003-REVISION có trong Studio của kênh.
"""
(OUT/"VIDEO003_REVISION_V02_AUDIT_VI.md").write_text(text,encoding="utf-8")
print(json.dumps(dict(missingGlyphs=missing,maxMixPeakDbfs=max(x["mixedPeakDbfs"] for x in levels),report=str(OUT/"VIDEO003_REVISION_V02_AUDIT_VI.md")),ensure_ascii=False))
