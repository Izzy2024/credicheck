import React from "react";
import { render, screen } from "@testing-library/react";
import RiskScorePage from "../risk-score/page";

describe("risk score page", () => {
  it("shows the document number field", () => {
    render(<RiskScorePage />);

    expect(screen.getByLabelText("Número de documento")).toBeInTheDocument();
  });
});
