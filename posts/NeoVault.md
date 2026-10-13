---
title: NeoVault
summary: "HTB Bug Bounty CTF workflow: predict MongoDB ObjectIds and exploit IDOR to retrieve the flag."
date: 2025-09-04
tag: htb-machines
---

![](/images/posts/NeoVault_1.png)

>#### The challenge description
>**Neovault** is a trusted banking application that allows users to effortlessly transfer funds to one another and conveniently download their transaction history. We invite you to explore the application for any potential vulnerabilities and uncover the flag hidden within its depths.

## **Introduction**
This web application is vulnerable to `IDOR` with exploit the `MongoDB Object IDs` Prediction which allows us to discover other users Ids and with IDOR can read their transaction  

## **Vulnerability Discovery & Exploitation**

- By enumerating analyzing the request and response , we can discover interesting APIs that we can exploit and the web application use `Mongo Object ID` (we had it from the challenge’s description)
- When we visited the transaction tab , we noticed the browser send request to API `/api/v2/transactions` and gets transaction with user `neo_system` 
- the body of `/api/v2/transactions` contains `toUserId` parameter so we can retrieve the ID of user `neo_system`
- we can use that `Object ID`  to predict other IDs . To do this , we will use the following script or [mongo-objectid-predict](https://github.com/andresriancho/mongo-objectid-predict)

### Exploiting MongoDB Object IDs Prediction 

```python
from bson.objectid import ObjectId
from datetime import datetime

# That neo system ID change here:685f6ce00a273c2d0e852541
oid = ObjectId("685edf544481addc20be4306")
print(oid.generation_time)  # Timestamp

# Generate nearby IDs:
base = int(str(oid), 16)
for offset in range(-10, 10):
    new_id = hex(base + offset)[2:]
    print(new_id)
```

```bash
$ python3 generate_id_mongodb.py
```

- Now, we can enumerate other users by using the wordlist we created. We can use Burp Suite Intruder to automate the process, using each entry from the list as the `neo_system` user ID parameter.

Boom!! By navigating to the Transactions tab, we can see that another user `user_with_flag`has been added to the list

![](/images/posts/NeoVault_2.png)

### Exploiting IDOR
 
 >at this time , we only exploited MongoDB Object IDs Prediction but IDOR is still here . the answer might be in `Download PDF` 

- I started analyzing `js source code` , when i search for keyword like `api, v1, v2` , I found v1 of APIs .
- By checking the version 1 , I found that the endpoint `/api/v1/transactions/download-transactions` is the only one that works , but it need of `_id` parameter. 

![](/images/posts/NeoVault_3.png)

- I added the victim user's ID (`user_with_flag`) and sent the request. Finally, we were able to download this user's transaction, which contains the flag.

![](/images/posts/NeoVault_4.png)
