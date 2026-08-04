/**
 * Ambient declarations for non-code assets that webpack resolves through @svgr/webpack and
 * file-loader. Needed so `npm run typecheck` can resolve these imports.
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}
