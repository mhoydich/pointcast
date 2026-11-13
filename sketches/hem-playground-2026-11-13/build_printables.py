from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
R=Path(__file__).resolve().parent
W,H=A4
ink=HexColor('#14243d');cream=HexColor('#f5f0df');coral=HexColor('#d95643')
url='https://pointcast.xyz/loom?to=%23pocket-poems'
c=canvas.Canvas(str(R/'Pocket-Poems-and-Prize.pdf'),pagesize=A4)
c.setTitle('Hem: Pocket Poems and a Questionable Prize');c.setAuthor('Hem (AI), for mh')
def text(x,y,t,size=10,font='Helvetica',color=ink):
 c.setFillColor(color);c.setFont('DejaVu-Bold' if font=='Helvetica-Bold' else 'DejaVu',size);c.drawString(x,y,t)
def qr(x,y,size,url):
 q=QrCodeWidget(url);x0,y0,x1,y1=q.getBounds();d=Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),0,0]);d.add(q);renderPDF.draw(d,c,x,y)
text(30,H-35,'POEMS YOU CAN FIND',20,'Helvetica-Bold');text(30,H-53,'Four pocket poems by Hem. Print, cut, and place with the host\'s permission.',9)
cards=[('AT THE CAFE',['The cup leaves a circle.','I leave a chair.','For a minute the table','has both of us there.'],'01-poetry-laundromat.png'),('IN THE COURTYARD',['One leaf takes the pool','at its own slow pace.','Nobody asks it','to finish the race.'],'03-missing-beret.png'),('IN THE COURT BAG',['We said one more.','The shadows grew.','The court lights came on.','We started two.'],'05-poems-you-can-find.png'),('ON THE WAY HOME',['A window goes gold.','A bicycle clicks.','The street does its poem','without any tricks.'],'04-bad-poetry-night.png')]
cw=(W-72)/2;ch=337
for i,(title,lines,img) in enumerate(cards):
 x=30+(i%2)*(cw+12);y=H-78-(i//2)*(ch+14)-ch
 c.setFillColor(cream);c.rect(x,y,cw,ch,fill=1,stroke=0);c.setStrokeColor(HexColor('#c6bda6'));c.setDash(2,3);c.rect(x,y,cw,ch,fill=0,stroke=1);c.setDash()
 c.drawImage(str(R/img),x+10,y+ch-142,width=cw-20,height=(cw-20)*9/16)
 text(x+15,y+ch-167,title,12,'Helvetica-Bold',coral)
 for k,line in enumerate(lines):text(x+15,y+ch-194-k*17,line,11)
 text(x+15,y+29,'Hem / Loom',9,'Helvetica-Bold');text(x+15,y+15,'Scan for the poem thread.',8)
 qr(x+cw-65,y+9,55,url)
text(30,24,'Asset-based Nouns scene remixes. Poems by Hem (AI), at mh\'s direction. No physical placements claimed.',7)
c.showPage()
c.setFillColor(cream);c.rect(0,0,W,H,fill=1,stroke=0);c.setStrokeColor(ink);c.setLineWidth(2);c.rect(25,25,W-50,H-50,fill=0,stroke=1);c.rect(33,33,W-66,H-66,fill=0,stroke=1)
text(55,H-75,'BAD POETRY NIGHT / LOOM',12,'Helvetica-Bold',coral)
text(55,H-126,'CERTIFICATE OF',25,'Helvetica-Bold');text(55,H-162,'QUESTIONABLE',30,'Helvetica-Bold');text(55,H-198,'ACHIEVEMENT',30,'Helvetica-Bold')
c.drawImage(str(R/'heckle-avatar.png'),W-175,H-345,width=100,height=100)
text(55,H-285,'UNAWARDED TEMPLATE',11,'Helvetica-Bold',coral)
text(55,H-316,'Presented to',12)
c.line(55,H-365,W-55,H-365)
text(55,H-393,'For an original poem of memorable, intentional awkwardness.',10)
text(55,H-430,'Winning poem / Loom message:',11);c.line(55,H-465,W-55,H-465)
text(55,H-512,'Reader tally:',11);c.line(140,H-512,W-55,H-512)
text(55,H-558,'Host:',11);c.line(95,H-558,270,H-558);text(300,H-558,'Date:',11);c.line(337,H-558,W-55,H-558)
text(55,170,'Award only after real entries and a recorded reader tally.',10)
text(55,150,'This blank certificate does not declare or authenticate a winner.',9)
qr(55,57,68,'https://pointcast.xyz/loom?to=%23bad-poetry-night');text(140,96,'Small poems. Crooked hat.',13,'Helvetica-Bold');text(140,76,'Hem + Heckle / fictional bot hosts / for mh',9)
c.save()
print(R/'Pocket-Poems-and-Prize.pdf')
