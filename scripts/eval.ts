#!/usr/bin/env ts-node

/**
 * Simple evaluation harness for Docs Copilot
 * Tests the RAG system with predefined questions and expected keywords
 */

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestCase {
  question: string;
  expectedKeywords: string[];
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    description: 'On-call database connection error',
    question: 'How do I handle database connection errors during on-call?',
    expectedKeywords: ['database', 'connection', 'pool', 'check'],
  },
  {
    description: 'Payment methods accepted',
    question: 'What payment methods do you accept?',
    expectedKeywords: ['credit', 'card', 'visa', 'mastercard', 'paypal'],
  },
  {
    description: 'Stripe webhook failures',
    question: 'What should I do if Stripe webhooks are failing?',
    expectedKeywords: ['webhook', 'stripe', 'endpoint', 'signature'],
  },
  {
    description: 'On-call escalation',
    question: 'When should I escalate an incident to engineering manager?',
    expectedKeywords: ['escalate', 'hour', 'manager', 'critical'],
  },
  {
    description: 'JWT token validation issues',
    question: 'Why are JWT tokens failing validation?',
    expectedKeywords: ['jwt', 'token', 'secret', 'expir'],
  },
  {
    description: 'Pro plan features',
    question: 'What features are included in the Pro plan?',
    expectedKeywords: ['pro', 'unlimited', 'storage', 'automation'],
  },
  {
    description: 'Incident severity definitions',
    question: 'What is a Sev1 incident?',
    expectedKeywords: ['sev', 'critical', 'outage', 'immediate'],
  },
  {
    description: 'Payment refund process',
    question: 'How do I process a refund?',
    expectedKeywords: ['refund', 'stripe', 'charge', 'amount'],
  },
  {
    description: 'High CPU usage alert',
    question: 'How do I respond to high CPU usage alerts?',
    expectedKeywords: ['cpu', '80', 'logs', 'scale'],
  },
  {
    description: 'Unrelated question (should abstain)',
    question: 'What is the weather today?',
    expectedKeywords: ['don\'t know', 'I don\'t know'],
  },
];

interface EvalResult {
  testCase: TestCase;
  passed: boolean;
  answer: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  abstained: boolean;
  error?: string;
}

async function runEvaluation(): Promise<void> {
  console.log('🔍 Running Docs Copilot Evaluation\n');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Total test cases: ${TEST_CASES.length}\n`);

  const results: EvalResult[] = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`[${i + 1}/${TEST_CASES.length}] ${testCase.description}...`);

    try {
      const response = await axios.post(`${BASE_URL}/chat`, {
        question: testCase.question,
      });

      const answer = response.data.answer?.toLowerCase() || '';
      const abstained = response.data.abstained || false;

      // Check which keywords are present
      const matchedKeywords: string[] = [];
      const missedKeywords: string[] = [];

      for (const keyword of testCase.expectedKeywords) {
        if (answer.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        } else {
          missedKeywords.push(keyword);
        }
      }

      // Pass if at least 50% of keywords matched (or if it's the abstain test)
      const passThreshold = testCase.expectedKeywords.length * 0.5;
      const testPassed = matchedKeywords.length >= passThreshold;

      results.push({
        testCase,
        passed: testPassed,
        answer: response.data.answer,
        matchedKeywords,
        missedKeywords,
        abstained,
      });

      if (testPassed) {
        console.log(`  ✅ PASS (${matchedKeywords.length}/${testCase.expectedKeywords.length} keywords matched)`);
        passed++;
      } else {
        console.log(`  ❌ FAIL (${matchedKeywords.length}/${testCase.expectedKeywords.length} keywords matched)`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testCase,
        passed: false,
        answer: '',
        matchedKeywords: [],
        missedKeywords: testCase.expectedKeywords,
        abstained: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${TEST_CASES.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  // Print detailed failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    failures.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.testCase.description}`);
      console.log(`   Question: ${result.testCase.question}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Missed keywords: ${result.missedKeywords.join(', ')}`);
        console.log(`   Answer preview: ${result.answer.substring(0, 100)}...`);
      }
      console.log('');
    });
  }

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run evaluation
runEvaluation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
