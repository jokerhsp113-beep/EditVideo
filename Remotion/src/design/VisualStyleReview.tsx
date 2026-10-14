import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {handwriting} from './typography';
import {InkArrow, InkLine, dashPattern} from './Ink';
import {Widget} from '../biy2/Widgets';

export const VisualStyleReview: React.FC = () => {
  const frame=useCurrentFrame();
  const progress=interpolate(frame,[0,24],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'#FFFFF7',color:'#111417',fontFamily:handwriting,fontWeight:400,padding:'64px 96px',boxSizing:'border-box'}}>
    <div style={{fontSize:72,lineHeight:1.1}}>Cùng một nét chữ, cùng một nét vẽ</div>
    <div style={{fontSize:38,marginTop:18}}>Tiếng Việt: Ắ Ằ Ẳ Ẵ Ặ · Ế Ề Ể Ễ Ệ · Ơ Ư Đ · Ứ Ừ Ử Ữ Ự</div>
    <div style={{fontSize:38,marginTop:12}}>Science: CO₂ · H₂O · 37°C · β · Δ · → · ≤ · ±</div>
    <div style={{position:'absolute',left:96,top:330,width:1728,height:390}}>
      <svg width={1728} height={390}>
        <InkArrow from={{x:12,y:100}} to={{x:370,y:100}} progress={progress}/>
        <InkArrow from={{x:460,y:155}} to={{x:720,y:35}} bend={-48} progress={progress} color='#17BFA6'/>
        <InkLine from={{x:850,y:100}} to={{x:1190,y:100}} dashed progress={progress} color='#526873'/>
        <rect x={1260} y={30} width={440} height={160} rx={22} fill='none' stroke='#526873' strokeWidth={5} strokeDasharray={dashPattern(5)} strokeLinecap='round'/>
      </svg>
      {['Mũi tên','Đường cong','Nét đứt','Khung chú thích'].map((label,i)=><div key={label} style={{position:'absolute',left:i*430,top:215,fontSize:38}}>{label}</div>)}
      <div style={{position:'absolute',top:305,left:0}}><Widget layer={{id:'review-arrow',kind:'code_arrow',x:0,y:0,w:370,h:60,props:{span:true}}}/></div>
      <div style={{position:'absolute',top:305,left:850}}><Widget layer={{id:'review-link',kind:'code_dashed_link',x:0,y:0,w:340,h:60}}/></div>
    </div>
    <div style={{position:'absolute',left:96,right:96,bottom:86,fontSize:40,lineHeight:1.25}}>Chữ có dấu, nhãn nhỏ và ký hiệu đều dùng font đã đóng gói trong repo.</div>
  </AbsoluteFill>;
};
