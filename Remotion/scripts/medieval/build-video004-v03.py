"""V03: audio-cued opening, handwritten inserts, registered staging."""
import json,pathlib,copy,shutil,re,math
ROOT=pathlib.Path(__file__).resolve().parents[2]
EP=pathlib.Path(r'D:\Youtube\Medieval Life Explained\videos\Video004')
out=ROOT/'out/medieval/video004-v03'; out.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'examples/medieval/video004-animatic-v01.props.json').read_text(encoding='utf-8'))
e=data['episode']; a=json.loads((out/'ALIGNMENT.json').read_text(encoding='utf-8'))
e.update(id='video004-edit-v03',version='edit-v03',timingBasis='audio-aligned',words=[])
FPS=e['fps']; duration=e['durationInFrames']
manifest=json.loads((EP/'production/ASSET_MANIFEST_CURRENT.json').read_text(encoding='utf-8'))
def ensure(id):
    if any(x['id']==id for x in e['assets']): return
    asset=next(x for x in manifest['assets'] if x['id']==id)
    assert asset['status']=='generated-pending-composite',id
    p=pathlib.Path(asset['actualPath']); dest=ROOT/'public/medieval/video004-animatic-v01'/p.name
    shutil.copy2(p,dest)
    e['assets'].append({'id':id,'file':'medieval/video004-animatic-v01/'+p.name,'version':'v03-use','status':'draft','rights':'unresolved','role':'V03 inspected source, composite requires review'})
def img(id,x=960,y=540,w=1920,h=1080,z=0):
    ensure(id); return {'id':'img-'+id,'kind':'image','assetId':id,'x':x,'y':y,'width':w,'height':h,'z':z}
def nat(id,text='',x=960,y=540,w=1500,h=880,z=3):
    return {'id':'native-'+id,'kind':'native','nativeId':id,**({'text':text} if text else {}),'x':x,'y':y,'width':w,'height':h,'z':z}
def txt(text,x=960,y=170,w=1500,size=82):
    return {'id':'label-'+re.sub('[^a-z0-9]','',text.lower()),'kind':'text','text':text,'x':x,'y':y,'width':w,'height':210,'z':5,'color':'#30291F','fontSize':size,'lineHeight':1.05}
def paper(): return nat('N_PAPER',w=1920,h=1080,z=0)
def guide(pose,bg='BG_SHOP',right=None):
    return [img(bg),img(pose,x=470 if right else 960,y=525,w=850,h=1000,z=2)]+(right or [])
def study(ids):
    return [paper()]+[img(id,x=960+(i-(len(ids)-1)/2)*600,y=560,w=570,h=650,z=2) for i,id in enumerate(ids)]
def full(id):return [img(id)]
coinfile=ROOT/'public/medieval/video004-animatic-v01/EDITORIAL_COINS.svg'
coinfile.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><g fill="#BA8548" stroke="#3A302B" stroke-width="7" stroke-linejoin="round"><path d="M50 145v33c0 48 190 48 190 0v-33Z"/><ellipse cx="145" cy="145" rx="95" ry="43"/><path d="M164 81v33c0 48 190 48 190 0V81Z"/><ellipse cx="259" cy="81" rx="95" ry="43"/></g><g fill="none" stroke="#E9CF9F" stroke-width="5"><ellipse cx="145" cy="145" rx="67" ry="23"/><ellipse cx="259" cy="81" rx="67" ry="23"/></g></svg>',encoding='utf-8')
e['assets'].append({'id':'EDITORIAL_COINS','file':'medieval/video004-animatic-v01/EDITORIAL_COINS.svg','version':'v03','status':'draft','rights':'recorded','role':'Original code-native cost metaphor, not a specific historical denomination'})
def tokens(t):return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",t.lower().replace('’',"'"))
word_tokens=[]; wt=[]
for w in a['words']:
    for t in tokens(w['word']):word_tokens.append(t);wt.append(w)
def cue(phrase,after=0):
    target=tokens(phrase)
    for i in range(len(word_tokens)-len(target)+1):
        if wt[i]['start']>=after and word_tokens[i:i+len(target)]==target:return wt[i]['start']
    raise ValueError(('Missing phrase',phrase,after))
