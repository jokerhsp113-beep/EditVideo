export type Word = {text: string; startMs: number; endMs: number};
export type Asset = {id: string; file: string; version: string; status: 'draft' | 'inspected'; rights: 'recorded' | 'unresolved'; role: string};
export type Motion = {toX?: number; toY?: number; toScale?: number; durationFrames: number};
export type Transform = {x:number; y:number; scale:number; rotate:number; opacity:number};
export type Keyframe = Partial<Transform> & {frame:number; easing:'linear'|'smooth'|'ease-in'|'ease-out'|'hold'};
export type Camera = {reason:string; keyframes:Keyframe[]; pivotX:number; pivotY:number};
export type Layer = {
  id: string; kind: 'image' | 'text' | 'rect' | 'group' | 'native'; assetId?: string; nativeId?: string; text?: string;
  x: number; y: number; width: number; height: number; z: number;
  color: string; fromFrame?: number; at?: string; occurrence?: number;
  untilFrame?: number; enter: 'none' | 'fade'; enterFrames: number;
  scale: number; rotate: number; motion?: Motion;
  parentId?:string; pivotX?:number; pivotY?:number; opacity?:number; keyframes?:Keyframe[];
  space?:'world'|'screen';
  textRole?:'headline'|'keyLabel'|'scopeNote'; fontSize?:number; lineHeight?:number;
  align?:'left'|'center'|'right'; padding?:number;
};
export type Shot = {id: string; fromFrame?: number; anchor?: string; occurrence?: number; background: string; layers: Layer[]; note?: string; camera?:Camera};
export type AudioClip = {id: string; file: string; role: 'voice' | 'music' | 'sfx' | 'ambience' | 'action' | 'editorial-accent'; fromFrame: number; durationFrames: number; trimBeforeFrames: number; volume: number; fadeFrames: number; loop: boolean; rights: 'recorded' | 'unresolved'; gainEnvelope?:{frame:number;gain:number}[]};
export type Episode = {
  id: string; version: string; scriptVersion: string; planVersion: string;
  width: number; height: number; fps: number; durationInFrames: number;
  timingBasis: 'estimated' | 'audio-aligned'; words: Word[];
  assets: Asset[]; audio: AudioClip[]; shots: Shot[];
};
export type ResolvedLayer = Layer & {enterFrame: number; exitFrame: number};
export type ResolvedShot = Omit<Shot, 'layers'> & {startFrame: number; durationInFrames: number; layers: ResolvedLayer[]};
export type ResolvedEpisode = Omit<Episode, 'shots'> & {shots: ResolvedShot[]};

const fail = (message: string): never => {throw new Error(`Medieval manifest: ${message}`);};
const obj = (v: unknown, name: string): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(`${name} must be an object`);
  return v as Record<string, unknown>;
};
const str = (v: unknown, name: string): string => {
  if (typeof v !== 'string' || !v.trim()) return fail(`${name} must be nonempty text`);
  return v;
};
const number = (v: unknown, name: string, min = -Infinity): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min) return fail(`${name} must be finite and >= ${min}`);
  return v;
};
const integer = (v: unknown, name: string, min = 0): number => {
  const n = number(v, name, min);
  if (!Number.isInteger(n)) return fail(`${name} must be an integer`);
  return n;
};
const list = (v: unknown, name: string): unknown[] => Array.isArray(v) ? v : fail(`${name} must be an array`);
const choice = <T extends string>(v: unknown, options: readonly T[], name: string): T => {
  if (!options.includes(v as T)) return fail(`${name} must be ${options.join('/')}`);
  return v as T;
};
const bool = (v: unknown, name: string, fallback: boolean): boolean => {
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') return fail(`${name} must be boolean`);
  return v;
};
const keys = (o: Record<string, unknown>, allowed: string[], name: string) => {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(`${name}: unknown field ${k}`);
};
const optionalInt = (v: unknown, name: string): number | undefined => v === undefined ? undefined : integer(v, name);
const path = (v: unknown, name: string): string => {
  const p = str(v, name);
  if (p.includes('\\') || p.startsWith('/') || p.includes(':') || p.split('/').some(s => !s || s === '.' || s === '..')) fail(`${name} must be a relative public/ file path`);
  return p;
};
const unique = (ids: string[], name: string) => {if (new Set(ids).size !== ids.length) fail(`${name} IDs must be unique`);};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

