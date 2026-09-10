import DOMPurify from 'dompurify';

const YOUTUBE_IFRAME_SRC = /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\//i;

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const element = node as Element;
      const src = element.getAttribute('src') || '';
      if (!YOUTUBE_IFRAME_SRC.test(src)) {
        element.parentNode?.removeChild(element);
        return;
      }
      element.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      element.removeAttribute('srcdoc');
    }
  });

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    const value = (data.attrValue || '').trim();
    if (data.attrName === 'href' || data.attrName === 'src') {
      if (value.startsWith('//') || /^\s*(javascript|vbscript):/i.test(value)) {
        data.keepAttr = false;
      }
      if (data.attrName === 'href' && /^\s*data:/i.test(value)) {
        data.keepAttr = false;
      }
    }
  });
}

const PURIFY_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ['iframe', 'video'],
  ADD_ATTR: ['allowfullscreen', 'frameborder', 'controls', 'target', 'allow', 'sandbox'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'link', 'meta', 'base'],
};

export function sanitizeHtmlContent(html: string): string {
  if (!html) return '';
  installHooks();
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
