"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowButton(true), 5000); // show after 5s
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("User choice:", choice.outcome);
    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-50 max-w-sm mx-auto sm:mx-0 bg-black text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:gap-4">
      <div className="flex-1">
        <p className="font-semibold">Install Ustaz</p>
        <p className="text-sm text-gray-300">Get the app for a faster experience</p>
      </div>
      <div className="mt-3 sm:mt-0 flex gap-2">
        <button
          onClick={handleInstall}
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
        >
          Install
        </button>
        <button
          onClick={() => setShowButton(false)}
          className="text-gray-400 hover:text-gray-200 px-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
