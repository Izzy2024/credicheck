import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DisputesPage from '../disputes/page';

describe('Disputes page', () => {
  it('renders open dispute entry point', async () => {
    render(<DisputesPage />);
    expect(await screen.findByText('Abrir disputa')).toBeInTheDocument();
  });
});
