import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BulkUploadPage from '../bulk-upload/page';

describe('Bulk upload page', () => {
  it('renders the CSV template download link', async () => {
    render(<BulkUploadPage />);
    expect(await screen.findByText('Descargar template CSV')).toBeInTheDocument();
  });
});
