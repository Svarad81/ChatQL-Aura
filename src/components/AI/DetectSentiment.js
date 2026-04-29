import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'
import comprehend from '../../images/comprehend.png'
import detectSentiment from '../../graphql/AI/detectSentiment'

const score = val => Number.parseFloat(val * 100).toFixed(1) + '%'

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Negative: '#ef4444',
  Neutral: '#94a3b8',
  Mixed: '#f59e0b'
}

const SENTIMENT_EMOJIS = {
  POSITIVE: '😊',
  NEGATIVE: '😔',
  NEUTRAL: '😐',
  MIXED: '🤔'
}

// SVG Donut Chart with glowing orb needle
const SentimentDonut = ({ scores, sentiment }) => {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const categories = ['Positive', 'Negative', 'Neutral', 'Mixed']
  
  let cumulativeOffset = 0
  const segments = categories.map(cat => {
    const value = scores[cat] || 0
    const dashLength = value * circumference
    const dashOffset = circumference - dashLength
    const rotation = (cumulativeOffset * 360) - 90
    cumulativeOffset += value
    return { cat, value, dashLength, dashOffset, rotation, color: SENTIMENT_COLORS[cat] }
  })

  // Calculate orb position — place it at the dominant sentiment arc midpoint
  const dominantIdx = categories.indexOf(sentiment.charAt(0) + sentiment.slice(1).toLowerCase())
  let orbAngleFraction = 0
  for (let i = 0; i < dominantIdx; i++) {
    orbAngleFraction += (scores[categories[i]] || 0)
  }
  orbAngleFraction += (scores[categories[dominantIdx]] || 0) / 2
  const orbAngle = (orbAngleFraction * 360 - 90) * (Math.PI / 180)
  const orbX = 60 + 45 * Math.cos(orbAngle)
  const orbY = 60 + 45 * Math.sin(orbAngle)

  return (
    <div className="sentiment-gauge">
      <div className="gauge-container">
        <div className="donut-chart">
          <svg viewBox="0 0 120 120">
            <defs>
              <filter id="orbGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background track */}
            <circle cx="60" cy="60" r={radius} stroke="rgba(200,205,220,0.15)" strokeWidth="8" />
            {/* Sentiment arcs */}
            {segments.map(seg => (
              <circle
                key={seg.cat}
                cx="60"
                cy="60"
                r={radius}
                stroke={seg.color}
                strokeWidth="8"
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={0}
                style={{
                  transform: `rotate(${seg.rotation}deg)`,
                  transformOrigin: '60px 60px',
                  transition: 'stroke-dashoffset 0.6s ease-in-out, transform 0.6s ease-in-out'
                }}
              />
            ))}
            {/* Glowing Orb */}
            <circle
              cx={orbX}
              cy={orbY}
              r="6"
              fill={SENTIMENT_COLORS[sentiment.charAt(0) + sentiment.slice(1).toLowerCase()] || '#6366f1'}
              filter="url(#orbGlow)"
              style={{ transition: 'cx 0.6s ease-in-out, cy 0.6s ease-in-out' }}
            />
          </svg>
          <div className="gauge-center-label">
            <span className="gauge-emoji">{SENTIMENT_EMOJIS[sentiment] || '😐'}</span>
            <span className="gauge-sentiment">{sentiment}</span>
          </div>
        </div>
        <div className="gauge-scores">
          {categories.map(cat => (
            <div key={cat} className="score-item">
              <span className="score-dot" style={{ background: SENTIMENT_COLORS[cat] }} />
              <span>{cat}</span>
              <span className="score-value">{score(scores[cat])}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <img src={comprehend} alt="Amazon Comprehend" style={{ width: '18px', height: '18px' }} />
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Amazon Comprehend</span>
        </div>
      </div>
    </div>
  )
}

function DetectSentiment({ data: { loading, error, detectSentiment } }) {
  if (loading) {
    return (
      <div className="sentiment-gauge">
        <div className="gauge-container" style={{ padding: '20px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.15)',
            borderTopColor: '#6366f1',
            animation: 'spinRefresh 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Analyzing sentiment...</span>
        </div>
      </div>
    )
  } else if (error) {
    const err = JSON.stringify(error.message)
    return (
      <div style={{
        padding: '12px', borderRadius: '12px',
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
        fontSize: '0.8rem', color: '#ef4444', textAlign: 'center'
      }}>
        {err}
      </div>
    )
  }

  const response = JSON.parse(detectSentiment.response)
  const { Sentiment, SentimentScore: scores } = response

  return <SentimentDonut scores={scores} sentiment={Sentiment} />
}

DetectSentiment.propTypes = {
  data: PropTypes.object.isRequired
}
export default graphql(detectSentiment, {
  skip: props => !props.text,
  options: props => ({
    variables: {
      language: props.language,
      text: props.text
    }
  })
})(DetectSentiment)
