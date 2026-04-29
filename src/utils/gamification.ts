export const XP_PER_HOUR = 25;

// 🔥 XP formula (simple but scalable)
export const calculateXP = (activities: any[] = []) => {
    return activities.reduce((acc, a) => acc + (a.xp || 0), 0);
};

// 🎯 LEVEL SYSTEM (smooth progression)
export const getLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp) / 5);
};

// 🔥 XP required for current level
export const getLevelXP = (level: number) => {
    return Math.pow(level / 0.1, 2);
};

// 🎯 XP needed to next level
export const getNextLevelXP = (level: number) => {
    return Math.pow((level + 1) / 0.1, 2);
};

// 📊 progress % to next level
export const getLevelProgress = (xp: number) => {
    const level = getLevel(xp);
    const current = getLevelXP(level);
    const next = getNextLevelXP(level);

    return Math.min(100, ((xp - current) / (next - current)) * 100);
};