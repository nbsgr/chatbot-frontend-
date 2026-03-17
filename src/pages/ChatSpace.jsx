import React, { Component, createRef } from "react";
import "./ChatSpace.css";
import { callApi, getSession } from "../api/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import MarkdownRenderer from "./MarkdownRenderer";

const BASE_URL =
  "https://2sg5mh11-8080.inc1.devtunnels.ms";

class ChatSpace extends Component {

  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      input: "",
      activeStreamingIndex: null,
      isStreaming: false,
      isThinking: false
    };

    this.textareaRef = createRef();
    this.chatEndRef = createRef();

    this.subscription = null;
    this.stompClient = null;
  }

  componentDidMount() {
    this.connectWebSocket();
    this.loadMessages();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.conversation?.id !==
      this.props.conversation?.id
    ) {
      this.loadMessages();

      if (this.stompClient?.connected) {
        this.subscribeToConversation();
      }
    }
  }

  componentWillUnmount() {
    this.subscription?.unsubscribe();
    this.stompClient?.deactivate();
  }

  // ==================================
  // WEBSOCKET CONNECT
  // ==================================

  connectWebSocket = () => {

    const token = getSession("token");

    this.stompClient = new Client({

      webSocketFactory: () =>
        new SockJS(`${BASE_URL}/ws-chat`),

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      reconnectDelay: 5000,

      onConnect: () => {
        console.log("WS CONNECTED");
        this.subscribeToConversation();
      },

      onStompError: frame => {
        console.error("STOMP ERROR:", frame);
      },

      onWebSocketError: error => {
        console.error("WS ERROR:", error);
      },

      debug: () => {}
    });

    this.stompClient.activate();
  };

  // ==================================
  // SUBSCRIBE
  // ==================================

  subscribeToConversation = () => {

    const { conversation } = this.props;

    if (!conversation ||
        !this.stompClient?.connected)
      return;

    this.subscription?.unsubscribe();

    this.subscription =
      this.stompClient.subscribe(
        `/user/queue/conversation/${conversation.id}`,
        msg => {

          const data = JSON.parse(msg.body);

          // ============================
          // TOKEN
          // ============================

          if (data.type === "TOKEN") {

            const chunk = data.content || "";

            this.setState(prev => {

              let messages = [...prev.messages];
              let index = prev.activeStreamingIndex;

              // First token → create new bot message
              if (index === null) {

                const botMsg = {
                  sender: "bot",
                  text: "",
                  sources: []
                };

                messages.push(botMsg);
                index = messages.length - 1;
              }

              // Immutable update
              const updatedMessage = {
                ...messages[index],
                text: messages[index].text + chunk
              };

              messages[index] = updatedMessage;

              return {
                messages,
                activeStreamingIndex: index,
                isStreaming: true,
                isThinking: false
              };
            });

            this.scrollToBottom();
            return;
          }

          // ============================
          // SOURCES
          // ============================

          if (data.type === "SOURCES") {

            this.setState(prev => {

              const messages = [...prev.messages];

              const index = prev.activeStreamingIndex;

              if (index !== null &&
                  messages[index]?.sender === "bot") {

                messages[index] = {
                  ...messages[index],
                  sources: data.sources || []
                };
              }

              return { messages };
            });

            this.scrollToBottom();
            return;
          }

          // ============================
          // COMPLETE
          // ============================

          if (data.type === "COMPLETE") {

            this.setState({
              activeStreamingIndex: null,
              isStreaming: false,
              isThinking: false
            });

            this.scrollToBottom();
            return;
          }

          // ============================
          // ERROR
          // ============================

          if (data.type === "ERROR") {

            const errorMsg = {
              sender: "bot",
              text: data.content || "Something went wrong.",
              sources: []
            };

            this.setState(prev => ({
              messages: [
                ...prev.messages,
                errorMsg
              ],
              activeStreamingIndex: null,
              isStreaming: false,
              isThinking: false
            }));

            return;
          }
        }
      );
  };

  // ==================================
  // LOAD MESSAGES
  // ==================================

  parseSources = (sources) => {
    if (!sources) return [];
    try {
      const parsed = JSON.parse(sources);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  loadMessages = () => {

    const { conversation } = this.props;
    if (!conversation) return;

    const token = getSession("token");

    callApi(
      "POST",
      `${BASE_URL}/messages/list`,
      {
        conversationId:
          conversation.id.toString()
      },
      res => {

        if (res.status === 200) {

          const formatted =
            res.data.map(m => ({
              sender:
                m.senderType.toLowerCase(),
              text: m.content,
              sources:
                this.parseSources(m.sources)
            }));

          this.setState({
            messages: formatted,
            activeStreamingIndex: null,
            isStreaming: false,
            isThinking: false
          },
          () => this.scrollToBottom());
        }
      },
      token
    );
  };

  // ==================================
  // SEND MESSAGE
  // ==================================

sendMessage = () => {

  if (this.state.isStreaming || this.state.isThinking) {
    return;
  }

  const { conversation } = this.props;
  const inputText = this.state.input.trim();

  if (!inputText) return;

  const token = getSession("token");

  const userMsg = {
    sender: "user",
    text: inputText,
    sources: []
  };

  this.setState(prev => ({
    messages: [...prev.messages, userMsg],
    input: "",
    isThinking: true
  }), () => this.scrollToBottom());

  callApi(
    "POST",
    `${BASE_URL}/messages/send`,
    {
      conversationId: conversation.id.toString(),
      content: inputText
    },
    (res) => {
      if (res.status !== 200) {
        console.error("Failed to save message", res);
      }
    },
    token
  );

  if (this.stompClient?.connected) {

    this.stompClient.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({
        conversationId: conversation.id.toString(),
        content: inputText
      })
    });

  } else {
    console.error("WebSocket not connected");
  }
};

  // ==================================
  // SCROLL
  // ==================================

  scrollToBottom = () =>
    this.chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });

  renderSources = (sources) => {

    if (!sources || sources.length === 0)
      return null;

    return (
      <div className="cgpt-message-sources">
        <div className="cgpt-source-title">
          Sources
        </div>

        {sources.map((src, i) => (
          <div key={i}
               className="cgpt-source-item">
            🔗
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer">
              {src}
            </a>
          </div>
        ))}
      </div>
    );
  };

  render() {

    const {
      messages,
      input,
      isStreaming,
      isThinking
    } = this.state;

    const { conversation } =
      this.props;

    if (!conversation)
      return (
        <div className="cgpt-chatspace-root">
          <h1>Select or start a conversation</h1>
        </div>
      );

    return (
      <div className="cgpt-chatspace-root">

        <div className="cgpt-chatspace-area">

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`cgpt-chatspace-message ${
                msg.sender === "user"
                  ? "cgpt-chatspace-user"
                  : "cgpt-chatspace-bot"
              }`}
            >
              <MarkdownRenderer content={msg.text}/>
              {this.renderSources(msg.sources)}
            </div>
          ))}

          {isThinking && !isStreaming &&
            <div className="cgpt-chatspace-message cgpt-chatspace-bot thinking">
              <span className="dot"/>
              <span className="dot"/>
              <span className="dot"/>
            </div>
          }

          <div ref={this.chatEndRef}/>
        </div>

        <div className="cgpt-chatspace-input-container">
          <div className="cgpt-chatspace-input-wrapper">

            <textarea
              ref={this.textareaRef}
              value={input}
              onChange={e =>
                this.setState({
                  input: e.target.value
                })
              }
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  this.sendMessage();
                }
              }}
              placeholder="Message Bot..."
              className="cgpt-chatspace-input"
              rows={1}
            />

            <button
              className="cgpt-chatspace-send-btn"
              onClick={this.sendMessage}
              disabled={isStreaming || isThinking}
            >
              {isStreaming || isThinking ? "⏹" : "➤"}
            </button>

          </div>
        </div>

      </div>
    );
  }
}

export default ChatSpace;