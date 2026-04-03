import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import NotificationsPage from "../notifications/page";

describe("notifications badge", () => {
  it("shows unread badge text on the notifications page", async () => {
    localStorage.setItem("accessToken", "test-token");

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({ count: 2 }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            notifications: [
              {
                id: "n-1",
                title: "Nueva alerta",
                message: "Hay una nueva notificación",
                status: "UNREAD",
              },
            ],
          }),
        }),
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("No leídas")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Marcar todas como leídas/i })).toBeInTheDocument();
  });
});
