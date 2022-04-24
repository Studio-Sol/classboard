import os
import random
from PIL import Image, ImageDraw, ImageFont 
import cv2
import numpy as np
import uuid

def gen_captcha():
    SEP = os.path.sep
    FONT_FILE = SEP.join(["/home/ubuntu/storage/school/router/api/captcha/", "veramono.ttf"])
    FONT_SIZE = 50
    POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    LENGTH = 5
    WIDTH = 220
    HEIGHT = 100

    R = 0
    G = 0
    B = 0
    im = Image.new("RGB", (WIDTH, HEIGHT), (R, G, B))
    draw = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT_FILE, FONT_SIZE, encoding="unic")

    value = ''.join(random.sample(POOL, LENGTH))
    
    gray = (200, 200, 200)
    tmph = random.randint(0,100)
    tmph2 = random.randint(0,100)
    draw.line((0, random.randint(0,80), 65, tmph), fill=gray, width=3)
    draw.line((65, tmph, 130, tmph2), fill=gray, width=3)
    draw.line((130, tmph2, 200, random.randint(0,100)), fill=gray, width=3)


    tmph = random.randint(0,100)
    tmph2 = random.randint(0,100)
    draw.line((0, random.randint(0,80), 65, tmph), fill=gray, width=3)
    draw.line((65, tmph, 130, tmph2), fill=gray, width=3)
    draw.line((130, tmph2, 200, random.randint(0,100)), fill=gray, width=3)

    draw.text((random.randint(10,25), random.randint(10,25)), value, font=font)


    im.save("/home/ubuntu/storage/school/tmp/" + value + ".jpg")

    l = random.uniform(20,24)      # 파장(wave length) 클수록 쉬움
    amp = random.uniform(12,16)    # 진폭(amplitude) 작을수록 쉬움

    img = cv2.imread("/home/ubuntu/storage/school/tmp/" + value + ".jpg")
    os.system("rm /home/ubuntu/storage/school/tmp/" + value + ".jpg")
    rows, cols = img.shape[:2]

    # 초기 매핑 배열 생성 ---①
    mapy, mapx = np.indices((rows, cols),dtype=np.float32)

    # sin, cos 함수를 적용한 변형 매핑 연산 ---②
    sinx = mapx + amp * np.sin(mapy/l)  
    cosy = mapy + amp * np.cos(mapx/l)

    # 영상 매핑 ---③
    # x,y 축 모두 sin, cos 곡선 적용 및 외곽 영역 보정
    img = cv2.remap(img, sinx, cosy, cv2.INTER_LINEAR, \
                        None, cv2.BORDER_REPLICATE)
    
    for i in range(random.randint(30, 40)):
        pos = (random.randint(0, WIDTH), random.randint(0, HEIGHT))
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        img = cv2.line(img, pos, pos, color, 5)


    # 결과 출력 
    id_ = uuid.uuid4().hex
    cv2.imwrite(filename="/home/ubuntu/storage/school/captcha_img/" + id_ + ".jpg", img=img)

    return id_, value

data = gen_captcha()
print('{"id": "%s", "value": "%s"}' % (data[0], data[1]))