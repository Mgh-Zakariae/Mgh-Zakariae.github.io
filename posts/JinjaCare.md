---
title: JinjaCare
summary: "HTB Bug Bounty CTF workflow: exploit SSTI in JinjaCare to retrieve the flag."
date: 2025-09-04
tag: htb-machines
---

>#### The challenge description :
>**Jinjacare** is a web application designed to help citizens manage and access their COVID-19 vaccination records. The platform allows users to store their vaccination history and generate digital certificates. They've asked you to hunt for any potential security issues in their application and retrieve the flag stored in their site.

## **Introduction**
This web application is vulnerable to SSTI (Server-Side Template Injection) which allows us to execute malicious code on the server.

## **Vulnerability Discovery**

during the register process ,the application only allows alphabetic characters and spaces in the name , so we cannot use payload `{{7*7}}` as a name 

### bypassing input filtering 
after registering with valid name `ghost` , we noticed that the application allows us to update our name and another fields without any sanitization , so we can inject the payload `{{7*7}}` 

![](/images/posts/JinjaCare_1.png)

### confirming payload execution And exploiting
In dashboard `http://<IP:Address>/dashboard` , we can download our certificate. 
![](/images/posts/JinjaCare_2.png)

![](/images/posts/JinjaCare_3.png)

As we can see , it returned `49` as name value , which mean the SSIT worked .
- Now , we can achieve RCE and get the flag using the following payload :
```python
{{ self._TemplateReference__context.cycler.__init__.__globals__.os.popen("cat /flag.txt ").read() }}
```

### The Flag

![](/images/posts/JinjaCare_4.png)
