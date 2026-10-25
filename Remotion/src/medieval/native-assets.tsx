import React from 'react';
import {handwriting} from '../design/typography';
export const nativeAssetIds = ['N_PAPER','N_SUN','N_SCOPE','N_RELATION','N_HOUSE','N_LIGHT_FX','N_RULE','N_RECAP','N_SEAT','N_RUSH_PROCESS','N_FORGE_SOUND','N_CARE_TIME','N_WATCH_DUTY','N_MUSIC_SWAP','N_CONDITION_GATE'] as const;
export type NativeAssetId = typeof nativeAssetIds[number];
type Props = {id: NativeAssetId; text?: string; frame?: number; handwritten?:boolean};
const ink = '#3A302B', paper = '#F4EDE1', blue = '#526C7A', gold = '#BA8548';
// High-contrast handwriting stays readable on both paper and illustrated walls.
const textInk = '#111820', textHalo = '#FFF9E8';

/** Editable, screen-space graphics. Labels are supplied by each shot, never baked into historical artwork. */
export const NativeAsset: React.FC<Props> = ({id,text,frame=0,handwritten=true}) => {
  const labels=(text ?? '').split('|').map(s=>s.trim());
  const phase=(duration:number)=>Math.min(1,Math.max(0,frame/duration));
  const show=(at:number)=>Math.min(1,Math.max(0,(frame-at)/9));
  const label=(value:string,x:number,y:number,size=34,anchor:'start'|'middle'|'end'='middle',maxWidth?:number) => <text x={x} y={y} textAnchor={anchor} fontFamily={handwritten?handwriting:'Arial, sans-serif'} fontSize={size} fontWeight={handwritten?400:'bold'} fill={textInk} stroke={textHalo} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke fill" textLength={maxWidth && value.length*size*0.58>maxWidth ? maxWidth : undefined} lengthAdjust="spacingAndGlyphs">{value}</text>;
  const box=(x:number,y:number,w:number,h:number,fill=paper) => <rect x={x} y={y} width={w} height={h} rx={20} fill={fill} stroke={ink} strokeWidth={5}/>;
  if(handwritten && ['N_SCOPE','N_RULE','N_RELATION','N_RECAP','N_CONDITION_GATE'].includes(id)) {
    const wrap=(value:string,limit:number)=>{const lines:string[]=[];let line='';for(const word of value.split(' ')){if(line && (line+' '+word).length>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
    const note=(value:string,x:number,y:number,size:number,width:number,delay=0)=> <g opacity={delay===0?1:Math.min(1,Math.max(0,(frame-Math.min(delay,6))/5))}><text x={x} y={y} fill={textInk} stroke={textHalo} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={handwriting} fontWeight={400} fontSize={size} textAnchor="middle">{wrap(value,width).map((line,i)=><tspan key={i} x={x} dy={i===0?0:size*1.15}>{line}</tspan>)}</text></g>;
    return <svg viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {(id==='N_SCOPE'||id==='N_RULE') && <>{note(labels[0]||'',500,185,58,28)}<path d="M200 221 Q500 208 800 225" fill="none" stroke={gold} strokeWidth={6} strokeLinecap="round"/>{labels.slice(1).map((s,i)=><React.Fragment key={i}>{note(s,500,320+i*96,52,29,10+i*12)}</React.Fragment>)}</>}
      {id==='N_RELATION' && <>{note(labels[0]||'',240,245,52,16)}<path d="M430 300 Q500 250 570 300 M549 282 L574 300 L550 317" stroke={gold} strokeWidth={6} fill="none" strokeLinecap="round" opacity={show(10)}/>{note(labels[1]||'',770,245,52,17,17)}</>}
      {id==='N_RECAP' && labels.map((s,i)=><React.Fragment key={i}>{note(s,260+(i%2)*480,205+Math.floor(i/2)*205,56,15,i*12)}<path d={`M${115+(i%2)*480} ${235+Math.floor(i/2)*205} q145 -12 290 3`} fill="none" stroke={gold} strokeWidth={5}/></React.Fragment>)}
      {id==='N_CONDITION_GATE' && labels.map((s,i)=><React.Fragment key={i}>{note(s,500,155+i*150,62,28,i*15)}<circle cx={135} cy={137+i*150} r={10} fill={gold} opacity={show(i*15)}/></React.Fragment>)}
    </svg>;
  }
  return <svg viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label={id}>
    {id==='N_PAPER' && <><rect width="1000" height="600" fill={paper}/><path d="M50 84 Q500 54 950 86 M45 518 Q500 548 954 518" fill="none" stroke="#D4C5AF" strokeWidth="5"/></>}
    {id==='N_SUN' && <><circle cx="500" cy="300" r="126" fill={gold} stroke={ink} strokeWidth="8"/>{Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <line key={i} x1={500+156*Math.cos(a)} y1={300+156*Math.sin(a)} x2={500+206*Math.cos(a)} y2={300+206*Math.sin(a)} stroke={ink} strokeWidth="9" strokeLinecap="round"/>})}</>}
    {id==='N_SCOPE' && <>{box(60,66,880,468)}<path d="M100 176H900" stroke={ink} strokeWidth="5"/>{label(labels[0]||'SOURCE SCOPE',500,142,40)}{label(labels[1]||'',500,330,48)}{label(labels[2]||'',500,416,28)}</>}
    {id==='N_RELATION' && <>{box(54,170,332,238,'#E9D9BC')}{box(614,170,332,238,'#D3DFDF')}<path d="M402 288 H590 M558 255 L594 288 L558 321" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>{label(labels[0]||'',220,305,38,'middle',282)}{label(labels[1]||'',780,305,38,'middle',282)}</>}
    {id==='N_HOUSE' && <><path d="M95 260 L500 76 L905 260 V525 H95Z" fill={paper} stroke={ink} strokeWidth="9" strokeLinejoin="round"/><path d="M500 210 V525" stroke={ink} strokeWidth="7"/>{label(labels[0]||'REST',300,370,42)}{label(labels[1]||'WORK',700,370,42)}</>}
    {id==='N_LIGHT_FX' && <><path d="M500 500 C350 400 404 304 488 170 C484 254 628 293 578 409 C564 456 534 488 500 500Z" fill="#E7A64F" stroke={ink} strokeWidth="7"/><path d="M498 476 C442 423 468 373 508 305 C512 366 558 400 538 445Z" fill="#F4D486"/><path d={`M650 210 Q${675+Math.sin(frame/9)*8} 165 644 124`} fill="none" stroke="#9F9E99" strokeWidth="8" strokeLinecap="round" opacity={0.4}/></>}
    {id==='N_RULE' && <>{box(66,60,868,480)}<path d="M114 174 H886" stroke={ink} strokeWidth="5"/>{label(labels[0]||'RULE',500,138,46)}{label(labels[1]||'',500,285,42)}{label(labels[2]||'',500,386,31)}</>}
    {id==='N_RECAP' && <>{[0,1,2,3].map(i=><g key={i}>{box(24+i*246,120,216,320)}{label(labels[i]||'',132+i*246,290,28,'middle',190)}</g>)}</>}
    {id==='N_SEAT' && <><path d="M210 105 H277 V348 H710 V394 H270 V510 H208 V348Z M660 392 H725 V510 H660Z" fill="#96714F" stroke={ink} strokeWidth="9" strokeLinejoin="round"/><path d="M275 350 H710" stroke="#C29A6F" strokeWidth="9"/></>}
    {id==='N_RUSH_PROCESS' && <>
      {box(62,324,250,154,'#B68A63')}<ellipse cx="187" cy="324" rx="125" ry="30" fill="#D7B58A" stroke={ink} strokeWidth="6"/>
      <path d="M205 55 L205 392" stroke="#6C784C" strokeWidth="16" strokeLinecap="round" transform={`translate(${frame<48?0:Math.min(545,(frame-48)*18)} ${frame<24?-170+frame*7:frame<48?-(frame-24)*7:-168})`}/>
      <path d="M713 236 H786 V467 H713Z" fill="#77736B" stroke={ink} strokeWidth="7"/><path d="M717 267 H783" stroke={ink} strokeWidth="8"/>
      <g opacity={show(30)}>{label(labels[0]||'RUSH',192,524,30)}{label(labels[1]||'FAT',480,524,30)}{label(labels[2]||'HOLDER',755,524,30)}</g>
    </>}
    {id==='N_FORGE_SOUND' && <>
      <path d="M98 436 H424 V514 H98Z M159 436 V329 H361 V436" fill="#8C7E71" stroke={ink} strokeWidth="8"/>
      <path d="M654 185 L892 185 L892 516 L654 516Z M718 516 V315 H826 V516" fill={paper} stroke={ink} strokeWidth="8"/>
      {[0,1,2].map(i=><path key={i} d={`M${492+i*44} 292 Q${550+i*30} 350 ${492+i*44} 407`} fill="none" stroke={gold} strokeWidth="12" opacity={show(i*12)} />)}
      {label(labels[0]||'WORK',263,565,30)}{label(labels[1]||'REST',775,565,30)}
    </>}
    {id==='N_CARE_TIME' && <>
      <path d="M80 444 H920" stroke={ink} strokeWidth="10"/>
      {[0,1,2].map(i=><g key={i} opacity={show(i*18)}><circle cx={210+i*290} cy="444" r="24" fill={i===2?gold:blue} stroke={ink} strokeWidth="5"/>{label(labels[i]||['HOME','PAID WORK ENDS','REST'][i],210+i*290,350,i===1?28:32)}</g>)}
    </>}
    {id==='N_WATCH_DUTY' && <>
      <path d="M66 432 Q500 382 934 432 V532 H66Z" fill="#68785D" stroke={ink} strokeWidth="7"/>
      <circle cx="230" cy="331" r="30" fill={gold} stroke={ink} strokeWidth="6"/>
      <path d="M230 361 V415" stroke={ink} strokeWidth="14" strokeLinecap="round"/>
      <path d={`M260 329 Q450 ${235+Math.sin(frame/15)*40} 710 ${310+Math.sin(frame/15)*55}`} fill="none" stroke="#D8C89F" strokeWidth="8" strokeDasharray="14 18" opacity={show(15)}/>
      {label(labels[0]||'WATCHING',500,145,34)}
    </>}
    {id==='N_MUSIC_SWAP' && <>
      <g opacity={1-phase(35)}><path d="M120 270 L210 195 L300 270 V436 H120Z" fill={paper} stroke={ink} strokeWidth="10" strokeLinejoin="round"/>{label(labels[0]||'WORKPLACE',210,535,28)}</g>
      <g opacity={show(16)}><path d="M680 180 V410 Q660 390 632 400 Q596 414 609 443 Q626 470 670 450 Q694 437 694 410 V228 L824 201 V368 Q801 350 774 364 Q738 379 751 408 Q768 436 811 415 Q839 399 839 370 V153Z" fill={gold} stroke={ink} strokeWidth="9" strokeLinejoin="round"/></g>
      <g opacity={show(26)}>{label(labels[1]||'GATHERING',710,535,31)}</g>
    </>}
    {id==='N_CONDITION_GATE' && <>
      {[0,1,2].map(i=><g key={i} opacity={show(i*18)}>{box(46+i*322,170,274,260,i===2?'#D3DFDF':paper)}{label(labels[i]||'',183+i*322,313,23)}</g>)}
    </>}
  </svg>;
};
