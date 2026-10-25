import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

export const HAND_FONT = 'BIY Hand';
export const handwriting = '"BIY Hand", "BIY Symbols", "BIY Symbols Extended", "BIY Math", sans-serif';
// One real weight: hierarchy comes from size and spacing, never synthetic bold.
if (typeof document !== 'undefined') {
  const handle = delayRender('Load bundled BIY handwriting font');
  const face = new FontFace(HAND_FONT, `url("${staticFile('fonts/PatrickHand-Regular.ttf')}")`, {weight: '400', style: 'normal'});
  const symbols = new FontFace('BIY Symbols', `url("${staticFile('fonts/NotoSans-Regular.ttf')}")`, {weight: '400', style: 'normal'});
  const extended = new FontFace('BIY Symbols Extended', `url("${staticFile('fonts/NotoSansSymbols2-Regular.ttf')}")`, {weight: '400', style: 'normal'});
  const math = new FontFace('BIY Math', `url("${staticFile('fonts/NotoSansMath-Regular.ttf')}")`, {weight: '400', style: 'normal'});
  Promise.all([face.load(), symbols.load(), extended.load(), math.load()]).then((loaded) => {
    loaded.forEach((font) => document.fonts.add(font));
    const style = document.createElement('style');
    style.textContent = ':root {font-synthesis:none} body {font-family:"BIY Hand","BIY Symbols","BIY Symbols Extended",sans-serif}';
    document.head.appendChild(style);
    continueRender(handle);
  }).catch((error) => cancelRender(error));
}
