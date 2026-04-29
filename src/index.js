import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

window.CHATQL_VERSION = 'AURA_V8_DECOUPLED';
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