const unit = (v:unknown, name:string):number => {
  const n=number(v,name,0); if(n>1) fail(`${name} must be <= 1`); return n;
};
const parseKeyframes = (input:unknown):Keyframe[] => {
  const frames=list(input,'keyframes').map((v):Keyframe=>{
    const k=obj(v,'keyframe'); keys(k,['frame','x','y','scale','rotate','opacity','easing'],'keyframe');
    if(['x','y','scale','rotate','opacity'].every(p=>k[p]===undefined)) fail('keyframe needs a transform value');
    return {frame:integer(k.frame,'keyframe.frame'),
      x:k.x===undefined?undefined:number(k.x,'keyframe.x'), y:k.y===undefined?undefined:number(k.y,'keyframe.y'),
      scale:k.scale===undefined?undefined:number(k.scale,'keyframe.scale',0.01),
      rotate:k.rotate===undefined?undefined:number(k.rotate,'keyframe.rotate'),
      opacity:k.opacity===undefined?undefined:unit(k.opacity,'keyframe.opacity'),
      easing:choice(k.easing??'smooth',['linear','smooth','ease-in','ease-out','hold'],'keyframe.easing')};
  });
  if(!frames.length || frames[0].frame!==0 || frames.some((k,i)=>i>0&&k.frame<=frames[i-1].frame)) fail('keyframes must start at 0 and strictly increase');
  return frames;
};

/** Relative to layer entry, or shot start for camera. Destination easing controls each segment. */
export const sampleTransform = (base:Transform, frames:Keyframe[]|undefined, frame:number):Transform => {
  if(!frames?.length) return base;
  let previous={...base}; let previousFrame=0;
  for(const key of frames){
    const next={...previous};
    for(const field of ['x','y','scale','rotate','opacity'] as const) if(key[field]!==undefined) next[field]=key[field]!;
    if(frame<key.frame){
      const raw=Math.max(0,Math.min(1,(frame-previousFrame)/(key.frame-previousFrame)));
      const t=key.easing==='hold'?0:key.easing==='linear'?raw:key.easing==='ease-in'?raw*raw:key.easing==='ease-out'?1-(1-raw)*(1-raw):raw*raw*(3-2*raw);
      const result={...previous};
      for(const field of ['x','y','scale','rotate','opacity'] as const) result[field]=previous[field]+(next[field]-previous[field])*t;
      return result;
    }
    previous=next; previousFrame=key.frame;
  }
  return previous;
};
export const sampleGain = (envelope:AudioClip['gainEnvelope'],frame:number):number => {
  if(!envelope?.length) return 1;
  let previous=envelope[0];
  for(const point of envelope.slice(1)){
    if(frame<point.frame){const t=Math.max(0,(frame-previous.frame)/(point.frame-previous.frame));return previous.gain+(point.gain-previous.gain)*t;}
    previous=point;
  }
  return previous.gain;
};

/** Require a unique phrase in the specified window, unless occurrence is explicit. */
export const phraseFrame = (words: Word[], phrase: string, fps: number, from: number, to: number, occurrence?: number): number => {
  const tokens: {text: string; ms: number}[] = [];
  for (const w of words) for (const text of norm(w.text)) tokens.push({text, ms: w.startMs});
  const wanted = norm(phrase);
  if (!wanted.length) fail(`empty normalized cue: ${phrase}`);
  const hits: number[] = [];
  for (let i = 0; i <= tokens.length - wanted.length; i++) {
    const frame = Math.round(tokens[i].ms * fps / 1000);
    if (frame < from || frame >= to) continue;
    if (wanted.every((w, j) => tokens[i + j].text === w && Math.round(tokens[i+j].ms*fps/1000)<to)) hits.push(frame);
  }
  if (occurrence !== undefined) {
    if (occurrence < 1 || occurrence > hits.length) fail(`cue occurrence unavailable: ${phrase}`);
    return hits[occurrence - 1];
  }
  if (hits.length !== 1) fail(`cue must resolve exactly once in its window: ${phrase} (${hits.length} hits)`);
  return hits[0];
};

