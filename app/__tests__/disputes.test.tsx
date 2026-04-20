import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DisputesPage from '../disputes/page';

describe('Disputes page', () => {
  it('renders disputes title', async () => {
    localStorage.setItem('accessToken', 'test-token');

    // Prevent real network calls in this smoke test.
    global.fetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      }) as any) as any;

    render(<DisputesPage />);
    expect(await screen.findByText('Mis disputas')).toBeInTheDocument();
  });
});
