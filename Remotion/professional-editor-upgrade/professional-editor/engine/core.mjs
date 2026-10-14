// Pure compiler shared by the renderer and CLI. Frame numbers are integers.
const purposes = new Set(['hook', 'mechanism', 'comparison', 'evidence', 'summary']);
const kinds = new Set(['image', 'text', 'rect', 'ellipse', 'connection']);
const actions = new Set(['move', 'approach', 'reject', 'reveal', 'emphasize', 'rotate']);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const integer = (v) => Number.isInteger(v) && v >= 0;
const point = (v) => v && finite(v.x) && finite(v.y);
const words = (s) => s.normalize('NFKC').toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]+/gu) ?? [];
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v, mode) => mode === 'linear' ? v : mode === 'out' ? 1 - (1-v)**3 : v*v*(3-2*v);

export function resolveCue(cue, captions, fps) {
  if ('frame' in cue) return cue.frame;
  const target = words(cue.anchor);
  const tokens = captions.flatMap((c) => words(c.text).map((text) => ({text, ms: c.startMs})));
  const matches = [];
  for (let i = 0; i <= tokens.length - target.length; i++) {
    if (target.length && target.every((w, k) => tokens[i+k].text === w)) matches.push(tokens[i].ms);
  }
  if (!matches.length) throw new Error(`Anchor not found: ${cue.anchor}`);
  if (matches.length > 1 && cue.occurrence === undefined) throw new Error(`Ambiguous anchor (${matches.length} matches): ${cue.anchor}; specify occurrence`);
  const hit = matches[(cue.occurrence ?? 1)-1];
  if (hit === undefined) throw new Error(`Anchor occurrence out of range: ${cue.anchor}`);
  return Math.round(hit*fps/1000) + (cue.offsetFrames ?? 0);
}

