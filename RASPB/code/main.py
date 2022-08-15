#! /usr/bin/python 


#インポート
import sys
#ユーザーのpipにパスを通す
sys.path.append("/home/toukaaoi/.local/lib/python3.9/site-packages")

import RPi.GPIO as GPIO
import redis
import time 
import json
import dht11


class ght_inst:
    def __init__(self, pin):
        self.humid = -1
        self.temp = -1
        self.inst = dht11.DHT11(pin = 23)

    def measure(self):
        result = self.inst.read()
        self.humid = result.humidity
        self.temp = result.temperature
    
    def call(self):
        self.measure()
        return json.dumps({"t" : self.temp, "h" : self.humid})

class redis_inst:
    def __init__(self, host, port=6379, db=0):
        self.inst = redis.Redis(host=host, port=port, db=db)
    def send(self, channel, data):
        #json(stringを受け取る)
        return self.inst.publish(channel, data)


def main():
    # initialize GPIO
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.cleanup()

    #インスタンス作成
    ght_instance = ght_inst(23)
    redis_instance = redis_inst("toukard.com")
    channel = "dht11"

    #デーモン用
    while (True):
        #データ取得
        data = ght_instance.call()
        
        #デバッグ
        #print(data)

        #パブリッシュ
        redis_instance.send(channel, data)
        #1秒待
        time.sleep(60)

if __name__ == "__main__":
    main()