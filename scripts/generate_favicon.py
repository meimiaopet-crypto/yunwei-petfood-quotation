"""
生成 favicon.ico：蓝色背景 + 白色 YW 字母
包含 16x16, 32x32, 48x48 多尺寸，兼容浏览器标签页和收藏夹
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT = r'C:\Users\Administrator\WorkBuddy\2026-07-10-14-37-27\app\favicon.ico'
BG = '#2563EB'        # 项目主色蓝
FG = '#FFFFFF'        # 白色文字
TEXT = 'YW'

# 尝试加载系统字体，找不到就用默认字体（默认字体也能显示字母）
font_paths = [
    r'C:\Windows\Fonts\arialbd.ttf',
    r'C:\Windows\Fonts\Arial.ttf',
]
font = None
for fp in font_paths:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, 40)
            break
        except Exception:
            pass
if font is None:
    font = ImageFont.load_default()

images = []
for size in (16, 32, 48, 64):
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)
    # 计算文字居中
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), TEXT, font=font, fill=FG)
    images.append(img)

images[0].save(OUTPUT, format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)], append_images=images[1:])
print(f'favicon.ico saved to {OUTPUT}')
