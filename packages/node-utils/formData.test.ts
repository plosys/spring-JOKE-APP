import { createFormData } from './formData.js';

describe('createFormData', () => {
  it('should handle strings', () => {
    const form = createFormData({ foo: 'bar' });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="foo"\r
\r
bar\r
--${boundary}--\r
`,
    );
  });

  it('should handle numbers', () => {
    const form = createFormData({ answer: 42 });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="answer"\r
\r
42\r
--${boundary}--\r
`,
    );
  });

  it('should handle booleans', () => {
    const form = createFormData({ really: true });
    const boundary = form.getBoundary();
    expect(String(form.getBuffer())).toBe(
      `--${boundary}\r
Content-Disposition: form-data; name="really"\r
\r
true\r
--${boundary}--\r
`,
    );
  });

  it('should handle buffers', () => {
    const form = createFormData({ buf: Buffer.from('fer') });
    const boundary = form.g