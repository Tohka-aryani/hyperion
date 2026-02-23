const TICKER_ITEMS = [
  '53 PEOPLE DEAD OR MISSING AFTER MIGRANT BOAT CAPSIZES IN MEDITERRANEAN',
  'EBO TAYLOR, GHANAIAN HIGHLIFE PIONEER AND GUITARIST, DIES AGE 90',
  'WEATHER TRACKER: SPAIN AND PORTUGAL HIT BY THIRD DEADLY STORM IN TWO WEEKS',
]

export default function Footer() {
  const content = TICKER_ITEMS.flatMap((item, i) => [
    <span key={`item-${i}`} className="ticker-item">{item}</span>,
    <span key={`sep-${i}`} className="ticker-sep"> — </span>,
  ])
  const contentDup = TICKER_ITEMS.flatMap((item, i) => [
    <span key={`dup-item-${i}`} className="ticker-item">{item}</span>,
    <span key={`dup-sep-${i}`} className="ticker-sep"> — </span>,
  ])

  return (
    <footer className="footer">
      <div className="live-badge">
        <span className="live-dot" />
        <span>LIVE</span>
      </div>
      <div className="ticker-wrap">
        <div className="ticker">
          {content}
          {contentDup}
        </div>
      </div>
    </footer>
  )
}
