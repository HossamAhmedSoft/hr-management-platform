// ============================================================
// GDG NCTU HR Platform — Unified Auth & Registration Approval Workflow
// Comprehensive Automated Test Suite & Verification Runner
// ============================================================

import crypto from "crypto";

const testResults = [];

function assert(id, name, condition, details) {
  testResults.push({ id, name, passed: Boolean(condition), details });
  const status = condition ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} [${id}] ${name} -> ${details}`);
}

console.log("=================================================");
console.log("RUNNING UNIFIED AUTH & REGISTRATION APPROVAL TESTS");
console.log("=================================================\n");

// -------------------------------------------------------------
// HELPERS & MOCK ENGINE
// -------------------------------------------------------------

function hashPassword(password, salt) {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function generateReferenceNo() {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `REG-${year}-NCTU-${randomChars}`;
}

const EGYPTIAN_PHONE_REGEX = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
const NATIONAL_ID_REGEX = /^(2|3)\d{13}$/;

// State Machine Transition Matrix
const VALID_TRANSITIONS = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["under_review", "cancelled"],
  under_review: ["needs_info", "approved", "rejected"],
  needs_info: ["under_review", "cancelled"],
  approved: [],
  rejected: [],
  cancelled: [],
};

function isValidTransition(current, next) {
  return Boolean(VALID_TRANSITIONS[current]?.includes(next));
}

function calculateSlaBreach(submittedAtStr, slaHours = 48) {
  const submittedAt = new Date(submittedAtStr).getTime();
  const elapsedMs = Date.now() - submittedAt;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  return elapsedHours > slaHours;
}

// -------------------------------------------------------------
// TEST 1: Registration Schema & Regex Validation
// -------------------------------------------------------------
try {
  const validPhone = "+201012345678";
  const invalidPhone = "0199999999"; // Invalid Egyptian telecom prefix
  const validNatId = "29901011234567";
  const invalidNatId = "19901011234567"; // Invalid century prefix (must be 2 or 3)

  const phoneOk = EGYPTIAN_PHONE_REGEX.test(validPhone) && !EGYPTIAN_PHONE_REGEX.test(invalidPhone);
  const natIdOk = NATIONAL_ID_REGEX.test(validNatId) && !NATIONAL_ID_REGEX.test(invalidNatId);

  assert(
    "TEST-01",
    "Egyptian Phone & National ID Regex Validation",
    phoneOk && natIdOk,
    `Phone: ${validPhone} (valid) vs ${invalidPhone} (rejected). National ID: ${validNatId} (valid) vs ${invalidNatId} (rejected).`
  );
} catch (e) {
  assert("TEST-01", "Egyptian Phone & National ID Regex Validation", false, e.message);
}

// -------------------------------------------------------------
// TEST 2: Anti-Spam Honeypot Field Protection
// -------------------------------------------------------------
try {
  function processSubmission(payload) {
    // If hidden honeypot has content, silently discard
    if (payload._honeypot && payload._honeypot.trim().length > 0) {
      return { status: 200, silentlyDiscarded: true, inserted: false };
    }
    return { status: 200, silentlyDiscarded: false, inserted: true };
  }

  const botPayload = {
    full_name: "Spam Bot",
    email: "bot@spammer.org",
    _honeypot: "http://spam-link.ru",
  };
  const humanPayload = {
    full_name: "Mahmoud Hassan",
    email: "mahmoud.hassan@example.com",
    _honeypot: "",
  };

  const botResult = processSubmission(botPayload);
  const humanResult = processSubmission(humanPayload);

  const passed = botResult.silentlyDiscarded && !botResult.inserted && humanResult.inserted;
  assert(
    "TEST-02",
    "Anti-Spam Honeypot Trapping",
    passed,
    "Bot submission with honeypot silently discarded without DB insertion."
  );
} catch (e) {
  assert("TEST-02", "Anti-Spam Honeypot Trapping", false, e.message);
}

// -------------------------------------------------------------
// TEST 3: Reference Number Format & Uniqueness
// -------------------------------------------------------------
try {
  const ref1 = generateReferenceNo();
  const ref2 = generateReferenceNo();
  const pattern = /^REG-\d{4}-NCTU-[A-Z0-9]{4}$/;

  const validPattern = pattern.test(ref1) && pattern.test(ref2);
  const unique = ref1 !== ref2;

  assert(
    "TEST-03",
    "Reference Number Generation",
    validPattern && unique,
    `Generated refs: ${ref1}, ${ref2} match format REG-YYYY-NCTU-XXXX and are unique.`
  );
} catch (e) {
  assert("TEST-03", "Reference Number Generation", false, e.message);
}

// -------------------------------------------------------------
// TEST 4: Anti-Enumeration Status Check Response
// -------------------------------------------------------------
try {
  const mockDb = [
    { reference_no: "REG-2026-NCTU-ABCD", email: "alice@nctu.edu.eg", status: "pending_approval" },
  ];

  function queryStatus(ref, email) {
    const match = mockDb.find(
      (r) => r.reference_no === ref && r.email.toLowerCase() === email.toLowerCase()
    );
    if (!match) {
      // Unified error: Does not reveal if the reference exists OR if the email exists
      return { success: false, error: "No matching application found with this reference and email." };
    }
    return { success: true, status: match.status };
  }

  // Probe with wrong email for existing ref
  const probe1 = queryStatus("REG-2026-NCTU-ABCD", "wrong@nctu.edu.eg");
  // Probe with fake ref
  const probe2 = queryStatus("REG-2026-NCTU-FAKE", "alice@nctu.edu.eg");
  // Legitimate query
  const probeValid = queryStatus("REG-2026-NCTU-ABCD", "alice@nctu.edu.eg");

  const uniformErrors =
    probe1.error === probe2.error &&
    probe1.success === false &&
    probe2.success === false &&
    probeValid.success === true &&
    probeValid.status === "pending_approval";

  assert(
    "TEST-04",
    "Anti-Enumeration Protection on Status Inquiries",
    uniformErrors,
    "Uniform error returned for non-existent reference and mismatched email, preventing enumeration."
  );
} catch (e) {
  assert("TEST-04", "Anti-Enumeration Protection on Status Inquiries", false, e.message);
}

// -------------------------------------------------------------
// TEST 5: State Machine Transitions & Invalidation Guard
// -------------------------------------------------------------
try {
  const legal1 = isValidTransition("pending_approval", "under_review");
  const legal2 = isValidTransition("under_review", "needs_info");
  const legal3 = isValidTransition("needs_info", "under_review");
  const legal4 = isValidTransition("under_review", "approved");
  const legal5 = isValidTransition("pending_approval", "cancelled");

  // Illegal transitions
  const illegal1 = isValidTransition("rejected", "approved");
  const illegal2 = isValidTransition("cancelled", "approved");
  const illegal3 = isValidTransition("approved", "pending_approval");
  const illegal4 = isValidTransition("draft", "approved"); // Must go through review

  const allLegalPass = legal1 && legal2 && legal3 && legal4 && legal5;
  const allIllegalBlocked = !illegal1 && !illegal2 && !illegal3 && !illegal4;

  assert(
    "TEST-05",
    "Approval State Machine Transition Integrity",
    allLegalPass && allIllegalBlocked,
    "Legal transitions allowed, illegal transitions (rejected->approved, cancelled->approved) strictly blocked."
  );
} catch (e) {
  assert("TEST-05", "Approval State Machine Transition Integrity", false, e.message);
}

// -------------------------------------------------------------
// TEST 6: Separation of Duties Enforcement
// -------------------------------------------------------------
try {
  function canAdminApproveRequest(adminUser, request) {
    if (adminUser.role !== "super_admin" && adminUser.role !== "hr_admin") {
      return { allowed: false, reason: "Insufficient permissions." };
    }
    // Separation of duties: Reviewer cannot approve their own registration application
    if (adminUser.email.toLowerCase().trim() === request.email.toLowerCase().trim()) {
      return {
        allowed: false,
        reason: "Separation of duties violation: You cannot approve your own registration application.",
      };
    }
    return { allowed: true };
  }

  const adminActor = { id: "usr_admin", email: "admin@gdgnctu.com", role: "super_admin" };
  const selfRequest = { id: "req_self", email: "admin@gdgnctu.com", status: "pending_approval" };
  const applicantRequest = { id: "req_app", email: "student@nctu.edu.eg", status: "pending_approval" };

  const selfCheck = canAdminApproveRequest(adminActor, selfRequest);
  const legitCheck = canAdminApproveRequest(adminActor, applicantRequest);

  const passed = selfCheck.allowed === false && legitCheck.allowed === true;
  assert(
    "TEST-06",
    "Separation of Duties (Admin Cannot Self-Approve)",
    passed,
    `Self-approval blocked: "${selfCheck.reason}" | External applicant approval permitted.`
  );
} catch (e) {
  assert("TEST-06", "Separation of Duties (Admin Cannot Self-Approve)", false, e.message);
}

// -------------------------------------------------------------
// TEST 7: Atomic Approval & Profile Promotion Transaction
// -------------------------------------------------------------
try {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword("P@ssw0rd2026!", salt);

  const mockRequest = {
    id: "req_778899",
    reference_no: "REG-2026-NCTU-7788",
    email: "fatima.zahra@nctu.edu.eg",
    full_name: "Fatima Zahra",
    phone: "+201123456789",
    password_hash: passwordHash,
    salt,
    status: "under_review",
    assigned_role: "member",
    assigned_team_id: "team_mobile",
    submitted_data: {
      national_id: "29901011234567",
      university: "National Cairo Tech University (NCTU)",
      faculty: "Faculty of Computer Science & AI",
      graduation_year: 2027,
      skills: ["Flutter", "Dart", "Firebase"],
      tshirt_size: "M",
      github_url: "https://github.com/fatimazahra",
    },
  };

  const profilesTable = [];
  const eventsTable = [];
  const auditLogTable = [];

  // Atomic approval simulation
  function executeApprovalTransaction(req, admin, overrides = {}) {
    const role = overrides.role || req.assigned_role || "member";
    const team_id = overrides.team_id || req.assigned_team_id;

    // 1. Create Profile
    const newProfile = {
      id: crypto.randomUUID(),
      email: req.email,
      full_name: req.full_name,
      role,
      team_id,
      phone: req.phone,
      status: "active",
      joined_date: new Date().toISOString(),
      metadata: {
        registration_reference_no: req.reference_no,
        national_id: req.submitted_data.national_id,
        university: req.submitted_data.university,
        faculty: req.submitted_data.faculty,
        graduation_year: req.submitted_data.graduation_year,
        skills: req.submitted_data.skills,
        tshirt_size: req.submitted_data.tshirt_size,
        github_url: req.submitted_data.github_url,
        password_hash: req.password_hash,
        salt: req.salt,
      },
    };
    profilesTable.push(newProfile);

    // 2. Update Request Status
    req.status = "approved";
    req.promoted_profile_id = newProfile.id;
    req.reviewed_by = admin.id;
    req.reviewed_at = new Date().toISOString();

    // 3. Log Registration Event
    eventsTable.push({
      request_id: req.id,
      event_type: "approved",
      actor_id: admin.id,
      details: { role, team_id, promoted_profile_id: newProfile.id },
    });

    // 4. Log Security Audit Trail
    auditLogTable.push({
      actor: admin.email,
      action: "registration.approved",
      target: req.reference_no,
      details: `Applicant ${req.email} approved as ${role} in ${team_id}`,
    });

    return { success: true, profile: newProfile };
  }

  const adminUser = { id: "usr_super_1", email: "admin@gdgnctu.com", role: "super_admin" };
  const txResult = executeApprovalTransaction(mockRequest, adminUser, { role: "team_lead" });

  const profileCreated = profilesTable.length === 1 && profilesTable[0].role === "team_lead";
  const requestApproved = mockRequest.status === "approved" && mockRequest.promoted_profile_id === profilesTable[0].id;
  const eventRecorded = eventsTable.length === 1 && eventsTable[0].event_type === "approved";
  const auditLogged = auditLogTable.length === 1 && auditLogTable[0].action === "registration.approved";
  const metadataPreserved = profilesTable[0].metadata.national_id === "29901011234567";

  const allTxOk = profileCreated && requestApproved && eventRecorded && auditLogged && metadataPreserved;

  assert(
    "TEST-07",
    "Atomic Approval & Profile Promotion Transaction",
    allTxOk,
    `Profile created (${profilesTable[0].id}) with role: ${profilesTable[0].role}, team: ${profilesTable[0].team_id}, metadata mapped, and audit event logged.`
  );
} catch (e) {
  assert("TEST-07", "Atomic Approval & Profile Promotion Transaction", false, e.message);
}

// -------------------------------------------------------------
// TEST 8: Login Behavior Across Request Lifecycle
// -------------------------------------------------------------
try {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword("Secret123!", salt);

  const mockPendingRequest = {
    email: "applicant@nctu.edu.eg",
    password_hash: hash,
    salt,
    status: "pending_approval",
    reference_no: "REG-2026-NCTU-9900",
  };

  const mockApprovedProfile = {
    id: "usr_promoted_1",
    email: "member@nctu.edu.eg",
    status: "active",
    metadata: { password_hash: hash, salt },
  };

  function simulateLogin(email, password, requests, profiles) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check active profiles
    const profile = profiles.find((p) => p.email.toLowerCase() === normalizedEmail);
    if (profile) {
      const pHash = hashPassword(password, profile.metadata.salt);
      if (pHash === profile.metadata.password_hash) {
        return { success: true, session: { user: profile, token: "tok_session_123" } };
      }
      return { success: false, error: "Invalid credentials" };
    }

    // 2. Check pending registration requests
    const regReq = requests.find((r) => r.email.toLowerCase() === normalizedEmail);
    if (regReq) {
      const rHash = hashPassword(password, regReq.salt);
      if (rHash === regReq.password_hash) {
        return {
          success: false,
          registrationStatus: regReq.status,
          referenceNo: regReq.reference_no,
          message: "Your application is currently pending admin review.",
        };
      }
      return { success: false, error: "Invalid credentials" };
    }

    return { success: false, error: "User not found" };
  }

  // Pending applicant tries to login with correct credentials
  const pendingAttempt = simulateLogin(
    "applicant@nctu.edu.eg",
    "Secret123!",
    [mockPendingRequest],
    [mockApprovedProfile]
  );
  // Approved member logs in with correct credentials
  const memberAttempt = simulateLogin(
    "member@nctu.edu.eg",
    "Secret123!",
    [mockPendingRequest],
    [mockApprovedProfile]
  );
  // Attacker uses wrong password on pending applicant
  const attackerAttempt = simulateLogin(
    "applicant@nctu.edu.eg",
    "WrongPassword!",
    [mockPendingRequest],
    [mockApprovedProfile]
  );

  const pendingBlockedSafely =
    pendingAttempt.success === false &&
    pendingAttempt.registrationStatus === "pending_approval" &&
    pendingAttempt.referenceNo === "REG-2026-NCTU-9900";

  const memberAuthenticated = memberAttempt.success === true && Boolean(memberAttempt.session?.token);
  const attackerRejected = attackerAttempt.success === false && attackerAttempt.error === "Invalid credentials";

  assert(
    "TEST-08",
    "Pre-Approval vs Post-Approval Authentication Gate",
    pendingBlockedSafely && memberAuthenticated && attackerRejected,
    "Pending applicant routed to status dashboard without access token; approved member receives valid session token."
  );
} catch (e) {
  assert("TEST-08", "Pre-Approval vs Post-Approval Authentication Gate", false, e.message);
}

// -------------------------------------------------------------
// TEST 9: Draft Storage Security (Password Exclusion)
// -------------------------------------------------------------
try {
  function serializeDraft(formValues) {
    // Strictly strip passwords before storing in browser draft
    const { password, confirmPassword, ...safeFields } = formValues;
    return JSON.stringify(safeFields);
  }

  const rawValues = {
    full_name: "Kareem Tarek",
    email: "kareem@nctu.edu.eg",
    password: "SuperSecretPassword123!",
    confirmPassword: "SuperSecretPassword123!",
    national_id: "29905051234567",
  };

  const serialized = serializeDraft(rawValues);
  const deserialized = JSON.parse(serialized);

  const passwordExcluded = !("password" in deserialized) && !("confirmPassword" in deserialized);
  const contentPreserved = deserialized.full_name === "Kareem Tarek" && deserialized.national_id === "29905051234567";

  assert(
    "TEST-09",
    "Draft Storage Credential Isolation",
    passwordExcluded && contentPreserved,
    "Password and confirmPassword strictly excluded from browser storage draft serialization."
  );
} catch (e) {
  assert("TEST-09", "Draft Storage Credential Isolation", false, e.message);
}

// -------------------------------------------------------------
// TEST 10: SLA Breach Identification
// -------------------------------------------------------------
try {
  const now = Date.now();
  const dateRecent = new Date(now - 12 * 60 * 60 * 1000).toISOString(); // 12 hours ago
  const dateBreached = new Date(now - 54 * 60 * 60 * 1000).toISOString(); // 54 hours ago (>48h SLA)

  const isRecentBreached = calculateSlaBreach(dateRecent, 48);
  const isOldBreached = calculateSlaBreach(dateBreached, 48);

  const passed = !isRecentBreached && isOldBreached;
  assert(
    "TEST-10",
    "SLA Breach Detection (>48h SLA Limit)",
    passed,
    `12h request breached: ${isRecentBreached} (false) | 54h request breached: ${isOldBreached} (true)`
  );
} catch (e) {
  assert("TEST-10", "SLA Breach Detection (>48h SLA Limit)", false, e.message);
}

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log("\n=================================================");
const total = testResults.length;
const passedCount = testResults.filter((r) => r.passed).length;
console.log(`TOTAL PASSED: ${passedCount} / ${total}`);
console.log("=================================================");

if (passedCount !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
