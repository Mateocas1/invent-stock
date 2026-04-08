#!/usr/bin/env node
/**
 * Smoke Test Runner
 *
 * Quick smoke tests to verify production deployment.
 * Usage: npm run test:smoke [-- --url=http://your-app.com]
 */

const http = require('http');

const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : 'http://localhost:3000';

console.log('🔥 Running smoke tests...\n');
console.log(`   Target: ${baseUrl}\n`);

const tests = [
  { name: 'Health Check', path: '/health', expectStatus: 200 },
  { name: 'Ready Check', path: '/ready', expectStatus: 200 },
  { name: 'Ping', path: '/ping', expectStatus: 200 },
  { name: 'Metrics', path: '/metrics', expectStatus: 200 },
];

async function runTest(test) {
  return new Promise(resolve => {
    const startTime = Date.now();

    http
      .get(`${baseUrl}${test.path}`, res => {
        const duration = Date.now() - startTime;
        let data = '';

        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const passed = res.statusCode === test.expectStatus;
          const result = {
            name: test.name,
            passed,
            status: res.statusCode,
            duration,
            response: passed ? JSON.parse(data) : null,
          };
          resolve(result);
        });
      })
      .on('error', err => {
        resolve({
          name: test.name,
          passed: false,
          error: err.message,
          duration: Date.now() - startTime,
        });
      });
  });
}

async function runAllTests() {
  const results = [];

  for (const test of tests) {
    process.stdout.write(`   Testing ${test.name}... `);
    const result = await runTest(test);
    results.push(result);

    if (result.passed) {
      console.log(`✅ (${result.duration}ms)`);
    } else {
      console.log(`❌ (${result.error || `status ${result.status}`})`);
    }
  }

  console.log('\n📊 Results:\n');

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  // Show health check details if available
  const healthResult = results.find(r => r.name === 'Health Check' && r.passed);
  if (healthResult?.response) {
    console.log('   Status:', healthResult.response.status);
    console.log('   Version:', healthResult.response.version);
    console.log('   Uptime:', healthResult.response.uptime, 'seconds');
    console.log('   Database:', healthResult.response.checks?.database);
    console.log('   Telegram:', healthResult.response.checks?.telegram);
    console.log('');
  }

  console.log(`   Passed: ${passed.length}/${results.length}`);
  console.log(`   Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\n   Failed tests:');
    failed.forEach(f => console.log(`   - ${f.name}: ${f.error || 'HTTP error'}`));
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests passed!');
    process.exit(0);
  }
}

runAllTests();
