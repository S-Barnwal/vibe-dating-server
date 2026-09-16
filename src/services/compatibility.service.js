// ============================================================
// VIBE - COMPATIBILITY SERVICE
// ============================================================
// This service calculates a compatibility score between
// the logged-in user's profile and another profile.
//
// Score: 0 - 100
//
// Factors:
// - Shared interests
// - Dating intention
// - Mutual gender preference
// - Distance
// - Recent activity
// ============================================================


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const normalizeText = (value) => {
  if (!value) {
    return "";
  }

  return String(value).trim().toLowerCase();
};


const normalizeInterests = (interests = []) => {
  if (!Array.isArray(interests)) {
    return [];
  }

  return interests
    .map((interest) => normalizeText(interest))
    .filter(Boolean);
};


// ------------------------------------------------------------
// SHARED INTERESTS SCORE
// ------------------------------------------------------------
// Maximum: 40 points
//
// Uses Jaccard-style similarity:
//
// shared interests / total unique interests
//
// Example:
// Mine:   travel, music, food
// Them:   travel, music, fitness
//
// Shared = 2
// Unique = 4
//
// Score = 2 / 4 * 40 = 20
// ------------------------------------------------------------

const calculateInterestScore = (
  myInterests = [],
  theirInterests = []
) => {
  const mine = normalizeInterests(myInterests);
  const theirs = normalizeInterests(theirInterests);

  if (mine.length === 0 || theirs.length === 0) {
    return {
      score: 0,
      sharedInterests: [],
    };
  }

  const mySet = new Set(mine);
  const theirSet = new Set(theirs);

  const sharedInterests = theirs.filter((interest) =>
    mySet.has(interest)
  );

  const uniqueInterests = new Set([
    ...mine,
    ...theirs,
  ]);

  const similarity =
    sharedInterests.length / Math.max(uniqueInterests.size, 1);

  const score = Math.round(similarity * 40);

  return {
    score,
    sharedInterests,
  };
};


// ------------------------------------------------------------
// DATING INTENTION SCORE
// ------------------------------------------------------------
// Maximum: 20 points
// ------------------------------------------------------------

const calculateIntentionScore = (
  myIntention,
  theirIntention
) => {
  const mine = normalizeText(myIntention);
  const theirs = normalizeText(theirIntention);

  if (!mine || !theirs) {
    return 0;
  }

  return mine === theirs ? 20 : 0;
};


// ------------------------------------------------------------
// MUTUAL PREFERENCE SCORE
// ------------------------------------------------------------
// Maximum: 15 points
//
// We check both directions:
//
// 1. My preference matches their gender
// 2. Their preference matches my gender
//
// This makes compatibility more meaningful than simply
// checking the current user's preference.
// ------------------------------------------------------------

const calculatePreferenceScore = ({
  myGender,
  myInterestedIn,
  theirGender,
  theirInterestedIn,
}) => {
  const mineGender = normalizeText(myGender);
  const mineInterestedIn = normalizeText(myInterestedIn);

  const theirsGender = normalizeText(theirGender);
  const theirsInterestedIn = normalizeText(theirInterestedIn);

  let score = 0;

  if (
    mineInterestedIn &&
    theirsGender &&
    mineInterestedIn === theirsGender
  ) {
    score += 8;
  }

  if (
    theirsInterestedIn &&
    mineGender &&
    theirsInterestedIn === mineGender
  ) {
    score += 7;
  }

  return score;
};


// ------------------------------------------------------------
// DISTANCE SCORE
// ------------------------------------------------------------
// Maximum: 15 points
//
// Closer = better compatibility.
//
// <= 5 km   = 15
// <= 10 km  = 12
// <= 20 km  = 8
// <= 50 km  = 4
// > 50 km   = 0
// ------------------------------------------------------------

const calculateDistanceScore = (distanceKm) => {
  const distance = Number(distanceKm);

  if (!Number.isFinite(distance)) {
    return 0;
  }

  if (distance <= 5) {
    return 15;
  }

  if (distance <= 10) {
    return 12;
  }

  if (distance <= 20) {
    return 8;
  }

  if (distance <= 50) {
    return 4;
  }

  return 0;
};


