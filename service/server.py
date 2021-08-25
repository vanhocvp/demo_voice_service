import pika
from pika import channel
import redis
from flask import Flask, request, redirect, url_for, flash, jsonify
import numpy as np
import pickle as p
import json
import asyncio
import uuid
import time
from flask_cors import CORS


red = redis.Redis(
     host= 'localhost',
     port= '6379',
     db=0)

app = Flask(__name__)
CORS(app)

@app.route('/api/', methods=['POST'])
def receive_data():
    if request.method == "POST":

        data = request.files['file']
        print (f"Recieve filename: {data.filename}")
        id = str(uuid.uuid1())
        body = {'id':id,
                'signal':data.read().decode('latin-1')}

        # push data to queue rabbitmq
        connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        channel = connection.channel()
        channel.queue_declare(queue='hello')
        channel.basic_publish(exchange='',
                            routing_key='hello',
                            body=json.dumps(body)
                    )
        # set id for request
        red.set(id,json.dumps({'status':'pending'}))
        
        # await until worker done
        while json.loads(red.get(id))['status'] == "pending":
            time.sleep(0.1)
            pass
        
        # get result from redis
        result = json.loads(red.get(id))['result']

        connection.close()
        return jsonify({'result':result})

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=1234, threaded=True)