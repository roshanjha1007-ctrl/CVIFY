export default function ComparisonTable({ items = [] }) {
  if (!items.length) {
    return (
      <div
        className="rounded-xl border px-4 py-8 text-sm text-center"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
      >
        Analyze more than one resume version to compare ATS progress, keyword coverage, and structural gains.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-4 py-3" style={{ color: 'var(--text-dim)' }}>Version</th>
            <th className="text-left px-4 py-3" style={{ color: 'var(--text-dim)' }}>ATS Score</th>
            <th className="text-left px-4 py-3" style={{ color: 'var(--text-dim)' }}>Matched Skills</th>
            <th className="text-left px-4 py-3" style={{ color: 'var(--text-dim)' }}>Missing Skills</th>
            <th className="text-left px-4 py-3" style={{ color: 'var(--text-dim)' }}>Structure</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{item.dateLabel}</div>
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{item.atsScore}</td>
              <td className="px-4 py-3" style={{ color: 'var(--green)' }}>{item.matchedSkills}</td>
              <td className="px-4 py-3" style={{ color: item.missingSkills > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {item.missingSkills}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                {item.structureReadability}/100
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
