import {
  calculateEvaluationScore,
  getPointClassification,
  calculateWorkingDayDeadline,
} from "./utils";

export interface PolicyVerificationResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

export function runPolicyVerification(): PolicyVerificationResult[] {
  const results: PolicyVerificationResult[] = [];

  // Test 1: Standard Evaluation 4.5/5 -> 90 / 100
  const eval1 = calculateEvaluationScore([
    { categoryWeight: 30, rating: 4.5 },
    { categoryWeight: 25, rating: 4.5 },
    { categoryWeight: 15, rating: 4.5 },
    { categoryWeight: 10, rating: 4.5 },
    { categoryWeight: 10, rating: 4.5 },
    { categoryWeight: 10, rating: 4.5 },
  ]);
  results.push({
    name: "Standard 4.5/5 score calculation",
    passed: eval1.score === 90 && eval1.band === "Outstanding Performance",
    expected: "90 (Outstanding Performance)",
    actual: `${eval1.score} (${eval1.band})`,
  });

  // Test 2: N/A proportional adjustment
  const eval2 = calculateEvaluationScore([
    { categoryWeight: 30, rating: null }, // N/A
    { categoryWeight: 25, rating: 5.0 },
    { categoryWeight: 15, rating: 5.0 },
    { categoryWeight: 10, rating: 5.0 },
    { categoryWeight: 10, rating: 5.0 },
    { categoryWeight: 10, rating: 5.0 },
  ]);
  results.push({
    name: "N/A Proportional weight adjustment (sum 70 -> 100)",
    passed: eval2.score === 100,
    expected: 100,
    actual: eval2.score,
  });

  // Test 3: All N/A -> Not Evaluated
  const eval3 = calculateEvaluationScore([
    { categoryWeight: 30, rating: null },
    { categoryWeight: 25, rating: null },
    { categoryWeight: 15, rating: null },
    { categoryWeight: 10, rating: null },
    { categoryWeight: 10, rating: null },
    { categoryWeight: 10, rating: null },
  ]);
  results.push({
    name: "All categories N/A returns null score and 'Not Evaluated'",
    passed: eval3.score === null && eval3.band === "Not Evaluated",
    expected: "null (Not Evaluated)",
    actual: `${eval3.score} (${eval3.band})`,
  });

  // Test 4: Points Classification
  const p1 = getPointClassification(15);
  const p2 = getPointClassification(5);
  const p3 = getPointClassification(-3);
  const p4 = getPointClassification(-8);
  results.push({
    name: "Point Net Classification tiers (Green/Normal/Warning/Red)",
    passed:
      p1.level === "green" &&
      p2.level === "normal" &&
      p3.level === "warning" &&
      p4.level === "red",
    expected: "green, normal, warning, red",
    actual: `${p1.level}, ${p2.level}, ${p3.level}, ${p4.level}`,
  });

  // Test 5: 7 Egyptian Working Days (skip Friday/Saturday)
  const startDate = new Date(2026, 9, 15); // Thursday Oct 15
  const deadline = calculateWorkingDayDeadline(startDate, 7);
  results.push({
    name: "7 Egyptian working days skips Fri/Sat weekends",
    passed: deadline.getDate() === 26,
    expected: 26,
    actual: deadline.getDate(),
  });

  return results;
}
