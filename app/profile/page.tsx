// app/profile/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getProfile, uploadAvatar, type PlayerProfile } from '@/lib/profile';
import { xpToLevel, levelToTitle, xpProgress } from '@/lib/xp';
import { drawDailyQuests, questDifficultyColor, type DailyQuest } from '@/lib/quests';

function Avatar({
  url, initials, size, uploading,
}: { url: string | null; initials: string; size: number; uploading: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#1a237e', border: '3px solid #5c6bc0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative', flexShrink: 0,
    }}>
      {url ? (
        <img src={url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#fff', fontFamily: "'Spectral', serif", fontSize: size * 0.28, fontWeight: 700 }}>
          {initials}
        </span>
      )}
      {uploading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.75em',
        }}>
          Uploading…
        </div>
      )}
    </div>
  );
}

type LearningStatsRow = {
  total_attempted: number; total_correct: number;
  item_attempted: number; item_correct: number;
  action_attempted: number; action_correct: number;
};

type Achievement = {
  id: number; key: string; name: string; description: string;
  icon_emoji: string; xp_reward: number; unlocked_at: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [achievements,  setAchievements]  = useState<Achievement[]>([]);
  const [stats,         setStats]         = useState<import('@/lib/playerStats').PlayerStats | null>(null);
  const [dailyQuests,   setDailyQuests]   = useState<DailyQuest[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStatsRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);
      // Non-fatal: quest load failure should not break the profile page
      drawDailyQuests(user.id).then(setDailyQuests).catch(() => {});
      try {
        const p = await getProfile(user.id);
        setProfile(p);
        const { data: achData, error: achError } = await supabase.rpc('get_player_achievements', { p_player_id: user.id });
        if (achError) console.error('Achievements failed to load:', achError);
        setAchievements((achData ?? []) as Achievement[]);
        const [{ data: streakRows, error: streakErr }, { data: finishedGames, error: gamesErr }, { data: playerDecks, error: decksErr }, { data: lsRow }] = await Promise.all([
          supabase.rpc('get_player_stats', { p_player_id: user.id }),
          supabase
            .from('games')
            .select('player1_id, winner_id, state_json')
            .eq('status', 'finished')
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .limit(500),
          supabase
            .from('decks')
            .select('id, name')
            .eq('player_id', user.id),
          supabase
            .from('player_learning_stats')
            .select('total_attempted,total_correct,item_attempted,item_correct,action_attempted,action_correct')
            .eq('player_id', user.id)
            .maybeSingle(),
        ]);
        if (streakErr || gamesErr || decksErr) throw new Error('Stats query failed');
        if (lsRow) setLearningStats(lsRow as LearningStatsRow);
        const longestWinStreak: number =
          (streakRows as Array<{ longest_win_streak: number }> | null)?.[0]?.longest_win_streak ?? 0;
        const { computeAllStats } = await import('@/lib/playerStats');
        const computed = computeAllStats(
          user.id,
          (finishedGames ?? []) as { player1_id: string; winner_id: string | null; state_json: import('@/lib/types').GameState }[],
          longestWinStreak,
          (playerDecks ?? []) as Array<{ id: string; name: string }>,
        );
        setStats(computed);
      } catch {
        setLoadError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setLoadError('Failed to load profile. Please try again.');
      setLoading(false);
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be under 2 MB.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadAvatar(userId, file);
      setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading…
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350' }}>
        {loadError}
      </div>
    );
  }
  if (!profile) return null;

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;
  const initials = profile.username.slice(0, 2).toUpperCase();
  const level = xpToLevel(profile.xp);
  const title = levelToTitle(level);
  const { current: xpCurrent, needed: xpNeeded } = xpProgress(profile.xp);

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      {/* Avatar upload */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ cursor: uploading ? 'wait' : 'pointer' }}
          title="Click to change avatar"
        >
          <Avatar url={profile.avatar_url} initials={initials} size={100} uploading={uploading} />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            marginTop: 10, background: 'none', color: '#5c6bc0',
            border: 'none', cursor: uploading ? 'wait' : 'pointer',
            fontSize: '0.85em', padding: 0,
          }}
        >
          {uploading ? 'Uploading…' : 'Change avatar'}
        </button>
        {uploadError && (
          <p style={{ color: '#ef5350', fontSize: '0.8em', margin: '6px 0 0' }}>{uploadError}</p>
        )}
      </div>

      {/* Username, level badge & coins */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontFamily: "'Spectral', serif", fontSize: '1.8em', margin: '0 0 8px' }}>
          {profile.username}
        </h1>

        {/* Level badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#1a237e', border: '1px solid #5c6bc0', borderRadius: 20,
          padding: '5px 14px', marginBottom: 10,
        }}>
          <span style={{ color: '#c9a84c', fontFamily: "'Spectral', serif", fontWeight: 700, fontSize: '0.9em' }}>
            Lv. {level}
          </span>
          <span style={{ color: '#aaa', fontSize: '0.78em' }}>·</span>
          <span style={{ color: '#9fa8da', fontSize: '0.82em' }}>{title}</span>
        </div>

        {/* XP progress bar (hidden at max level) */}
        {xpNeeded > 0 && (
          <div style={{ maxWidth: 240, margin: '0 auto 12px' }}>
            <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(100, (xpCurrent / xpNeeded) * 100)}%`,
                background: '#5c6bc0',
                transition: 'width 0.3s',
              }} />
            </div>
            <p style={{ color: '#444', fontSize: '0.7em', margin: '4px 0 0', textAlign: 'center' }}>
              {xpCurrent} / {xpNeeded} XP to Lv. {level + 1}
            </p>
          </div>
        )}

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#111', border: '1px solid #333', borderRadius: 20, padding: '7px 18px',
        }}>
          <span style={{ fontSize: '1.2em' }}>🪙</span>
          <span style={{ color: '#ffd54f', fontFamily: "'Spectral', serif", fontWeight: 700, fontSize: '1.1em' }}>
            {profile.coins.toLocaleString()} coins
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
        background: '#111', border: '1px solid #222', borderRadius: 12, padding: '20px 16px',
      }}>
        {[
          { label: 'Played', value: profile.games_played },
          { label: 'Wins', value: profile.games_won },
          { label: 'Win Rate', value: `${winRate}%` },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontFamily: "'Spectral', serif", fontSize: '1.6em', fontWeight: 700 }}>
              {stat.value}
            </div>
            <div style={{ color: '#666', fontSize: '0.78em', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Game Stats */}
      {stats && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{
            fontFamily: "'Spectral', serif", color: '#c9a84c',
            fontSize: '1em', marginBottom: 12, textAlign: 'center', letterSpacing: '0.08em',
          }}>
            GAME STATS
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            {[
              { label: 'Avg Win Margin', value: stats.avgWinningMargin !== null ? `+${stats.avgWinningMargin}` : '—' },
              { label: 'Avg Loss Margin', value: stats.avgLosingMargin !== null ? `-${stats.avgLosingMargin}` : '—' },
              { label: 'Longest Streak', value: stats.longestWinStreak > 0 ? `${stats.longestWinStreak}W` : '—' },
              { label: 'Top Card', value: stats.mostPlayedCard ? `${stats.mostPlayedCard.name} (×${stats.mostPlayedCard.count})` : '—' },
              { label: 'Top Release', value: stats.mostPlayedRelease ? stats.mostPlayedRelease.name : '—' },
              { label: 'Fav Deck', value: stats.favoriteDeck ? stats.favoriteDeck.name : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{ color: '#555', fontSize: '0.7em', fontFamily: "'Spectral', serif", letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ color: '#ddd', fontSize: '0.95em', fontFamily: "'Spectral', serif", fontWeight: 600, wordBreak: 'break-word' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Stats */}
      {learningStats && learningStats.total_attempted > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{
            fontFamily: "'Spectral', serif", color: '#c9a84c',
            fontSize: '1em', marginBottom: 12, textAlign: 'center', letterSpacing: '0.08em',
          }}>
            LEARNING STATS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                label: 'Overall Accuracy',
                value: `${Math.min(100, Math.round((learningStats.total_correct / learningStats.total_attempted) * 100))}%`,
              },
              {
                label: 'Total Attempts',
                value: String(learningStats.total_attempted),
              },
              ...(learningStats.item_attempted > 0 ? [{
                label: 'Addition / Sub.',
                value: `${Math.min(100, Math.round((learningStats.item_correct / learningStats.item_attempted) * 100))}%`,
              }] : []),
              ...(learningStats.action_attempted > 0 ? [{
                label: 'Multiplication / Div.',
                value: `${Math.min(100, Math.round((learningStats.action_correct / learningStats.action_attempted) * 100))}%`,
              }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{ color: '#555', fontSize: '0.7em', fontFamily: "'Spectral', serif", letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ color: '#ddd', fontSize: '0.95em', fontFamily: "'Spectral', serif", fontWeight: 600 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Quests */}
      {dailyQuests.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{
            fontFamily: "'Spectral', serif", color: '#ffd54f',
            fontSize: '1em', marginBottom: 14, textAlign: 'center', letterSpacing: '0.08em',
          }}>
            DAILY QUESTS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dailyQuests.map(q => {
              const col = questDifficultyColor(q.difficulty);
              return (
                <div key={q.id} style={{
                  background: q.completed ? 'rgba(165,214,167,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${q.completed ? '#a5d6a740' : col + '44'}`,
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: q.completed ? 0.65 : 1,
                }}>
                  <div style={{ fontSize: '1.6em', flexShrink: 0 }}>{q.icon_emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: q.completed ? '#a5d6a7' : '#ddd', fontSize: '0.9em', fontWeight: 600, marginBottom: 2 }}>
                      {q.completed ? '✅ ' : ''}{q.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.76em' }}>{q.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: col, fontSize: '0.68em', letterSpacing: 1, marginBottom: 2, textTransform: 'uppercase' }}>
                      {q.difficulty}
                    </div>
                    {!q.completed && (
                      <div style={{ color: '#ffd54f', fontSize: '0.8em', fontWeight: 700 }}>+{q.xp_reward} XP</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ color: '#333', fontSize: '0.72em', marginTop: 8, textAlign: 'right' }}>
            Resets at midnight UTC
          </div>
        </div>
      )}

      {/* Badges */}
      {achievements.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{
            fontFamily: "'Spectral', serif", color: '#c9a84c',
            fontSize: '1.1em', marginBottom: 16, textAlign: 'center',
          }}>
            Badges
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
          }}>
            {achievements.map(ach => {
              const earned = ach.unlocked_at !== null;
              return (
                <div
                  key={ach.id}
                  title={earned ? `${ach.name}: ${ach.description}` : '??? (locked)'}
                  style={{
                    background: '#111', border: `1px solid ${earned ? '#333' : '#1a1a1a'}`,
                    borderRadius: 10, padding: '10px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    opacity: earned ? 1 : 0.3,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.8em', lineHeight: 1 }}>
                    {earned ? ach.icon_emoji : '?'}
                  </span>
                  <span style={{
                    fontFamily: "'Spectral', serif", fontSize: '0.62em',
                    color: earned ? '#ccc' : '#555', textAlign: 'center', lineHeight: 1.2,
                  }}>
                    {earned ? ach.name : '???'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