export const resolveEpisode = (input: unknown): ResolvedEpisode => {
  const e = obj(input, 'episode');
  keys(e, ['id','version','scriptVersion','planVersion','width','height','fps','durationInFrames','timingBasis','words','assets','audio','shots'], 'episode');
  const fps = integer(e.fps, 'fps', 1);
  const durationInFrames = integer(e.durationInFrames, 'durationInFrames', 1);
  const words = list(e.words ?? [], 'words').map((v, i): Word => {
    const w = obj(v, `word ${i}`); keys(w, ['text','startMs','endMs'], 'word');
    const startMs = number(w.startMs, 'word.startMs', 0), endMs = number(w.endMs, 'word.endMs', 0);
    if (endMs <= startMs || endMs > durationInFrames / fps * 1000 + 1) fail('word outside episode or nonpositive duration');
    return {text: str(w.text, 'word.text'), startMs, endMs};
  });
  if (words.some((w, i) => i > 0 && w.startMs < words[i - 1].startMs)) fail('word timings out of order');
  const assets = list(e.assets ?? [], 'assets').map((v): Asset => {
    const a = obj(v, 'asset'); keys(a, ['id','file','version','status','rights','role'], 'asset');
    return {id: str(a.id, 'asset.id'), file: path(a.file, 'asset.file'), version: str(a.version, 'asset.version'), status: choice(a.status, ['draft','inspected'], 'asset.status'), rights: choice(a.rights, ['recorded','unresolved'], 'asset.rights'), role: str(a.role, 'asset.role')};
  });
  unique(assets.map(a => a.id), 'asset');
  const audio = list(e.audio ?? [], 'audio').map((v): AudioClip => {
    const a = obj(v, 'audio'); keys(a, ['id','file','role','fromFrame','durationFrames','trimBeforeFrames','volume','fadeFrames','loop','rights','gainEnvelope'], 'audio');
    const gainEnvelope=a.gainEnvelope===undefined?undefined:list(a.gainEnvelope,'gainEnvelope').map(v=>{const p=obj(v,'gain point');keys(p,['frame','gain'],'gain point');return {frame:integer(p.frame,'gain frame'),gain:unit(p.gain,'gain')};});
    const clip: AudioClip = {id: str(a.id,'audio.id'),file:path(a.file,'audio.file'),role:choice(a.role,['voice','music','sfx','ambience','action','editorial-accent'],'audio.role'),fromFrame:integer(a.fromFrame,'audio.fromFrame'),durationFrames:integer(a.durationFrames,'audio.durationFrames',1),trimBeforeFrames:integer(a.trimBeforeFrames ?? 0,'audio.trimBeforeFrames'),volume:number(a.volume ?? 1,'audio.volume',0),fadeFrames:integer(a.fadeFrames ?? 0,'audio.fadeFrames'),loop:bool(a.loop,'audio.loop',false),rights:choice(a.rights ?? 'unresolved',['recorded','unresolved'],'audio.rights'),gainEnvelope};
    if (clip.volume > 1 || clip.fromFrame + clip.durationFrames > durationInFrames || clip.fadeFrames * 2 > clip.durationFrames) fail(`invalid audio bounds: ${clip.id}`);
    if (clip.loop && !['music','ambience'].includes(clip.role)) fail('only music or ambience clips may loop');
    if(gainEnvelope && (!gainEnvelope.length || gainEnvelope[0].frame!==0 || gainEnvelope.some((p,i)=>p.frame>=clip.durationFrames || (i>0&&p.frame<=gainEnvelope[i-1].frame)))) fail('gain envelope must start at 0 and increase inside clip');
    return clip;
  });
  unique(audio.map(a => a.id), 'audio');
  const shots = list(e.shots,'shots').map((v): Shot => {
    const s = obj(v,'shot'); keys(s,['id','fromFrame','anchor','occurrence','background','layers','note','camera'],'shot');
    let camera:Camera|undefined;
    if(s.camera!==undefined){const c=obj(s.camera,'camera');keys(c,['reason','keyframes','pivotX','pivotY'],'camera');camera={reason:str(c.reason,'camera.reason'),keyframes:parseKeyframes(c.keyframes),pivotX:unit(c.pivotX??0.5,'camera.pivotX'),pivotY:unit(c.pivotY??0.5,'camera.pivotY')};}
    const fromFrame = optionalInt(s.fromFrame,'shot.fromFrame');
    const anchor = s.anchor === undefined ? undefined : str(s.anchor,'shot.anchor');
    if ((fromFrame === undefined) === (anchor === undefined)) fail('shot needs exactly one of fromFrame/anchor');
    if (s.occurrence !== undefined && !anchor) fail('shot occurrence needs anchor');
    const layers = list(s.layers,'layers').map((v): Layer => {
      const l = obj(v,'layer');
      keys(l,['id','kind','assetId','nativeId','text','x','y','width','height','z','color','fromFrame','at','occurrence','untilFrame','enter','enterFrames','scale','rotate','motion','parentId','pivotX','pivotY','opacity','keyframes','textRole','fontSize','lineHeight','align','padding','space'],'layer');
      const kind = choice(l.kind,['image','text','rect','group','native'],'layer.kind');
      const assetId = l.assetId === undefined ? undefined : str(l.assetId,'layer.assetId');
      const nativeId = l.nativeId === undefined ? undefined : choice(l.nativeId,['N_PAPER','N_SUN','N_SCOPE','N_RELATION','N_HOUSE','N_LIGHT_FX','N_RULE','N_RECAP','N_SEAT','N_RUSH_PROCESS','N_FORGE_SOUND','N_CARE_TIME','N_WATCH_DUTY','N_MUSIC_SWAP','N_CONDITION_GATE'],'layer.nativeId');
      const text = l.text === undefined ? undefined : str(l.text,'layer.text');
      if (kind === 'image' && (!assetId || !assets.some(a => a.id === assetId))) fail('image layer needs an existing assetId');
      if (kind !== 'image' && assetId) fail('only image layers use assetId');
      if (kind === 'native' && !nativeId) fail('native layer needs nativeId');
      if (kind !== 'native' && nativeId) fail('only native layers use nativeId');
      if (kind === 'text' && !text) fail('text layer needs text');
      if(kind!=='text' && ['textRole','fontSize','lineHeight','align','padding'].some(k=>l[k]!==undefined)) fail('text layout fields require text layer');
      const keyframes=l.keyframes===undefined?undefined:parseKeyframes(l.keyframes);
      if(keyframes&&l.motion!==undefined) fail('choose motion or keyframes, not both');
      if(l.parentId!==undefined && l.space!==undefined) fail('only root layers set space; children inherit their group space');
      const fromFrame = optionalInt(l.fromFrame,'layer.fromFrame');
      const at = l.at === undefined ? undefined : str(l.at,'layer.at');
      if (at && fromFrame !== undefined) fail('layer cannot set both at/fromFrame');
      if (l.occurrence !== undefined && !at) fail('layer occurrence needs at');
      let motion: Motion | undefined;
      if (l.motion !== undefined) {
        const m = obj(l.motion,'motion'); keys(m,['toX','toY','toScale','durationFrames'],'motion');
        motion = {durationFrames:integer(m.durationFrames,'motion.durationFrames',1),toX:m.toX === undefined ? undefined : number(m.toX,'motion.toX'),toY:m.toY === undefined ? undefined : number(m.toY,'motion.toY'),toScale:m.toScale === undefined ? undefined : number(m.toScale,'motion.toScale',0.01)};
        if (motion.toX === undefined && motion.toY === undefined && motion.toScale === undefined) fail('motion needs an endpoint');
      }
      return {id:str(l.id,'layer.id'),kind,assetId,nativeId,text,x:number(l.x,'layer.x'),y:number(l.y,'layer.y'),width:number(l.width,'layer.width',1),height:number(l.height,'layer.height',1),z:number(l.z ?? 0,'layer.z'),color:str(l.color ?? '#28313A','layer.color'),fromFrame,at,occurrence:optionalInt(l.occurrence,'layer.occurrence'),untilFrame:optionalInt(l.untilFrame,'layer.untilFrame'),enter:choice(l.enter ?? 'none',['none','fade'],'layer.enter'),enterFrames:integer(l.enterFrames ?? 8,'layer.enterFrames',1),scale:number(l.scale ?? 1,'layer.scale',0.01),rotate:number(l.rotate ?? 0,'layer.rotate'),motion,
        parentId:l.parentId===undefined?undefined:str(l.parentId,'parentId'),pivotX:l.pivotX===undefined?undefined:unit(l.pivotX,'pivotX'),pivotY:l.pivotY===undefined?undefined:unit(l.pivotY,'pivotY'),opacity:l.opacity===undefined?undefined:unit(l.opacity,'opacity'),keyframes,space:l.space===undefined?undefined:choice(l.space,['world','screen'] as const,'space'),
        textRole:l.textRole===undefined?undefined:choice(l.textRole,['headline','keyLabel','scopeNote'] as const,'textRole'),fontSize:l.fontSize===undefined?undefined:number(l.fontSize,'fontSize',1),lineHeight:l.lineHeight===undefined?undefined:number(l.lineHeight,'lineHeight',0.1),align:l.align===undefined?undefined:choice(l.align,['left','center','right'] as const,'align'),padding:l.padding===undefined?undefined:number(l.padding,'padding',0)};
    });
    if (!layers.length) fail('shot needs visible layers');
    unique(layers.map(l => l.id),'layer within shot');
    return {id:str(s.id,'shot.id'),fromFrame,anchor,occurrence:optionalInt(s.occurrence,'shot.occurrence'),background:str(s.background ?? '#F4EDE1','shot.background'),layers,camera,note:s.note === undefined ? undefined : str(s.note,'shot.note')};
  });
  if (!shots.length) fail('episode needs shots');
  unique(shots.map(s => s.id),'shot');
  const starts = shots.map(s => s.fromFrame ?? phraseFrame(words,s.anchor as string,fps,0,durationInFrames,s.occurrence));
  if (starts[0] !== 0 || starts.some((f,i) => f >= durationInFrames || (i > 0 && f <= starts[i-1]))) fail('shots must start at 0 and increase strictly inside episode');
  const resolved = shots.map((s,i): ResolvedShot => {
    const startFrame = starts[i], endFrame = starts[i+1] ?? durationInFrames;
    const layers = s.layers.map((l): ResolvedLayer => {
      const enterFrame = l.at ? phraseFrame(words,l.at,fps,startFrame,endFrame,l.occurrence) - startFrame : l.fromFrame ?? 0;
      const exitFrame = l.untilFrame ?? endFrame - startFrame;
      if (enterFrame >= exitFrame || exitFrame > endFrame - startFrame) fail(`layer timing outside shot: ${s.id}/${l.id}`);
      if (l.motion && l.motion.durationFrames > exitFrame - enterFrame) fail(`motion too long: ${s.id}/${l.id}`);
      if(l.keyframes && l.keyframes[l.keyframes.length-1].frame>=exitFrame-enterFrame) fail(`keyframe outside layer: ${s.id}/${l.id}`);
      return {...l,enterFrame,exitFrame};
    });
    if (!layers.some(l => l.enterFrame === 0)) fail(`shot needs an explicitly authored initial layer: ${s.id}`);
    for(const layer of layers){
      const seen=new Set([layer.id]);let current=layer;
      while(current.parentId){
        const parent=layers.find(l=>l.id===current.parentId);
        if(!parent || parent.kind!=='group') fail(`parent must be an existing group: ${current.id}`);
        const p=parent!;
        if(seen.has(p.id)) fail('cyclic layer groups');seen.add(p.id);
        if(current.enterFrame<p.enterFrame || current.exitFrame>p.exitFrame) fail('child lifetime outside parent group');
        current=p;
      }
    }
    if(s.camera && s.camera.keyframes[s.camera.keyframes.length-1].frame>=endFrame-startFrame) fail('camera keyframe outside shot');
    return {...s,startFrame,durationInFrames:endFrame-startFrame,layers};
  });
  const timingBasis = choice(e.timingBasis,['estimated','audio-aligned'],'timingBasis');
  if (timingBasis === 'audio-aligned' && !audio.some(a => a.role === 'voice')) fail('audio-aligned episode needs voice');
  return {id:str(e.id,'episode.id'),version:str(e.version,'episode.version'),scriptVersion:str(e.scriptVersion,'scriptVersion'),planVersion:str(e.planVersion,'planVersion'),width:integer(e.width,'width',1),height:integer(e.height,'height',1),fps,durationInFrames,timingBasis,words,assets,audio,shots:resolved};
};
