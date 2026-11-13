/**
 * Code execution adapter.
 *
 * The whole app calls exactly `runCode(language, code)`. Right now this is a
 * deliberately small mock: it never executes untrusted code. It reads simple
 * printed literals (and literal variable assignments) so the workspace has
 * something believable to render.
 *
 * TODO: replace the mock body with a call to a Next.js Route Handler that
 * proxies the Piston API (POST /api/execute or similar). Keep the returned
 * shape: { stdout, stderr, success, mocked }.
 */

const PRINT_PATTERNS = {
  python: /\bprint\s*\((.*)\)\s*$/,
  javascript: /\bconsole\.log\s*\((.*)\)\s*;?\s*$/,
  typescript: /\bconsole\.log\s*\((.*)\)\s*;?\s*$/,
  java: /\bSystem\.out\.print(?:ln)?\s*\((.*)\)\s*;?\s*$/,
  go: /\bfmt\.Print(?:ln|f)?\s*\((.*)\)\s*$/,
  ruby: /\b(?:puts|print)\s+(.+)$/,
  php: /\becho\s+(.+);\s*$/,
  c: /\bprintf\s*\((.*)\)\s*;\s*$/,
  cpp: /\b(?:std::)?cout\s*<<\s*(.+);\s*$/,
  rust: /\bprintln!\s*\((.*)\)\s*;?\s*$/,
};

const ASSIGNMENT_PATTERNS = [
  /^(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(.+?);?\s*$/,
  /^([A-Za-z_]\w*)\s*:=\s*(.+?)\s*$/,
  /^(?:int|long|short|float|double|char|boolean|String|string|auto|std::string)\s+([A-Za-z_]\w*)\s*=\s*(.+?);\s*$/,
  /^\$([A-Za-z_]\w*)\s*=\s*(.+?);\s*$/,
  /^([A-Za-z_]\w*)\s*=\s*(.+?)\s*$/,
];

function unescapeLiteral(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function readLiteral(raw, variables = new Map()) {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim().replace(/;\s*$/, "");

  if (!value || value.includes("`") || value.includes("${")) {
    return null;
  }

  if (/^\$?[A-Za-z_]\w*$/.test(value)) {
    const key = value.startsWith("$") ? value.slice(1) : value;

    return variables.has(key) ? variables.get(key) : null;
  }

  const quoted =
    value.match(/^"((?:\\.|[^"\\])*)"$/) ||
    value.match(/^'((?:\\.|[^'\\])*)'$/);

  if (quoted) {
    return unescapeLiteral(quoted[1]);
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return value;
  }

  return null;
}

function readPrintfLiteral(raw, variables) {
  if (typeof raw !== "string") {
    return null;
  }

  const match = raw.match(/^\s*"((?:\\.|[^"\\])*)"\s*(?:,\s*([\s\S]*))?$/);

  if (!match) {
    return null;
  }

  const format = unescapeLiteral(match[1]);
  const argumentsList = (match[2] ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let argumentIndex = 0;
  let failed = false;

  const output = format
    .replace(/%%/g, "\u0000")
    .replace(/%[disf]/g, () => {
      const argument = argumentsList[argumentIndex];
      argumentIndex += 1;
      const resolved = readLiteral(argument, variables);

      if (resolved === null) {
        failed = true;
        return "";
      }

      return resolved;
    })
    .replace(/\u0000/g, "%");

  if (failed || /%[disf]/.test(output)) {
    return null;
  }

  return output;
}

function readStreamValues(raw, variables) {
  if (typeof raw !== "string") {
    return [];
  }

  return raw
    .split("<<")
    .map((part) => part.trim())
    .filter((part) => part && !/^(?:std::)?endl$/.test(part))
    .map((part) => readLiteral(part, variables))
    .filter((part) => part !== null);
}

function readPhpEcho(raw, variables) {
  if (typeof raw !== "string") {
    return null;
  }

  const values = raw
    .split(".")
    .map((part) => readLiteral(part, variables))
    .filter((part) => part !== null);

  if (values.length === 0) {
    return null;
  }

  return values.join("");
}

