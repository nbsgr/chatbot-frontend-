import React, { Component } from "react";
import "./ResetPassword.css";
import { callApi, getSession } from "../api/api";

export default class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
      message: "",
      loading: false
    };
  }

  componentDidMount() {
    const authToken = getSession("token");

    if (authToken) {
      window.location.replace("/dashboard");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const token = params.get("token");

    if (!email || !token) {
      this.setState({ message: "Invalid or expired reset link" });
      return;
    }

    this.setState({ email, token });
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  submitResetPassword = () => {
    const { email, token, newPassword, confirmPassword } = this.state;

    if (!newPassword || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    this.setState({ loading: true, message: "" });

    const data = {
      email,
      token,
      newPassword
    };

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/reset-password",
      data,
      this.handleResponse
    );
  };

  handleResponse = (res) => {
    this.setState({ loading: false });

    if (res.status === 200) {
      this.setState({
        message: "Password reset successful! Redirecting to login..."
      });

      setTimeout(() => {
        window.location.replace("/login");
      }, 2000);
    } else {
      this.setState({ message: res.message });
    }
  };

  render() {
    const { newPassword, confirmPassword, loading, message } = this.state;

    return (
      <div className="cgpt-rp-page">
        <div className="cgpt-rp-card">
          <h2 className="cgpt-rp-title">Reset password</h2>

          <input
            type="password"
            name="newPassword"
            placeholder="New password"
            value={newPassword}
            onChange={this.handleChange}
            className="cgpt-rp-input"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={this.handleChange}
            className="cgpt-rp-input"
          />

          <button
            onClick={this.submitResetPassword}
            disabled={loading}
            className="cgpt-rp-button"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>

          {message && (
            <p className="cgpt-rp-message">{message}</p>
          )}
        </div>
      </div>
    );
  }
}
