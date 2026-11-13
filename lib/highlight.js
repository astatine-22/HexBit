/**
 * Tiny read-only syntax highlighter used by the challenge detail preview.
 * Monaco is reserved for the solve workspace; this keeps the detail page light.
 */

const KEYWORDS = new Set([
  "and",
  "as",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "do",
  "echo",
  "elif",
  "else",
  "enum",
  "extends",
  "false",
  "fn",
  "for",
  "foreach",
  "func",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "int",
  "interface",
  "let",
  "loop",
  "match",
  "mut",
  "new",
  "nil",
  "None",
  "not",
  "null",
  "or",
  "package",
  "print",
  "printf",
  "println",
  "public",
  "puts",
  "return",
  "static",
  "struct",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "use",
  "var",
  "void",
  "while",
]);

const TYPES = new Set([
  "String",
  "Vec",
  "HashMap",
  "Array",
  "Integer",
  "Boolean",
  "boolean",
  "char",
  "double",
  "float",
  "long",
  "string",
  "number",
]);

const TOKEN_RE =
  /(#include|#define)|(\/\/[^\n]*|#[^\n]*|\/\*[^\n]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;

const CLASS_NAMES = {
  comment: "text-[#6f7768] italic",
  string: "text-[#d7dd8f]",
  number: "text-[#9cc9e6]",
  keyword: "text-[#e6bd77]",
  function: "text-[#9fd8c2]",
  type: "text-[#c7b7e8]",
  preprocessor: "text-[#c7b7e8]",
  plain: "text-[#e8e5da]",
};

function tokenizeLine(line) {
  const tokens = [];
  let lastIndex = 0;
  let match;

  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), type: "plain" });
    }

    const [full, preprocessor, comment, string, number, identifier] = match;

    if (preprocessor) {
      tokens.push({ text: full, type: "preprocessor" });
    } else if (comment) {
      tokens.push({ text: full, type: "comment" });
    } else if (string) {
      tokens.push({ text: full, type: "string" });
    } else if (number) {
      tokens.push({ text: full, type: "number" });
    } else if (identifier) {
      const rest = line.slice(match.index + full.length);
      const isCall = /^\s*\(/.test(rest);
      let type = "plain";

      if (KEYWORDS.has(identifier)) {
        type = "keyword";
      } else if (TYPES.has(identifier)) {
        type = "type";
      } else if (isCall) {
        type = "function";
      }

      tokens.push({ text: full, type });
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), type: "plain" });
  }

  return tokens;
}

export function highlightCode(code) {
  return String(code ?? "")
    .replace(/\n$/, "")
    .split("\n")
    .map(tokenizeLine);
}

export function tokenClassName(type) {
  return CLASS_NAMES[type] ?? CLASS_NAMES.plain;
}