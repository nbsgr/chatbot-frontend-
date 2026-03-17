import React, { Component } from "react";
import "./Login.css";
import { callApi, setSession, getSession } from "../api/api";

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
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
    this.setState({ [e.target.name]: e.target.value });
  };

  login = () => {
    const { email, password } = this.state;

    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    this.setState({ loading: true, message: "" });

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/signin",
      { email, password },
      this.handleLoginResponse
    );
  };

  handleLoginResponse = (res) => {
    this.setState({ loading: false });

    if (res.status === 200) {
      setSession("token", res.data, 1);
      window.location.replace("/dashboard");
    } else {
      this.setState({ message: res.message });
    }
  };

  goToForgotPassword = () => {
    window.location.replace("/forgot-password");
  };

  render() {
    return (
      <div className="chatgpt-login-page">
        <div className="chatgpt-login-card">
          <h2 className="chatgpt-login-title">Log in</h2>

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={this.state.email}
            onChange={this.handleChange}
            className="chatgpt-login-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={this.handleChange}
            className="chatgpt-login-input"
          />

          <button
            onClick={this.login}
            disabled={this.state.loading}
            className="chatgpt-login-button"
          >
            {this.state.loading ? "Logging in..." : "Log in"}
          </button>

          <p
            className="chatgpt-login-forgot"
            onClick={this.goToForgotPassword}
          >
            Forgot password?
          </p>

          {this.state.message && (
            <p className="chatgpt-login-message">{this.state.message}</p>
          )}
        </div>
      </div>
    );
  }
}
