import { useState, useEffect, useRef } from 'react'
import { fetchCombinedSocmedFeed } from '../api/socmedFeedData'

const TWITTER_ACCOUNTS = [
  { username: 'USAToday', label: 'USA Today' },
  { username: 'OsintMonitor', label: 'Osint Monitor' },
  { username: 'FoxNews', label: 'Fox News' },
]

const TWITTER_WIDGETS_URL = 'https://platform.twitter.com/widgets.js'

/** Profile image URL for a Twitter username (with fallback) */
const TWITTER_AVATAR_URL = (username) =>
  `https://unavatar.io/twitter/${encodeURIComponent(username)}`

/** Reputation/topic label per source (optional, like reference) */
const SOURCE_LABELS = {
  USAToday: { rep: 'HIGH REP', topic: 'NEWS' },
  OsintMonitor: { rep: 'OSINT', topic: 'INTEL' },
  FoxNews: { rep: 'HIGH REP', topic: 'NEWS' },
}

/** Parse tweet text into segments: plain text, @mentions (link), URLs (link) */
function parseTweetContent(text) {
  if (!text || typeof text !== 'string') return [{ type: 'text', value: '—' }]
  const segments = []
  const urlRe = /https?:\/\/[^\s]+/gi
  const mentionRe = /@(\w+)/g
  let lastIndex = 0
  const parts = []
  let m
  const re = /(@\w+)|(https?:\/\/[^\s]+)/gi
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    if (match[0].startsWith('@')) {
      parts.push({ type: 'mention', value: match[0].slice(1), raw: match[0] })
    } else {
      parts.push({ type: 'url', value: match[0] })
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return parts.length ? parts : [{ type: 'text', value: text }]
}

function TweetContent({ text }) {
  const segments = parseTweetContent(text)
  return (
    <div className="socmed-card-content">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }
        if (seg.type === 'mention') {
          return (
            <a
              key={i}
              href={`https://twitter.com/${seg.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="socmed-card-mention"
              onClick={(e) => e.stopPropagation()}
            >
              @{seg.value}
            </a>
          )
        }
        if (seg.type === 'url') {
          return (
            <a
              key={i}
              href={seg.value}
              target="_blank"
              rel="noopener noreferrer"
              className="socmed-card-url"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.value}
            </a>
          )
        }
        return null
      })}
    </div>
  )
}

function TweetCard({ item }) {
  const displayName = TWITTER_ACCOUNTS.find((a) => a.username === item.username)?.label || item.username
  const labels = SOURCE_LABELS[item.username] || { rep: 'TWEET', topic: '' }
  const initial = (displayName || item.username).charAt(0).toUpperCase()
  const content = (item.title || item.description || '').trim() || '—'
  const tweetUrl = item.link || '#'

  return (
    <article className="socmed-card">
      <div className="socmed-card-inner">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="socmed-card-header-link"
        >
          <div className="socmed-card-header">
            <div className="socmed-card-avatar" aria-hidden="true">
              <img
                src={TWITTER_AVATAR_URL(item.username)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                  const fallback = e.target.nextElementSibling
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <span className="socmed-card-avatar-fallback" style={{ display: 'none' }}>
                {initial}
              </span>
            </div>
            <div className="socmed-card-meta">
              <span className="socmed-card-name">{displayName}</span>
              <span className="socmed-card-handle">@{item.username}</span>
              <span className="socmed-card-time">{item.timeAgo}</span>
            </div>
          </div>
        </a>
        <div className="socmed-card-labels">
          <span className="socmed-card-badge socmed-badge-tweet">
            <span className="socmed-badge-x" aria-hidden="true">X</span>
            TWEET
          </span>
          {labels.rep && (
            <span className="socmed-card-badge socmed-badge-rep">{labels.rep}</span>
          )}
          {labels.topic && (
            <span className="socmed-card-badge socmed-badge-topic">{labels.topic}</span>
          )}
        </div>
        <div className="socmed-card-body">
          <TweetContent text={content} />
        </div>
        {item.image && (
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="socmed-card-media-link"
          >
            <div className="socmed-card-media">
              <img src={item.image} alt="" loading="lazy" />
            </div>
          </a>
        )}
      </div>
    </article>
  )
}

export default function SocmedWindow({ onClose }) {
  const [activeTab, setActiveTab] = useState('twitter')
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const embedRef = useRef(null)
  const showEmbedFallback = !loading && feedItems.length === 0

  useEffect(() => {
    setLoading(true)
    fetchCombinedSocmedFeed(TWITTER_ACCOUNTS)
      .then((items) => setFeedItems(items || []))
      .catch(() => setFeedItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showEmbedFallback) return
    if (document.querySelector(`script[src="${TWITTER_WIDGETS_URL}"]`)) {
      setScriptLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = TWITTER_WIDGETS_URL
    script.async = true
    script.charset = 'utf-8'
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)
  }, [showEmbedFallback])

  useEffect(() => {
    if (!showEmbedFallback || !scriptLoaded || !window.twttr?.widgets || !embedRef.current) return
    window.twttr.widgets.load(embedRef.current)
  }, [showEmbedFallback, scriptLoaded])

  return (
    <div className="socmed-window" role="dialog" aria-label="Social media feeds">
      <div className="socmed-window-titlebar">
        <div className="socmed-window-title">
          <span className="socmed-window-dot" />
          <span>SOCMED</span>
        </div>
        <div className="socmed-window-controls">
          <button type="button" className="socmed-window-btn" aria-label="Minimize" />
          <button type="button" className="socmed-window-btn" aria-label="Maximize" />
          <button
            type="button"
            className="socmed-window-btn socmed-window-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
      </div>

      <div className="socmed-tabs">
        <button
          type="button"
          className={`socmed-tab ${activeTab === 'twitter' ? 'active' : ''}`}
          onClick={() => setActiveTab('twitter')}
          aria-selected={activeTab === 'twitter'}
        >
          <span className="socmed-tab-icon socmed-tab-icon-x" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <span>Twitter</span>
        </button>
        <button
          type="button"
          className={`socmed-tab ${activeTab === 'telegram' ? 'active' : ''}`}
          onClick={() => setActiveTab('telegram')}
          aria-selected={activeTab === 'telegram'}
        >
          <span className="socmed-tab-icon socmed-tab-icon-telegram" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </span>
          <span>Telegram</span>
        </button>
      </div>

      <div className="socmed-content socmed-feed">
        {activeTab === 'twitter' && (
          <>
            {loading && (
              <div className="socmed-loading">Loading feed…</div>
            )}

            {!loading && feedItems.length > 0 && (
              <div className="socmed-feed-list">
                {feedItems.map((item) => (
                  <TweetCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {showEmbedFallback && (
              <div className="socmed-embed-stack" ref={embedRef}>
                {TWITTER_ACCOUNTS.map(({ username, label }) => (
                  <div key={username} className="socmed-embed-block">
                    <div className="socmed-embed-label">@{username} — {label}</div>
                    <a
                      className="twitter-timeline"
                      href={`https://twitter.com/${username}`}
                      data-chrome="nofooter noheader noborders"
                      data-tweet-limit="8"
                      data-dnt="true"
                    >
                      Tweets by {username}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'telegram' && (
          <div className="socmed-telegram">
            <div className="socmed-telegram-header">
              <p className="socmed-telegram-desc">Preview Telegram channels in the browser. Open a channel below to view recent posts.</p>
            </div>
            <div className="socmed-telegram-channels">
              <a href="https://t.me/s/durov" target="_blank" rel="noopener noreferrer" className="socmed-telegram-channel">
                <span className="socmed-telegram-channel-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </span>
                <span>Durov (Telegram)</span>
              </a>
              <a href="https://t.me/s/telegram" target="_blank" rel="noopener noreferrer" className="socmed-telegram-channel">
                <span className="socmed-telegram-channel-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </span>
                <span>Telegram</span>
              </a>
            </div>
            <iframe
              title="Telegram channel preview"
              src="https://t.me/s/durov?embed=1"
              className="socmed-telegram-iframe"
            />
          </div>
        )}
      </div>
    </div>
  )
}
