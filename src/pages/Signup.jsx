import React, { Component } from "react";
import "./Signup.css";
import { callApi, getSession } from "../api/api";

export default class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
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

  requestOtp = () => {
    const { fullname, email, password, confirmPassword } = this.state;

    if (!fullname.trim() || !email.trim() || !password || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    this.setState({ loading: true, message: "" });

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/request-signup-otp",
      { email: email.trim() },
      this.handleOtpResponse
    );
  };

  handleOtpResponse = (response) => {
    this.setState({ loading: false });

    if (response.status === 200) {
      const DEFAULT_ROLE = 1;

      const signupData = {
        fullname: this.state.fullname,
        email: this.state.email,
        password: this.state.password,
        role: DEFAULT_ROLE
      };

      localStorage.setItem("signupData", JSON.stringify(signupData));
      window.location.replace("/verify-otp");
    } else {
      this.setState({ message: response.message });
    }
  };

  render() {
    return (
      <div className="chatgpt-signup-page">
        <div className="chatgpt-signup-card">
          <h2 className="chatgpt-signup-title">Sign up</h2>

          <input
            type="text"
            name="fullname"
            placeholder="Full name"
            value={this.state.fullname}
            onChange={this.handleChange}
            className="chatgpt-signup-input"
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={this.state.email}
            onChange={this.handleChange}
            className="chatgpt-signup-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={this.handleChange}
            className="chatgpt-signup-input"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={this.state.confirmPassword}
            onChange={this.handleChange}
            className="chatgpt-signup-input"
          />

          <button
            onClick={this.requestOtp}
            className="chatgpt-signup-button"
            disabled={this.state.loading}
          >
            {this.state.loading ? "Sending OTP..." : "Request OTP"}
          </button>

          {this.state.message && (
            <p className="chatgpt-signup-error">{this.state.message}</p>
          )}
        </div>
      </div>
    );
  }
}