// ------------------------------------------------------------
// ACTIVITY SCORE
// ------------------------------------------------------------
// Maximum: 10 points
//
// Recently active people receive a higher score.
//
// <= 1 hour    = 10
// <= 24 hours  = 8
// <= 3 days    = 5
// <= 7 days    = 2
// older        = 0
// ------------------------------------------------------------

const calculateActivityScore = (lastActiveAt) => {
  if (!lastActiveAt) {
    return 0;
  }

  const activeDate = new Date(lastActiveAt);

  if (Number.isNaN(activeDate.getTime())) {
    return 0;
  }

  const now = Date.now();
  const difference = now - activeDate.getTime();

  if (difference < 0) {
    return 10;
  }

  const hours = difference / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours <= 1) {
    return 10;
  }

  if (hours <= 24) {
    return 8;
  }

  if (days <= 3) {
    return 5;
  }

  if (days <= 7) {
    return 2;
  }

  return 0;
};


// ------------------------------------------------------------
// COMPATIBILITY REASONS
// ------------------------------------------------------------
// These reasons will later be shown on the
// "Most Compatible" cards.
//
// Example:
// "You both like Travel"
// "Looking for the same thing"
// "You are nearby"
// "Recently active"
// ------------------------------------------------------------

const buildCompatibilityReasons = ({
  sharedInterests,
  intentionScore,
  preferenceScore,
  distanceScore,
  activityScore,
}) => {
  const reasons = [];

  if (sharedInterests.length > 0) {
    const displayInterests = sharedInterests
      .slice(0, 3)
      .map(
        (interest) =>
          interest.charAt(0).toUpperCase() +
          interest.slice(1)
      );

    reasons.push(
      `You both like ${displayInterests.join(", ")}`
    );
  }

  if (intentionScore === 20) {
    reasons.push("You're looking for the same thing");
  }

  if (preferenceScore >= 15) {
    reasons.push("Your preferences align");
  }

  if (distanceScore >= 12) {
    reasons.push("They're nearby");
  } else if (distanceScore >= 4) {
    reasons.push("They're within your area");
  }

  if (activityScore >= 8) {
    reasons.push("Recently active");
  }

  return reasons.slice(0, 3);
};


// ------------------------------------------------------------
// MAIN COMPATIBILITY CALCULATOR
// ------------------------------------------------------------

export const calculateCompatibility = ({
  myProfile,
  targetProfile,
  distanceKm,
}) => {
  if (!myProfile || !targetProfile) {
    return {
      score: 0,
      sharedInterests: [],
      reasons: [],
    };
  }

  // 1. Interests
  const interestResult = calculateInterestScore(
    myProfile.interests,
    targetProfile.interests
  );

  // 2. Dating intention
  const intentionScore = calculateIntentionScore(
    myProfile.datingIntention,
    targetProfile.datingIntention
  );

  // 3. Mutual preferences
  const preferenceScore = calculatePreferenceScore({
    myGender: myProfile.gender,
    myInterestedIn: myProfile.interestedIn,
    theirGender: targetProfile.gender,
    theirInterestedIn: targetProfile.interestedIn,
  });

  // 4. Distance
  const distanceScore =
    calculateDistanceScore(distanceKm);

  // 5. Activity
  const activityScore =
    calculateActivityScore(
      targetProfile.lastActiveAt
    );

  // ----------------------------------------------------------
  // TOTAL
  // ----------------------------------------------------------

  const totalScore =
    interestResult.score +
    intentionScore +
    preferenceScore +
    distanceScore +
    activityScore;

  const score = Math.min(
    100,
    Math.max(0, totalScore)
  );

  // ----------------------------------------------------------
  // REASONS
  // ----------------------------------------------------------

  const reasons = buildCompatibilityReasons({
    sharedInterests: interestResult.sharedInterests,
    intentionScore,
    preferenceScore,
    distanceScore,
    activityScore,
  });

  return {
    score,
    sharedInterests:
      interestResult.sharedInterests,
    reasons,

    breakdown: {
      interests: interestResult.score,
      intention: intentionScore,
      preferences: preferenceScore,
      distance: distanceScore,
      activity: activityScore,
    },
  };
};


// ------------------------------------------------------------
// SORT PROFILES BY COMPATIBILITY
// ------------------------------------------------------------

export const sortByCompatibility = (
  profiles = []
) => {
  return [...profiles].sort(
    (a, b) => b.score - a.score
  );
};