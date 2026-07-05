import logoLong from '../assets/LONG--FOR-BG-HITAM.webp'

const exploreLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/#work' },
]

const communityLinks = [
  { label: 'Discord', href: 'https://discord.alwination.id' },
  { label: 'Store', href: 'https://store.alwination.id' },
  { label: 'Support', href: '/#contact' },
  { label: 'Server IP', href: '/#home' },
  { label: 'Rules', href: '/rules' },
  { label: 'Terms', href: '/terms' },
]

const socials = [
  {
    label: 'Discord',
    href: 'https://discord.alwination.id',
    icon: (
      <svg width="18" height="18" viewBox="-1 -1 26 26" fill="currentColor" aria-hidden="true"><path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4c1.4.4 2 .9 2 1s-.7-.4-1.9-.8a13 13 0 0 0-6.6 0c-1.2.4-1.9.8-1.9.8s.6-.6 2-1L8.6 4c-1.4.3-2.7.7-3.9 1.3C2.2 9 1.5 12.6 1.8 16.1A15.8 15.8 0 0 0 6.7 18.6l.9-1.4c-.5-.2-1-.4-1.4-.7l.3-.2c2.7 1.3 5.5 1.3 8.2 0l.3.2c-.4.3-.9.5-1.4.7l.9 1.4c1.7-.5 3.3-1.3 4.9-2.5.4-4.1-.6-7.6-2.1-10.8ZM8.5 14.1c-.8 0-1.5-.8-1.5-1.8s.7-1.8 1.5-1.8 1.5.8 1.5 1.8-.7 1.8-1.5 1.8Zm7 0c-.8 0-1.5-.8-1.5-1.8s.7-1.8 1.5-1.8 1.5.8 1.5 1.8-.7 1.8-1.5 1.8Z" /></svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@alwisusilo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@alwinationmc',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v3.5a7 7 0 0 1-3.9-1.2v6.5c0 3.3-2.1 5.3-5.4 5.3-3 0-5.4-2.2-5.4-5.1 0-3.3 2.7-5.7 6-5.1v3.7c-1.3-.4-2.4.3-2.4 1.5 0 1 .8 1.7 1.8 1.7 1.1 0 1.8-.6 1.8-2.1V3h3.6Z" /></svg>
    ),
  },
]

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg-2 pb-8 pt-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <img className="mb-4 h-[30px] w-auto object-contain" src={logoLong} alt="AlwiNation" />
            <p className="max-w-[36ch] text-[14.5px] text-muted">
              A community server hub for updates, events, and announcements.
            </p>
            <div className="mt-5 flex gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-surface text-muted transition hover:-translate-y-0.5 hover:border-white/20 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-2">Explore</h4>
            {exploreLinks.map((link) => (
              <a key={link.href} href={link.href} className="block py-1.5 text-[14.5px] text-muted transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-2">Community</h4>
            {communityLinks.map((link) => (
              <a key={link.label} href={link.href} className="block py-1.5 text-[14.5px] text-muted transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[13.5px] text-muted-2">
          <span>© 2026 AlwiNation. All rights reserved.</span>
          <span>play.alwination.id</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
