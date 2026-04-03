import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "../page";

describe("public search landing", () => {
  it("shows the public document search field", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Número de documento")).toBeInTheDocument();
  });
});
