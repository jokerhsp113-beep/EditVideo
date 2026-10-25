"""Replace measured repetition with inspected alternate views, preserving audio cuts."""
import pathlib,json,copy,collections
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'out/medieval/video004-variety-v05'
base=json.loads((ROOT/'examples/medieval/video004-final.props.json').read_text(encoding='utf-8'))
data=copy.deepcopy(base);e=data['episode'];e.update(id='video004-variety-v05',version='edit-v05-variety')
inventory=json.loads((OUT/'ASSET_INVENTORY_V05.json').read_text(encoding='utf-8'))
new={r['id']:r for r in inventory};assert len(new)==22
for r in inventory:
 assert r['status']=='inspected-for-stated-use',r['id']
 e['assets'].append({'id':r['id'],'file':r['publicFile'],'version':'v05r02' if 'r02' in r['publicFile'] else 'v05','status':'inspected','rights':'unresolved','role':'Alternate view; visual QA and generation provenance in ASSET_INVENTORY_V05.json'})
shots={s['id']:s for s in e['shots']};changes=[]
def image(id,x=960,y=540,w=1920,h=1080,z=0):return {'id':'img-'+id,'kind':'image','assetId':id,'x':x,'y':y,'width':w,'height':h,'z':z}
def full(shot,id,reason):
 s=shots[shot];s['layers']=[image(id)];s.pop('camera',None)
 changes.append({'shot':shot,'newImages':[id],'reason':reason})
def background(shot,id,reason):
 s=shots[shot];old=next((l for l in s['layers'] if l.get('assetId','').startswith('BG_')),None)
 assert old is not None,shot
 old['assetId']=id;old['id']='img-'+id
 changes.append({'shot':shot,'newImages':[id],'reason':reason})
