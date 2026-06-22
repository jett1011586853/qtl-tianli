import { rankTables } from "../data/rankTables.js";

export const YEARS = [2021, 2022, 2023, 2024, 2025];

export function rankAtScore(score, year) {
  const table = rankTables[String(year)] ?? rankTables[year];
  if (!table?.length) return null;
  if (score >= table[0][0]) return table[0][1];
  if (score <= table[table.length - 1][0]) return table[table.length - 1][1];

  for (let index = 0; index < table.length - 1; index += 1) {
    const [highScore, highRank] = table[index];
    const [lowScore, lowRank] = table[index + 1];
    if (score <= highScore && score >= lowScore) {
      const distance = (highScore - score) / Math.max(1, highScore - lowScore);
      return Math.round(highRank + distance * (lowRank - highRank));
    }
  }
  return table[table.length - 1][1];
}

export function predictRank(score) {
  const observations = YEARS.map((year) => ({ year, rank: rankAtScore(score, year) })).filter(
    ({ rank }) => Number.isFinite(rank),
  );
  const count = observations.length;
  if (count < 2) {
    const fallback = observations[0]?.rank ?? 1;
    return { predicted: fallback, low: fallback, high: fallback, observations };
  }

  const meanYear = observations.reduce((sum, item) => sum + item.year, 0) / count;
  const meanRank = observations.reduce((sum, item) => sum + item.rank, 0) / count;
  const numerator = observations.reduce(
    (sum, item) => sum + (item.year - meanYear) * (item.rank - meanRank),
    0,
  );
  const denominator = observations.reduce(
    (sum, item) => sum + (item.year - meanYear) ** 2,
    0,
  );
  const slope = denominator ? numerator / denominator : 0;
  const predicted = Math.max(1, Math.round(meanRank + slope * (2026 - meanYear)));
  const spread = Math.max(120, Math.round(predicted * 0.08));
  return {
    predicted,
    low: Math.max(1, predicted - spread),
    high: predicted + spread,
    observations,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function classifyRatio(ratio) {
  if (ratio >= 1.01 && ratio <= 1.22) return "rush";
  if (ratio >= 0.84 && ratio < 1.01) return "match";
  if (ratio >= 0.55 && ratio < 0.84) return "safety";
  return null;
}

const TARGET_RATIO = { rush: 1.1, match: 0.93, safety: 0.7 };

export function buildRecommendations(programs, predictedRank, region, searchTerm = "") {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return programs
    .filter((program) => region === "全部" || program.region === region)
    .filter((program) => {
      if (!normalizedSearch) return true;
      return `${program.school}${program.major}${program.city}`.toLowerCase().includes(normalizedSearch);
    })
    .map((program) => {
      const rankedHistory = program.history
        .map(({ year, score }) => ({ year, score, rank: rankAtScore(score, year) }))
        .filter(({ rank }) => Number.isFinite(rank));
      if (!rankedHistory.length) return null;
      const benchmarkRank = median(rankedHistory.map(({ rank }) => rank));
      const ratio = predictedRank / Math.max(1, benchmarkRank);
      const category = classifyRatio(ratio);
      if (!category) return null;
      return { ...program, rankedHistory, benchmarkRank, ratio, category };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        Math.abs(left.ratio - TARGET_RATIO[left.category]) -
        Math.abs(right.ratio - TARGET_RATIO[right.category]),
    );
}

export function formatRank(value) {
  return new Intl.NumberFormat("zh-CN").format(Math.round(value));
}
