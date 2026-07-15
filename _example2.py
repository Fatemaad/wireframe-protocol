from PIL import Image, ImageDraw
import math
from _um import render_um

W=H=1024
img=Image.new("RGB",(W,H),(0,0,0))
d=ImageDraw.Draw(img,"RGBA")
INK=(232,236,242,255); DIM=(232,236,242,150)

def sphere(cx,cy,r,squashx=1.0,nlon=9,nlat=7,col=DIM,w=1,latsq=0.34):
    for i in range(1,nlat):
        phi=math.pi*i/nlat; y=cy-r*math.cos(phi)
        rx=r*math.sin(phi)*squashx; eh=rx*latsq
        d.ellipse([cx-rx,y-eh,cx+rx,y+eh],outline=col,width=w)
    for j in range(nlon):
        th=math.pi*j/nlon; rx=abs(r*math.cos(th))*squashx
        d.ellipse([cx-rx,cy-r,cx+rx,cy+r],outline=col,width=w)
    d.ellipse([cx-r*squashx,cy-r,cx+r*squashx,cy+r],outline=INK,width=2)

# PERSON head
hx,hy,hr=372,330,140
sphere(hx,hy,hr,0.92,9,7,DIM,1)
d.ellipse([hx-58,hy-6,hx-30,hy+14],outline=(150,180,255,230),width=2)
d.ellipse([hx+30,hy-6,hx+58,hy+14],outline=(150,180,255,230),width=2)
d.line([hx-26,hy+hr-8,hx-30,hy+hr+46],fill=DIM,width=1)
d.line([hx+26,hy+hr-8,hx+30,hy+hr+46],fill=DIM,width=1)
tcx=372
for k in range(9):
    yy=hy+hr+40+k*40; ww=150+k*20
    d.ellipse([tcx-ww,yy-26,tcx+ww,yy+26],outline=DIM,width=1)
for vx in range(-3,4):
    xx=tcx+vx*52; d.line([xx,hy+hr+40,xx+vx*10,H-40],fill=(232,236,242,90),width=1)
d.arc([tcx-190,hy+hr-10,tcx+190,hy+hr+260],200,340,fill=INK,width=2)

# ARM + IRON
hand=(560,690)
d.line([tcx+120,hy+hr+120,hand[0],hand[1]],fill=INK,width=2)
for t in range(5):
    d.line([tcx+120+t*8,hy+hr+120+t*6,hand[0],hand[1]-6+t*4],fill=(232,236,242,80),width=1)
tip=(662,742)
d.line([hand[0],hand[1],tip[0],tip[1]],fill=INK,width=3)
d.line([hand[0]-4,hand[1]-10,hand[0]+40,hand[1]-2],fill=DIM,width=6)
d.polygon([tip[0]-2,tip[1]-6,tip[0]+10,tip[1]+2,tip[0]-2,tip[1]+6],outline=INK)
sm=[(tip[0]+4,tip[1]-8)]
for i in range(1,7): sm.append((tip[0]+4+14*math.sin(i*0.9),tip[1]-8-i*16))
d.line(sm,fill=(232,236,242,120),width=1,joint="curve")

# BOARD
bx0,by0,bx1,by1=600,760,830,860
d.polygon([bx0,by0+18,bx0+40,by0,bx1,by0+24,bx1-40,by1],outline=INK)
for gx in range(1,9):
    xx=bx0+gx*(bx1-bx0)/9; d.line([xx,by0+6,xx-6,by1-6],fill=(232,236,242,70),width=1)
for gy in range(1,4):
    d.line([bx0+6,by0+18+gy*20,bx1-6,by0+24+gy*16],fill=(232,236,242,70),width=1)
d.rectangle([bx0+70,by0+34,bx0+120,by0+64],outline=INK)

# AXIE
ax,ay,ar=760,560,96
sphere(ax,ay,ar,1.0,8,6,DIM,1)
d.ellipse([ax-52,ay-6,ax-14,ay+34],fill=(0,0,0,255),outline=INK,width=1)
d.ellipse([ax+14,ay-6,ax+52,ay+34],fill=(0,0,0,255),outline=INK,width=1)
d.ellipse([ax-49,ay-3,ax-31,ay+15],fill=(0,0,0,255))
byy=ay+ar+8
sphere(ax,byy+30,70,1.0,7,5,DIM,1)
d.line([ax-64,byy+18,ax-96,byy+40],fill=DIM,width=2)
d.line([ax+64,byy+18,ax+96,byy+40],fill=DIM,width=2)
d.ellipse([ax-70,byy+78,ax-20,byy+104],outline=INK,width=2)
d.ellipse([ax+20,byy+78,ax+70,byy+104],outline=INK,width=2)

# LOGOS
def axiometa(x,top,h):
    s=h/100
    def Ln(a,b,c,e): d.line([x+a*s,top+b*s,x+c*s,top+e*s],fill=INK,width=max(2,int(8*s)))
    Ln(26,30,26,58); Ln(74,30,74,58); Ln(26,30,66,78); Ln(74,30,34,78); return h
def paste(path,x,y,h):
    im=Image.open(path).convert("RGBA"); w=int(im.width*h/im.height)
    im=im.resize((w,h),Image.LANCZOS); img.paste(im,(int(x),int(y)),im); return w

pad=34; gap=20; lh=42
x=pad
x+=axiometa(x,pad,lh)+gap
x+=paste("assets/Anthropic.png",x,pad,lh)+gap
um=render_um(lh+2); img.paste(um,(int(x),int(pad-1)),um); x+=um.width+gap

bh=38; byb=H-pad-bh; bx=pad
bx+=paste("assets/modal-logo-icon.png",bx,byb,bh)+gap
bx+=paste("assets/linkup.png",bx,byb,bh)+gap
bx+=paste("assets/bambu.png",bx,byb,bh)+gap

img.save("example-wireframe.png","PNG"); print("saved", img.size)
