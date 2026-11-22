// 积分只由确定性公式计算，方便复现和防止“看心情”的暗箱。
export function expectedWinGain({ score = 0, rating = 200, streak = 0, rank = 0 } = {}) {
  const base = 14
  const quality = Math.round(rating * 0.16)
  const underdog = Math.round(Math.max(0, rating - score) * 0.12)
  const streakBonus = Math.min(12, Math.max(0, streak) * 2)
  const ladderBonus = rank ? Math.max(0, 10 - rank) * 4 : 0
  return Math.min(360, base + quality + underdog + streakBonus + ladderBonus)
}

export function expectedLossDelta({ score = 0, rating = 200, rank = 0 } = {}) {
  const ladderRisk = rank ? Math.max(0, 11 - rank) * 1.2 : 0
  return -Math.min(60, Math.round(5 + Math.max(0, score - rating) * 0.045 + rating * 0.008 + ladderRisk))
}

export function expectedSurrenderDelta({ score = 0, rating = 200, rank = 0 } = {}) {
  // 对高难度对手认输，惩罚更轻：承认差距，不鼓励送分。
  const factor = Math.max(0.18, 1 - rating / 1200)
  const base = 6 + Math.max(0, score - rating) * 0.035 + (rank ? (11 - rank) * 0.6 : 0)
  return -Math.max(2, Math.round(base * factor))
}

export function applyMatchResult(profile, { winner, reason, opponent, duration }) {
  const before = Math.max(0, Number(profile.score) || 0)
  let delta = 0
  const rank = Number(opponent?.topRank) || 0
  if (winner === 'player') {
    delta = expectedWinGain({ score: before, rating: opponent.rating, streak: profile.streak, rank })
  } else if (reason === 'surrender') {
    delta = expectedSurrenderDelta({ score: before, rating: opponent.rating, rank })
  } else {
    delta = expectedLossDelta({ score: before, rating: opponent.rating, rank })
  }
  const after = Math.max(0, before + delta)
  const win = winner === 'player'
  const streak = win ? (profile.streak || 0) + 1 : 0
  return {
    delta,
    scoreBefore: before,
    scoreAfter: after,
    profile: {
      ...profile,
      score: after,
      wins: (profile.wins || 0) + (win ? 1 : 0),
      losses: (profile.losses || 0) + (win ? 0 : 1),
      streak,
      bestStreak: Math.max(profile.bestStreak || 0, streak),
      matches: (profile.matches || 0) + 1,
      updatedAt: Date.now(),
    },
    summary: {
      winner,
      reason,
      duration,
      win,
      streak,
    },
  }
}

export function funMoment({ winner, reason, opponent, profileBefore, profileAfter, duration }) {
  if (winner !== 'player') return ''
  const note = []
  if (profileBefore.score + 260 <= opponent.rating) note.push('越级挑战')
  if ((profileAfter.streak || 0) >= 3) note.push(`${profileAfter.streak} 连胜`)
  if (duration <= 14) note.push('速胜')
  if (number(profileBefore.hpRatio) <= 0.22) note.push('丝血反杀')
  return note[0] || ''
}

function number(value) {
  return Number.isFinite(value) ? value : 9
}

export function formatDelta(delta) {
  if (delta > 0) return `+${delta}`
  return String(delta)
}
