---
title: End-to-End CI/CD Pipeline with Jenkins, Docker, Ansible & Kubernetes
summary: "Building an End-to-End Automated CI/CD Pipeline: From Code Push to Kubernetes Deployment"
tag: homelabs
date: 2026-05-09
---

This project demonstrates the implementation of an automated CI/CD pipeline that connects source code management, application testing, container image creation, and Kubernetes deployment.

The objective was to automate the application delivery process, from a code push to a running application inside a Kubernetes cluster, while reducing manual intervention and improving deployment consistency.

Jenkins orchestrates the pipeline, Maven handles the Java application build, Docker packages the application, and Ansible automates deployment to a local Kubernetes cluster running with kind.

## Architecture

```text
GitHub Repository
       |
       | Code Push
       v
     Jenkins
       |
       v
  Maven Build & Tests
       |
       v
   Docker Build
       |
       v
    Docker Hub
       |
       v
     Ansible
       |
       v
 Kubernetes (kind)
       |
       +-- Deployment
       |     +-- Pod 1
       |     +-- Pod 2
       |
       +-- Service
```

## Pipeline Workflow

### 01 — Continuous Integration with Jenkins

Configured Jenkins to orchestrate the pipeline and execute the required stages following a source code update.

- Retrieve the latest code from GitHub.
- Automate build and test execution.
- Define the pipeline as code using a `Jenkinsfile`.
- Configure timestamps, build retention, and execution status reporting.

### 02 — Build and Test with Maven

Used Maven to compile the Java application, resolve dependencies, execute unit tests, and package the application into an executable JAR file.

```bash
mvn -B -DskipTests=false clean package
```

The generated artifact is archived in Jenkins for traceability.

### 03 — Containerization with Docker

Created a Docker image containing the packaged Java application and its runtime environment.

- Defined the container configuration using a Dockerfile.
- Built the application image.
- Applied versioned and `latest` tags.
- Exposed port `8080` for application access.

### 04 — Image Registry with Docker Hub

Integrated Docker Hub into the pipeline to store and distribute container images.

Jenkins authenticates using stored credentials and pushes the generated image tags to the registry, making the image available for deployment.

### 05 — Deployment Automation with Ansible

Used Ansible to automate the Kubernetes deployment process through a playbook.

The deployment workflow includes:

- Validating Kubernetes manifest files before deployment.
- Applying the Deployment and Service configurations.
- Automating the process through Jenkins.
- Using local execution mode to manage the local Kubernetes environment.

### 06 — Application Deployment with Kubernetes

Deployed the containerized application to a local Kubernetes cluster created with kind.

The Kubernetes Deployment is configured with **two replicas**, helping maintain application availability if an individual Pod becomes unavailable.

The configuration also includes:

- **Liveness probes:** Detect application failures and allow Kubernetes to restart unhealthy containers.
- **Readiness probes:** Determine when containers are ready to receive traffic.
- **Service:** Provides a stable internal endpoint for accessing the application within the cluster.

### 07 — Verification and Cleanup

The final pipeline stages handle deployment verification, execution status reporting, and Docker registry logout.

This provides a repeatable workflow for building, packaging, publishing, and deploying the application.

## Key Technical Decisions

| Component | Purpose |
|---|---|
| Jenkins | Pipeline orchestration and automation |
| Maven | Java build, dependency management, and unit testing |
| Docker | Application containerization |
| Docker Hub | Container image registry |
| Ansible | Automated Kubernetes deployment |
| Kubernetes (kind) | Container orchestration in a local cluster |
| GitHub | Source code management and change tracking |

## Challenges & Lessons Learned

### Pipeline as Code

Defining the workflow in a `Jenkinsfile` makes the pipeline easier to maintain, review, and reproduce.

### Container Runtime Integration

Integrating Docker with a containerized Jenkins installation requires understanding how Jenkins accesses the Docker daemon and how permissions affect image operations.

### Secure Credential Management

Registry credentials and Kubernetes configuration are handled through Jenkins credentials rather than being embedded directly in the pipeline definition.

### Automated Deployment Validation

Validating Kubernetes manifests before applying them helps identify configuration errors earlier in the deployment process.

### Kubernetes Health Management

Configuring readiness and liveness probes introduces an important distinction between an application that is running and one that is ready to serve requests.

## Skills Demonstrated

- CI/CD pipeline design and automation
- Jenkins declarative pipelines
- Java application build and testing with Maven
- Docker image creation and registry management
- Ansible playbooks and automated deployments
- Kubernetes Deployments, Pods, Services, and health probes
- Git-based version control
- Credential management and deployment troubleshooting

## Conclusion

This project brought together several DevOps tools into a single automated delivery workflow. It provided practical experience connecting continuous integration, containerization, image distribution, infrastructure automation, and Kubernetes orchestration.

The result is a repeatable pipeline that demonstrates how application delivery can be automated from a source code update through deployment to a local Kubernetes environment.

