import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

describe("dashboard smoke test", () => {
  it("renders a React test environment", () => {
    render(<main>Signal dashboard</main>);
    expect(screen.getByText("Signal dashboard")).toBeInTheDocument();
  });
});
