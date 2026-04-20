export default function SectionPanel({ title, eyebrow, children, className = '' }) {
  return (
    <section
      className={`glass-panel border rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${className}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {(title || eyebrow) && (
        <div className="mb-4">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: 'var(--text-dim)' }}>
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
