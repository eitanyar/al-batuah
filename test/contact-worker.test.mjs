import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../worker.mjs';

const assetResponse = new Response('static asset', { status: 200 });
const validSubmission = {
  name: 'ישראל ישראלי',
  email: 'israel@example.com',
  phone: '050-1234567',
  subject: 'בדיקה',
  message: 'הודעת בדיקה',
  privacyConsent: true,
};

function createEnv(overrides = {}) {
  return {
    ASSETS: { fetch: async () => assetResponse.clone() },
    ...overrides,
  };
}

function contactRequest(data, method = 'POST') {
  return new Request('https://example.com/api/contact', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(data) : undefined,
  });
}

test('the Worker delegates non-contact requests, including non-POST contact requests, to static assets', async () => {
  const requests = [];
  const env = createEnv({
    ASSETS: {
      fetch: async (request) => {
        requests.push(request);
        return assetResponse.clone();
      },
    },
  });

  const response = await worker.fetch(contactRequest(null, 'GET'), env);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'static asset');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'GET');
});

test('the Worker preserves contact validation and honeypot responses without sending an email', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail('Resend must not be called');

  try {
    const invalidJson = await worker.fetch(
      new Request('https://example.com/api/contact', { method: 'POST', body: '{' }),
      createEnv(),
    );
    const missingFields = await worker.fetch(contactRequest({ name: 'ישראל' }), createEnv());
    const invalidEmail = await worker.fetch(
      contactRequest({ ...validSubmission, email: 'not-an-email' }),
      createEnv(),
    );
    const honeypot = await worker.fetch(
      contactRequest({ ...validSubmission, website: 'https://spam.example' }),
      createEnv(),
    );

    assert.deepEqual(await invalidJson.json(), { ok: false, error: 'invalid_json' });
    assert.deepEqual(await missingFields.json(), { ok: false, error: 'missing_fields' });
    assert.deepEqual(await invalidEmail.json(), { ok: false, error: 'invalid_email' });
    assert.deepEqual(await honeypot.json(), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('the Worker reports missing Resend configuration without sending an email', async () => {
  const response = await worker.fetch(contactRequest(validSubmission), createEnv());

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: 'not_configured' });
});

test('the Worker sends validated contact submissions through Resend and preserves success and failure responses', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: requests.length === 1 ? 200 : 503 });
  };

  try {
    const success = await worker.fetch(
      contactRequest({ ...validSubmission, message: '<script>alert(1)</script>' }),
      createEnv({ RESEND_API_KEY: 'test-only-key' }),
    );
    const failure = await worker.fetch(
      contactRequest(validSubmission),
      createEnv({ RESEND_API_KEY: 'test-only-key' }),
    );

    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { ok: true });
    assert.equal(failure.status, 502);
    assert.deepEqual(await failure.json(), { ok: false, error: 'send_failed' });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://api.resend.com/emails');
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only-key');
    const body = JSON.parse(requests[0].options.body);
    assert.equal(body.reply_to, validSubmission.email);
    assert.match(body.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
