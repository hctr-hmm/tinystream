// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Text whose digits roll to their new value. Each
 * digit is keyed by its distance from the end, so "9" → "10" rolls the last
 * place and a new place appears in front.
 */
export function Ticker({ value, className = '' }: { value: string; className?: string }) {
  const chars = [...value]
  return (
    <span className={`inline-flex tabular ${className}`} aria-label={value} role="text">
      {chars.map((c, i) => {
        const key = chars.length - i
        return /\d/.test(c) ? (
          <Digit key={key} d={Number(c)} />
        ) : (
          <span key={`${key}${c}`} aria-hidden className="whitespace-pre">
            {c}
          </span>
        )
      })}
    </span>
  )
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function Digit({ d }: { d: number }) {
  return (
    <span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1lh' }}>
      <span className="invisible">0</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col items-center transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ transform: `translateY(${-d * 10}%)` }}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}
