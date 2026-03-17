import React, { Component } from "react";
import "./Dashboard.css";
import ChatSpace from "./ChatSpace";
import { callApi, getSession, setSession } from "../api/api";

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fullname: "",
      sidebarOpen: true,
      conversations: [],
      activeConversationId: null,
      renamingId: null,
      renameValue: ""
    };
  }

  componentDidMount() {
    const token = getSession("token");
    if (!token) {
      this.logout();
      return;
    }

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/getfullname",
      {},
      this.fullnameResponse,
      token
    );

    this.loadConversations();
  }

  fullnameResponse = (res) => {
    if (!res || res.status !== 200) {
      this.logout();
      return;
    }
    this.setState({ fullname: res.data });
  };

  loadConversations = () => {
    const token = getSession("token");

    callApi(
      "GET",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/conversations/list",
      {},
      (res) => {
        if (res.status === 200) {
          const list = res.data || [];

          this.setState((prev) => ({
            conversations: list,
            activeConversationId:
              prev.activeConversationId && list.some(c => c.id === prev.activeConversationId)
                ? prev.activeConversationId
                : list.length > 0
                ? list[0].id
                : null
          }));
        }
      },
      token
    );
  };

  logout = () => {
    setSession("token", "", -1);
    window.location.replace("/login");
  };

  toggleSidebar = () => {
    this.setState((prev) => ({ sidebarOpen: !prev.sidebarOpen }));
  };

  createNewChat = () => {
    const token = getSession("token");

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/conversations/create",
      {},
      (res) => {
        if (res.status === 200) {
          this.loadConversations();
          this.setState({ activeConversationId: res.data.id });
        }
      },
      token
    );
  };

  selectConversation = (id) => {
    this.setState({ activeConversationId: id });
  };

  startRename = (id, title) => {
    this.setState({ renamingId: id, renameValue: title || "" });
  };

  handleRenameChange = (e) => {
    this.setState({ renameValue: e.target.value });
  };

  saveRename = (id) => {
    const token = getSession("token");

    callApi(
      "PUT",
      `https://2sg5mh11-8080.inc1.devtunnels.ms/conversations/rename/${id}`,
      { title: this.state.renameValue },
      (res) => {
        if (res.status === 200) {
          this.loadConversations();
        }
      },
      token
    );

    this.setState({ renamingId: null, renameValue: "" });
  };

  deleteConversation = (id) => {
    const token = getSession("token");

    callApi(
      "DELETE",
      `https://2sg5mh11-8080.inc1.devtunnels.ms/conversations/${id}`,
      {},
      (res) => {
        if (res.status === 200) {
          this.loadConversations();
        }
      },
      token
    );
  };

  render() {
    const {
      fullname,
      sidebarOpen,
      conversations,
      activeConversationId,
      renamingId,
      renameValue
    } = this.state;

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId
    );

    return (
      <div className="cgpt-dashboard-root">
        {/* HEADER */}
        <div className="cgpt-header">
          <div className="cgpt-header-left">
            <img src="https://i.pinimg.com/736x/4e/8a/ca/4e8aca3be544783cc75849e2183849c8.jpg" alt="logo" className="cgpt-logo" />
            <span className="cgpt-title">Bot</span>
          </div>

          <div className="cgpt-header-right">
            <span className="cgpt-username">{fullname}</span>
            <img
              className="cgpt-logout"
              onClick={this.logout}
              src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png"
              alt="logout"
            />
          </div>
        </div>

        {/* BODY */}
        <div className="cgpt-body">
          {/* SIDEBAR */}
          <div className={`cgpt-sidebar ${sidebarOpen ? "open" : "closed"}`}>
            
            {/* TOGGLE BUTTON */}
            <button
              className="cgpt-sidebar-toggle sidebar-toggle-attached"
              onClick={this.toggleSidebar}
            >
              ☰
            </button>

            <button className="cgpt-newchat-btn" onClick={this.createNewChat}>
              + New chat
            </button>

            <div className="cgpt-thread-list">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`cgpt-thread-item ${
                    activeConversationId === conv.id ? "active" : ""
                  }`}
                  onClick={() => this.selectConversation(conv.id)}
                >
                  {renamingId === conv.id ? (
                    <input
                      className="cgpt-rename-input"
                      value={renameValue}
                      onChange={this.handleRenameChange}
                      onBlur={() => this.saveRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") this.saveRename(conv.id);
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="cgpt-thread-title">
                        {conv.title || "New chat"}
                      </span>

                      <div className="cgpt-thread-actions">
                        <span
                          className="cgpt-thread-dots"
                          onClick={(e) => {
                            e.stopPropagation();
                            this.startRename(conv.id, conv.title);
                          }}
                        >
                          ✏️
                        </span>

                        <span
                          className="cgpt-thread-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            this.deleteConversation(conv.id);
                          }}
                        >
                          🗑️
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CHAT */}
          <div className="cgpt-main">
            <ChatSpace conversation={activeConversation} />
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;
