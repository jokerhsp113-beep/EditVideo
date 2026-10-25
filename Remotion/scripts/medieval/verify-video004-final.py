"""Inspect final encode, verify unchanged timeline/audio and write delivery notes."""
import pathlib,subprocess,json,hashlib
WORK=pathlib.Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2')
ROOT=pathlib.Path(__file__).resolve().parents[2]
BIN=WORK/'render-tools/ffmpeg-9.0.2-essentials_build/bin'
OUT=ROOT/'out/medieval/video004-final'
movie=OUT/'VIDEO004_FINAL_1080p30.mp4'
def probe(file):
 return json.loads(subprocess.run([str(BIN/'ffprobe.exe'),'-v','error','-show_streams','-show_format','-of','json',str(file)],capture_output=True,text=True,check=True).stdout)
meta=probe(movie)
video=next(s for s in meta['streams'] if s['codec_type']=='video')
audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
if video['pix_fmt']=='yuvj420p' or video.get('color_range')=='pc':
 # Remotion's JPEG path can tag the encode as full range despite pixelFormat.
 # Convert the actual sample range before tagging the delivery as limited range.
 delivery=OUT/'VIDEO004_FINAL_delivery.mp4'
 assert not delivery.exists(),'Do not overwrite an existing delivery conversion'
 print('Normalize video range and enable faststart; audio stream copied unchanged',flush=True)
 subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-i',str(movie),'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','18','-threads','6','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','copy','-movflags','+faststart',str(delivery)],check=True)
 delivery.replace(movie)
 meta=probe(movie);video=next(s for s in meta['streams'] if s['codec_type']=='video');audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['r_frame_rate'])==(1920,1080,'30/1')
assert video['pix_fmt']=='yuv420p'
assert abs(float(meta['format']['duration'])-458.16163265306125)<.12
before=json.loads((ROOT/'examples/medieval/video004-v03.props.json').read_text(encoding='utf-8'))['episode']
after=json.loads((ROOT/'examples/medieval/video004-final.props.json').read_text(encoding='utf-8'))['episode']
assert before['audio']==after['audio']
assert [(s['id'],s['fromFrame']) for s in before['shots']]==[(s['id'],s['fromFrame']) for s in after['shots']]
subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','-'],check=True)
for second in [24,81,201,365,457]:
 subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-ss',str(second),'-i',str(movie),'-frames:v','1','-y',str(OUT/f'export-final-{second}.png')],check=True)
report={'file':movie.name,'seconds':float(meta['format']['duration']),'width':1920,'height':1080,'fps':30,'pixelFormat':video['pix_fmt'],'videoCodec':video['codec_name'],'audioCodec':audio['codec_name'],'fullDecodePassed':True,'voiceAndTimingUnchangedFromV03':True,'shots':len(after['shots']),'font':'Patrick Hand regular','textFill':'#111820','textHalo':'#FFF9E8','nativeHaloSvgUnits':3,'htmlHaloPixelsAt1080':3,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
(OUT/'EXPORT_CHECK_FINAL.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(OUT/'FINAL_NOTES_VI.md').write_text('''# Video004 — bản chốt

Nội dung và dựng V03 được người dùng duyệt. Lần chốt chỉ sửa khả năng đọc của chữ:

- Chữ gần đen `#111820`, viền kem mảnh `#FFF9E8`; áp dụng cho chữ HTML và nhãn SVG.
- Giữ Patrick Hand regular, không hộp chữ; không thay wording, voice hoặc mốc cắt.
- Xuất master 1920 × 1080, 30 fps, H.264/yuv420p + AAC, khoảng 7:38.

Đã kiểm TypeScript, preflight cấu trúc, 8 khung typography mẫu ở 1080p; so timeline/audio với V03 và giải mã toàn file. Metadata và fingerprint nằm trong EXPORT_CHECK_FINAL.json. Các frame từ file cuối được trích để kiểm bằng mắt. Không ghi nhận lại lần nghe duyệt toàn bộ giọng trong vòng sửa màu chữ này.

Timeline chỉnh sửa: `D:/Youtube/EditVideo/Remotion/examples/medieval/video004-final.props.json`.
Composition: `VIDEO004-FINAL`, entrypoint `src/medieval/index.ts`.
Các trạng thái nguồn asset được giữ trong props; kiểm export ở đây là kiểm kỹ thuật file, không thay đổi dữ liệu nguồn.
''',encoding='utf-8')
print(json.dumps(report))
