import { reducedMotion } from './reveal.js'

// Particles over the hero, the Season band and news pictures; none under prefers-reduced-motion.
// Each kind's look and motion live in theme.css (.fx-<kind>); this only places the pieces,
// spread by index so the layout is identical on every render.
// count is the kind's 'normal' amount; each piece runs d + (i % 5) * step seconds.
const kinds = {
  embers: { count: 18, d: 7, step: 1.6 },
  snow: { count: 34, d: 9, step: 1.6 },
  rain: { count: 40, d: 0.8, step: 0.12 },
  leaves: { count: 16, d: 11, step: 1.8 },
  petals: { count: 22, d: 12, step: 1.8 },
  fireflies: { count: 24, d: 5, step: 1.2 },
  hearts: { count: 10, d: 6, step: 1.1 },
}
// 'lots' on the busiest kind (rain) is 80 pieces, the most any layer renders.
const amounts = { few: 0.5, normal: 1, lots: 2 }

// R3 low-discrepancy sequence: even cover at any count, without the rows a plain i * k shows.
const spread = (i, a) => (0.5 + i * a) % 1

// scale thins the layer for a smaller picture (the featured news card).
function Particles({ kind, amount = 'normal', color = '', scale = 1 }) {
  const look = kinds[kind]
  if (!look || reducedMotion()) return null
  const count = Math.round(look.count * (amounts[amount] ?? 1) * scale)
  // News posts come from their own API: only a plain hex colour may reach the CSS.
  const style = /^#[0-9a-f]{6}$/i.test(color) ? { '--c': color } : undefined
  return (
    <div className={`fx fx-${kind}`} style={style} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const d = look.d + (i % 5) * look.step
        return (
          <i
            key={i}
            style={{
              left: `${(spread(i, 0.8191725134) * 100).toFixed(2)}%`,
              '--y': `${(5 + spread(i, 0.5497004779) * 80).toFixed(2)}%`, // fireflies only
              '--d': `${d.toFixed(2)}s`,
              '--delay': `${-(d * spread(i, 0.6710436067)).toFixed(2)}s`,
              '--x': `${(i % 2 ? 1 : -1) * (20 + (i % 4) * 14)}px`,
            }}
          />
        )
      })}
    </div>
  )
}

export default Particles
