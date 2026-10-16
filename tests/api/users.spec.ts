/**
 * Users API — generated from specs/api/users.md.
 *
 * reqres.in is a public mock API, not part of saucedemo: writes are echoed back but not
 * stored, so these tests prove the response contract only. API-only, so `test`/`expect`
 * come from @playwright/test — the project fixtures add browser page objects, which an
 * API spec has no use for. Runs in the `api` project, which sets baseURL to reqres.
 *
 * The `support` and `_meta` blocks are reqres marketing copy and are deliberately not
 * asserted.
 */
import { test, expect } from '@playwright/test';

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

test.describe('Users API', () => {
  test('returns a single user by id @smoke', async ({ request }) => {
    const response = await request.get('/api/users/2');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
    });
    expect(body.data.avatar).toMatch(/^https:\/\/.+/);
  });

  test('returns 404 for a user that does not exist @regression', async ({ request }) => {
    const response = await request.get('/api/users/23');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({});
  });

  test('creates a user @smoke', async ({ request }) => {
    const user = { name: 'morpheus', job: 'leader' };

    const response = await request.post('/api/users', { data: user });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject(user);
    expect(body.id).toEqual(expect.stringMatching(/\S/));
    expect(body.createdAt).toMatch(ISO_TIMESTAMP);
  });

  test('replaces a user with PUT @regression', async ({ request }) => {
    const user = { name: 'morpheus', job: 'zion resident' };

    const response = await request.put('/api/users/2', { data: user });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject(user);
    expect(body.updatedAt).toMatch(ISO_TIMESTAMP);
  });

  test('updates part of a user with PATCH @regression', async ({ request }) => {
    const change = { job: 'zion resident' };

    const response = await request.patch('/api/users/2', { data: change });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject(change);
    expect(body.updatedAt).toMatch(ISO_TIMESTAMP);
    // Only the sent field comes back — PATCH must not echo a full user.
    expect(body).not.toHaveProperty('name');
  });

  test('deletes a user @regression', async ({ request }) => {
    const response = await request.delete('/api/users/2');

    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
  });
});
