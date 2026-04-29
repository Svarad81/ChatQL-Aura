import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Auth } from 'aws-amplify'
import { graphql } from 'react-apollo'
import { getUser } from '../graphql/queries'
import {
  registerUser,
  createConvo,
  createConvoLink,
  updateConvoLink
} from '../graphql/mutations'
import UserBar from './UserBar'
import SideBar from './SideBar'
import Messenger from './Messenger'

// compose was removed in react-apollo 3.x — simple replacement
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x)

function chatName(userName) {
  return `${userName} (chat)`
}

const convoList = {}

// ═══════════════════════════════════════════════════════
// System Health Card — SVG Sparkline Micro-Charts
// ═══════════════════════════════════════════════════════

const generateSparklineData = (seed, points = 12) => {
  const data = []
  let val = 50 + (seed * 17) % 30
  for (let i = 0; i < points; i++) {
    val += (Math.sin(i * 0.8 + seed) * 15) + (Math.cos(i * 1.2) * 5)
    val = Math.max(10, Math.min(90, val))
    data.push(val)
  }
  return data
}

const Sparkline = ({ data, color, label, value }) => {
  const width = 80
  const height = 28
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="health-metric">
      <div className="metric-sparkline">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill={`url(#grad-${label.replace(/\s/g, '')})`}
          />
        </svg>
      </div>
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  )
}

