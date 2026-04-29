import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConversationBar from './ConversationBar'
import InputBar from './InputBar'
import MessagePane from './MessagePane'
import { getConvo } from '../graphql/queries'
import { graphql } from 'react-apollo'

class Messenger extends Component {
  render() {
    const {
      switchView,
      conversation,
      conversationName,
      data = {}
    } = this.props
    
    const {
      subscribeToMore = () => {},
      fetchMore = () => {},
      getConvo = {}
    } = data

    const { messages = {} } = getConvo
    const { items: messagesItems = [], nextToken } = messages
    const messagesList = messagesItems || []
    return (
      <React.Fragment>
        <ConversationBar
          {...{ conversation, name: conversationName, switchView }}
        />
        <MessagePane
          conversation={this.props.conversation}
          userId={this.props.userId}
          userMap={this.getUserMap()}
          {...{ messages: messagesList, subscribeToMore, fetchMore, nextToken }}
        />
        <InputBar
          conversation={this.props.conversation}
          userId={this.props.userId}
          onMessageSent={this.props.onMessageSent}
          createMessage={() => {}}
        />
      </React.Fragment>
    )
  }

  getUserMap = () => {
    const {
      conversation: { associated: { items = [] } = {} } = {}
    } = this.props
    return items.reduce((acc, curr) => {
      acc[curr.user.id] = curr.user.username
      return acc
    }, {})
  }
}

Messenger.propTypes = {
  conversation: PropTypes.object,
  conversationName: PropTypes.string,
  userId: PropTypes.string,
  switchView: PropTypes.func.isRequired,
  data: PropTypes.object
}

const MessengerWithData = graphql(getConvo, {
  skip: props => !props.conversation,
  options: props => ({
    variables: { id: props.conversation.id },
    fetchPolicy: 'cache-and-network'
  })
})(Messenger)

export default Messenger
export { MessengerWithData }
