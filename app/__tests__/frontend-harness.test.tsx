import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "../page";

describe("frontend harness", () => {
  it("renders the login page title", () => {
    render(<LoginPage />);

    expect(screen.getByText("CrediCheck")).toBeInTheDocument();
  });
});
