"""Local ASR and traceable beat alignment; does not imply a listening review."""
import sys, pathlib, json, subprocess, hashlib, re, difflib
WORK=pathlib.Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2')
sys.path.insert(0,str(WORK/'render-tools/asr-python'))
import numpy as np
from faster_whisper import WhisperModel
ROOT=pathlib.Path(__file__).resolve().parents[2]
EP=pathlib.Path(r'D:\Youtube\Medieval Life Explained\videos\Video004')
OUT=ROOT/'out/medieval/video004-v03'
OUT.mkdir(parents=True,exist_ok=True)
AUDIO=EP/'audio/Audio001.mp3'
raw=OUT/'ASR_RAW.json'
fingerprint=hashlib.sha256(AUDIO.read_bytes()).hexdigest()
if raw.exists():
    result=json.loads(raw.read_text(encoding='utf-8'))
    assert result['sha256']==fingerprint
else:
    model_path=next((WORK/'render-tools/asr-models/models--Systran--faster-whisper-base.en/snapshots').iterdir())
    model=WhisperModel(str(model_path),device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True)
    ff=WORK/'render-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'
    pcm=subprocess.run([str(ff),'-v','error','-i',str(AUDIO),'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True,check=True).stdout
    samples=np.frombuffer(pcm,dtype=np.int16).astype(np.float32)/32768
    segments,info=model.transcribe(samples,language='en',beam_size=5,word_timestamps=True,vad_filter=False)
    result={'sha256':fingerprint,'duration':info.duration,'model':'faster-whisper base.en int8 local','human_listened':False,'words':[]}
    for seg in segments:
        result['words'].extend({'word':w.word,'start':w.start,'end':w.end,'probability':w.probability} for w in seg.words or [])
        print(round(seg.end,1),seg.text,flush=True)
    raw.write_text(json.dumps(result,indent=2),encoding='utf-8')
def toks(s): return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",s.lower().replace('’',"'"))
board=json.loads((EP/'production/STORYBOARD_CURRENT.json').read_text(encoding='utf-8'))
beats=[b for s in board['scenes'] for b in s['beats']]
master=[]; ranges=[]
for b in beats:
    start=len(master); master+=toks(b['narration']); ranges.append((start,len(master)))
spoken=[]; times=[]
for w in result['words']:
    for t in toks(w['word']): spoken.append(t); times.append(w)
matcher=difflib.SequenceMatcher(None,master,spoken,autojunk=False)
mapping={}; mismatches=[]
for op,a,b,c,d in matcher.get_opcodes():
    if op=='equal': mapping.update(zip(range(a,b),range(c,d)))
    else: mismatches.append({'op':op,'script':' '.join(master[a:b]),'asr':' '.join(spoken[c:d]),'scriptIndex':a})
assert len(mapping)/len(master)>.92, 'ASR/script disagreement requires investigation'
aligned=[]
for b,(start,end) in zip(beats,ranges):
    matched=next((i for i in range(start,end) if i in mapping),None)
    assert matched is not None,b['id']
    offset=matched-start
    at=times[mapping[matched]]['start']-offset*.22
    aligned.append({'id':b['id'],'start':max(0,at),'narration':b['narration'],'exactStart':start in mapping,'unmatchedLeadingWords':offset})
for i,b in enumerate(aligned):
    b['end']=aligned[i+1]['start'] if i+1<len(aligned) else result['duration']
    assert b['end']>b['start'],b
report={'status':'ASR word aligned; not human listened','sha256':fingerprint,'exactTokenFraction':len(mapping)/len(master),'mismatches':mismatches,'beats':aligned,'words':result['words']}
(OUT/'ALIGNMENT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('ALIGNMENT',len(aligned),report['exactTokenFraction'],flush=True)
