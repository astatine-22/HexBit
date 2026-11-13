/**
 * CodeMentor challenge bank.
 *
 * Challenges are loaded from data/challenges/<language>.json, one file per
 * supported language. All screens read them through getChallenges() and
 * getChallengeById(id). Both stay async so the local files can be swapped for
 * Supabase queries later without touching a single component.
 *
 * TODO: replace the JSON file reads with Supabase queries. The public function
 * signatures below should stay the same.
 */

import pythonChallenges from "@/data/challenges/python.json";
import javascriptChallenges from "@/data/challenges/javascript.json";
import typescriptChallenges from "@/data/challenges/typescript.json";
import javaChallenges from "@/data/challenges/java.json";
import cChallenges from "@/data/challenges/c.json";
import cppChallenges from "@/data/challenges/cpp.json";
import goChallenges from "@/data/challenges/go.json";
import rubyChallenges from "@/data/challenges/ruby.json";
import phpChallenges from "@/data/challenges/php.json";
import rustChallenges from "@/data/challenges/rust.json";

const MOCK_CHALLENGES = [
  ...pythonChallenges,
  ...javascriptChallenges,
  ...typescriptChallenges,
  ...javaChallenges,
  ...cChallenges,
  ...cppChallenges,
  ...goChallenges,
  ...rubyChallenges,
  ...phpChallenges,
  ...rustChallenges,
];

/**
 * Return every challenge in shelf order.
 * @returns {Promise<Array<object>>}
 */
export async function getChallenges() {
  return MOCK_CHALLENGES;
}

/**
 * Return one challenge or null when the id is unknown.
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getChallengeById(id) {
  if (typeof id !== "string") {
    return null;
  }

  return MOCK_CHALLENGES.find((challenge) => challenge.id === id) ?? null;
}

export async function getChallengesByLanguage(language) {
  const all = await getChallenges();
  return all.filter((challenge) => challenge.language === language);
}

export const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c",
  "cpp",
  "go",
  "ruby",
  "php",
  "rust",
];

/**
 * Group challenges into the physical metaphor hierarchy:
 * language -> chapters (by category) -> challenges.
 * @returns {Record<string, { id: string; name: string; glyph: string; chapters: Array<{ id: string; title: string; challenges: Array<object> }> }>}
 */
export function getLanguageCurriculum() {
  const byLanguage = {};

  for (const challenge of MOCK_CHALLENGES) {
    const languageId = challenge.language;
    const langKey = String(languageId || "misc");

    if (!byLanguage[langKey]) {
      const glyphMap = { python: "Py", javascript: "JS", typescript: "TS", java: "Jv", c: "C", cpp: "C++", go: "Go", ruby: "Rb", php: "PHP", rust: "Rs" };
      byLanguage[langKey] = {
        id: langKey,
        name: languageId,
        glyph: glyphMap[langKey] || String(langKey).slice(0, 2).toUpperCase(),
        chapters: [],
      };
    }

    const chapterId = String(challenge.category || "misc")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const chapterTitle = challenge.category || "Misc";

    let chapter = byLanguage[langKey].chapters.find(
      (entry) => entry.id === chapterId
    );

    if (!chapter) {
      chapter = { id: chapterId, title: chapterTitle, challenges: [] };
      byLanguage[langKey].chapters.push(chapter);
    }

    chapter.challenges.push(challenge);
  }

  return byLanguage;
}
