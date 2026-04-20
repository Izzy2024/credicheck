import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "../login/page";

describe("frontend harness", () => {
  it("renders the login page title", () => {
    localStorage.clear();
    render(<LoginPage />);

    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });
});
