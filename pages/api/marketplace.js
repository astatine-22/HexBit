import { getUser, updateProgress } from "../../lib/auth";
import marketplacePacks from "../../data/marketplace-packs.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ packs: marketplacePacks });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, packId, username, currentProgress } = req.body || {};

  if (action === "list") {
    return res.status(200).json({ packs: marketplacePacks });
  }

  if (action === "unlock") {
    if (!packId) {
      return res.status(400).json({ error: "packId is required" });
    }

    const pack = marketplacePacks.find((p) => p.id === packId);
    if (!pack) {
      return res.status(404).json({ error: "Marketplace pack not found" });
    }

    // Attempt lookup in persistent users, or fallback to client-supplied progress for guests
    const user = username ? getUser(username) : null;
    const progress = user?.progress || currentProgress || {};

    const unlockedPacks = Array.isArray(progress.unlockedPacks) ? progress.unlockedPacks : [];
    if (unlockedPacks.includes(packId)) {
      return res.status(200).json({
        success: true,
        message: "Pack is already unlocked",
        pack,
        unlockedPacks,
        remainingXp: progress.xp ?? 170,
      });
    }

    const currentXp = progress.leaderboardStats?.xp ?? progress.xp ?? 170;

    // Prerequisite Checks
    if (currentXp < pack.prerequisiteXp) {
      return res.status(400).json({
        error: `Requires ${pack.prerequisiteXp} XP to unlock (current: ${currentXp} XP)`,
      });
    }

    if (currentXp < pack.xpCost) {
      return res.status(400).json({
        error: `Insufficient XP balance. Pack costs ${pack.xpCost} XP (available: ${currentXp} XP)`,
      });
    }

    const remainingXp = currentXp - pack.xpCost;
    const newUnlockedPacks = [...new Set([...unlockedPacks, packId])];

    const partialUpdate = {
      xp: remainingXp,
      unlockedPacks: newUnlockedPacks,
      leaderboardStats: {
        ...(progress.leaderboardStats || {}),
        xp: remainingXp,
      },
    };

    if (user?.username) {
      updateProgress(user.username, partialUpdate);
    }

    return res.status(200).json({
      success: true,
      message: `Unlocked ${pack.skillName}`,
      pack,
      unlockedPacks: newUnlockedPacks,
      remainingXp,
      partialUpdate,
    });
  }

  return res.status(400).json({ error: "Unknown action" });
}
