import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { deleteArtwork, listArtworks, type SavedArtwork } from "./artwork-store";
import type { ChildProfile } from "./profile-data";

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "colorquest-artwork";
}

export default function ArtworkGallery({ profiles, revision = 0 }: { profiles: ChildProfile[]; revision?: number }) {
  const [artworks, setArtworks] = useState<SavedArtwork[]>([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const refresh = () => listArtworks().then(setArtworks).catch(() => setMessage("The artwork gallery could not be opened on this device."));
  useEffect(() => { refresh(); }, [revision]);

  const exportArtwork = async (artwork: SavedArtwork) => {
    const filename = `${safeFilename(artwork.title)}.png`;
    if (Capacitor.isNativePlatform()) {
      const saved = await Filesystem.writeFile({ path: filename, data: artwork.dataUrl.split(",")[1], directory: Directory.Cache });
      await Share.share({
        title: artwork.title,
        text: "A creation from ColorQuest Kids",
        files: [saved.uri],
        dialogTitle: "Save, print, or share this artwork",
      });
      setMessage("Android's save and share choices are open.");
      return;
    }
    const link = document.createElement("a");
    link.href = artwork.dataUrl;
    link.download = filename;
    link.click();
    setMessage("High-resolution PNG downloaded.");
  };

  const printArtwork = (artwork: SavedArtwork) => {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return setMessage("Please allow the print window, then try again.");
    popup.document.write(`<!doctype html><html><head><title>${artwork.title}</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:96vw;max-height:94vh;object-fit:contain}@page{margin:12mm}</style></head><body><img src="${artwork.dataUrl}" alt="${artwork.title}"></body></html>`);
    popup.document.close();
    popup.addEventListener("load", () => popup.print(), { once: true });
  };

  const remove = async (artwork: SavedArtwork) => {
    if (!window.confirm(`Delete “${artwork.title}” from this device?`)) return;
    await deleteArtwork(artwork.id);
    await refresh();
    setMessage("Artwork deleted from this device.");
  };

  const shown = artworks.filter((item) => filter === "all" || item.profileId === filter);

  return (
    <section className="artwork-gallery">
      <div className="gallery-heading">
        <div><p className="eyebrow">Private family gallery</p><h2>Saved creations</h2></div>
        <label>Show artwork for<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All children</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
      </div>
      {shown.length === 0 ? (
        <div className="empty-gallery"><span>🖼️</span><strong>No saved pictures yet</strong><p>When a child taps “Save to gallery,” the picture will appear privately here.</p></div>
      ) : (
        <div className="artwork-grid">
          {shown.map((artwork) => {
            const profile = profiles.find((item) => item.id === artwork.profileId);
            return (
              <article key={artwork.id}>
                <img src={artwork.dataUrl} alt={artwork.title} />
                <div><strong>{artwork.title}</strong><small>{profile?.avatar} {profile?.name || "Child"} · {new Date(artwork.createdAt).toLocaleDateString()}</small></div>
                <div className="artwork-actions">
                  <button onClick={() => exportArtwork(artwork)}>Download / share</button>
                  <button onClick={() => printArtwork(artwork)}>Print</button>
                  <button className="delete-art" onClick={() => remove(artwork)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {message && <p className="gallery-message" role="status">{message}</p>}
      <p className="gallery-privacy">🔒 Artwork stays on this device unless a parent chooses Download, Print, or Share.</p>
    </section>
  );
}
