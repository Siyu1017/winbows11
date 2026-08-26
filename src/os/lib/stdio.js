// Compatibility entry point for existing WRT applications. New core code
// imports stdio.ts directly; keeping this bridge avoids breaking app modules
// that still reference the historic JavaScript path.
export { default } from './stdio.ts';
export * from './stdio.ts';