export function validatePlan(plan) {
  const issues = [];
  const add = (code, location, message, severity='error') => issues.push({severity, code, location, message});
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return [{severity:'error',code:'PLAN_TYPE',location:'plan',message:'Expected an object'}];
  const unknown = (obj, allowed, loc) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) add('UNKNOWN_FIELD',`${loc}.${k}`,'Unknown field; it would otherwise be ignored');
  };
  unknown(plan, ['schemaVersion','id','title','status','fps','width','height','durationFrames','profile','intent','captions','scenes','audio','review'], 'plan');
  if (plan.schemaVersion !== 1) add('SCHEMA_VERSION','schemaVersion','Only version 1 is supported');
  for (const key of ['id','title','intent']) if (typeof plan[key] !== 'string' || !plan[key].trim()) add('REQUIRED',key,'Non-empty text required');
  if (!['draft','review','final'].includes(plan.status)) add('STATUS','status','Expected draft, review, or final');
  if (plan.profile !== 'biy-science') add('PROFILE','profile','Unknown profile');
  for (const key of ['fps','width','height','durationFrames']) if (!Number.isInteger(plan[key]) || plan[key] <= 0) add('POSITIVE_INTEGER',key,'Positive integer required');
  if (!plan.review || !['pending','passed'].includes(plan.review.visual) || !['pending','passed','not-applicable'].includes(plan.review.audio) || !Array.isArray(plan.review.notes) || plan.review.notes.some(n=>typeof n!=='string')) add('REVIEW','review','Review states and notes required');
  if (plan.status === 'final' && (plan.review?.visual !== 'passed' || !['passed','not-applicable'].includes(plan.review?.audio))) add('FINAL_REVIEW','review','A final requires actual visual/audio review');
  const captions = plan.captions ?? [];
  if (!Array.isArray(captions)) add('CAPTIONS','captions','Expected array');
  else captions.forEach((c,i) => {
    if (typeof c.text !== 'string' || !finite(c.startMs) || !finite(c.endMs) || c.startMs < 0 || c.endMs <= c.startMs || (i && c.startMs < captions[i-1].startMs)) add('CAPTION_TIMING',`captions[${i}]`,'Captions must have non-negative, ordered start and positive duration');
    else if (c.endMs > plan.durationFrames/plan.fps*1000 + 1000/plan.fps) add('CAPTION_RANGE',`captions[${i}]`,'Caption extends beyond composition');
  });
  const cue = (c, loc) => {
    if (!c || typeof c !== 'object' || Array.isArray(c)) {add('CUE',loc,'Expected frame or anchor cue'); return false;}
    unknown(c,['frame','anchor','occurrence','offsetFrames'],loc);
    if ('frame' in c) {
      if (!integer(c.frame) || 'anchor' in c || 'occurrence' in c || 'offsetFrames' in c) {add('CUE',loc,'A frame cue contains only a non-negative integer frame'); return false;}
    } else if (typeof c.anchor !== 'string' || !words(c.anchor).length || (c.occurrence !== undefined && (!Number.isInteger(c.occurrence) || c.occurrence < 1)) || (c.offsetFrames !== undefined && !Number.isInteger(c.offsetFrames))) {add('CUE',loc,'Anchor cue requires text, optional positive occurrence and integer offsetFrames'); return false;}
    return true;
  };
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) {add('SCENES','scenes','At least one scene required'); return issues;}
  if (!Array.isArray(plan.audio)) add('AUDIO','audio','Expected audio array');
  const sceneIds = new Set();
  const resolvedScenes = new Map();
  let end = 0;
  plan.scenes.forEach((s,i) => {
    const loc = `scenes[${i}]`;
    if (!s || typeof s !== 'object') {add('SCENE',loc,'Expected object'); return;}
    unknown(s,['id','purpose','takeaway','start','durationFrames','holdReason','carryFrom','layers','actions','camera'],loc);
    if (!s.id || sceneIds.has(s.id)) add('DUPLICATE_ID',loc,'Scene id required and unique');
    sceneIds.add(s.id);
    if (!purposes.has(s.purpose)) add('PURPOSE',loc,'Unknown scene purpose');
    for (const k of ['takeaway','holdReason']) if (typeof s[k] !== 'string' || !s[k].trim()) add('EDITORIAL_INTENT',`${loc}.${k}`,'Explain the takeaway and why this duration is needed');
    if (!Number.isInteger(s.durationFrames) || s.durationFrames <= 0) add('DURATION',loc,'Positive integer duration required');
    let from = NaN;
    if (cue(s.start,`${loc}.start`) && Array.isArray(captions)) {
      try {from = resolveCue(s.start,captions,plan.fps);} catch(e) {add('ANCHOR',loc,e.message);}
      if (from !== end) add('TIMELINE_GAP',loc,`Expected scene at frame ${end}, received ${from}; overlaps and gaps are not implicit`);
      end = from + s.durationFrames;
    }
    if (!Array.isArray(s.layers) || !Array.isArray(s.actions)) {add('SCENE_ARRAYS',loc,'layers and actions must be arrays'); return;}
    let layers = [];
    if (s.carryFrom) {
      if (i === 0 || s.carryFrom !== plan.scenes[i-1].id || !resolvedScenes.has(s.carryFrom)) add('CONTINUITY',loc,'carryFrom must name the immediately previous scene');
      else {
        const prev = resolvedScenes.get(s.carryFrom);
        layers = prev.layers.map(l=>({...l,...layerState(prev,l,prev.durationFrames-1)}));
      }
    }
    const localIds = new Set();
    for (const l of s.layers) {
      if (!l || typeof l !== 'object') {add('LAYER',loc,'Expected layer object'); continue;}
      unknown(l,['id','kind','x','y','width','height','assetId','text','parentId','z','rotate','scale','opacity','pivot','fill','stroke','strokeWidth','radius','fontSize','weight','align','fromId','toId','fromPoint','toPoint'],`${loc}.${l.id}`);
      if (!l.id || localIds.has(l.id)) add('DUPLICATE_ID',loc,'Local layer ids must be unique');
      localIds.add(l.id);
      if (!kinds.has(l.kind)) add('LAYER_KIND',loc,`Unsupported kind: ${l.kind}`);
      if (![l.x,l.y,l.width,l.height].every(finite) || l.width <= 0 || l.height <= 0) add('GEOMETRY',loc,`Invalid geometry: ${l.id}`);
      for (const k of ['z','rotate','scale','opacity','strokeWidth','radius','fontSize','weight']) if (l[k] !== undefined && !finite(l[k])) add('NUMBER',loc,`Invalid ${k}: ${l.id}`);
      if (l.scale !== undefined && l.scale <= 0) add('SCALE',loc,'Scale must be positive');
      if (l.opacity !== undefined && (l.opacity < 0 || l.opacity > 1)) add('OPACITY',loc,'Opacity must be 0..1');
      for (const k of ['pivot','fromPoint','toPoint']) if (l[k] !== undefined && (!point(l[k]) || l[k].x < 0 || l[k].x > 1 || l[k].y < 0 || l[k].y > 1)) add('ATTACHMENT_POINT',loc,'Normalized points must be 0..1');
      if (l.kind === 'image' && typeof l.assetId !== 'string') add('ASSET_ID',loc,'Image assetId required');
      if (l.kind === 'text' && (typeof l.text !== 'string' || !l.text.trim() || !finite(l.fontSize) || l.fontSize <= 0)) add('TEXT',loc,'Text layers need non-empty text and positive fontSize');
      if (l.align !== undefined && !['left','center','right'].includes(l.align)) add('ALIGN',loc,'Unknown alignment');
      const old = layers.findIndex(p=>p.id===l.id);
      if (old < 0) layers.push(l); else layers[old] = l;
    }
    const byId = new Map(layers.map(l=>[l.id,l]));
    for (const l of layers) {
      if (l.parentId && !byId.has(l.parentId)) add('PARENT',loc,`Missing parent for ${l.id}`);
      const seen = new Set([l.id]); let p = l.parentId;
      while (p && byId.has(p)) {if (seen.has(p)) {add('PARENT_CYCLE',loc,`Cycle at ${l.id}`); break;} seen.add(p); p=byId.get(p).parentId;}
      if (l.kind === 'connection' && (!byId.has(l.fromId) || !byId.has(l.toId) || l.parentId)) add('CONNECTION',loc,'Connections require existing subjects and live at scene root');
      if (l.kind === 'connection' && [l.fromId,l.toId].some(id=>byId.get(id)?.kind==='connection')) add('CONNECTION',loc,'Connections cannot attach to other connections');
    }
    if (s.camera) {
      if (!point(s.camera.from) || !point(s.camera.to) || ![s.camera.from?.scale,s.camera.to?.scale].every(v=>finite(v)&&v>0)) add('CAMERA',loc,'Camera endpoints require x,y and positive scale');
    }
    const actionIds = new Set(); const ranges = new Map(); const compiledActions = [];
    for (const a of s.actions) {
      if (!a || typeof a !== 'object') {add('ACTION',loc,'Expected action object'); continue;}
      unknown(a,['id','subject','type','start','durationFrames','reason','target','to','offset','amount','ease'],`${loc}.${a.id}`);
      if (!a.id || actionIds.has(a.id)) add('DUPLICATE_ID',loc,'Action ids required and unique'); actionIds.add(a.id);
      if (!actions.has(a.type) || !byId.has(a.subject)) add('ACTION',loc,'Action type and subject must exist');
      if (byId.get(a.subject)?.kind === 'connection') add('ACTION',loc,'Animate connection subjects, not the connection');
      if (typeof a.reason !== 'string' || !a.reason.trim()) add('ACTION_REASON',loc,'Every action needs an editorial reason');
      if (!Number.isInteger(a.durationFrames) || a.durationFrames <= 0) add('ACTION_DURATION',loc,'Positive integer action duration required');
      if (['move','reject'].includes(a.type) && !point(a.to)) add('ACTION_TARGET',loc,'move/reject require destination x,y');
      if (a.type === 'approach' && (!byId.has(a.target) || byId.get(a.subject)?.parentId !== byId.get(a.target)?.parentId)) add('ACTION_TARGET',loc,'Approach requires an existing target in the same parent coordinate system');
      if (a.offset !== undefined && !point(a.offset)) add('ACTION_OFFSET',loc,'Offset needs finite x,y');
      if (a.type === 'rotate' && !finite(a.amount)) add('ACTION_AMOUNT',loc,'Rotate requires angle');
      if (a.type === 'emphasize' && (a.amount !== undefined && (!finite(a.amount) || a.amount <= 0))) add('ACTION_AMOUNT',loc,'Emphasis scale must be positive');
      if (a.ease !== undefined && !['linear','smooth','out'].includes(a.ease)) add('EASE',loc,'Unknown easing');
      if (!cue(a.start,`${loc}.${a.id}.start`) || !Array.isArray(captions)) continue;
      try {
        const start = 'frame' in a.start ? a.start.frame : resolveCue(a.start,captions,plan.fps)-from;
        if (start < 0 || start+a.durationFrames > s.durationFrames) add('ACTION_RANGE',loc,`Action ${a.id} is outside scene`);
        const channel = ['move','approach','reject'].includes(a.type) ? 'position' : a.type;
        const key = `${a.subject}:${channel}`; const prev = ranges.get(key) ?? [];
        if (prev.some(([x,y])=>start<y && start+a.durationFrames>x)) add('ACTION_OVERLAP',loc,`Overlapping ${channel} actions for ${a.subject}`);
        prev.push([start,start+a.durationFrames]); ranges.set(key,prev);
        if (a.type === 'approach' && s.actions.some(other=>other.subject===a.target&&['move','approach','reject'].includes(other.type))) add('MOVING_TARGET',loc,'Approach target must remain still; use explicit move for moving targets');
        compiledActions.push({...a,startFrame:start});
      } catch(e) {add('ANCHOR',loc,e.message);}
    }
    if (!issues.some(v=>v.severity==='error')) resolvedScenes.set(s.id,{...s,layers,from,actions:compiledActions.sort((a,b)=>a.startFrame-b.startFrame)});
  });
  if (end !== plan.durationFrames) add('TIMELINE_END','durationFrames',`Scenes end at ${end}, composition ends at ${plan.durationFrames}`);
  const audioIds = new Set();
  if (Array.isArray(plan.audio)) for (const t of plan.audio) {
    if (!t || typeof t !== 'object') {add('AUDIO','audio','Track must be object'); continue;}
    unknown(t,['id','assetId','role','startFrame','durationFrames','trimBeforeFrames','gainDb','fadeInFrames','fadeOutFrames','duckUnderVoice','reason'],`audio.${t.id}`);
    if (!t.id || audioIds.has(t.id)) add('DUPLICATE_ID','audio','Track ids required and unique'); audioIds.add(t.id);
    if (typeof t.assetId !== 'string' || !['voice','music','ambience','foley','accent'].includes(t.role) || typeof t.reason !== 'string' || !t.reason.trim()) add('AUDIO_TRACK','audio','Track needs assetId, role and reason');
    if (![t.startFrame,t.durationFrames,t.fadeInFrames,t.fadeOutFrames,t.trimBeforeFrames??0].every(integer) || t.durationFrames <= 0 || t.startFrame+t.durationFrames>plan.durationFrames || t.fadeInFrames+t.fadeOutFrames>t.durationFrames || !finite(t.gainDb) || t.gainDb>0 || t.gainDb < -96) add('AUDIO_RANGE','audio','Invalid range, fades or gainDb (-96..0)');
    if (t.duckUnderVoice !== undefined && typeof t.duckUnderVoice !== 'boolean') add('DUCKING','audio','duckUnderVoice must be boolean');
    if (t.role === 'voice' && t.duckUnderVoice) add('DUCKING','audio','Voice tracks cannot duck themselves');
  }
  if (plan.status==='final' && plan.audio?.length && plan.review?.audio==='not-applicable') add('FINAL_AUDIO','review','An audible final requires audio review');
  return issues;
}

