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

  it('strips XSS vectors used in stored HTML', () => {
    const dirty = [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)"></svg>',
      '<form action="https://evil.example"><input name="token"></form>',
      '<object data="https://evil.example"></object>',
      '<embed src="https://evil.example">',
      '<link rel="stylesheet" href="https://evil.example/x.css">',
      '<meta http-equiv="refresh" content="0;url=https://evil.example">',
      '<base href="https://evil.example/">',
      '<a href="javascript:alert(1)">x</a>',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
    ].join('');

    const clean = sanitizeHtmlContent(dirty).toLowerCase();
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onload');
    expect(clean).not.toContain('<form');
    expect(clean).not.toContain('<object');
    expect(clean).not.toContain('<embed');
    expect(clean).not.toContain('<link');
    expect(clean).not.toContain('<meta');
    expect(clean).not.toContain('<base');
    expect(clean).not.toContain('javascript');
    expect(clean).not.toContain('data:text/html');
  });

  it('sandboxes allowed YouTube iframes and drops srcdoc', () => {
    const dirty =
      '<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>alert(1)</script>"></iframe>';
    const clean = sanitizeHtmlContent(dirty);
    expect(clean).toContain('youtube.com');
    expect(clean).toContain('sandbox');
    expect(clean.toLowerCase()).not.toContain('srcdoc');
  });
});

