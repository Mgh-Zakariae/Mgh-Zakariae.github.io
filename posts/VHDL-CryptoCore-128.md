---
title: VHDL CryptoCore 128
summary: "VHDL-CryptoCore-128: High-Performance AES-128 Hardware Engine"
date: 2026-01-25
tag: embedded-iot
---



# VHDL-CryptoCore-128: High-Performance AES-128 Hardware Engine




**CryptoCore-128** is a robust, high-throughput hardware implementation of the **Advanced Encryption Standard (AES)** with a 128-bit key length. Designed specifically for **FPGA (Field Programmable Gate Array)** deployment, this VHDL engine provides hardware-level isolation and deterministic performance, making it ideal for securing sensitive real-time data streams where software encryption would be too slow.

The system is managed by a sophisticated **Finite State Machine (FSM)** known as , ensuring seamless coordination between key generation, data buffering, and the core cryptographic transformation rounds.



Our mission was to develop a hardware security module capable of protecting data in modern autonomous systems:
* **Real-Time Encryption:** Achieving low-latency processing to secure continuous data flows (e.g., Drone-to-Ground communication).
* **Hardware-Based Security:** Offloading cryptographic tasks from the CPU to a dedicated, tamper-resistant FPGA fabric.
* **Autonomous Key Management:** Integrating a **CSPRNG** (Cryptographically Secure Pseudo-Random Number Generator) for internal, secure key rotation.



##  System Architecture
The architecture is modular, facilitating independent verification of each component before final integration into the `AES_Core`.

### 1. The Control Unit (FSM Orchestrator)
The FSM acts as the "Logical Brain" of the system, managing transitions through critical states:
* **IDLE:** Power-saving mode, waiting for the `System_START` signal.
* **KEY_GEN:** Interfacing with the **CSPRNG** to prepare a fresh 128-bit key.
* **ENCRYPT:** Executing the 10 transformation rounds of the AES algorithm.
* **STREAMING:** Coordinating the data pipeline between Input and Output FIFOs for continuous operation.
* 
![](https://github.com/user-attachments/assets/82f90110-0f76-438c-93c5-746cd6af69e9)

  

### 2. The Data Path (AES Engine)
 The data path includes:
* **Key Expansion:** An internal logic block that derives 11 round keys from the initial seed.
* **Core Transformations:** Optimized VHDL entities for `SubBytes` (S-Box), `ShiftRows`, `MixColumns`, and `AddRoundKey`.
* **Galois Field Math:** Efficient hardware multiplication in $GF(2^8)$ to minimize resource utilization.

![](https://github.com/user-attachments/assets/46c2b0a0-db08-43e0-a152-7a7ffa500316)





### 3. Key Management (CSPRNG)
The engine includes a dedicated generator providing high entropy keys, ensuring that the encryption remains unpredictable and robust against cryptanalysis.



##  Simulation & Verification
The design was tested using **ModelSim** to ensure 100% functional accuracy.

* **Logic Verification:** Simulation waveforms confirm perfect state transitions from `RUN` to `DONE_STATE`.
* **Timing Analysis:** Validated `key_valid` and `ciphertext_ready` signals to guarantee synchronization.
* **Hexadecimal Accuracy:** Output ciphertexts were verified against official NIST test vectors.

![](https://github.com/user-attachments/assets/46c9471e-594e-4a7f-a813-4a8a074ed1e9)
![](https://github.com/user-attachments/assets/b9644f3a-d28e-4b68-8631-1c84ae9f3e91)
![](https://github.com/user-attachments/assets/58f11b60-b64e-461f-b1ef-78f5ed9e2c84)







## Real-World Applications

*  Aerospace & UAVs: Securing telemetry and video feeds for military and commercial drones.
*  Automotive Security: Protecting CAN-bus networks in autonomous vehicles from external interference.
*  Edge Computing: Acting as a hardware accelerator for secure IoT gateways and data hubs.


# Code source 

[https://github.com/Kouissi-Hamza/AES_128_VHDL](https://github.com/Kouissi-Hamza/AES_128_VHDL)