import struct,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[2]
def coverage(file):
    data=file.read_bytes()
    u16=lambda n:struct.unpack_from('>H',data,n)[0]
    u32=lambda n:struct.unpack_from('>I',data,n)[0]
    tables={data[12+i*16:16+i*16].decode():u32(20+i*16) for i in range(u16(4))}
    base=tables['cmap']; chars=set()
    for i in range(u16(base+2)):
        record=base+4+i*8
        if u16(record) not in (0,3): continue
        off=base+u32(record+4); fmt=u16(off)
        if fmt==4:
            count=u16(off+6)//2; ends=off+14; starts=ends+count*2+2; deltas=starts+count*2; ranges=deltas+count*2
            for j in range(count):
                end=u16(ends+j*2); start=u16(starts+j*2); delta=u16(deltas+j*2); offset=u16(ranges+j*2)
                for code in range(start,min(end,65534)+1):
                    glyph=u16(ranges+j*2+offset+(code-start)*2) if offset else (code+delta)%65536
                    if glyph: chars.add(code)
        elif fmt==12:
            for j in range(u32(off+12)):
                start,end,glyph=struct.unpack_from('>III',data,off+16+j*12)
                chars.update(range(start if glyph else start+1,end+1))
    return chars
hand=coverage(root/'public/fonts/PatrickHand-Regular.ttf'); fallback=coverage(root/'public/fonts/NotoSans-Regular.ttf')|coverage(root/'public/fonts/NotoSansSymbols2-Regular.ttf')|coverage(root/'public/fonts/NotoSansMath-Regular.ttf')
texts=['Cùng một nét chữ, cùng một nét vẽ','Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ơ Ư Đ Ứ Ừ Ử Ữ Ự','CO₂ H₂O 37°C β Δ → ≤ ± ≠']
for folder in ['src/biy/timeline','src/biy2/timeline']:
    for p in (root/folder).glob('*.ts'):
        texts.extend(re.findall(r'\b(?:text|title|label|sub|value):\s*"([^"\n]*)"',p.read_text(encoding='utf-8')))
for p in (root/'src/data').glob('manifest_shots*.json'):
    def visit(obj):
        if isinstance(obj,dict):
            for k,v in obj.items():
                if k in ['text','title','label','sub'] and isinstance(v,str): texts.append(v)
                else: visit(v)
        elif isinstance(obj,list):
            for value in obj: visit(value)
    visit(json.loads(p.read_text(encoding='utf-8-sig')))
needed={ord(c) for t in texts for c in t if not c.isspace()}
missing=needed-hand-fallback
report={'textSamples':len(texts),'uniqueCharacters':len(needed),'missing':[chr(c) for c in sorted(missing)],'symbolFallback':[chr(c) for c in sorted(needed-hand)],'fontFiles':['PatrickHand-Regular.ttf','NotoSans-Regular.ttf','NotoSansSymbols2-Regular.ttf','NotoSansMath-Regular.ttf'],'limits':'Checks cmap coverage for extracted editable text, not text baked into raster images or every possible future script.'}
out=root/'professional-editor-upgrade/professional-editor/output/visual-refresh/glyph-report.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=True))
raise SystemExit(bool(missing))