beatmap={b['id']:b for b in a['beats']}; original=copy.deepcopy(e['shots']);shots=[];notes=[]
# The opening is directed phrase by phrase. Materials appear on the spoken cue,
# the guide takes a seat on "have an evening", the sun is outside over a meadow.
material=[paper(),img('C_INGREDIENTS',x=430,y=545,w=750,h=950,z=2),img('PROP_RUSH',x=1140,y=410,w=600,h=360,z=2),txt('Fuel',x=1150,y=710,w=700,size=96)]
effort=copy.deepcopy(material);effort[1]=img('C_CHECK_SELF',x=430,y=545,w=750,h=950,z=2);effort[-1]=txt('Fuel. Effort.',x=1200,y=710,w=900,size=90)
effort.append(img('PROP_HOLDER',x=1510,y=420,w=220,h=430,z=2))
money=copy.deepcopy(effort);money[1]=img('C_SERIOUS',x=430,y=545,w=750,h=950,z=2);money[3]=txt('Fuel. Effort. Money.',x=1200,y=710,w=1000,size=82)
money.append(img('EDITORIAL_COINS',x=1170,y=535,w=300,h=200,z=3))
sunscene=[img('BG_MEADOW'),img('C_LOOK_SUN',x=480,y=545,w=810,h=970,z=2),nat('N_SUN',x=1450,y=270,w=460,h=460,z=1)]
sunscene[-1]['keyframes']=[{'frame':0,'y':270,'opacity':1,'easing':'linear'},{'frame':59,'y':400,'opacity':0,'easing':'smooth'}]
opening=[
 (0,'light',full('RUSHLIGHT_LIT_CLOSE')),
 (cue('fuel'),'fuel',material),
 (cue('effort'),'effort',effort),
 (cue('money'),'money',money),
 (cue('surely darkness'),'darkness',sunscene),
 (cue('stop working'),'stop',guide('C_HOPE')),
 (cue('put things down'),'put-down',guide('C_PUTDOWN')),
 (cue('have an evening'),'sit',guide('C_SEATED_CONTACT_A')),
 (cue('I like the idea'),'sun-employer',copy.deepcopy(sunscene)),
 (cue("we're finished"),'finished',[img('BG_MEADOW'),img('C_HOPE',x=510,y=545,w=810,h=970,z=2),nat('N_SUN',x=1450,y=360,w=600,h=600,z=1),txt('Finished?',x=1410,y=830,w=850,size=94)]),
 (cue('Difficult to argue with'),'argue',guide('C_CHECK_SELF','BG_MEADOW',[nat('N_SUN',x=1400,y=310,w=580,h=580)])),
 (cue('enormous'),'enormous',[paper(),nat('N_SUN',x=1200,y=480,w=1000,h=1000),img('C_LOOK_SUN',x=320,y=730,w=430,h=530,z=3)]),
 (cue('on fire'),'fire',[paper(),nat('N_SUN',x=1150,y=450,w=1050,h=1050),img('C_NOISE_REACT',x=320,y=730,w=430,h=530,z=3),txt('On fire.',x=330,y=280,w=620,size=100)]),
 (cue('But before I book'),'trip',guide('C_HOPE','BG_STREET')),
 (cue("there's a problem"),'problem',guide('C_CHECK_SELF','BG_STREET')),
 (cue('Having less light'),'limit',full('PEWTER_TASK_STOP_CLOSE')),
 (cue("It doesn't necessarily"),'not-yours',guide('C_SERIOUS','BG_SHOP',[txt('Whose time is it?',x=1320,y=410,w=850,size=92)])),
 (cue('In medieval England'),'examples',full('PEWTER_WORKBENCH_DUSK')),
 (cue('to leave their work until daylight'),'leave',full('PEWTER_TASK_STOP_CLOSE')),
 (cue('people whose work followed'),'care',full('CARE_CRADLE_CLOSE')),
 (cue('people staying up'),'enjoy',full('MUSIC_INDOOR_GROUP')),
 (cue('Including a group of tailors'),'tailors',[img('BG_STREET'),img('MUSIC_COMPANIONS',x=1000,y=650,w=1450,h=740,z=2)]),
 (cue("I'd like to join them"),'join',guide('C_LISTEN','BG_STREET')),
 (cue('First though'),'seeing',guide('C_LOOK_RUSH','BG_SHOP')),
 (cue('how are we seeing anything'),'light-return',full('RUSHLIGHT_LIT_CLOSE')),
]
for i,(start,name,layers) in enumerate(opening):
    shots.append({'id':'OPEN-'+name,'fromFrame':round(start*FPS),'background':'#F4EDE1','layers':layers,'note':'ASR phrase cue; '+name})
