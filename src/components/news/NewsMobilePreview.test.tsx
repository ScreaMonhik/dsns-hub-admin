import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsMobilePreview } from './NewsMobilePreview';
import { useThemeStore } from '../../store/themeStore';

vi.mock('./TipTapEditor', () => ({
  TipTapViewer: ({ value }: { value: string }) => <div data-testid="tiptap-viewer">{value}</div>,
}));

vi.mock('../common/SecureImage', () => ({
  SecureImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const longContent = Array.from({ length: 40 }, (_, i) => `Абзац новини номер ${i + 1}.`).join('\n');

function renderPreview(adminMode: 'light' | 'dark' = 'dark') {
  useThemeStore.setState({ mode: adminMode, toggleTheme: useThemeStore.getState().toggleTheme });
  return render(
    <ThemeProvider theme={createTheme({ palette: { mode: adminMode } })}>
      <NewsMobilePreview title="Довга новина" content={longContent} categoryName="Оголошення" />
    </ThemeProvider>
  );
}

describe('NewsMobilePreview', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: 'dark' });
  });

  it('lets the article body scroll inside the phone frame', () => {
    renderPreview('dark');

    const scroll = screen.getByTestId('news-preview-scroll');
    const styles = getComputedStyle(scroll);

    expect(styles.overflowY).toBe('auto');
    expect(styles.minHeight).toBe('0px');
    expect(styles.pointerEvents).not.toBe('none');
    expect(screen.getByTestId('tiptap-viewer')).toHaveTextContent('Абзац новини номер 40');
  });

  it('switches only the phone preview theme, not the admin theme', async () => {
    const user = userEvent.setup();
    renderPreview('dark');

    const scroll = screen.getByTestId('news-preview-scroll');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(scroll).toHaveAttribute('data-preview-mode', 'light');
    expect(getComputedStyle(scroll).backgroundColor).toBe('rgb(248, 250, 252)');

    await user.click(screen.getByRole('button', { name: 'Темна тема прев’ю' }));

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(screen.getByTestId('news-preview-scroll')).toHaveAttribute('data-preview-mode', 'dark');
    expect(getComputedStyle(screen.getByTestId('news-preview-scroll')).backgroundColor).toBe('rgb(18, 18, 18)');
  });

  it('keeps the admin light theme when the preview is switched to dark', async () => {
    const user = userEvent.setup();
    renderPreview('light');

    expect(useThemeStore.getState().mode).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Темна тема прев’ю' }));

    expect(useThemeStore.getState().mode).toBe('light');
    expect(screen.getByTestId('news-preview-scroll')).toHaveAttribute('data-preview-mode', 'dark');
    expect(getComputedStyle(screen.getByTestId('news-preview-scroll')).backgroundColor).toBe('rgb(18, 18, 18)');
  });
});
