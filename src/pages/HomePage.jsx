import React, { Component } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import { getSession } from "../api/api";

export default class HomePage extends Component {
  componentDidMount() {
    const token = getSession("token");
    if (token) {
      window.location.replace("/dashboard");
    }
  }

  render() {
    return (
      <div className="chatgpt-page">
        <header className="chatgpt-header">
          <div className="header-left">
            <img src="https://i.pinimg.com/736x/4e/8a/ca/4e8aca3be544783cc75849e2183849c8.jpg" alt="Bot Logo" className="bot-logo" />
            <span className="bot-text">Bot</span>
          </div>

          <div className="header-right">
            <Link to="/login" className="login-pill">Log in</Link>
            <Link to="/signup" className="signup-pill">Signup</Link>
            <img id="simg" src="https://i.pinimg.com/736x/ea/0e/ef/ea0eef1697c92d4df04b5abac0eeda9b.jpg" alt="User Icon" />
          </div>
        </header>

        <main className="chatgpt-center">
          <h1>What can I help with?</h1>

          <div className="chatgpt-input-box">
            <input type="text" placeholder="Ask anything" />

            <div className="chatgpt-actions">
              <button>Attach</button>
              <button>Search</button>
              <button>Study</button>
              <button>Create image</button>
              <button className="voice">Voice</button>
            </div>
          </div>
        </main>

        <footer className="chatgpt-footer">
          By messaging Bot, you agree to our Terms and Privacy Policy.
        </footer>
      </div>
    );
  }
}
