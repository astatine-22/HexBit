import marketplacePacks from "../data/marketplace-packs.json";

/**
 * Client & server verification engine for Job-Description Matching ("The Audition").
 * Matches detected requirements against real solved challenges and test execution telemetry.
 */

const SYNONYMS = {
  python: ["python", "py"],
  javascript: ["javascript", "js", "web", "frontend"],
  typescript: ["typescript", "ts", "typed"],
  rust: ["rust", "rs", "systems"],
  go: ["go", "golang"],
  "c++": ["cpp", "c++", "systems"],
  c: ["c", "pointers", "memory"],
  sql: ["sql", "database", "query", "data structures"],
  "rest apis": ["web", "api", "backend", "network", "http"],
  "data structures": ["data structures", "array", "list", "hash", "map", "stack", "queue"],
  algorithms: ["algorithms", "sorting", "searching", "recursion", "logic", "loops"],
  concurrency: ["concurrency", "async", "threads", "parallel"],
  "memory management": ["pointers", "memory", "allocation", "bitwise", "c", "rust", "cpp"],
  "state management": ["state", "objects", "classes", "data structures"],
};

function matchChallengeToSkill(challenge, skillName) {
  const s = String(skillName || "").toLowerCase().trim();
  if (!s) return false;

  const lang = String(challenge.language || "").toLowerCase();
  const cat = String(challenge.category || "").toLowerCase();
  const title = String(challenge.title || "").toLowerCase();
  const tags = Array.isArray(challenge.tags)
    ? challenge.tags.map((t) => String(t).toLowerCase())
    : [];

  // Direct matches
  if (lang === s) return true;
  if (cat.includes(s) || s.includes(cat)) return true;
  if (title.includes(s)) return true;
  if (tags.some((t) => t.includes(s) || s.includes(t))) return true;

  // Check synonym mappings
  for (const [key, aliases] of Object.entries(SYNONYMS)) {
    if (s.includes(key) || aliases.includes(s)) {
      if (lang === key || aliases.includes(lang)) return true;
      if (aliases.some((a) => cat.includes(a) || tags.some((t) => t.includes(a)))) return true;
    }
  }

  return false;
}

/**
 * Verify skills against the challenge bank and user solved challenges.
 *
 * @param {Object} jobData - { requiredSkills, niceToHaveSkills, coreConcepts }
 * @param {Array} allChallenges - Loaded from getChallenges()
 * @param {Array|Set} solvedChallengeIds - Array or Set of solved IDs
 * @returns {Object} Verified scorecard, match score, and sprint playlist
 */
