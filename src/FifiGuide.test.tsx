import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FifiGuide from "./FifiGuide";

vi.mock("./SpeechProvider", () => ({
  SpeakButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

describe("FifiGuide", () => {
  it("explains drawing autosave and puts focus on the safe choice", async () => {
    const stay = vi.fn();
    const leave = vi.fn();

    render(<FifiGuide open mode="leave-drawing" childName="Maya" onStay={stay} onLeave={leave} />);

    expect(screen.getByRole("dialog", { name: "Your picture is safe, Maya!" })).toBeTruthy();
    expect(screen.getByText(/save a private draft on this device/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hear Fifi" })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Stay & draw" })));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(stay).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
  });

  it("leaves only after the child chooses the explicit leave action", async () => {
    const user = userEvent.setup();
    const stay = vi.fn();
    const leave = vi.fn();
    render(<FifiGuide open mode="leave-drawing" onStay={stay} onLeave={leave} />);

    await user.click(screen.getByRole("button", { name: "Keep it safe and leave" }));
    expect(leave).toHaveBeenCalledTimes(1);
    expect(stay).not.toHaveBeenCalled();
  });

  it("makes start-over explicit while Escape keeps the picture", async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    const startOver = vi.fn();
    render(<FifiGuide open mode="start-over" onCancel={cancel} onStartOver={startOver} />);

    expect(screen.getByText(/cannot be undone/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start a fresh page" }));
    expect(startOver).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("shows tips without a blocking dialog", async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(
      <FifiGuide
        open
        mode="tip"
        message="Try turning a triangle into a rocket!"
        onDismiss={dismiss}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("note", { name: "Fifi's tip" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Dismiss Fifi's tip" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("falls back to the local placeholder when mascot art cannot load", () => {
    render(<FifiGuide open mode="tip" mascotSrc="/fifi-mascot.png" message="Hello!" onDismiss={() => undefined} />);
    fireEvent.error(screen.getByAltText("Fifi, your ColorQuest guide"));
    expect(screen.getByRole("img", { name: "Fifi, your ColorQuest guide" })).toBeTruthy();
  });
});
