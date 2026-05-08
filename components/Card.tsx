import type { Card as CardType } from '@/lib/types';

const TYPE_STYLES: Record<string, {
  border: string; bg: string; nameBg: string; artGrad: string;
  typeBg: string; typeColor: string; textBg: string;
  flavorColor: string; footerBg: string; footerColor: string;
}> = {
  creature: {
    border: '#5c6bc0', bg: '#1a237e', nameBg: '#0d1642',
    artGrad: 'linear-gradient(160deg,#283593,#1a237e)',
    typeBg: '#0d1642', typeColor: '#90caf9',
    textBg: '#0a0e2e', flavorColor: '#7986cb',
    footerBg: '#0d1642', footerColor: '#5c6bc0',
  },
  item: {
    border: '#81c784', bg: '#1b5e20', nameBg: '#0a2e0e',
    artGrad: 'linear-gradient(160deg,#2e7d32,#1b5e20)',
    typeBg: '#0a2e0e', typeColor: '#a5d6a7',
    textBg: '#071a09', flavorColor: '#81c784',
    footerBg: '#0a2e0e', footerColor: '#4caf50',
  },
  action: {
    border: '#ce93d8', bg: '#4a148c', nameBg: '#1a0533',
    artGrad: 'linear-gradient(160deg,#6a1b9a,#4a148c)',
    typeBg: '#1a0533', typeColor: '#ce93d8',
    textBg: '#0f0120', flavorColor: '#ce93d8',
    footerBg: '#1a0533', footerColor: '#ab47bc',
  },
  event: {
    border: '#ef9a9a', bg: '#7f0000', nameBg: '#2e0000',
    artGrad: 'linear-gradient(160deg,#c62828,#7f0000)',
    typeBg: '#2e0000', typeColor: '#ef9a9a',
    textBg: '#1a0000', flavorColor: '#ef9a9a',
    footerBg: '#2e0000', footerColor: '#e53935',
  },
};

// All font sizes are explicit px — no em inheritance from the html base.
const fs = (scale: number) => ({
  name:   Math.round(14 * scale),
  value:  Math.round(13 * scale),
  type:   Math.round(11 * scale),
  icon:   Math.round(16 * scale),
  body:   Math.round(12 * scale),
  footer: Math.round(10 * scale),
  emoji:  Math.round(52 * scale),
});

interface Props {
  card: CardType;
  releaseNumber?: number;
  scale?: number;
}

export default function Card({ card, releaseNumber, scale = 1 }: Props) {
  const s = TYPE_STYLES[card.type] ?? TYPE_STYLES.creature;
  const f = fs(scale);
  const displayValue =
    card.type === 'creature' ? String(card.value ?? 0) :
    card.type === 'event' ? 'EVENT' :
    (card.operator ?? '').replace('÷', '/');
  const valueColor = card.type === 'creature' && (card.value ?? 0) < 0 ? '#ef5350' : '#90caf9';
  const w = Math.round(240 * scale);
  const artH = Math.round(w * 0.75);

  return (
    <div style={{ width: w, borderRadius: 14, overflow: 'hidden', border: `${Math.max(2, Math.round(4 * scale))}px solid ${s.border}`, background: s.bg, fontFamily: 'serif', flexShrink: 0 }}>
      {/* Name bar */}
      <div style={{ padding: `${Math.round(6 * scale)}px ${Math.round(10 * scale)}px`, background: s.nameBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: Math.round(6 * scale) }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: f.name, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontFamily: "'Cinzel', serif" }}>{card.name}</span>
        <span style={{ background: card.type === 'event' ? '#b71c1c' : 'rgba(0,0,0,0.4)', color: valueColor, fontWeight: 900, fontSize: f.value, padding: `2px ${Math.round(6 * scale)}px`, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {displayValue}
        </span>
      </div>
      {/* Art */}
      <div style={{ height: artH, background: s.artGrad, position: 'relative', overflow: 'hidden', borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: f.emoji }}>
        {card.art_url
          ? <img src={card.art_url} alt={card.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : card.art_emoji}
      </div>
      {/* Type line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`, background: s.typeBg, color: s.typeColor, fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Cinzel', serif" }}>
        <span style={{ fontSize: f.type, textTransform: 'capitalize' }}>{card.type}</span>
        <span style={{ fontSize: f.icon }}>{card.release?.icon ?? ''}</span>
      </div>
      {/* Text box */}
      <div style={{ padding: `${Math.round(8 * scale)}px ${Math.round(10 * scale)}px`, minHeight: Math.round(56 * scale), background: s.textBg, fontSize: f.body }}>
        {card.effect_text && <p style={{ color: '#ddd', margin: `0 0 ${Math.round(6 * scale)}px` }}>{card.effect_text}</p>}
        <p style={{ color: s.flavorColor, fontStyle: 'italic', margin: 0, fontFamily: "'Crimson Text', serif" }}>{card.flavor_text}</p>
      </div>
      {/* Footer */}
      <div style={{ padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`, background: s.footerBg, fontSize: f.footer, letterSpacing: 1, textAlign: 'right', color: s.footerColor }}>
        {releaseNumber ? `R${releaseNumber}` : ''}
      </div>
    </div>
  );
}
