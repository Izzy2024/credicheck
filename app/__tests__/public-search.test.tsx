import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "../dashboard/page";

describe("public dashboard", () => {
  it("shows the main search input without requiring login", async () => {
    localStorage.clear();
    render(<Dashboard />);

    expect(
      await screen.findByPlaceholderText(
        "Ingrese nombre, número de identificación o NIT...",
      ),
    ).toBeInTheDocument();
  });
});