fullmap={
 'S016-B02':('MUSIC_HARP_DETAIL','The promised music is revealed through the instrument rather than another group tableau.'),
 'S017-B01':('MUSIC_SHOP_WINDOW','Establish the Oxford gathering from outside the shop.'),
 'ACT-celebratingtheeve':('MUSIC_SHOP_REVERSE','Reverse view shows the workplace functioning as a gathering place.'),
 'CUE-singingandplayinginstruments':('MUSIC_HARP_DETAIL','Match the spoken instrument cue with visible strings and hands.'),
 'S017-B03':('MUSIC_SEWING_ASIDE','Work objects set aside explain the narrator’s workplace assumption.'),
 'S018-B01':('MUSIC_STREET_WIDE','The music moves outside on the spoken after-midnight cue.'),
 'S018-B02':('MUSIC_SHOP_WINDOW','The narrator’s mistaken inference is contrasted with visible music.'),
 'S019-B01':('BG_STREET_REVERSE','Show the empty street they expected, not the same singing group.'),
 'S022-B01':('MUSIC_SHOP_REVERSE','Recall the celebration using a different group perspective.'),
 'S030-B02':('MUSIC_SHOP_WINDOW','Recap the chosen evening activity through an exterior glimpse.'),
 'CUE-putthesewingaside':('MUSIC_SEWING_ASIDE','Specific textile detail supports the closing sewing/instrument contrast.'),
 'S013-B04':('CARE_BEDSIDE_REVERSE','Transition from work next door to work inside the home.'),
 'S014-B01':('CARE_TIREDFACE','New intimate perspective introduces the poverty/care example.'),
 'S014-B02':('CARE_TEXTILE_DETAIL','Textile work and the cradle share the home; avoid another generic mother image.'),
 'S015-B01':('CARE_CRADLE_HANDS','Actual contact with the cradle supports waking to rock it.'),
 'S015-B02':('CARE_TIREDFACE','Interrupted rest is visible in the mother’s expression.'),
 'ACT-eretheinterruption':('CARE_CRADLE_HANDS','Shift to the interruption’s immediate physical focus.'),
 'ACT-besidetheplace':('CARE_BEDSIDE_REVERSE','Bed and cradle relationship becomes clear.'),
 'S015-B03':('CARE_TEXTILE_DETAIL','The poverty qualifier returns to the household’s work rather than repeating a face.'),
 'S030-B01':('CARE_CRADLE_HANDS','Short care callback at the matching audio cue.'),
 'ACT-whoneedsyou':('CARE_TIREDFACE','Return to a human need in the final question.'),
 'CUE-whilepiecesofarmor':('FORGE_OVER_SHOULDER','A second smith viewpoint supports the hammering description.'),
 'S012-B01':('FORGE_OVER_SHOULDER','The craftsman’s position is presented from his side of the work.'),
 'S011-B01':('FORGE_NEIGHBOUR_WALL','A new physical reaction replaces the repeated seated neighbour.'),
 'S013-B01':('FORGE_WINDOW_REVERSE','Window view links the home to its neighbouring workplace.'),
 'S010-B04':('FORGE_WINDOW_REVERSE','The home side of the shared neighbourhood replaces another forge close-up.'),
 'S013-B02':('FORGE_NEIGHBOUR_WALL','Turning off one light cannot stop the neighbour’s work.'),
 'S011-B03':('FORGE_SMOKE_ROOM','Room and incoming smoke reinforce the exact indoors narration.'),
 'S020-B03':('BG_MEADOW_PATH','A field-edge route establishes a different night task.'),
 'S021-B01':('MEADOW_WATCHER_REAR','Show the meadow-watching task as an illustrative reconstruction.'),
 'S021-B03':('BG_MEADOW_PATH','The route home is visible without inventing an attack scene.'),
 'S021-B04':('BG_MEADOW_HEDGE','An empty field-edge angle supports the contrast with cutting/gathering.'),
 'S023-B01':('BG_MEADOW_PATH','Restrained empty-path shot for the serious account; no invented violence.'),
 'ACT-someonecouldhavemeadows':('MEADOW_WATCHER_REAR','Specific watcher callback instead of the empty original field.'),
 'S008-B02':('PEWTER_RIM_DETAIL','Top view emphasizes the sight needed to make/inspect a bowl.'),
 'S009-B03':('PEWTER_RIM_DETAIL','The rim and finish replace the repeated worker portrait.'),
 'OPEN-leave':('PEWTER_SETDOWN_SIDE','A work-stop view differs from the earlier daylight-limit image.'),
 'S009-B04':('PEWTER_SETDOWN_SIDE','Hands and bowl touching the bench express stopping the task.'),
 'S005-B04':('RUSHLIGHT_SIDE_DETAIL','Closer side view reveals the rush/iron-grip contact.'),
 'S007-B01':('RUSHLIGHT_SIDE_DETAIL','Recall this lighting material through a second view.'),
}
for shot,(id,reason) in fullmap.items():full(shot,id,reason)
bgmap={
 'ACT-somebodynearxford':'BG_MEADOW_HEDGE','S021-B02':'BG_MEADOW_HEDGE',
 'ACT-ashewasaccustomed':'BG_MEADOW_PATH','S023-B03':'BG_MEADOW_HEDGE',
 'ACT-tmatterswhatyouredoing':'BG_MEADOW_PATH','ACT-whetherthosehoursareyours':'BG_MEADOW_HEDGE','S032-B02':'BG_MEADOW_PATH',
 'S006-B01':'BG_SHOP_SIDE','S006-B03':'BG_SHOP_SIDE','S007-B04':'BG_SHOP_SIDE',
 'ACT-owsupposeyouvegotyourlight':'BG_SHOP_SIDE','ACT-herulewasnt':'BG_SHOP_REVERSE',
 'S009-B05':'BG_SHOP_REVERSE','ACT-nthisoccasion':'BG_SHOP_REVERSE','S010-B02':'BG_SHOP_SIDE',
 'S013-B03':'BG_SHOP_SIDE','ACT-pparentlyalsoneed':'BG_SHOP_REVERSE','S016-B01':'BG_SHOP_REVERSE',
 'S017-B04':'BG_SHOP_REVERSE','ACT-withnobodyremaining':'BG_SHOP_SIDE','S027-B02':'BG_SHOP_SIDE',
 'S029-B02':'BG_SHOP_REVERSE','S031-B02':'BG_SHOP_SIDE',
 'S018-B03':'BG_STREET_REVERSE','S019-B03':'BG_STREET_REVERSE','S020-B01':'BG_STREET_REVERSE',
 'ACT-beingfreetostopworking':'BG_STREET_DOORWAY','S024-B01':'BG_STREET_DOORWAY',
 'ACT-andcarryingalight':'BG_STREET_DOORWAY','S025-B01':'BG_STREET_DOORWAY','S025-B03':'BG_STREET_DOORWAY',
 'S028-B02':'BG_STREET_REVERSE','ACT-requiredpeopletostayawake':'BG_STREET_DOORWAY',
}
for shot,id in bgmap.items():background(shot,id,'Alternate viewpoint within the same scene family; preserve guide/audio cue.')
# Make the seating setup and reaction genuinely different while keeping chair contact.
chair=next(l for l in shots['ACT-withnobodyremaining']['layers'] if l.get('assetId')=='C_SEATED_CONTACT_B')
chair['assetId']='C_SEATED_CONTACT_A';chair['id']='img-C_SEATED_CONTACT_A'
changes.append({'shot':'ACT-withnobodyremaining','newImages':['C_SEATED_CONTACT_A'],'reason':'Hopeful seated setup changes to the objection reaction in S027-B02; no duplicate hold.'})
# London compliance is not illustrated by reusing Oxford singers.
shots['S028-B04']['layers']=[image('BG_STREET_DOORWAY'),image('C_SERIOUS',x=960,y=525,w=850,h=1000,z=2)]
changes.append({'shot':'S028-B04','newImages':['BG_STREET_DOORWAY','C_SERIOUS'],'reason':'A quiet London doorway supports the rule/compliance qualification, not a repeated Oxford group.'})
# Give each full-frame insert a modest authored reframe; reusable backdrops stay fixed.
for i,s in enumerate(e['shots']):
 n=(e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames'])-s['fromFrame']
 if len(s['layers'])==1 and s['layers'][0]['kind']=='image' and s['layers'][0].get('assetId') in new:
  s['camera']={'reason':'Read the new viewpoint/detail at the preserved narration cue','pivotX':.46 if i%2 else .57,'pivotY':.52,'keyframes':[{'frame':0,'scale':1.01,'easing':'linear'},{'frame':n-1,'scale':1.065,'easing':'smooth'}]}
used={l['assetId'] for s in e['shots'] for l in s['layers'] if l.get('assetId')}
assert set(new)<=used,('Unused generated assets',set(new)-used)
e['assets']=[a for a in e['assets'] if a['id'] in used]
assert e['audio']==base['episode']['audio']
assert [(s['id'],s['fromFrame']) for s in e['shots']]==[(s['id'],s['fromFrame']) for s in base['episode']['shots']]
same=[[e['shots'][i-1]['id'],s['id']] for i,s in enumerate(e['shots'][1:],1) if s['layers']==e['shots'][i-1]['layers']]
assert not same,('Unchanged adjacent compositions',same)
target=ROOT/'examples/medieval/video004-v05.props.json';target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
mapped=[]
for change in changes:
 s=shots[change['shot']];i=e['shots'].index(s)
 mapped.append({**change,'start':s['fromFrame']/e['fps'],'end':(e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames'])/e['fps'],'audioCue':s.get('note','')})
(OUT/'REPLACEMENT_MAP_V05.json').write_text(json.dumps(mapped,ensure_ascii=False,indent=2),encoding='utf-8')
print('Built',len(e['shots']),'shots;',len(used),'used images;',len(new),'new; modified shots',len({c['shot'] for c in changes}))
