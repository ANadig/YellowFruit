/* eslint-disable import/prefer-default-export */

export enum YfCssClasses {
  hotkeyUnderline = 'yf-hotkey-underline',
}

/** Turn a string with an ampersand into the string with the letter after the ampersand underlined */
export function hotkeyFormat(caption: string) {
  const splitLoc = caption.indexOf('&');
  if (splitLoc === -1) return <span>caption</span>;

  const start = caption.substring(0, splitLoc);
  const uLetter = caption.substring(splitLoc + 1, splitLoc + 2);
  const end = caption.substring(splitLoc + 2);

  return (
    <span>
      {start}
      <span className={YfCssClasses.hotkeyUnderline}>{uLetter}</span>
      {end}
    </span>
  );
}
