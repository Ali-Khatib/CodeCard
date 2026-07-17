import { expect, test, type Page } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/upload-progress';
const SIGNED_UPLOAD_BASE =
  'http://localhost:3000/e2e-fixtures/signed-upload';
const SIGNED_UPLOAD_URL = `${SIGNED_UPLOAD_BASE}?token=e2e-token`;
const SIGNED_UPLOAD_ROUTE =
  /^http:\/\/localhost:3000\/e2e-fixtures\/signed-upload\?token=e2e-token$/;

const PNG_FILE = {
  name: 'slow-network-avatar.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mP8z8AARAwMjIwgBgAE/wH+Y9ZQAAAAAElFTkSuQmCC',
    'base64',
  ),
};

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function openFixture(page: Page) {
  await page.setExtraHTTPHeaders({
    'x-codecard-e2e-fixture': 'upload-progress',
  });
  await page.goto(FIXTURE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: 'Avatar upload browser fixture' }),
  ).toBeVisible();
  await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
  // The fixture marker is needed only for the document request.
  await page.setExtraHTTPHeaders({});
}

async function selectAvatar(page: Page) {
  const input = page.getByLabel('Choose profile photo');
  await input.setInputFiles(PNG_FILE);
  await expect(page.getByRole('button', { name: 'Upload photo' })).toBeVisible();
  return input;
}

async function assertFinalAvatar(page: Page) {
  const upload = page.getByTestId('avatar-upload');
  const finalImage = upload.getByRole('img', {
    name: 'Upload Test User avatar',
  });

  await expect(finalImage).toHaveAttribute(
    'src',
    /auth-collage(?:%2F|\/)avatar\.jpg/i,
  );
  await expect(finalImage).toHaveCount(1);
  await expect(page.getByTestId('mutation-toast-success')).toContainText(
    'Profile photo updated',
  );
  await expect(page.getByTestId('avatar-upload-progress')).toHaveCount(0);
  await expect(upload).toHaveAttribute('aria-busy', 'false');
}

test.describe('WS04-T011 controlled upload progress', () => {
  test('holds a signed upload until visible progress is asserted, then completes once', async ({
    page,
  }) => {
    const releaseUpload = deferred();
    const uploadIntercepted = deferred();
    let initRequests = 0;
    let putRequests = 0;

    await page.route('**/api/upload', async (route) => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      const body = request.postDataJSON() as Record<string, unknown>;
      expect(body).toMatchObject({
        resourceType: 'avatar',
        filename: PNG_FILE.name,
        mimeType: PNG_FILE.mimeType,
      });
      initRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          path: 'e2e/avatar.png',
          signedUrl: SIGNED_UPLOAD_BASE,
          token: 'e2e-token',
          mimeType: PNG_FILE.mimeType,
          maxBytes: 5 * 1024 * 1024,
        }),
      });
    });

    await page.route(SIGNED_UPLOAD_ROUTE, async (route) => {
      expect(route.request().url()).toBe(SIGNED_UPLOAD_URL);
      expect(route.request().method()).toBe('PUT');
      putRequests += 1;
      uploadIntercepted.resolve();
      await releaseUpload.promise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    });

    await openFixture(page);
    const input = await selectAvatar(page);

    await page.getByRole('button', { name: 'Upload photo' }).click();
    await uploadIntercepted.promise;

    const upload = page.getByTestId('avatar-upload');
    const progress = page.getByTestId('avatar-upload-progress');
    await expect(upload).toHaveAttribute('aria-busy', 'true');
    await expect(progress).toBeVisible();
    await expect(progress.getByRole('progressbar')).toHaveAccessibleName(
      /Uploading image/i,
    );
    await expect(progress).toContainText(/Uploading image/i);
    await expect(input).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Upload photo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Retry upload/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cancel upload/i })).toBeVisible();

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);

    releaseUpload.resolve();
    await assertFinalAvatar(page);

    expect(initRequests).toBe(1);
    expect(putRequests).toBe(1);
    await expect(upload.getByText(/interrupted|failed/i)).toHaveCount(0);
  });

  test('shows a safe network failure and retries the original file to one asset', async ({
    page,
  }) => {
    const retryIntercepted = deferred();
    let initRequests = 0;
    let putRequests = 0;

    await page.route('**/api/upload', async (route) => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      const body = request.postDataJSON() as Record<string, unknown>;
      expect(body).toMatchObject({
        resourceType: 'avatar',
        filename: PNG_FILE.name,
      });
      initRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          path: 'e2e/avatar.png',
          signedUrl: SIGNED_UPLOAD_BASE,
          token: 'e2e-token',
          mimeType: PNG_FILE.mimeType,
          maxBytes: 5 * 1024 * 1024,
        }),
      });
    });

    await page.route(SIGNED_UPLOAD_ROUTE, async (route) => {
      expect(route.request().url()).toBe(SIGNED_UPLOAD_URL);
      expect(route.request().method()).toBe('PUT');
      putRequests += 1;
      if (putRequests === 1) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
      retryIntercepted.resolve();
    });

    await openFixture(page);
    await selectAvatar(page);
    await page.getByRole('button', { name: 'Upload photo' }).click();

    const upload = page.getByTestId('avatar-upload');
    const localStatus = upload.locator('p[role="status"]');
    await expect(localStatus).toHaveText('The upload was interrupted. Try again.');
    await expect(localStatus).not.toContainText(
      /XMLHttpRequest|Supabase|storage\/v1|stack|upload\.codecard\.test/i,
    );
    await expect(page.getByTestId('avatar-upload-progress')).toHaveCount(0);

    const retry = page.getByRole('button', {
      name: `Retry upload for ${PNG_FILE.name}`,
    });
    await expect(retry).toBeVisible();
    await retry.focus();
    await expect(retry).toBeFocused();

    await page.keyboard.press('Enter');
    await retryIntercepted.promise;
    await assertFinalAvatar(page);

    await expect(localStatus).not.toContainText(/interrupted|failed/i);
    await expect(retry).toHaveCount(0);
    expect(initRequests).toBe(2);
    expect(putRequests).toBe(2);
  });
});