# Retain the remaining 89 authored beats, now at actual word timestamps.
for s in original:
    b=beatmap[s['id']]
    if b['start']<45:continue
    s['fromFrame']=round(b['start']*FPS);s['note']='ASR cue: '+b['narration']
    layers=s['layers']
    layers[:]=[l for l in layers if l.get('id')!='diagram-wash']
    # Editorial text has no surrounding box; plain paper prevents contrast loss.
    if any(l.get('nativeId') in ['N_SCOPE','N_RULE','N_RELATION','N_RECAP','N_CONDITION_GATE'] for l in layers):
        if not any(l.get('assetId','').startswith('C_') for l in layers):
            layers[0]=paper()
    for l in layers:
        if l.get('assetId','').startswith('C_'):
            l.update(x=460 if any(z['kind']=='native' for z in layers) else 960,y=525,width=850,height=1000)
        if l.get('assetId') in ['PROP_TALLOW','PROP_BEESWAX','PROP_RUSH_PREPARED']:
            layers[0]=paper(); l.update(x=960,y=540,width=1000,height=850)
        if l.get('assetId')=='MUSIC_COMPANIONS':l.update(x=1000,y=660,width=1500,height=750)
        # No guessed fade before voice cues.
        l.pop('fromFrame',None);l.pop('enter',None);l.pop('enterFrames',None)
    shots.append(s)
# Replace the diagram of dipped rush with real separated material inserts.
replace={
 'S005-B02':study(['PROP_RUSH','PROP_FAT','PROP_HOLDER']),
 'S006-B02':study(['PROP_RUSH','PROP_FAT','PROP_HOLDER']),
 'S017-B03':[img('BG_SHOP'),img('MUSIC_COMPANIONS',x=1050,y=660,w=1500,h=750,z=2)],
 'S028-B04':[img('BG_STREET'),img('MUSIC_COMPANIONS',x=1050,y=660,w=1500,h=750,z=2)],
 'S027-B02':guide('C_SEATED_CONTACT_B','BG_SHOP'),
 'S032-B02':guide('C_CHECK_SELF','BG_MEADOW'),
}
for s in shots:
    if s['id'] in replace:s['layers']=replace[s['id']]
# Body changes on semantic ASR cues instead of retaining one image over a long beat.
extra=[('while pieces of armor','FORGE_STRIKE_CLOSE',130),
       ('Then he describes waking','CARE_CRADLE_CLOSE',190),('singing and playing instruments','MUSIC_INDOOR_GROUP',235),
       ('put the sewing aside','MUSIC_INDOOR_GROUP',430)]
for phrase,id,after in extra:
    start=cue(phrase,after)
    frame=round(start*FPS)
    existing=next((s for s in shots if s['fromFrame']==frame),None)
    if existing:existing.update(layers=full(id),note='ASR semantic cut: '+phrase)
    else:shots.append({'id':'CUE-'+re.sub('[^a-z]','',phrase),'fromFrame':frame,'background':'#F4EDE1','layers':full(id),'note':'ASR semantic cut: '+phrase})
