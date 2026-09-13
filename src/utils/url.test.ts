import { describe, expect, it } from 'vitest';
import { getFullUrl, isInternalApiUrl, isSafeHttpUrl, isSafeYoutubeUrl, toApiRequestUrl } from './url';

describe('url security helpers', () => {
  it('accepts relative API paths', () => {
    expect(isInternalApiUrl('/uploads/avatars/a.jpg')).toBe(true);
    expect(getFullUrl('/uploads/avatars/a.jpg')).toBe('http://localhost:3000/uploads/avatars/a.jpg');
  });

  it('rejects protocol-relative, javascript, and traversal URLs', () => {
    expect(isInternalApiUrl('//evil.com/x')).toBe(false);
    expect(isInternalApiUrl('javascript:alert(1)')).toBe(false);
    expect(isInternalApiUrl('/../etc/passwd')).toBe(false);
    expect(getFullUrl('javascript:alert(1)')).toBe('');
    expect(getFullUrl('https://evil.example/img.png')).toBe('');
  });

  it('converts same-origin absolute URLs to a path', () => {
    expect(toApiRequestUrl('http://localhost:3000/documents/download/file.pdf')).toBe('/documents/download/file.pdf');
  });

  it('blocks requests to a foreign origin', () => {
    expect(() => toApiRequestUrl('https://evil.example/steal')).toThrow();
  });

  it('validates http(s) and YouTube URLs', () => {
    expect(isSafeHttpUrl('https://dsns.gov.ua/page')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeYoutubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isSafeYoutubeUrl('https://evil.com/youtube')).toBe(false);
  });

  it('rejects SSRF and open-redirect style API URLs', () => {
    expect(isInternalApiUrl('http://127.0.0.1:3000/users')).toBe(false);
    expect(isInternalApiUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isInternalApiUrl('file:///etc/passwd')).toBe(false);
    expect(isInternalApiUrl('/uploads/../../etc/passwd')).toBe(false);
    expect(isInternalApiUrl('https://localhost:3000/users@evil.example')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeYoutubeUrl('https://youtube.com.evil.example/watch?v=abc')).toBe(false);
    expect(isSafeYoutubeUrl('https://evil.example/?u=youtube.com')).toBe(false);
  });
});

