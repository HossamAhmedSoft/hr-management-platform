# Security Policy & Vulnerability Disclosure

**Project:** GDG on Campus NCTU HR Management Platform  
**Organization:** Google Developer Groups on Campus — NCTU (New Cairo Technological University)  
**Maintained By:** GDG NCTU Core Security & Engineering Team

---

## 1. Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported | Status |
| :--- | :--- | :--- |
| **v2.4.x (Current Production)** | ✅ Yes | Fully Supported & Actively Maintained |
| v2.3.x | ⚠️ Critical Only | Security patches until December 2026 |
| < v2.3.0 | ❌ No | End of Life (Upgrade Mandatory) |

---

## 2. Reporting a Vulnerability

The GDG NCTU engineering team takes the security of our platform and member data very seriously. If you believe you have discovered a security vulnerability in our application, services, or APIs, please report it privately and responsibly.

### 2.1 Private Reporting Channels
- **Primary Security Email:** `security@gdgnctu.com`
- **Lead Security Engineer:** `hossam.admin@gdgnctu.com`

**Please do NOT disclose vulnerabilities publicly, file public GitHub issues, or share details on social platforms prior to responsible coordination and patch verification.**

### 2.2 What to Include in Your Report
To help us triage and investigate the issue quickly, please include:
1. **Description:** Clear summary of the vulnerability type (e.g., BAC, Injection, Authentication bypass).
2. **Impact:** What an attacker could achieve by exploiting this flaw.
3. **Reproduction Steps:** Step-by-step instructions or proof-of-concept (PoC) HTTP requests/payloads.
4. **Affected Endpoints / Files:** Specific URLs, routes, or source code components involved.
5. **Mitigation Suggestion:** If you have an idea for a fix, please include it.

---

## 3. Vulnerability Handling & Response SLA

When you submit a security vulnerability report, our team commits to the following timeline:

| Stage | Response Time | Action |
| :--- | :--- | :--- |
| **Initial Acknowledgment** | **Within 24 hours** | Confirmation of receipt and assignment to a security triage engineer |
| **Triage & Reproduction** | **Within 48 hours** | Reproduction of the finding, CVSS scoring, and initial risk assessment |
| **Remediation & Patching** | **Within 3 to 7 days** | Development, code review, automated testing, and staging verification |
| **Production Deployment** | **Immediate upon patch approval** | Release of patched version and notification to the reporter |

---

## 4. Scope & Safe Harbor

### In-Scope Assets
- Main application routes (`https://gdgnctu.com/*`)
- API endpoints (`https://gdgnctu.com/api/*`)
- Supabase database schema and RPC security boundaries
- Next.js edge proxy middleware and HTTP security headers

### Out-of-Scope (Prohibited Testing)
- Denial of Service (DoS / DDoS) attacks against production infrastructure.
- Social engineering, phishing, or physical attacks against GDG NCTU members or organizers.
- Automated vulnerability scanners executing high-volume requests (> 5 req/sec) without prior written authorization.
- Tampering with real member data or production databases beyond minimal verification.

### Safe Harbor
If you conduct security research in good faith, adhere to the guidelines outlined in this document, and avoid privacy violations or destruction of data, GDG NCTU will not pursue legal action against you and will acknowledge your contribution in our Security Hall of Fame.
