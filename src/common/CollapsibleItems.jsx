import { RichInline } from './RichText.jsx'
import './pages.css'

function CollapsibleItems({ items = [], className = '', renderContent }) {
  return (
    <div className={`acc ${className}`}>
      {items.map((item, index) => (
        <details className="acc-item panel" key={`${item.title}-${index}`}>
          <summary>
            <span className="acc-title"><RichInline text={item.title} /></span>
            <span className="acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </summary>
          {item.text && (
            <div className="acc-body">
              {renderContent
                ? renderContent(item.text, item, index)
                : <p className="whitespace-pre-line"><RichInline text={item.text} /></p>}
            </div>
          )}
        </details>
      ))}
    </div>
  )
}

export default CollapsibleItems
