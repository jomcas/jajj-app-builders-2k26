// The model writes **markdown** even when told not to. The chat shows plain text, so the
// markup is stripped: emphasis, headings, code, links and quotes lose their markers, and list
// items become "• " lines. Pure.

export function stripMarkdown(text: string): string {
  return (
    text
      // Code fences: keep the code, drop the ``` lines.
      .replace(/^\s*```[^\n]*\n?/gm, '')
      // Images and links: keep the text.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\((?:https?:|mailto:|tahak:|#|\/)[^)]*\)/g, '$1')
      // Headings and block quotes.
      .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
      .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
      // Bullets (-, *, +) become "• "; numbered items keep their numbers.
      .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
      // Horizontal rules.
      .replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, '')
      // Bold, then italics, then strike-through and inline code.
      .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
      .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '$1$2')
      .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1$2')
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')
      .replace(/`([^`\n]+)`/g, '$1')
      // Stray markers: an unclosed ** while the answer is still streaming, or one at the end.
      .replace(/\*\*/g, '')
      .replace(/(__|\*|`)+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
