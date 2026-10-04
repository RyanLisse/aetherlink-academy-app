import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('the public academy shell shows its navigation', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByText('Academy')).toBeVisible();
  await expect(screen.getByRole('navigation', 'Main navigation')).toBeVisible();
  await expect(screen.getByRole('link', 'Squad room')).toBeVisible();
});
