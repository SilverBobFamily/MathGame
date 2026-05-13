'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getCampaignData, getPlayerCampaignProgress, isChapterUnlocked, type CampaignArc } from '@/lib/campaign';

export default function CampaignPage() {
  const [arcs, setArcs] = useState<CampaignArc[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { window.location.href = '/login'; return; }
      try {
        const [arcData, progress] = await Promise.all([
          getCampaignData(),
          getPlayerCampaignProgress(user.id),
        ]);
        if (!mounted) return;
        setArcs(arcData);
        setCompletedIds(progress);
      } catch {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const allChapters = arcs.flatMap(a => a.chapters);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading campaign…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px', fontFamily: "'Spectral', serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ color: '#ffd54f', fontSize: '0.72em', letterSpacing: 2, marginBottom: 6 }}>STORY MODE</div>
        <h1 style={{ color: '#fff', fontSize: '2em', margin: 0 }}>Campaign</h1>
      </div>

      {arcs.map(arc => {
        const arcCompleted = arc.chapters.every(c => completedIds.has(c.id));
        const arcProgress = arc.chapters.filter(c => completedIds.has(c.id)).length;
        return (
          <div key={arc.id} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '1.4em' }}>{arc.theme_emoji}</span>
              <div>
                <div style={{ color: arcCompleted ? '#ffd54f' : '#fff', fontSize: '1.1em', fontWeight: 700 }}>
                  {arc.title}
                  {arcCompleted && <span style={{ marginLeft: 8 }}>{arc.badge_emoji}</span>}
                </div>
                <div style={{ color: '#555', fontSize: '0.7em' }}>
                  {arcProgress}/{arc.chapters.length} completed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arc.chapters.map(chapter => {
                const done = completedIds.has(chapter.id);
                const unlocked = isChapterUnlocked(chapter, completedIds, allChapters);
                const diffColor: Record<string, string> = {
                  easy: '#a5d6a7', normal: '#ffd54f', hard: '#ef9a9a', expert: '#ce93d8'
                };
                return (
                  <div
                    key={chapter.id}
                    style={{
                      background: done ? '#0d1f0d' : unlocked ? '#111' : '#0a0a0a',
                      border: `1px solid ${done ? '#2e5e2e' : unlocked ? '#1e1e1e' : '#111'}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      opacity: unlocked ? 1 : 0.45,
                    }}
                  >
                    <div>
                      <div style={{ color: done ? '#a5d6a7' : '#fff', fontSize: '0.92em', fontWeight: 700, marginBottom: 2 }}>
                        {done ? '✅ ' : unlocked ? '' : '🔒 '}{chapter.title}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: '#555', fontSize: '0.68em' }}>vs {chapter.ai_opponent_name}</span>
                        <span style={{ color: diffColor[chapter.ai_difficulty] ?? '#aaa', fontSize: '0.65em', fontWeight: 700, textTransform: 'uppercase' }}>
                          {chapter.ai_difficulty}
                        </span>
                        {chapter.win_condition === 'win_by_margin' && (
                          <span style={{ color: '#555', fontSize: '0.65em' }}>win by {chapter.win_param}+</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#ffd54f', fontSize: '0.72em' }}>+{chapter.xp_reward} XP</span>
                      {unlocked && (
                        <Link
                          href={`/campaign/${chapter.id}`}
                          style={{
                            background: done ? '#1a2e1a' : '#c9a84c',
                            color: done ? '#a5d6a7' : '#0d0d1a',
                            border: 'none', borderRadius: 8,
                            padding: '6px 14px', fontSize: '0.75em', fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                            fontFamily: "'Spectral', serif",
                          }}
                        >
                          {done ? 'Replay' : 'Play'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
