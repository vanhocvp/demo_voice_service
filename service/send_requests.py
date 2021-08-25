import requests
from threading import Thread

def send_request(i):
    signal = f"send by vanhocvp - {i}"
    response = requests.post("http://localhost:1234/api/", json = {'signal':signal})
    print (response)
    
for i in range (10):
    t = Thread(target = send_request, args=(i,))
    t.start()
    # break

# t2 = Thread(target = send_request, args=(2,))
# t3 = Thread(target = send_request, args=(3,))
# t4 = Thread(target = send_request, args=(4,))
# t2.start()
# t3.start()
# t4.start()