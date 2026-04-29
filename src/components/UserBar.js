import React from "react";
import PropTypes from "prop-types";

const UserBar = ({ name, registered, signout, switchView }) => (
  <div className="topbar">
    <nav className="navbar navbar-bbb bg-primary">
      <div className="navbar-brand" style={{ gap: '10px' }}>
        <span
          className="mr-2"
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: registered
              ? 'linear-gradient(135deg, #6366f1, #818cf8)'
              : 'rgba(148, 163, 184, 0.2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: registered ? '#fff' : '#94a3b8', fontSize: '0.85rem'
          }}
        >
          <i className={(registered ? "fas" : "far") + " fa-user-circle"} />
        </span>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e1b4b' }}>{name}</span>
          {registered && (
            <span style={{
              display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400
            }}>
              Online
            </span>
          )}
        </div>
      </div>
      <div className="d-flex flex-grow-1">
        <button
          className="btn btn-sm btn-squidink ml-auto"
          onClick={signout}
          style={{ fontSize: '0.8rem', minHeight: '36px', padding: '4px 14px' }}
        >
          Sign Out
        </button>
        <button
          className="navbar-toggler btn-sm mr-2 ml-auto"
          onClick={switchView}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <i className="fas fa-chevron-circle-right" style={{ color: '#6366f1' }} />
        </button>
      </div>
    </nav>
  </div>
);
UserBar.propTypes = {
  name: PropTypes.string,
  registered: PropTypes.bool,
  switchView: PropTypes.func.isRequired,
  signout: PropTypes.func.isRequired
};

export default UserBar;
