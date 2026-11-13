// scripts/verify_challenges.js
// Run: node scripts/verify_challenges.js
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data", "challenges");
const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

const REQUIRED = [
  "id",
  "title",
  "difficulty",
  "language",
  "category",
  "tags",
  "estimatedMinutes",
  "description",
  "starterCode",
  "expectedOutput",
  "hints",
];

const allIds = new Set();
const errors = [];
let total = 0;

const perLang = {};

for (const file of files) {
  const lang = file.replace(".json", "");
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    errors.push(`${file}: invalid JSON (${e.message})`);
    continue;
  }
  if (!Array.isArray(arr)) {
    errors.push(`${file}: top-level is not an array`);
    continue;
  }
  perLang[lang] = arr.length;
  total += arr.length;

  for (const c of arr) {
    if (!c || typeof c !== "object") {
      errors.push(`${file}: non-object entry`);
      continue;
    }
    for (const field of REQUIRED) {
      if (c[field] === undefined || c[field] === null) {
        errors.push(`${file}: ${c.id || "?"} missing field ${field}`);
        continue;
      }
      if (typeof c[field] === "string" && c[field].trim() === "") {
        errors.push(`${file}: ${c.id || "?"} empty ${field}`);
      }
      if (field === "hints" && (!Array.isArray(c.hints) || c.hints.length < 3)) {
        errors.push(`${file}: ${c.id} needs >=3 hints`);
      }
      if (field === "tags" && (!Array.isArray(c.tags) || c.tags.length === 0)) {
        errors.push(`${file}: ${c.id} needs tags`);
      }
    }
    if (!["easy", "medium", "hard"].includes(c.difficulty)) {
      errors.push(`${file}: ${c.id} bad difficulty ${c.difficulty}`);
    }
    if (typeof c.estimatedMinutes !== "number" || c.estimatedMinutes < 5 || c.estimatedMinutes > 25) {
      errors.push(`${file}: ${c.id} estimatedMinutes out of range`);
    }
    if (allIds.has(c.id)) {
      errors.push(`${file}: DUPLICATE ID ${c.id}`);
    }
    allIds.add(c.id);
  }
}

// Minimum counts
for (const [lang, count] of Object.entries(perLang)) {
  if (count < 100) {
    errors.push(`${lang}: only ${count} challenges (need >=100)`);
  }
}

console.log("Languages:", Object.keys(perLang).length);
console.log("Total challenges:", total);
console.log("Unique IDs:", allIds.size);
for (const [lang, count] of Object.entries(perLang)) {
  console.log(`  ${lang}: ${count}`);
}

if (errors.length) {
  console.log("\nERRORS (" + errors.length + "):");
  errors.slice(0, 40).forEach((e) => console.log("  - " + e));
  if (errors.length > 40) console.log(`  ... and ${errors.length - 40} more`);
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
