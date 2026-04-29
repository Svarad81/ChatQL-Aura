import React from 'react'
import PropTypes from 'prop-types'
import appsync from '../images/appsync.png'

const ConversationBar = ({ conversation, name, switchView }) => {
  return (
    <div className="topbar convo-bar">
      <nav className="navbar navbar-expand-lg navbar-light bg-primary">
        <button
          className="navbar-toggler mr-2"
          type="button"
          onClick={switchView}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <i className="fas fa-chevron-circle-left" style={{ color: '#6366f1' }} />
        </button>
        <div className="convo-title">
          <span>{name ? 'ChatQL' : 'ChatQL'}</span>
          {name && <span className="convo-subtitle">{name}</span>}
        </div>
        <div className="d-flex flex-row align-items-center ml-auto">
          <div className="aws-badge">
            <i className="fab fa-aws" style={{ fontSize: '1.1em', color: '#475569' }} />
            <img
              src={appsync}
              alt="AWS AppSync"
              style={{ width: '1.1em', opacity: 0.8 }}
            />
            <span style={{ fontWeight: 500 }}>AppSync</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
ConversationBar.propTypes = {
  conversation: PropTypes.object,
  name: PropTypes.string,
  switchView: PropTypes.func.isRequired
}

export default ConversationBar
