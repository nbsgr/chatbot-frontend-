import React, { Component } from "react";
import "./OtpVerification.css";
import { callApi, getSession } from "../api/api";

export default class OtpVerification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otp: "",
      message: ""
    };
  }

  componentDidMount() {
    const token = getSession("token");

    if (token) {
      window.location.replace("/dashboard");
      return;
    }

    const signupData = localStorage.getItem("signupData");

    if (!signupData) {
      window.location.replace("/signup");
      return;
    }
  }

  handleChange = (e) => {
    this.setState({ otp: e.target.value });
  };

  verifyOtp = () => {
    const signupData = JSON.parse(localStorage.getItem("signupData"));

    if (!signupData) {
      alert("Signup data missing. Please signup again.");
      window.location.replace("/signup");
      return;
    }

    if (!this.state.otp.trim()) {
      alert("OTP is required");
      return;
    }

    const data = {
      email: signupData.email,
      otp: this.state.otp.trim()
    };

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/verify-signup-otp",
      data,
      this.verifyResponse
    );
  };

  verifyResponse = (response) => {
    if (response.status === 200) {
      this.finalSignup();
    } else {
      this.setState({ message: response.message });
    }
  };

  finalSignup = () => {
    const signupData = JSON.parse(localStorage.getItem("signupData"));

    if (!signupData) {
      alert("Signup data missing");
      window.location.replace("/signup");
      return;
    }

    const data = {
      fullname: signupData.fullname,
      email: signupData.email,
      password: signupData.password,
      role: parseInt(signupData.role)  // default role = 1
    };

    callApi(
      "POST",
      "https://2sg5mh11-8080.inc1.devtunnels.ms/users/signup",
      data,
      this.signupResponse
    );
  };

  signupResponse = (response) => {
    if (response.status === 200) {
      alert("Signup successful");
      localStorage.removeItem("signupData");
      window.location.replace("/login");
    } else {
      this.setState({ message: response.message });
    }
  };

  render() {
    return (
      <div className="chatgpt-otp-page">
        <div className="chatgpt-otp-card">
          <h2 className="chatgpt-otp-title">Verify OTP</h2>

          <input
            type="text"
            name="otp"
            placeholder="Enter OTP"
            value={this.state.otp}
            onChange={this.handleChange}
            className="chatgpt-otp-input"
          />

          <button
            onClick={this.verifyOtp}
            className="chatgpt-otp-button"
          >
            Verify & Signup
          </button>

          {this.state.message && (
            <p className="chatgpt-otp-error">{this.state.message}</p>
          )}
        </div>
      </div>
    );
  }
}
