import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration options
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be less than 10%
    errors: ['rate<0.1'],            // Custom error rate must be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Test API health endpoint
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  let healthCheck = check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!healthCheck);

  // Test pricing calculation endpoint
  let pricingResponse = http.post(`${BASE_URL}/api/vps/calculate-price`, JSON.stringify({
    cpuCores: 4,
    ramGb: 8,
    storageGb: 100,
    operatingSystem: 'Ubuntu 22.04 LTS'
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let pricingCheck = check(pricingResponse, {
    'pricing status is 200': (r) => r.status === 200,
    'pricing response time < 500ms': (r) => r.timings.duration < 500,
    'pricing has correct structure': (r) => {
      let data = JSON.parse(r.body);
      return data.success && data.data && data.data.totalPrice;
    },
  });
  errorRate.add(!pricingCheck);

  // Test authentication endpoint
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123'
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let loginCheck = check(loginResponse, {
    'login endpoint responds': (r) => r.status >= 200 && r.status < 500,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(!loginCheck);

  sleep(1);
}

export function handleSummary(data) {
  console.log('Load test completed');
  console.log(`Total requests: ${data.metrics.http_reqs.count}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.avg}ms`);
  console.log(`95th percentile response time: ${data.metrics.http_req_duration['p(95)']}ms`);
  console.log(`Error rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%`);
}