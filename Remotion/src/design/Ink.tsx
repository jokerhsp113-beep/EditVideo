import React, {useId} from 'react';

export const dashPattern = (width: number) => `${width * 1.6} ${width * 2.2}`;
type Point = {x: number; y: number};
type InkProps = {
  from: Point; to: Point; color?: string; strokeWidth?: number;
  progress?: number; bend?: number; dashed?: boolean; arrow?: boolean;
};

/** Fixed geometry: the small pen curve never changes randomly between frames. */
export const InkLine: React.FC<InkProps> = ({from, to, color='#111417', strokeWidth=6, progress=1, bend, dashed=false, arrow=false}) => {
  const id = useId().replace(/:/g, '');
  const dx=to.x-from.x, dy=to.y-from.y, length=Math.hypot(dx,dy);
  if (length < 0.01 || progress <= 0) return null;
  const nx=-dy/length, ny=dx/length;
  const offset=bend ?? Math.min(5, length*0.012);
  const c1={x:from.x+dx*0.32+nx*offset, y:from.y+dy*0.32+ny*offset};
  const c2={x:from.x+dx*0.72-nx*offset*0.45, y:from.y+dy*0.72-ny*offset*0.45};
  const d=`M${from.x} ${from.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
  const t=Math.min(1,Math.max(0,progress)), u=1-t;
  const tip={x:u*u*u*from.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*to.x, y:u*u*u*from.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*to.y};
  const tx=3*u*u*(c1.x-from.x)+6*u*t*(c2.x-c1.x)+3*t*t*(to.x-c2.x);
  const ty=3*u*u*(c1.y-from.y)+6*u*t*(c2.y-c1.y)+3*t*t*(to.y-c2.y);
  const angle=Math.atan2(ty,tx), head=Math.min(strokeWidth*3.2,length*0.2);
  const wing=(side:number) => ({x:tip.x-head*Math.cos(angle+side*0.52),y:tip.y-head*Math.sin(angle+side*0.52)});
  const a=wing(-1), b=wing(1), margin=strokeWidth*6+Math.abs(offset);
  return <g fill='none' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round' strokeLinejoin='round'>
    {dashed ? <>
      <defs><mask id={id} maskUnits='userSpaceOnUse' x={Math.min(from.x,to.x)-margin} y={Math.min(from.y,to.y)-margin} width={Math.abs(dx)+margin*2} height={Math.abs(dy)+margin*2}>
        <path d={d} stroke='white' strokeWidth={strokeWidth+2} pathLength={1} strokeDasharray='1 1' strokeDashoffset={1-t}/>
      </mask></defs>
      <path d={d} strokeDasharray={dashPattern(strokeWidth)} mask={`url(#${id})`}/>
    </> : <path d={d} pathLength={1} strokeDasharray='1 1' strokeDashoffset={1-t}/>}
    {arrow && t>0.12 ? <path d={`M${a.x} ${a.y} Q${tip.x} ${tip.y} ${tip.x} ${tip.y} L${b.x} ${b.y}`} opacity={Math.min(1,(t-0.12)*5)}/> : null}
  </g>;
};
export const InkArrow: React.FC<Omit<InkProps,'arrow'>> = (props) => <InkLine {...props} arrow/>;
