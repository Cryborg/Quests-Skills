const { get, run } = require('../../server/turso-db');

/**
 * Seed Bonus Operations
 */
async function seedBonusOperations() {
    console.log('🎓 Seeding bonus operations...');

    const operations = [
        {
            type: 'addition',
            reward: 1,
            max_per_day: 3,
            min_value: 100,
            max_value: 9999,
            is_active: 1,
        },
        {
            type: 'subtraction',
            reward: 2,
            max_per_day: 3,
            min_value: 100,
            max_value: 999,
            is_active: 1,
        },
        {
            type: 'multiplication',
            reward: 5,
            max_per_day: 3,
            min_value: 10,
            max_value: 99,
            is_active: 1,
        },
    ];

    let opCount = 0;
    for (const op of operations) {
        const existing = await get('SELECT * FROM bonus_operations WHERE type = ?', [op.type]);

        if (!existing) {
            const now = new Date().toISOString();
            await run(
                'INSERT INTO bonus_operations (type, reward, max_per_day, min_value, max_value, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [op.type, op.reward, op.max_per_day, op.min_value, op.max_value, op.is_active, now, now]
            );
            opCount++;
        }
    }
    console.log(`  ✅ ${opCount} new bonus operations seeded (${operations.length} total)`);
}

module.exports = { seedBonusOperations };
