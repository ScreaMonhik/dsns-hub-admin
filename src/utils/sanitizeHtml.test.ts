import { describe, expect, it } from 'vitest';
import { sanitizeHtmlContent } from './sanitizeHtml';

describe('sanitizeHtmlContent', () => {
  it('strips script tags and event handlers', () => {
    const dirty = '<p onclick="alert(1)">Hi</p><script>alert(2)</script>';
    const clean = sanitizeHtmlContent(dirty);
    expect(clean).toContain('<p>Hi</p>');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('onclick');
  });

  it('allows YouTube iframes and drops others', () => {
    const youtube = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
    const other = '<iframe src="https://evil.example/embed"></iframe>';
    expect(sanitizeHtmlContent(youtube)).toContain('youtube.com');
    expect(sanitizeHtmlContent(other)).not.toContain('iframe');
  });

  it('drops javascript URLs from links', () => {
    const dirty = '<a href="javascript:alert(1)">click</a>';
    const clean = sanitizeHtmlContent(dirty);
    expect(clean).not.toContain('javascript');
  });
});
