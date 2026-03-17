import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../api/api";

export default class ProtectedRoute extends Component {
  render() {
    const token = getSession("token");

    // If no token, block access
    if (!token) {
      return <Navigate to="/login" replace />;
    }

    // If authenticated, allow access
    return this.props.children;
  }
}
