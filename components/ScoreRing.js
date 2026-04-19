'use client'
import { useEffect, useState } from 'react'

export default function ScoreRing({ score }) {
  const [animated, setAnimated] = useState(false)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 70 ? '#00e676' :
    score >= 45 ? '#ffd600' :
    '#ff1744'

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="#222"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          transform="rotate(-90 60 60)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color}66)`
          }}
        />
        {/* Score text */}
        <text
          x="60" y="56"
          textAnchor="middle"
          fill={color}
          fontSize="24"
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
        >
          {score}
        </text>
        <text
          x="60" y="72"
          textAnchor="middle"
          fill="#555"
          fontSize="10"
          fontFamily="'JetBrains Mono', monospace"
        >
          / 100
        </text>
      </svg>
    </div>
  )
}