export function parsePlan(input) {
  const errors = validatePlan(input).filter(v=>v.severity==='error');
  if (errors.length) throw new Error(errors.map(e=>`${e.code} ${e.location}: ${e.message}`).join('\n'));
  return input;
}

export function compilePlan(input) {
  const plan = parsePlan(input); const scenes = [];
  for (const s of plan.scenes) {
    const from = resolveCue(s.start,plan.captions??[],plan.fps);
    const prev = scenes[scenes.length-1];
    const inherited = s.carryFrom ? prev.layers.map(l=>({...l,...layerState(prev,l,prev.durationFrames-1)})) : [];
    const layers = new Map(inherited.map(l=>[l.id,l]));
    for (const l of s.layers) layers.set(l.id,{...l});
    scenes.push({...s,from,layers:[...layers.values()],actions:s.actions.map(a=>({...a,startFrame:'frame' in a.start ? a.start.frame : resolveCue(a.start,plan.captions??[],plan.fps)-from})).sort((a,b)=>a.startFrame-b.startFrame)});
  }
  return {...plan,scenes};
}

export function layerState(scene, layer, frame) {
  const out = {x:layer.x,y:layer.y,scale:layer.scale??1,rotate:layer.rotate??0,opacity:layer.opacity??1};
  for (const a of scene.actions.filter(a=>a.subject===layer.id)) {
    if (frame<a.startFrame) continue;
    const p = ease(clamp((frame-a.startFrame)/a.durationFrames),a.ease);
    if (['move','reject','approach'].includes(a.type)) {
      const target = scene.layers.find(l=>l.id===a.target);
      const to = a.type === 'approach' ? {x:target.x+(a.offset?.x??0), y:target.y+(a.offset?.y??0)} : a.to;
      out.x += (to.x-out.x)*p; out.y += (to.y-out.y)*p;
    } else if (a.type === 'reveal') out.opacity = (layer.opacity??1)+(1-(layer.opacity??1))*p;
    else if (a.type === 'emphasize') out.scale *= 1+((a.amount??1.04)-1)*Math.sin(Math.PI*p);
    else if (a.type === 'rotate') out.rotate += (a.amount-out.rotate)*p;
  }
  return out;
}

