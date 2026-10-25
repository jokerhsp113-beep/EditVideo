from pathlib import Path
from PIL import Image,ImageDraw
import json,html,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v02';AUD=ROOT/'out/medieval/video005-audit-v02'
r=json.loads((OUT/'EXPORT_VERIFICATION_V02.json').read_text(encoding='utf8'))
r.update(visual_review_status='All 37 revised states inspected in 360px sheets; 51 actual exported frames inspected across five contact sheets, including all 37 revised states and opening/ending. 104 exact cut frames compared with authored state renders. No direct audio listening approval.',mix_technical_summary=dict(integrated_lufs=-18.5,true_peak_dbfs=-4.7,loudness_range_lu=2.0),revision='Typography/diagram/sound repair V02; narration and timeline unchanged')
(OUT/'EXPORT_VERIFICATION_V02.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8')
canvas=Image.new('RGB',(1200,760),'#E0DACF');d=ImageDraw.Draw(canvas)
for i,id in enumerate(['S023-T01','S061-T01']):
 for col,(label,p) in enumerate([('V01 - before',ROOT/f'out/medieval/video005-draft-v01/state-frames/V12-{id}.png'),('V02 - exported MP4',OUT/f'export-qa/{id}.jpg')]):
  im=Image.open(p).convert('RGB');im.thumbnail((596,335));x=col*600;y=i*380;canvas.paste(im,(x,y+34));d.text((x+8,y+9),id+' / '+label,fill='black')
canvas.save(OUT/'BEFORE_AFTER_V02.jpg',quality=95)
ff=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe'
clips=OUT/'audio-review';clips.mkdir(exist_ok=True)
for name,start,duration in [('opening',0,14),('bath',185,22),('ending',344.2,14.9667)]:
 subprocess.run([ff,'-v','error','-y','-ss',str(start),'-i',str(OUT/'VIDEO005_DRAFT_V02_1080p30.mp4'),'-t',str(duration),'-vn','-c:a','libmp3lame','-b:a','192k',str(clips/(name+'.mp3'))],check=True)
media=json.loads((AUD/'MEDIA_SOURCES_V02.json').read_text(encoding='utf8'));cards=[]
for item in media:
 rel=Path(item['file']).relative_to(ROOT/'public').as_posix();title=html.escape(item['title']);source=html.escape(item['source_page'],quote=True)
 status='Đã dùng' if item['kind']=='sfx' or item['title'] in ['There is Romance','Village Consort','Thinking Music'] else 'Phương án thay thế, chưa dùng'
 cards.append(f'<article><h3>{title}</h3><p>{status}</p><audio controls preload="none" src="public/{html.escape(rel,quote=True)}"></audio><p><a href="{source}">Nguồn chính chủ / tải miễn phí</a></p></article>')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><title>Video005 V02 — nghe và review</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#f4ede1;color:#30291f;font:18px/1.55 system-ui}video{width:100%;max-height:620px;background:#111}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{border-top:1px solid #c4b69e;padding:12px}audio{width:100%}h2{margin-top:38px}a{color:#345d80}</style><h1>Video005 — V02</h1><p>Bản review sau sửa chữ, sơ đồ và soundscape. Các đoạn âm thanh trích dưới đây là mix thực tế của MP4; file nguồn bên dưới có mức âm gốc khác bản mix. Agent chưa nghe duyệt trực tiếp.</p><video controls preload="metadata" src="../../final/draft-v02/VIDEO005_DRAFT_V02_1080p30.mp4"></video><h2>Nghe nhanh các đoạn cần review</h2><section>'''
for name,title in [('opening','Mở đầu: piano → chốt/cửa → khoảng lặng ngượng'),('bath','Tắm: tiếng nước và phản ứng của C'),('ending','Đoạn kết: callback piano, company và tiếng cười ngắn')]:page+=f'<article><h3>{title}</h3><audio controls preload="none" src="audio-review/{name}.mp3"></audio></article>'
page+='</section><h2>5 bản nhạc và 7 nguồn SFX</h2><section>'+''.join(cards)+'</section><h2>Tài liệu</h2><p><a href="AUDIT_BEFORE_EDIT_VI.md">Phân tích trước sửa</a> · <a href="AUDIT_AFTER_EDIT_VI.md">Audit sau sửa</a> · <a href="MUSIC_AND_SFX_SELECTION_VI.md">Danh sách và nguồn</a> · <a href="MUSIC_CREDITS_FOR_DESCRIPTION.txt">Credit cho description</a></p></html>'
(OUT/'REVIEW_MEDIA_V02.html').write_text(page,encoding='utf8')
print('Review package ready; boundary max RGB MAE',max(x['rgb_mae'] for x in r['all_state_boundary_checks']))
