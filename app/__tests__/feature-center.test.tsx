import React from "react";
import { render, screen } from "@testing-library/react";
import FeatureCenterPage from "../feature-center/page";

describe("feature center page", () => {
  it("renders the feature center title", () => {
    localStorage.setItem("accessToken", "test-token");

    render(<FeatureCenterPage />);

    expect(screen.getByText("Centro de Funciones")).toBeInTheDocument();
  });
});