directed=[
 ('some fat and a holder',57,study(['PROP_FAT','PROP_HOLDER'])),
 ('where the flame is going',59,full('RUSHLIGHT_LIT_CLOSE')),
 ("Now suppose you've got your light",80,guide('C_LIGHT')),
 ('What is it good enough to do',80,full('BOWL_WORKER_INSPECT')),
 ("The rule wasn't",105,guide('C_RULE_PROUD','BG_SHOP',[nat('N_RULE','Daylight work',x=1310,y=440,w=900,h=680)])),
 ('because I care so deeply',111,full('BOWL_WORKER_INSPECT')),
 ('On this occasion',116,guide('C_RULE_PROUD')),
 ('Thomas Young and his wife Alice',123,full('FORGE_NEIGHBOUR_LISTEN')),
 ('They said the hammer blows',129,[img('BG_FORGE'),nat('N_FORGE_SOUND','Forge|Neighbour')]),
 ("if it wasn't shaking",165,guide('C_NOISE_REACT','BG_FORGE')),
 ('Apparently I also need',180,guide('C_NEIGHBOUR','BG_SHOP')),
 ('William Langland describes',190,[paper(),nat('N_SCOPE','Piers Plowman|A poem about poverty')]),
 ('poor women with children',192,full('CARE_CRADLE_CLOSE')),
 ('Here the interruption',207,full('CARE_CRADLE_CLOSE')),
 ('beside the place',210,[img('BG_CARE'),img('CARE_B',x=1040,y=620,w=1050,h=880,z=2)]),
 ("not describing every household's evening",216,[paper(),nat('N_SCOPE','A poem|Not every household')]),
 ("a coroner's inquest described",230,[paper(),nat('N_SCOPE','Oxford, 1306|A coroner’s inquest')]),
 ('celebrating the eve',235,full('MUSIC_INDOOR_GROUP')),
 ('This was one group',267,[img('BG_STREET'),img('MUSIC_COMPANIONS',x=1050,y=660,w=1500,h=750,z=2)]),
 ("It doesn't make violence",288,[paper(),nat('N_SCOPE','A tragic outcome|Not the purpose of the music')]),
 ('somebody near Oxford',295,guide('C_POINT_MEADOW','BG_MEADOW')),
 ("as he was accustomed",300,[img('BG_MEADOW'),nat('N_WATCH_DUTY','By day and night')]),
 ("it doesn't tell us how often",325,[paper(),nat('N_SCOPE','One recorded night|Frequency remains unknown')]),
 ("being free to stop working",335,guide('C_LIGHT_QUERY','BG_STREET')),
 ('restricted wandering',344,[paper(),nat('N_RULE','London curfew|Wandering restricted')]),
 ('and carrying a light',356,guide('C_LIGHT','BG_STREET')),
 ('to close after curfew',382,full('TAVERN_DOOR_CLOSED')),
 ('with nobody remaining',384,guide('C_SEATED_CONTACT_B','BG_SHOP')),
 ('required people to stay awake',402,[img('BG_STREET'),nat('N_WATCH_DUTY','Keeping watch')]),
 ('not proof that every door shut',409,[paper(),nat('N_RULE','A written rule|Compliance is not established')]),
 ('Someone could need care',428,full('CARE_CRADLE_CLOSE')),
 ('someone could have meadows',429,full('BG_MEADOW')),
 ('someone could be making enough noise',431,full('FORGE_STRIKE_CLOSE')),
 ("It matters what you're doing",444,guide('C_CHECK_SELF','BG_MEADOW')),
 ('who needs you',449,full('CARE_CRADLE_CLOSE')),
 ('whether those hours are yours',450,guide('C_SERIOUS','BG_MEADOW')),
]
for phrase,after,layers in directed:
    # A few ASR contractions differ from the supplied script; those are located
    # in ALIGNMENT.json rather than silently supplied with invented timestamps.
    try:frame=round(cue(phrase,after)*FPS)
    except ValueError:
        print('UNRESOLVED directed cue',phrase);continue
    existing=next((s for s in shots if s['fromFrame']==frame),None)
    if existing:existing.update(layers=layers,note='ASR directed cue: '+phrase)
    else:shots.append({'id':'ACT-'+re.sub('[^a-z]','',phrase),'fromFrame':frame,'background':'#F4EDE1','layers':layers,'note':'ASR directed cue: '+phrase})
shots.sort(key=lambda s:s['fromFrame'])
assert len({s['fromFrame'] for s in shots})==len(shots)
for i,s in enumerate(shots):
    length=(shots[i+1]['fromFrame'] if i+1<len(shots) else duration)-s['fromFrame']
    # Slow reframing directs attention in flattened illustrations; it is not acting.
    if len(s['layers'])==1 and s['layers'][0]['kind']=='image' and length>20:
        s['camera']={'reason':'Reframe detail in the current illustration on this narration span','pivotX':.56,'pivotY':.5,
          'keyframes':[{'frame':0,'scale':1.02,'easing':'linear'},{'frame':length-1,'scale':1.10,'easing':'smooth'}]}
    # Existing lifetimes/keyframes never extend past a retimed shot.
    for l in s['layers']:
        if 'motion' in l:l['motion']['durationFrames']=min(l['motion']['durationFrames'],length-1)
        if 'keyframes' in l:
            l['keyframes'][-1]['frame']=min(l['keyframes'][-1]['frame'],length-1)
    if length>150:notes.append({'shot':s['id'],'seconds':round(length/FPS,2),'note':s['note']})
e['shots']=shots
e['words']=[{'text':w['word'].strip(),'startMs':round(w['start']*1000),'endMs':max(round(w['start']*1000)+1,round(w['end']*1000))} for w in a['words']]
target=ROOT/'examples/medieval/video004-v03.props.json'
target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'LONG_SHOTS.json').write_text(json.dumps(notes,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'SHOT_AUDIO_MAP.json').write_text(json.dumps([{'id':s['id'],'start':s['fromFrame']/FPS,'end':(shots[i+1]['fromFrame'] if i+1<len(shots) else duration)/FPS,'cue':s['note'],'assets':[l.get('assetId',l.get('nativeId')) for l in s['layers']]} for i,s in enumerate(shots)],ensure_ascii=False,indent=2),encoding='utf-8')
print(target,len(shots),len(e['assets']),len(notes),'long holds')
