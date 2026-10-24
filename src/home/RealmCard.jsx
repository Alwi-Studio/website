// One "Pick your Gameplay" card. The admin preview renders this same component.
function RealmCard({ realm, clone = false }) {
  const internal = realm.href.startsWith('/')
  return (
    <a
      className="realm"
      href={realm.href}
      style={{ '--realm': realm.color }}
      target={internal ? undefined : '_blank'}
      rel={internal ? undefined : 'noreferrer'}
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      inert={clone || undefined}
    >
      <img src={realm.image} width="900" height="1200" alt="" loading="lazy" draggable="false" />
      {realm.badge && <span className="realm-badge label">{realm.badge}</span>}
      {realm.label && <p className="label">{realm.label}</p>}
      <h3 className="realm-name">{realm.name}</h3>
      {realm.description && <p className="realm-desc">{realm.description}</p>}
      {realm.linkLabel && <span className="realm-go">{realm.linkLabel} <span aria-hidden="true">→</span></span>}
    </a>
  )
}

export default RealmCard
