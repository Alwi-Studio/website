import { RichInline } from './RichText.jsx'

function CollapsibleItems({ items = [], className = '' }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      {items.map((item, index) => (
        <details
          className="group overflow-hidden rounded-lg border border-white/10 bg-bg-2 transition open:border-brand/35 open:bg-brand/[0.04]"
          key={`${item.title}-${index}`}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-white transition hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/70 [&::-webkit-details-marker]:hidden">
            <span><RichInline text={item.title} /></span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-brand-2">
              <svg
                className="transition-transform duration-200 group-open:rotate-180"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </summary>
          {item.text && (
            <div className="border-t border-white/10 px-4 py-4 text-sm leading-7 text-muted">
              <p className="whitespace-pre-line"><RichInline text={item.text} /></p>
            </div>
          )}
        </details>
      ))}
    </div>
  )
}

export default CollapsibleItems
