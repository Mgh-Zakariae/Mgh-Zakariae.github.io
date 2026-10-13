---
title: Building a SIEM & SOC Detection Lab with Elastic Stack (ELK)
summary: "Designed and implemented a security monitoring solution based on the Elastic Stack to collect, process, and visualize security event logs"
tag: homelabs
date: 2026-04-02
---

## Overview

This project focused on creating and testing SIEM detection rules to identify suspicious activities and common cyberattacks through log analysis.

Using the Elastic Stack, we collected, processed, and analyzed security events to detect malicious behavior and generate alerts. The project covered multiple attack scenarios in controlled lab environments.

![](/images/posts/lab_2.jfif)


## Objectives

- Collect and centralize security logs from different systems.
- Create detection rules using Kibana Query Language (KQL).
- Generate alerts when suspicious activities are detected.
- Visualize security events through Kibana dashboards.
- Map detected activities to the MITRE ATT&CK framework.

## Attack Scenarios

### 1. SSH Brute-Force Detection

Simulated SSH brute-force attempts against an Ubuntu server using Hydra from Kali Linux.

- Collected authentication logs using Auditd and Filebeat.
- Processed and structured logs with Logstash.
- Created a threshold-based KQL detection rule for repeated failed SSH login attempts.
- Configured alerts to identify suspicious authentication activity.

### 2. SQL Injection Detection

Used DVWA (Damn Vulnerable Web Application) to simulate SQL injection attacks in a controlled environment.

- Explored SQL injection attack patterns.
- Collected and analyzed application security events.
- Investigated how SIEM rules can help identify suspicious web activity.

### 3. Suspicious RDP Login Detection

Designed a detection rule to identify potentially suspicious Remote Desktop Protocol (RDP) logins using service accounts.

- Analyzed Windows Security Event ID 4624 and Logon Type 10.
- Created a KQL query to identify RDP logins performed by accounts matching the `svc*` naming pattern.
- Explored additional context, including unusual source machines and login times.
- Mapped the scenario to MITRE ATT&CK techniques **T1021.001 (RDP)** and **T1078 (Valid Accounts)**.

## Tools & Technologies

- **SIEM:** Elastic Security
- **Log Management:** Elasticsearch, Logstash, Filebeat
- **Log Collection:** Auditd, Windows Security Events
- **Detection Language:** KQL
- **Attack Simulation:** Kali Linux, Hydra, DVWA
- **Threat Framework:** MITRE ATT&CK
- **Visualization:** Kibana dashboards and alerts

## Key Takeaways

This project helped me develop practical skills in security log analysis, SIEM rule creation, alert configuration, and attack detection. It also strengthened my understanding of how to connect observed events with known adversary techniques using MITRE ATT&CK.

The main takeaway was learning how to turn raw security logs into actionable detection signals that help security teams identify suspicious behavior.
