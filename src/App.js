import React, { Component } from 'react'

import './App.css'
import Amplify, { Auth } from 'aws-amplify'
import awsmobile from './aws-exports'
import { withAuthenticator } from 'aws-amplify-react'
import AWSAppSyncClient from 'aws-appsync'
import { Rehydrated } from 'aws-appsync-react'

import { ApolloProvider } from 'react-apollo'
import ChatApp, { ChatAppWithData } from './components/chatapp'

try {
  Amplify.configure(awsmobile)
} catch (e) {
  console.warn("Amplify configuration failed", e)
}

const isPlaceholder = !awsmobile.aws_user_pools_id || awsmobile.aws_user_pools_id.includes('xxxxxx')

let client
try {
  client = new AWSAppSyncClient({
    url: awsmobile.aws_appsync_graphqlEndpoint,
    region: awsmobile.aws_appsync_region,
    auth: {
      type: awsmobile.aws_appsync_authenticationType,
      jwtToken: async () =>
        (await Auth.currentSession()).getIdToken().getJwtToken()
    },
    complexObjectsCredentials: () => Auth.currentCredentials()
  })
} catch (e) {
  console.error("AppSync client initialization failed", e)
}

class App extends Component {
  state = { session: null, error: null }

  async componentDidMount() {
    if (isPlaceholder) return
    try {
      const session = await Auth.currentSession()
      this.setState({ session })
    } catch (e) {
      console.log('No session', e)
    }
  }

  userInfo = () => {
    const session = this.state.session
    if (!session) {
      return { name: 'Demo User', id: 'demo-id' }
    }
    const payload = session.idToken.payload
    return { name: payload['cognito:username'], id: payload['sub'] }
  }

  render() {
    const info = this.userInfo()
    
    if (isPlaceholder) {
      // Minimal dummy client to prevent sub-components from crashing
      const dummyClient = {
        readQuery: () => null,
        writeQuery: () => null,
        watchQuery: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        query: () => Promise.resolve({ data: {} }),
        mutate: () => Promise.resolve({ data: {} }),
        subscribe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        onResetStore: () => {},
        onClearStore: () => {},
        stop: () => {}
      }

      return (
        <ApolloProvider client={dummyClient}>
          <React.Fragment>
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #6366f1, #06b6d4)', zIndex: 10001
            }} />
            <ChatApp 
              name={info.name} 
              id={info.id} 
              registerUser={() => {}}
              createConvo={() => {}}
              createConvoLink={() => {}}
              updateConvoLink={() => {}}
              data={{ 
                getUser: { 
                  username: 'Demo User',
                  registered: true,
                  userConversations: { items: [] } 
                }, 
                subscribeToMore: () => () => {},
                fetchMore: () => Promise.resolve(),
                loading: false 
              }}
            />
          </React.Fragment>
        </ApolloProvider>
      )
    }

    return (
      <ApolloProvider client={client}>
        <Rehydrated>
          <ChatAppWithData name={info.name} id={info.id} />
        </Rehydrated>
      </ApolloProvider>
    )
  }
}

// Bypassing withAuthenticator if it's a placeholder to show the UI overhaul
export default isPlaceholder ? App : withAuthenticator(App)
