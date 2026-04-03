import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VerificationsPage from '../verifications/page';

describe('Verification page', () => {
  it('renders pending review section', async () => {
    render(<VerificationsPage />);
    expect(await screen.findByText('Pendientes de revisión')).toBeInTheDocument();
  });
});
