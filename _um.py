# render um-white.svg (grid of 64px rects) into a transparent PIL image at given height
import re
from PIL import Image, ImageDraw
def render_um(target_h):
    svg=open("um-white.svg").read()
    rects=re.findall(r'<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"',svg)
    xs=[int(a) for a,b,w,h,c in rects]; ys=[int(b) for a,b,w,h,c in rects]
    ws=[int(w) for a,b,w,h,c in rects]; hs=[int(h) for a,b,w,h,c in rects]
    minx=min(xs); miny=min(ys); maxx=max(x+w for x,w in zip(xs,ws)); maxy=max(y+h for y,h in zip(ys,hs))
    bw=maxx-minx; bh=maxy-miny
    scale=target_h/bh
    out=Image.new("RGBA",(int(bw*scale)+1,int(bh*scale)+1),(0,0,0,0))
    dd=ImageDraw.Draw(out)
    def col(c):
        if c=="white": return (255,255,255,255)
        c=c.lstrip("#"); return (int(c[0:2],16),int(c[2:4],16),int(c[4:6],16),255)
    for a,b,w,h,c in rects:
        x0=(int(a)-minx)*scale; y0=(int(b)-miny)*scale
        dd.rectangle([x0,y0,x0+int(w)*scale,y0+int(h)*scale],fill=col(c))
    return out
if __name__=="__main__":
    render_um(44).save("_um_test.png"); print("ok", render_um(44).size)
