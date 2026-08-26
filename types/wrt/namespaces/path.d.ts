/** Node.js-compatible path utilities using Winbows C:/ public paths. */
declare namespace path {
  const sep: '/';
  const delimiter: ';';
  function normalize(value: string): string;
  function join(...values: string[]): string;
  function resolve(...values: string[]): string;
  function isAbsolute(value: string): boolean;
  function dirname(value: string): string;
  function basename(value: string, suffix?: string): string;
  function extname(value: string): string;
  function relative(from: string, to: string): string;
  function parse(value: string): { root: string; dir: string; base: string; ext: string; name: string };
  function format(value: { dir?: string; root?: string; base?: string; name?: string; ext?: string }): string;
  function toNamespacedPath(value: string): string;
  const posix: typeof path;
  const win32: typeof path;
}
