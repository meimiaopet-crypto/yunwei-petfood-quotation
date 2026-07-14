"""
下载完整 Noto Sans CJK SC OTF 字体到 assets/fonts。

背景：
- 之前用 fonttools 手动子集化的 woff2/TTF 在 WPS 中渲染异常（空白/方块）。
- 实测 @react-pdf/renderer 内置的 fontkit 会在渲染时按 PDF 实际用字自动子集化，
  使用完整 OTF 反而得到更小的 PDF（~130KB）且 WPS 兼容性更好。
- 因此改为直接下载完整 Noto Sans CJK SC（简体中文）OTF 字体，
  让 @react-pdf 自行做运行时子集化。

用法：
  <venv>/Scripts/python.exe scripts/download_fonts.py
依赖：无（仅标准库 urllib）
输出：assets/fonts/NotoSansSC-Regular.otf, NotoSansSC-Bold.otf
"""
import os
import urllib.request

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")

SOURCES = {
    "NotoSansSC-Regular.otf": "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
    "NotoSansSC-Bold.otf": "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf",
}


if __name__ == "__main__":
    os.makedirs(FONT_DIR, exist_ok=True)
    for name, url in SOURCES.items():
        dst = os.path.join(FONT_DIR, name)
        print(f"downloading {name} ...")
        urllib.request.urlretrieve(url, dst)
        print(f"  {os.path.getsize(dst) // 1024}KB")
    print("done")
