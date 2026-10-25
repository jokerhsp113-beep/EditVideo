import argparse
import pathlib
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description='Build a labelled review sheet from rendered PNGs.')
parser.add_argument('directory', type=pathlib.Path)
parser.add_argument('output', type=pathlib.Path)
args = parser.parse_args()
files = sorted(args.directory.glob('*.png'))
if not files:
    parser.error('No PNGs found')
columns, width, height, label = 3, 480, 270, 34
sheet = Image.new('RGB',(columns*width, ((len(files)+columns-1)//columns)*(height+label)), '#172A35')
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
except OSError:
    font = ImageFont.load_default()
for index, file in enumerate(files):
    x,y = index%columns*width,index//columns*(height+label)
    with Image.open(file) as im:
        im = im.convert('RGB');im.thumbnail((width,height))
        sheet.paste(im,(x+(width-im.width)//2,y+(height-im.height)//2))
    draw.text((x+12,y+height+6),file.stem,font=font,fill='white')
args.output.parent.mkdir(parents=True, exist_ok=True)
sheet.save(args.output)
print(args.output)
