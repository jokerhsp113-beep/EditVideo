import React from 'react';
import {AbsoluteFill,Composition,Img,registerRoot} from 'remotion';
const Asset:React.FC<{svg:string}>=({svg})=><AbsoluteFill><style>{`@font-face{font-family:'Patrick Hand';src:url('/fonts/PatrickHand-Regular.ttf')}`}</style><Img src={'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)))} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
registerRoot(()=> <Composition id="ASSET-REVIEW" component={Asset} width={1920} height={1080} fps={30} durationInFrames={1} defaultProps={{svg:''}}/>);
