import React, { Component } from "react";
import "./ForgotPassword.css";
import { callApi, getSession } from "../api/api";

export default class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      message: "",
      loading: false
    };
  }

  componentDidMount() {
    const token = getSession("token");
    if (token) {
      window.location.replace("/dashboard");
    }
  }

  handleChange = (e) => {
    this.setState({ email: e.target.value });
  };

  submitForgotPassword = () => {
    const { email } = this.state;

    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    this.setState({ loading: true, message: "" });

    const data = {
      email: email.trim()
    };

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/request-password-reset",
      data,
      this.handleResponse
    );
  };

  handleResponse = (res) => {
    this.setState({ loading: false });

    if (res.status === 200) {
      this.setState({
        message: "Reset link sent to your email. Please check your inbox."
      });
    } else {
      this.setState({ message: res.message });
    }
  };

  goToLogin = () => {
    window.location.replace("/login");
  };

  render() {
    return (
      <div className="chatgpt-fp-page">
        <div className="chatgpt-fp-card">
          <h2 className="chatgpt-fp-title">Forgot password</h2>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={this.state.email}
            onChange={this.handleChange}
            className="chatgpt-fp-input"
          />

          <button
            onClick={this.submitForgotPassword}
            disabled={this.state.loading}
            className="chatgpt-fp-button"
          >
            {this.state.loading ? "Sending..." : "Send reset link"}
          </button>

          {this.state.message && (
            <p className="chatgpt-fp-message">{this.state.message}</p>
          )}

          <p className="chatgpt-fp-back" onClick={this.goToLogin}>
            Back to login
          </p>
        </div>
      </div>
    );
  }
}
