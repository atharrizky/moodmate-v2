import { supabase } from './supabase';

export async function processJournalReward(userId: string) {
  // 1. Ambil data profil dari Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return;

  const today = new Date().toISOString().split('T')[0];

  // 2. Logika Anti-Spam: Cek apakah hari ini sudah dapat reward
  if (profile.last_journal_date === today) {
    console.log("Reward harian sudah diklaim.");
    return;
  }

  // 3. Kalkulasi Reward (Tetap 10 Koin & 25 XP per hari)
  const newCoins = (profile.coins || 0) + 10;
  let newXP = (profile.xp || 0) + 25;
  let newLevel = profile.level || 1;

  // 4. Logika Level Up Progresif (XP Target = Level * 100)
  const xpTarget = newLevel * 100;
  if (newXP >= xpTarget) {
    newXP = newXP - xpTarget; // Sisa XP dibawa ke level berikutnya
    newLevel += 1;
  }

  // 5. Update data profil ke database
  await supabase
    .from('profiles')
    .update({
      coins: newCoins,
      xp: newXP,
      level: newLevel,
      current_streak: (profile.current_streak || 0) + 1,
      last_journal_date: today
    })
    .eq('id', userId);
}