export function worldPoint(scene, layerId, normalized, frame) {
  const layer = scene.layers.find(l=>l.id===layerId);
  if (!layer) throw new Error(`Missing attachment layer ${layerId}`);
  let p = {x:normalized.x*layer.width,y:normalized.y*layer.height};
  let l = layer;
  while (l) {
    const state=layerState(scene,l,frame), pivot=l.pivot??{x:0.5,y:0.5};
    const px=pivot.x*l.width,py=pivot.y*l.height;
    const x=(p.x-px)*state.scale,y=(p.y-py)*state.scale,r=state.rotate*Math.PI/180;
    p={x:state.x+px-l.width/2+x*Math.cos(r)-y*Math.sin(r),y:state.y+py-l.height/2+x*Math.sin(r)+y*Math.cos(r)};
    l=scene.layers.find(parent=>parent.id===l.parentId);
  }
  return p;
}

export function audioGain(track, localFrame, tracks, fps) {
  if (localFrame < 0 || localFrame >= track.durationFrames) return 0;
  const fade=Math.min(track.fadeInFrames?clamp(localFrame/track.fadeInFrames):1,track.fadeOutFrames?clamp((track.durationFrames-1-localFrame)/track.fadeOutFrames):1);
  const global=track.startFrame+localFrame;
  const attack=Math.max(1,Math.round(fps*0.12)),release=Math.max(1,Math.round(fps*0.25));
  const duck=track.duckUnderVoice?Math.max(0,...tracks.filter(t=>t.role==='voice').map(t=>Math.min(clamp((global-(t.startFrame-attack))/attack),clamp((t.startFrame+t.durationFrames+release-global)/release)))):0;
  return 10**((track.gainDb-12*duck)/20)*fade;
}

