import { reducedMotion } from './reveal.js'

// Ember and snow particles from the approved mockups; none under prefers-reduced-motion.
// kind: 'embers' rises from the bottom, 'snow' falls from the top. Spread by
// index so the layout is identical on every render.
function Particles({ kind, count = kind === 'snow' ? 34 : 18 }) {
  if (reducedMotion()) return null
  const snow = kind === 'snow'
  return (
    <div className={snow ? 'snow' : 'embers'} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const size = i % 3 === 0 ? (snow ? 6 : 4) : undefined
        return (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              width: size,
              height: size,
              '--d': `${(snow ? 9 : 7) + (i % 5) * 1.6}s`,
              '--delay': `${-(i * 0.9)}s`,
              '--x': `${(i % 2 ? 1 : -1) * (20 + (i % 4) * 14)}px`,
            }}
          />
        )
      })}
    </div>
  )
}

export default Particles