function readBraceFormatLiteral(raw, variables) {
  if (typeof raw !== "string") {
    return null;
  }

  const match = raw.match(/^\s*"((?:\\.|[^"\\])*)"\s*(?:,\s*([\s\S]*))?$/);

  if (!match) {
    return null;
  }

  const argumentsList = (match[2] ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let argumentIndex = 0;
  let failed = false;

  const output = unescapeLiteral(match[1]).replace(/\{\}/g, () => {
    const resolved = readLiteral(argumentsList[argumentIndex], variables);
    argumentIndex += 1;

    if (resolved === null) {
      failed = true;
      return "";
    }

    return resolved;
  });

  return failed ? null : output;
}

function collectVariables(source) {
  const variables = new Map();

  for (const line of String(source ?? "").split("\n")) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      (trimmed.startsWith("#") && !trimmed.startsWith("#include"))
    ) {
      continue;
    }

    for (const pattern of ASSIGNMENT_PATTERNS) {
      const match = trimmed.match(pattern);

      if (!match) {
        continue;
      }

      const [, name, rawValue] = match;
      const value = readLiteral(rawValue, variables);

      if (value !== null && !variables.has(name)) {
        variables.set(name, value);
      }

      break;
    }
  }

  return variables;
}

function extractPrintedLines(language, code) {
  const lines = [];
  const variables = collectVariables(code);
  const source = String(code ?? "").split("\n");

  for (const line of source) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      (trimmed.startsWith("#") && !trimmed.startsWith("#include"))
    ) {
      continue;
    }

    if (language === "cpp") {
      const match = trimmed.match(PRINT_PATTERNS.cpp);

      if (match) {
        const values = readStreamValues(match[1], variables);
        if (values.length > 0) {
          lines.push(values.join(""));
        }
        continue;
      }
    }

    if (language === "c") {
      const match = trimmed.match(PRINT_PATTERNS.c);
      if (match) {
        const literal = readPrintfLiteral(match[1], variables);
        if (literal !== null) {
          lines.push(literal);
        }
        continue;
      }
    }

    if (language === "php") {
      const match = trimmed.match(PRINT_PATTERNS.php);
      if (match) {
        const value = readPhpEcho(match[1], variables);
        if (value !== null) {
          lines.push(value);
        }
        continue;
      }
    }

    if (language === "java") {
      const match = trimmed.match(PRINT_PATTERNS.java);
      if (match) {
        const value = readLiteral(match[1], variables);
        if (value !== null) {
          lines.push(value);
        }
        continue;
      }
    }

    if (language === "rust") {
      const match = trimmed.match(PRINT_PATTERNS.rust);
      if (match) {
        const value = readBraceFormatLiteral(match[1], variables);
        if (value !== null) {
          lines.push(value);
        }
        continue;
      }
    }

    const pattern = PRINT_PATTERNS[language];

    if (!pattern) {
      // Unknown language: fall back to a generic quoted-literal scan.
      const values = readStreamValues(trimmed, variables);
      if (values.length > 0) {
        lines.push(values.join(" "));
      }
      continue;
    }

    const match = trimmed.match(pattern);

    if (!match) {
      continue;
    }

    if (language === "go") {
      const parts = match[1]
        .split(",")
        .map((part) => readLiteral(part, variables))
        .filter((part) => part !== null);

      if (parts.length > 0) {
        lines.push(parts.join(" "));
      }
      continue;
    }

    const value = readLiteral(match[1], variables);

    if (value !== null) {
      lines.push(value);
    }
  }

  return lines;
}

/**
 * Run code.
 *
 * @param {string} language one of the keys in LANGUAGE_META
 * @param {string} code source typed in the workspace
 * @returns {Promise<{stdout: string, stderr: string, success: boolean, mocked: boolean}>}
 */
export async function runCode(language, code) {
  const source = String(code ?? "");

  // A short pause keeps the run button honest about asynchronous execution.
  await new Promise((resolve) => setTimeout(resolve, 650));

  if (!source.trim()) {
    return {
      stdout: "",
      stderr: "Nothing to run — add a line of code first.",
      success: false,
      mocked: true,
    };
  }

  const printed = extractPrintedLines(language, source);

  if (printed.length === 0) {
    return {
      stdout: "",
      stderr: "",
      success: true,
      mocked: true,
    };
  }

  const body = printed
    .map((line) => line.replace(/\n+$/, ""))
    .join("\n");

  return {
    stdout: body.endsWith("\n") ? body : `${body}\n`,
    stderr: "",
    success: true,
    mocked: true,
  };
}