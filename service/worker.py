import time
import pika
import sys, os, json, random
from threading import Thread
import redis

red = redis.Redis(
     host= 'localhost',
     port= '6379',
     db=0)

def worker(worker_id):
    connection = pika.BlockingConnection(pika.ConnectionParameters(host = 'localhost'))
    channel = connection.channel()
    channel.queue_declare(queue = 'hello')
    print (f"LOADED WORKER {worker_id}")
    def callback(ch,method, properties, body):
        body = json.loads(body)
        sender_id = body['id']
        signal = body['signal']
        time_sleep = random.randint(1,3)

        print (f' [x] Worker [{worker_id}] - Received {signal} from Sender {sender_id} -- {time_sleep}')        
        time.sleep(time_sleep)
        print (f' [*] Worker [{worker_id}] - Done - Response Sender {sender_id}')

        # Set result to redis              
        age = random.randint(19,60)
        result = {'status':'Done','result':age}
        red.set(sender_id, json.dumps(result))
        
        ch.basic_ack(delivery_tag= method.delivery_tag)
    
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='hello',on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    try:
        worker_id = ''.join(sys.argv[1:]) or "Hello World!"
        worker(worker_id)
    except KeyboardInterrupt:
        try:
            sys.exit(0)
        except SystemExit:
            os.exit(0)
        