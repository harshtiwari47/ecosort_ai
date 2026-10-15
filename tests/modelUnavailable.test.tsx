import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassifyPage } from '../src/pages/ClassifyPage';
import { HistoryProvider } from '../src/features/history/HistoryContext';
import { SettingsProvider } from '../src/features/settings/SettingsContext';

describe('real classifier setup failures', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
  });

  it('keeps predictions unavailable and explains setup when local model assets are missing', async () => {
    const user = userEvent.setup();
    render(<SettingsProvider><HistoryProvider><BrowserRouter><ClassifyPage /></BrowserRouter></HistoryProvider></SettingsProvider>);
    const input = screen.getByLabelText('Choose waste image');
    await user.upload(input, new File(['image'], 'item.png', { type: 'image/png' }));
    await user.click(await screen.findByRole('button', { name: /Classify item/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/configuration is missing/i);
    expect(screen.getByText(/Follow the model setup steps in the README/i)).toBeInTheDocument();
  });
});
