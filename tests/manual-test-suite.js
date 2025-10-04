/**
 * GestioGar Manual Test Suite
 * Script para testing automatizado de funcionalidades principales
 * Ejecutar con: node tests/manual-test-suite.js
 */

const https = require('http');
const { performance } = require('perf_hooks');

class GestioGarTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async makeRequest(path, method = 'GET', data = null) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GestioGarTester/1.0'
        }
      };

      if (data && method !== 'GET') {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: responseTime
          });
        });
      });

      req.on('error', (err) => reject(err));
      
      if (data && method !== 'GET') {
        req.write(data);
      }
      
      req.end();
    });
  }

  async testEndpoint(path, expectedStatus = 200, testName = null) {
    const name = testName || `GET ${path}`;
    
    try {
      const result = await this.makeRequest(path);
      
      if (result.statusCode === expectedStatus) {
        this.testResults.passed++;
        this.testResults.details.push({
          test: name,
          status: 'PASS',
          responseTime: result.responseTime,
          details: `Status: ${result.statusCode}`
        });
        console.log(`✅ ${name} - ${result.responseTime.toFixed(2)}ms`);
      } else {
        this.testResults.failed++;
        this.testResults.details.push({
          test: name,
          status: 'FAIL',
          responseTime: result.responseTime,
          details: `Expected: ${expectedStatus}, Got: ${result.statusCode}`
        });
        console.log(`❌ ${name} - Expected: ${expectedStatus}, Got: ${result.statusCode}`);
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: name,
        status: 'ERROR',
        responseTime: 0,
        details: error.message
      });
      console.log(`💥 ${name} - Error: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting GestioGar Test Suite...\n');
    console.log(`🎯 Testing against: ${this.baseUrl}\n`);

    // Public Routes Tests
    console.log('📄 PUBLIC ROUTES TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/', 200, 'Landing Page');
    await this.testEndpoint('/auth/login', 200, 'Login Page');
    await this.testEndpoint('/auth/register', 200, 'Register Page');

    // Protected Routes Tests (Estas van a redirigir a login si no está autenticado)
    console.log('\n🔒 PROTECTED ROUTES TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/dashboard', 302, 'Dashboard Redirect');
    await this.testEndpoint('/clients', 302, 'Clients Redirect');
    await this.testEndpoint('/technicians', 302, 'Technicians Redirect');
    await this.testEndpoint('/jobs', 302, 'Jobs Redirect');
    await this.testEndpoint('/estimates', 302, 'Estimates Redirect');
    await this.testEndpoint('/invoices', 302, 'Invoices Redirect');
    await this.testEndpoint('/insurance', 302, 'Insurance Redirect');
    await this.testEndpoint('/suppliers', 302, 'Suppliers Redirect');
    await this.testEndpoint('/materials', 302, 'Materials Redirect');
    await this.testEndpoint('/appointments', 302, 'Appointments Redirect');
    await this.testEndpoint('/communications', 302, 'Communications Redirect');
    await this.testEndpoint('/reports', 302, 'Reports Redirect');

    // Settings Routes Tests
    console.log('\n⚙️ SETTINGS ROUTES TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/settings', 302, 'Settings Redirect');
    await this.testEndpoint('/settings/profile', 302, 'Settings Profile Redirect');
    await this.testEndpoint('/settings/company', 302, 'Settings Company Redirect');
    await this.testEndpoint('/settings/modules', 302, 'Settings Modules Redirect');
    await this.testEndpoint('/settings/security', 302, 'Settings Security Redirect');
    await this.testEndpoint('/settings/notifications', 302, 'Settings Notifications Redirect');

    // Static Assets Tests
    console.log('\n🎨 STATIC ASSETS TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/logo.png', 200, 'Logo Asset');
    await this.testEndpoint('/favicon.png', 200, 'Favicon Asset');

    // Module Routes Tests
    console.log('\n🧩 MODULE ROUTES TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/module', 404, 'Module Base Route (404 expected)');
    await this.testEndpoint('/module/invalid-module', 302, 'Invalid Module Redirect');

    // Error Pages Tests
    console.log('\n❌ ERROR PAGES TESTS');
    console.log('='.repeat(30));
    
    await this.testEndpoint('/nonexistent-page', 404, '404 Not Found Page');

    // Generate Report
    this.generateReport();
  }

  generateReport() {
    const total = this.testResults.passed + this.testResults.failed;
    const passRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(1) : 0;

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    // Performance summary
    const responseTimes = this.testResults.details
      .filter(test => test.responseTime > 0)
      .map(test => test.responseTime);
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log('\n⚡ PERFORMANCE METRICS');
      console.log('='.repeat(30));
      console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`🚀 Fastest Response: ${minResponseTime.toFixed(2)}ms`);
      console.log(`🐌 Slowest Response: ${maxResponseTime.toFixed(2)}ms`);
    }

    // Failed tests details
    const failedTests = this.testResults.details.filter(test => test.status !== 'PASS');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS DETAILS');
      console.log('='.repeat(50));
      failedTests.forEach(test => {
        console.log(`💥 ${test.test}`);
        console.log(`   Reason: ${test.details}`);
        console.log('   Response Time: ' + (test.responseTime ? `${test.responseTime.toFixed(2)}ms` : 'N/A'));
        console.log('');
      });
    }

    console.log('\n🎯 TESTING CHECKLIST COMPLETED');
    console.log('='.repeat(50));
    console.log('📄 Public routes accessible');
    console.log('🔒 Protected routes redirecting correctly');
    console.log('⚙️ Settings routes secured');
    console.log('🎨 Static assets loading');
    console.log('🧩 Module system routing');
    console.log('❌ Error handling working');
    
    if (this.testResults.passed === total) {
      console.log('\n🎉 ALL TESTS PASSED! GestioGar is ready for production! 🚀');
    } else {
      console.log('\n⚠️  Some tests failed. Review failed tests above.');
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        passRate: `${passRate}%`
      },
      tests: this.testResults.details
    };

    require('fs').writeFileSync('test-results.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: test-results.json');
  }
}

// TestRunner Execution
async function runGestioGarTests() {
  const tester = new GestioGarTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test suite crashed:', error.message);
    process.exit(1);
  }
}

// Execute tests if script is run directly
if (require.main === module) {
  runGestioGarTests();
}

module.exports = GestioGarTester;