export function validateAssets(plan, assets) {
  const issues=[];const byId=new Map(assets.map(a=>[a.id,a]));
  const add=(code,location,message,severity='error')=>issues.push({code,location,message,severity});
  const used=[...plan.scenes.flatMap(s=>s.layers.filter(l=>l.kind==='image').map(l=>({id:l.assetId,type:'image',loc:`${s.id}/${l.id}`,layer:l}))),...plan.audio.map(t=>({id:t.assetId,type:'audio',loc:t.id,track:t}))];
  for (const item of used) {
    const a=byId.get(item.id);
    if (!a) {add('ASSET_MISSING',item.loc,item.id);continue;}
    if(a.mediaType!==item.type) add('ASSET_TYPE',item.loc,`Expected ${item.type}: ${a.id}`);
    if(a.status==='rejected') add('ASSET_REJECTED',item.loc,a.id);
    if(a.flags?.some(f=>f==='unreadable'||f==='empty-alpha')) add('ASSET_BROKEN',item.loc,a.id);
    if(a.flags?.includes('placeholder')) add('PLACEHOLDER',item.loc,a.id,plan.status==='final'?'error':'warning');
    if(plan.status==='final'&&(a.status!=='approved'||!a.provenance?.source||!a.provenance?.license)) add('FINAL_ASSET',item.loc,`Final needs editorial approval and known provenance: ${a.id}`);
    if(item.type==='image' && a.width && a.height && !a.path.endsWith('.svg')) {
      const display=Math.max(item.layer.width/a.width,item.layer.height/a.height);
      if(display>1.25) add('UPSCALE',item.loc,`${a.id} enlarged ${display.toFixed(2)}x; inspect at delivery resolution`,'warning');
    }
    if(item.track && finite(a.durationSeconds) && ((item.track.trimBeforeFrames??0)+item.track.durationFrames)/plan.fps>a.durationSeconds+1/plan.fps) add('AUDIO_SOURCE_RANGE',item.loc,'Trim and duration exceed source audio');
  }
  return issues;
}
