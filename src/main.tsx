import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ColorQuestApp from "./App";
import "./styles.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function InstallableApp() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => undefined);
      }, { once: true });
    }

    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <>
      <ColorQuestApp />
      {installPrompt && (
        <button className="install-app-button" onClick={install} aria-label="Install ColorQuest Kids on this device">
          <span>🌈</span>
          <span><strong>Install ColorQuest</strong><small>Play from your home screen</small></span>
        </button>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstallableApp />
  </StrictMode>,
);
