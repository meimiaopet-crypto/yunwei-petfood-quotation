"""
生成 assets/fonts 下打包用的精简中文字体，避免 PDF 体积过大。

背景：
- @react-pdf/renderer 会把「注册的整个字体」嵌入 PDF（不按实际用字裁剪），
  完整 Noto Sans SC 会让单个 PDF 达到 ~10-25MB。
- 本脚本用 fonttools 把字体子集化到「ASCII + 拉丁扩展(越南语) + CJK标点 +
  全角 + 货币符号 + 完整 GB2312 汉字(6763)」，单 PDF 降到 ~2-3MB。

用法：
  <venv>/Scripts/python.exe scripts/subset_fonts.py
依赖：fonttools, brotli, requests
输出：assets/fonts/NotoSansSC-Regular.woff2, NotoSansSC-Bold.woff2
"""
import os
import urllib.request
from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")

# fontsource 提供的 Noto Sans SC（简体中文子集）woff2 源
SOURCES = {
    "NotoSansSC-Regular.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2",
    "NotoSansSC-Bold.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2",
}


def build_charset():
    cps = set()
    cps.update(range(0x20, 0x7F))       # ASCII 可见
    cps.update(range(0xA0, 0x100))      # Latin-1 (¥ £ ° 等)
    cps.update(range(0x100, 0x250))     # Latin Extended-A/B (越南语)
    cps.update(range(0x1E00, 0x1F00))   # Latin Extended Additional (越南语声调)
    cps.update(range(0x2000, 0x2070))   # 一般标点
    cps.update(range(0x20A0, 0x20C0))   # 货币符号 (₫ € 等)
    cps.update(range(0x3000, 0x3040))   # CJK 符号与标点
    cps.update(range(0xFE30, 0xFE50))   # CJK 兼容标点
    cps.update(range(0xFF00, 0xFFF0))   # 全角字符
    for hi in range(0xB0, 0xF8):        # 完整 GB2312 汉字 (6763)
        for lo in range(0xA1, 0xFF):
            try:
                cps.add(ord(bytes([hi, lo]).decode("gb2312")))
            except UnicodeDecodeError:
                pass
    return cps


def subset_one(name, url, unicodes):
    dst = os.path.join(FONT_DIR, name)
    tmp = dst + ".src"
    urllib.request.urlretrieve(url, tmp)  # 下载完整子集源
    font = TTFont(tmp)  # 读取 woff2（需 brotli）
    opt = Options()
    opt.flavor = "woff2"
    opt.desubroutinize = True
    opt.name_IDs = ["*"]
    opt.notdef_outline = True
    opt.layout_features = ["*"]
    ss = Subsetter(options=opt)
    ss.populate(unicodes=list(unicodes))
    ss.subset(font)
    font.save(dst)
    os.remove(tmp)
    print(f"{name}: {os.path.getsize(dst)//1024}KB")


if __name__ == "__main__":
    os.makedirs(FONT_DIR, exist_ok=True)
    cs = build_charset()
    print("charset size:", len(cs))
    for n, u in SOURCES.items():
        subset_one(n, u, cs)
    print("done")
