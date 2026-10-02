import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sepetakhq/storefront-kit/api/endpoints', () => ({ searchDestinations: vi.fn(async () => []) }));

const DestinationPicker = (await import('./DestinationPicker.jsx')).default;

afterEach(cleanup);

const PICKED = { ref: 'loc_1', label: 'TEBET BARAT, TEBET, KOTA JAKARTA SELATAN, DKI JAKARTA, 12810', subdistrict: 'TEBET BARAT', district: 'TEBET', city: 'KOTA JAKARTA SELATAN', province: 'DKI JAKARTA', zip_code: '12810' };

function Harness({ initial }) {
  const [value, setValue] = useState(initial);
  return (
    <QueryClientProvider client={new QueryClient()}>
      <DestinationPicker value={value} onChange={setValue} />
    </QueryClientProvider>
  );
}

describe('DestinationPicker', () => {
  it('does not grab the cursor on a fresh checkout', () => {
    render(<Harness initial={null} />);
    expect(document.activeElement).not.toBe(screen.getByRole('combobox'));
  });

  it('puts the cursor in the search box after "Ubah"', () => {
    render(<Harness initial={PICKED} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah' }));
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });
});