export function verifyJobMatch(jobData, allChallenges = [], solvedChallengeIds = [], unlockedPacks = []) {
  const solvedSet = solvedChallengeIds instanceof Set
    ? solvedChallengeIds
    : new Set(Array.isArray(solvedChallengeIds) ? solvedChallengeIds : []);

  const unlockedSet = unlockedPacks instanceof Set
    ? unlockedPacks
    : new Set(Array.isArray(unlockedPacks) ? unlockedPacks : []);

  const required = Array.isArray(jobData?.requiredSkills) ? jobData.requiredSkills : [];
  const niceToHave = Array.isArray(jobData?.niceToHaveSkills) ? jobData.niceToHaveSkills : [];
  const concepts = Array.isArray(jobData?.coreConcepts) ? jobData.coreConcepts : [];

  function evaluateSkill(skillName, isRequired = true) {
    const matchingChallenges = allChallenges.filter((c) => matchChallengeToSkill(c, skillName));
    const solvedMatching = matchingChallenges.filter((c) => solvedSet.has(c.id));
    const uncompleted = matchingChallenges.filter((c) => !solvedSet.has(c.id));

    const totalCount = matchingChallenges.length;
    const solvedCount = solvedMatching.length;

    // Check if this skill corresponds to an external Marketplace Sample Pack
    const sLower = String(skillName || "").toLowerCase().trim();
    const matchingPack = marketplacePacks.find((p) => {
      const pName = p.skillName.toLowerCase();
      if (pName.includes(sLower) || sLower.includes(pName)) return true;
      if (p.matchedKeywords?.some((k) => sLower.includes(k) || k.includes(sLower))) return true;
      return false;
    }) || null;

    const isPackUnlocked = matchingPack ? unlockedSet.has(matchingPack.id) : false;

    let status = "missing"; // 🔴 missing
    let earnedWeightRatio = 0.0;

    if (totalCount > 0) {
      if (solvedCount >= 3) {
        status = "mastered"; // 🟢 mastered (>= 3 solved)
        earnedWeightRatio = 1.0;
      } else if (solvedCount >= 1) {
        status = "learning"; // 🟡 learning (1-2 solved)
        earnedWeightRatio = 0.5;
      } else {
        status = "missing";
        earnedWeightRatio = 0.0;
      }
    } else if (matchingPack) {
      // External marketplace skill
      if (isPackUnlocked) {
        status = "mastered"; // 🟢 unlocked in Plugin Rack
        earnedWeightRatio = 1.0;
      } else {
        status = "marketplace_gap"; // 🔴 missing on native platform, available in Plugin Rack
        earnedWeightRatio = 0.0;
      }
    } else {
      status = "missing";
      earnedWeightRatio = 0.0;
    }

    return {
      name: skillName,
      status,
      solvedCount,
      totalCount,
      isRequired,
      uncompleted,
      weightRatio: earnedWeightRatio,
      marketplacePack: matchingPack,
      isPackUnlocked,
    };
  }

  const evaluatedRequired = required.map((s) => evaluateSkill(s, true));
  const evaluatedNice = niceToHave.map((s) => evaluateSkill(s, false));
  const evaluatedConcepts = concepts.map((s) => evaluateSkill(s, true));

  // Weighted Score Calculation: Required (75%), Nice-to-Have (25%)
  const reqWeightPool = 75;
  const niceWeightPool = 25;

  const reqScore = evaluatedRequired.length > 0
    ? (evaluatedRequired.reduce((acc, s) => acc + s.weightRatio, 0) / evaluatedRequired.length) * reqWeightPool
    : reqWeightPool * 0.5;

  const niceScore = evaluatedNice.length > 0
    ? (evaluatedNice.reduce((acc, s) => acc + s.weightRatio, 0) / evaluatedNice.length) * niceWeightPool
    : niceWeightPool * 0.5;

  const matchScore = Math.min(100, Math.max(0, Math.round(reqScore + niceScore)));

  // Generate Curated Sprint Playlist (4 to 6 uncompleted tracks)
  const playlistChallenges = [];
  const addedIds = new Set();

  // Difficulty sorter: Easy first, then Medium, then Hard
  const diffOrder = { easy: 1, medium: 2, hard: 3 };

  // Prioritize gaps in required skills, then learning skills, then nice-to-haves
  const prioritizedSkills = [
    ...evaluatedRequired.filter((s) => s.status === "missing"),
    ...evaluatedRequired.filter((s) => s.status === "learning"),
    ...evaluatedNice.filter((s) => s.status === "missing"),
    ...evaluatedConcepts.filter((s) => s.status === "missing"),
  ];

  for (const skill of prioritizedSkills) {
    if (playlistChallenges.length >= 6) break;

    const sortedUncompleted = [...skill.uncompleted].sort(
      (a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2)
    );

    for (const c of sortedUncompleted) {
      if (!addedIds.has(c.id)) {
        addedIds.add(c.id);
        playlistChallenges.push({
          ...c,
          fillsSkill: skill.name,
        });
        if (playlistChallenges.length >= 6) break;
        // Take at most 2 per skill so playlist stays diverse
        break;
      }
    }
  }

  // Check if any skill has an unlocked marketplace pack with drills
  for (const skill of [...evaluatedRequired, ...evaluatedNice, ...evaluatedConcepts]) {
    if (skill.isPackUnlocked && skill.marketplacePack?.tasks) {
      for (const t of skill.marketplacePack.tasks) {
        if (!addedIds.has(t.id) && playlistChallenges.length < 6) {
          addedIds.add(t.id);
          playlistChallenges.push({
            id: t.id,
            title: t.title,
            difficulty: t.difficulty || "medium",
            language: skill.marketplacePack.skillName,
            category: skill.marketplacePack.category,
            estimatedMinutes: t.estimatedMinutes || 25,
            description: t.description,
            isMarketplaceTask: true,
            packName: skill.marketplacePack.skillName,
            fillsSkill: skill.name,
          });
        }
      }
    }
  }

  // If still fewer than 4 challenges, backfill with early uncompleted challenges
  if (playlistChallenges.length < 4) {
    for (const c of allChallenges) {
      if (!solvedSet.has(c.id) && !addedIds.has(c.id)) {
        addedIds.add(c.id);
        playlistChallenges.push({
          ...c,
          fillsSkill: c.category || c.language,
        });
        if (playlistChallenges.length >= 4) break;
      }
    }
  }

  const estimatedMinutes = playlistChallenges.reduce(
    (acc, c) => acc + (c.estimatedMinutes || 10),
    0
  );

  const marketplaceGaps = [
    ...evaluatedRequired.filter((s) => s.status === "marketplace_gap"),
    ...evaluatedNice.filter((s) => s.status === "marketplace_gap"),
    ...evaluatedConcepts.filter((s) => s.status === "marketplace_gap"),
  ];

  return {
    matchScore,
    isReadyToApply: matchScore >= 80,
    evaluatedRequired,
    evaluatedNice,
    evaluatedConcepts,
    playlistChallenges,
    estimatedMinutes,
    marketplaceGaps,
    targetMatchScore: Math.min(100, matchScore + playlistChallenges.length * 7),
  };
}
