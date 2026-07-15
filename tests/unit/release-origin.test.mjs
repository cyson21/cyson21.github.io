import assert from 'node:assert/strict';
import test from 'node:test';
import { getReleaseOrigin } from '../../src/lib/release-origin.ts';

test('preview mode ignores the configured site URL', () => {
  assert.equal(getReleaseOrigin({
    PUBLIC_RELEASE: 'false',
    PUBLIC_SITE_URL: 'http://localhost:4321/path',
  }), null);
});

test('release mode returns a normalized HTTPS origin', () => {
  assert.equal(getReleaseOrigin({
    PUBLIC_RELEASE: 'true',
    PUBLIC_SITE_URL: '  https://portfolio.example.com/  ',
  }), 'https://portfolio.example.com');
});

const invalidReleaseOrigins = [
  [undefined, 'required'],
  ['not a URL', 'absolute HTTPS URL'],
  ['http://portfolio.example.com', 'use HTTPS'],
  ['https://user:secret@portfolio.example.com', 'credentials'],
  ['https://portfolio.example.com/path', 'only an origin'],
  ['https://portfolio.example.com/?query=1', 'only an origin'],
  ['https://localhost', 'local address'],
  ['https://192.168.1.10', 'local address'],
];

for (const [siteUrl, expectedMessage] of invalidReleaseOrigins) {
  test(`release mode rejects ${siteUrl ?? 'a missing URL'}`, () => {
    assert.throws(
      () => getReleaseOrigin({ PUBLIC_RELEASE: 'true', PUBLIC_SITE_URL: siteUrl }),
      new RegExp(expectedMessage),
    );
  });
}
