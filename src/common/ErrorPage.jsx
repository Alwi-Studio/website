function ErrorPage({
  code = '404',
  eyebrow = 'Page not found',
  title = 'This page does not exist.',
  description = 'The link may be incorrect, or the page may have been moved.',
  primaryHref = '/',
  primaryLabel = 'Go home',
  secondaryHref = '/news',
  secondaryLabel = 'View news',
}) {
  return (
    <main className="min-h-[78svh] bg-[#171717] px-5 pb-16 pt-32 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-white/10 bg-[#202020] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.24)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff7a59]">
            {eyebrow}
          </p>
          <p className="mt-5 text-7xl font-bold leading-none text-white sm:text-8xl">{code}</p>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-11 items-center rounded-md bg-[#ff5732] px-5 text-sm font-bold text-white no-underline transition hover:bg-[#ff704f]"
              href={primaryHref}
            >
              {primaryLabel}
            </a>
            <a
              className="inline-flex min-h-11 items-center rounded-md border border-white/15 px-5 text-sm font-semibold text-zinc-200 no-underline transition hover:border-[#ff5732] hover:text-white"
              href={secondaryHref}
            >
              {secondaryLabel}
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ErrorPage