const SystemHealthCard = () => (
  <div className="system-health-card">
    <div className="health-title">
      <span className="health-dot" />
      System Health
    </div>
    <div className="health-metrics">
      <Sparkline
        data={generateSparklineData(1)}
        color="#6366f1"
        label="Cloud Latency"
        value="42ms"
      />
      <Sparkline
        data={generateSparklineData(7)}
        color="#10b981"
        label="AI Accuracy"
        value="97.2%"
      />
      <Sparkline
        data={generateSparklineData(13)}
        color="#06b6d4"
        label="Engagement"
        value="84%"
      />
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════
// Data Pulse Visual (triggered on message submit)
// ═══════════════════════════════════════════════════════

class DataPulse extends Component {
  state = { pulses: [] }

  fire = () => {
    const id = Date.now()
    this.setState(prev => ({ pulses: [...prev.pulses, id] }))
    setTimeout(() => {
      this.setState(prev => ({
        pulses: prev.pulses.filter(p => p !== id)
      }))
    }, 1500)
  }

  render() {
    return (
      <div className="data-pulse-trail">
        {this.state.pulses.map(id => (
          <div key={id} className="data-pulse-line" />
        ))}
      </div>
    )
  }
}

// ═══════════════════════════════════════════════════════
// Main ChatApp Component
// ═══════════════════════════════════════════════════════

class ChatApp extends Component {
  state = {
    conversation: undefined,
    registered: false,
    viewCN: false
  }

  dataPulseRef = React.createRef()

  async componentDidMount() {
    this.init()
  }

  init = async () => {
    const { registerUser, name, id } = this.props
    if (id === 'demo-id') return // Skip initialization in demo mode
    try {
      const user = await registerUser()
      console.log('user registered', user)
      this.setState({ registered: true })
    } catch (e) {
      console.log('user already registered', e)
    }
  }

  signout = () => {
    Auth.signOut().then(() => window.location.reload())
  }

  initConvo = selection => {
    console.log('initConvo', selection)
    if (selection.conversation) {
      this.gotoConversation({ convoLink: selection })
    } else {
      const convo = this.findConverationWithUser(selection)
      if (convo) {
        this.gotoConversation({ convoLink: convo })
      } else {
        this.createNewConversation(selection)
      }
    }
  }

  createNewConversation = async user => {
    console.log('create new convo with', user)
    const { name, id } = this.props
    const createConvo = await this.launchNewConversation(user)
    const createConvoLink = await this.props.createConvoLink({
      variables: {
        input: {
          convoLinkUserId: id,
          convoLinkConversationId: createConvo.id,
          name: user.username,
          status: 'READY'
        }
      }
    })
    console.log('createConvoLink', createConvoLink)
    const userConvoLink = await this.props.createConvoLink({
      variables: {
        input: {
          convoLinkUserId: user.id,
          convoLinkConversationId: createConvo.id,
          name: name,
          status: 'READY'
        }
      }
    })
    console.log('userConvoLink', userConvoLink)
    this.gotoConversation({
      convoLink: createConvoLink.data.createConvoLink
    })
  }

  gotoConversation = ({ convoLink }) => {
    console.log('goto', convoLink.conversation)
    this.setState({
      conversation: convoLink.conversation,
      conversationName: convoLink.name,
      viewCN: false
    })
  }

  startConvoAtMessage = ({ message }) => {
    const {
      data: {
        getUser: { userConversations: { items: convoLinks = [] } = {} } = {}
      } = {}
    } = this.props
    const convoLink = convoLinks.find(
      c => c.conversation.id === message.messageConversationId
    )
    if (convoLink) {
      this.setState({
        conversation: convoLink.conversation,
        conversationName: convoLink.name,
        viewCN: false
      })
    }
  }

  findConverationWithUser = user => {
    const {
      data: {
        getUser: { userConversations: { items: convoLinks = [] } = {} } = {}
      } = {}
    } = this.props
    const convoLink = convoLinks.find(c => {
      const {
        conversation: { associated: { items: assoc = [] } = {} } = {}
      } = c
      return assoc.some(a => a.convoLinkUserId === user.id)
    })
    return convoLink
      ? {
          conversation: convoLink.conversation,
          conversationName: convoLink.name
        }
      : null
  }

  launchNewConversation = user => {
    let resolveFn
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve
    })

    this.props.createConvo({
      update: async (proxy, { data: { createConvo } }) => {
        console.log('update, ', createConvo)
        if (createConvo.id === '-1' || convoList[`${createConvo.id}`]) {
          return
        }
        resolveFn(createConvo)
      }
    })
    return promise
  }

  updateToReadyConversation = convoLink => {
    console.log('updateToReadyConversation - update', convoLink)

    let resolveFn
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve
    })

    this.props.updateConvoLink({
      variables: { id: convoLink.id },
      optimisticResponse: {
        updateConvoLink: {
          __typename: 'ConvoLink',
          id: convoLink.id,
          name: convoLink.name,
          convoLinkUserId: '-1',
          status: 'CONFIRMING',
          conversation: {
            __typename: 'Conversation',
            id: convoLink.conversation.id,
            name: '',
            createdAt: '',
            associated: {
              __typename: 'ModelConvoLinkConnection',
              items: []
            }
          }
        }
      },
      update: async (proxy, { data: { updateConvoLink } }) => {
        console.log('confirmLink , ', updateConvoLink)
        if (updateConvoLink.status === 'READY') {
          resolveFn(updateConvoLink)
        }
      }
    })
    return promise
  }

  switchView = () => {
    this.setState({ viewCN: !this.state.viewCN })
  }

  onMessageSent = () => {
    if (this.dataPulseRef.current) {
      this.dataPulseRef.current.fire()
    }
  }

  render() {
    let { data: { subscribeToMore, getUser: user = {} } = {} } = this.props
    user = user || { name: '', registered: false }

    let cn = this.state.viewCN ? 'switchview' : ''
    cn += ' chatql-app'

    return (
      <div className={cn}>
        {/* AWS Cloud Target — fixed data pulse destination */}
        <div className="aws-cloud-target">
          <i className="fab fa-aws" />
        </div>

        {/* Data Pulse Visual Layer */}
        <DataPulse ref={this.dataPulseRef} />

        <div className="col-4 drawer">
          <div className="border-right border-secondary h-100">
            <UserBar
              switchView={this.switchView}
              name={user.username}
              registered={user.registered}
              signout={this.signout}
            />
            {/* System Health Card — injected into sidebar */}
            <SystemHealthCard />
            <SideBar
              {...{
                subscribeToMore,
                userId: user.id,
                conversations: user.userConversations,
                onChange: this.initConvo
              }}
            />
          </div>
        </div>
        <div className="col viewer">
          <Messenger
            switchView={this.switchView}
            conversation={this.state.conversation}
            conversationName={this.state.conversationName}
            userId={this.props.id}
            onMessageSent={this.onMessageSent}
            data={{ getConvo: { messages: { items: [] } }, loading: false }}
          />
        </div>
      </div>
    )
  }
}
ChatApp.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  data: PropTypes.object,
  registerUser: PropTypes.func.isRequired,
  createConvo: PropTypes.func.isRequired,
  createConvoLink: PropTypes.func.isRequired,
  updateConvoLink: PropTypes.func.isRequired
}

const ChatAppWithData = compose(
  graphql(getUser, {
    skip: props => !props.id,
    options: props => ({
      variables: { id: props.id },
      fetchPolicy: 'cache-and-network'
    })
  }),
  graphql(registerUser, {
    name: 'registerUser',
    options: props => ({
      variables: {
        input: {
          id: props.id,
          username: props.name,
          registered: true
        }
      },
      optimisticResponse: {
        registerUser: {
          __typename: 'User',
          id: props.id,
          username: props.name,
          registered: true
        }
      }
    })
  }),
  graphql(createConvo, {
    name: 'createConvo',
    options: props => ({
      update: (proxy, { data: { createConvo } }) => {
        // console.log('convo created', createConvo)
      }
    })
  }),
  graphql(createConvoLink, {
    name: 'createConvoLink',
    options: props => ({
      ignoreResults: true
    })
  }),
  graphql(updateConvoLink, {
    name: 'updateConvoLink',
    options: props => ({
      ignoreResults: true
    })
  })
)(ChatApp)

export default ChatApp
export { ChatAppWithData }
