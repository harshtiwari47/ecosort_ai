import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { predictImage } from '../src/features/classifier/modelService';
import type { RankedPrediction } from '../src/types/domain';

vi.mock('../src/features/classifier/modelService', () => ({
  getModelStatus: () => ({ state: 'not-loaded', message: 'Model assets load locally on first use.', version: 'test-model' }),
  subscribeToModelStatus: (listener: (status: unknown) => void) => {
    listener({ state: 'not-loaded', message: 'Model assets load locally on first use.', version: 'test-model' });
    return () => undefined;
  },
  predictImage: vi.fn(),
}));

const mockPredict = vi.mocked(predictImage);
const sixScores: RankedPrediction[] = [
  { category: 'glass', score: 0.82 },
  { category: 'plastic', score: 0.09 },
  { category: 'metal', score: 0.04 },
  { category: 'paper', score: 0.025 },
  { category: 'cardboard', score: 0.015 },
  { category: 'other', score: 0.01 },
];

function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(<App />);
}

async function openClassifier(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('link', { name: /^Classify$/i }));
  expect(await screen.findByRole('heading', { name: 'Classify an item' })).toBeInTheDocument();
}

async function uploadImage(user: ReturnType<typeof userEvent.setup>, name = 'bottle.png') {
  const input = screen.getByLabelText('Choose waste image');
  await user.upload(input, new File(['sample-image'], name, { type: 'image/png' }));
  expect(await screen.findByAltText(`Selected waste item: ${name}`)).toBeInTheDocument();
}

describe('EcoSort routes and interactions', () => {
  beforeEach(() => mockPredict.mockReset());

  it('renders the home route and navigates to the main pages', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByRole('heading', { name: /Understand your waste/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Waste guide/i }));
    expect(await screen.findByRole('heading', { name: 'Waste sorting guide' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /^History$/i }));
    expect(await screen.findByRole('heading', { name: 'Classification history' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /^Settings$/i }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('supports direct route loading and displays a not-found page', () => {
    const view = renderApp('/about');
    expect(screen.getByRole('heading', { name: 'How the classifier works' })).toBeInTheDocument();
    view.unmount();
    window.history.pushState({}, '', '/unknown-route');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'This path doesn’t sort.' })).toBeInTheDocument();
  });

  it('announces unsupported upload formats', async () => {
    const user = userEvent.setup();
    renderApp();
    await openClassifier(user);
    const input = screen.getByLabelText('Choose waste image');
    fireEvent.change(input, { target: { files: [new File(['x'], 'item.gif', { type: 'image/gif' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPEG, PNG, or WebP image.');
  });

  it('classifies locally, stores only a summary, filters history, deletes a record, and clears history after confirmation', async () => {
    const user = userEvent.setup();
    mockPredict.mockResolvedValue(sixScores);
    renderApp();
    await openClassifier(user);
    await uploadImage(user, 'jar.png');
    await user.click(screen.getByRole('button', { name: /Classify item/i }));
    expect(await screen.findByRole('heading', { name: 'Suggested material group' })).toBeInTheDocument();
    const result = screen.getByRole('region', { name: 'Suggested material group' });
    expect(within(result).getAllByText('Glass', { selector: 'strong' })).toHaveLength(2);
    const saved = JSON.parse(window.localStorage.getItem('ecosort.history.v1') ?? '[]') as Array<Record<string, unknown>>;
    expect(saved).toHaveLength(1);
    expect(saved[0]).not.toHaveProperty('photo');
    expect(JSON.stringify(saved)).not.toContain('jar.png');

    await user.click(screen.getByRole('link', { name: /^History$/i }));
    expect(await screen.findByText('82%', { selector: 'strong' })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search history' }), 'paper');
    expect(screen.getByText('No results match')).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Search history' }));
    const row = screen.getByRole('article');
    await user.click(within(row).getByRole('button', { name: 'Delete Glass result' }));
    expect(screen.getByText('No classifications yet')).toBeInTheDocument();

    mockPredict.mockResolvedValue(sixScores);
    await user.click(screen.getByRole('link', { name: /^Classify$/i }));
    await uploadImage(user, 'can.png');
    await user.click(screen.getByRole('button', { name: /Classify item/i }));
    await screen.findByRole('heading', { name: 'Suggested material group' });
    await user.click(screen.getByRole('link', { name: /^History$/i }));
    await user.click(screen.getByRole('button', { name: /Clear history/i }));
    const dialog = screen.getByRole('alertdialog', { name: 'Clear all history?' });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Clear history', exact: true }));
    expect(screen.getByText('No classifications yet')).toBeInTheDocument();
  });

  it('shows loading, abstains below the configured threshold, and reports model errors', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('ecosort.settings.v1', JSON.stringify({ theme: 'dark', minConfidence: 0.8 }));
    let finish: ((value: RankedPrediction[]) => void) | undefined;
    mockPredict.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderApp();
    await openClassifier(user);
    await uploadImage(user);
    await user.click(screen.getByRole('button', { name: /Classify item/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/First use may take/i);
    expect(screen.getByRole('button', { name: /Classifying on this device/i })).toBeDisabled();
    await waitFor(() => expect(mockPredict).toHaveBeenCalled());
    await act(async () => finish?.([{ category: 'glass', score: 0.62 }, { category: 'plastic', score: 0.2 }]));
    expect(await screen.findByRole('heading', { name: 'Best match — uncertain' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/could not classify this item reliably/i);
  });

  it('persists theme and confidence preferences', async () => {
    const user = userEvent.setup();
    renderApp('/settings');
    await user.click(screen.getByRole('button', { name: /Light/ }));
    fireEvent.change(screen.getByRole('slider', { name: 'Minimum confidence score' }), { target: { value: '0.7' } });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('ecosort.settings.v1') ?? '{}')).toEqual({ theme: 'light', minConfidence: 0.7 }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
