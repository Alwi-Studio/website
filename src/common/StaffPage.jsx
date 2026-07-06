import { useState } from 'react'
import { RichInline } from './RichText.jsx'

function initials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

// Renders a Minecraft player head for the given username. mc-heads.net accepts
// usernames directly (and UUIDs). Falls back to initials if the head fails.
function MemberAvatar({ name }) {
  const [failed, setFailed] = useState(false)
  const username = String(name || '').trim()

  if (failed || !username) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-gradient-to-b from-brand-2 to-brand text-base font-bold text-[#1a0d07]">
        {initials(name)}
      </span>
    )
  }

  return (
    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-white/10 bg-surface-2">
      <img
        src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/96`}
        alt={`${username}'s Minecraft head`}
        width="48"
        height="48"
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover [image-rendering:pixelated]"
      />
    </span>
  )
}

function StaffPage({ eyebrow, title, intro, updated, groups = [] }) {
  const totalMembers = groups.reduce((sum, group) => sum + (group.members?.length ?? 0), 0)

  return (
    <main className="min-h-svh bg-bg pb-24 pt-32 text-white">
      {/* Header */}
      <section className="mx-auto max-w-[1080px] px-6">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,90,48,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{eyebrow}</span>
              <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
                {totalMembers} member{totalMembers === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="mt-4 text-[clamp(34px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.03em] text-white">
              {title}
            </h1>
            {intro && (
              <p className="mt-5 max-w-[70ch] text-[16.5px] leading-8 text-muted">
                <RichInline text={intro} />
              </p>
            )}
            {updated && (
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-2 px-3.5 py-2 text-sm font-semibold text-muted">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
                  Last updated {updated}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="mx-auto mt-8 grid max-w-[1080px] gap-8 px-6">
        {groups.length === 0 ? (
          <div className="rounded-[18px] border border-white/10 bg-surface p-8 text-center text-muted">
            The staff list is being updated. Check back soon.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-white">{group.name}</h2>
                <span className="rounded-full border border-white/10 bg-bg-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {group.members?.length ?? 0}
                </span>
                <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(group.members ?? []).map((member) => (
                  <article
                    key={`${group.name}-${member.name}`}
                    className="flex items-start gap-4 rounded-[18px] border border-white/10 bg-surface p-5 transition hover:-translate-y-0.5 hover:border-white/20"
                  >
                    <MemberAvatar name={member.name} />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold leading-tight text-white">{member.name}</h3>
                      {member.role && (
                        <p className="mt-0.5 text-sm font-semibold text-brand-2">{member.role}</p>
                      )}
                      {member.note && (
                        <p className="mt-2 text-sm leading-6 text-muted">
                          <RichInline text={member.note} />
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}

        {/* CTA */}
        <div className="rounded-[18px] border border-brand/25 bg-brand/[0.06] p-6 sm:p-7">
          <h2 className="text-lg font-bold text-white">Want to join the team?</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted">
            We open staff applications from time to time. Join our Discord to hear when applications go live.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-[46px] items-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-[22px] text-[15px] font-bold text-[#1a0d07] no-underline transition hover:brightness-105"
              href="https://discord.alwination.id"
              target="_blank"
              rel="noreferrer"
            >
              Join our Discord
            </a>
            <a
              className="inline-flex min-h-[46px] items-center rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white no-underline transition hover:border-white/25 hover:bg-white/[0.08]"
              href="/#home"
            >
              Back home
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default StaffPage
