"""Optional maintenance: pip install 'fonttools[woff]', then run this file.
Regenerates Pretendard subsets after adding text; rebuild CSS afterwards.
"""
from pathlib import Path
import hashlib,re
from fontTools import subset
root=Path(__file__).resolve().parent
chars=set(range(32,127))|{160}
for p in [*root.glob('*.html'),*root.glob('*.js'),*(root/'styles').glob('*.css')]:
    chars.update(map(ord,p.read_text(encoding='utf8')))
base=root/'styles/styles.css';css=base.read_text(encoding='utf8')
for weight,name in [(400,'Regular'),(700,'Bold')]:
    options=subset.Options();options.flavor='woff2';options.layout_features=['*']
    font=subset.load_font(str(root/f'assets/fonts/Pretendard-{name}.otf'),options)
    sub=subset.Subsetter(options=options);sub.populate(unicodes=chars);sub.subset(font)
    dest=root/f'assets/fonts/Pretendard-{name}.woff2';subset.save_font(font,str(dest),options)
    version=hashlib.sha256(dest.read_bytes()).hexdigest()[:8]
    coverage=sorted(set().union(*(set(t.cmap)for t in font['cmap'].tables if t.isUnicode())))
    ranges=','.join(f'U+{c:X}'for c in coverage)
    face=f"@font-face{{font-family:Pretendard;src:url('./assets/fonts/Pretendard-{name}.woff2?v={version}') format('woff2');font-weight:{weight};font-display:swap;unicode-range:{ranges};}}"
    css=re.sub(r"@font-face\{font-family:Pretendard;src:url\('./assets/fonts/Pretendard-"+name+r"\.woff2[^}]+\}",lambda _:face,css)
    for page in root.glob('*.html'):
        text=page.read_text(encoding='utf8');page.write_text(re.sub(r'Pretendard-'+name+r'\.woff2\?v=[^"\s]+','Pretendard-'+name+'.woff2?v='+version,text),encoding='utf8')
base.write_text(css,encoding='utf8')
