import { useState } from "react";
import { PROFILE_AVATARS, ageWorldFor, type ChildProfile } from "./profile-data";

const AGE_WORLD_NAMES = ["Little Explorer", "Growing Creator", "Curious Inventor", "Big Thinker"];

export function ProfileSetup({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, age: number, avatar: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(6);
  const [avatar, setAvatar] = useState(PROFILE_AVATARS[0]);
  const canCreate = name.trim().length > 0;

  return (
    <main className="profile-page">
      <section className="profile-setup-card">
        <div className="profile-welcome-art" aria-hidden="true">🌈</div>
        <p className="eyebrow">A private space on this device</p>
        <h1>Who is creating today?</h1>
        <p className="profile-intro">
          A profile remembers the child&apos;s age, progress, favorite trail, and artwork. No account, email, or full birthday is needed.
        </p>

        <label className="profile-field">
          First name or nickname
          <input
            value={name}
            maxLength={20}
            autoComplete="off"
            placeholder="Little artist"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="profile-field age-field">
          Age
          <input type="range" min="1" max="12" value={age} onChange={(event) => setAge(Number(event.target.value))} />
          <strong>{age} years old · {AGE_WORLD_NAMES[ageWorldFor(age)]}</strong>
        </label>

        <fieldset className="avatar-picker">
          <legend>Choose a friendly explorer</legend>
          <div>
            {PROFILE_AVATARS.map((item) => (
              <button key={item} type="button" className={avatar === item ? "active" : ""} onClick={() => setAvatar(item)} aria-label={`Choose ${item} avatar`} aria-pressed={avatar === item}>
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary-button profile-create" disabled={!canCreate} onClick={() => canCreate && onCreate(name, age, avatar)}>
          Create {name.trim() ? `${name.trim()}'s` : "my"} space →
        </button>
        {onCancel && <button className="text-button" onClick={onCancel}>Cancel</button>}
        <small className="privacy-note">🔒 Stored only on this device. Parents can edit or delete profiles in Parent Corner.</small>
      </section>
    </main>
  );
}

export function ProfileHub({
  profiles,
  activeProfileId,
  onSelect,
  onAdd,
  onBack,
}: {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onBack: () => void;
}) {
  return (
    <main className="profile-page">
      <section className="profile-hub-card">
        <button className="back-home" onClick={onBack}>← Back</button>
        <p className="eyebrow">Choose a creator</p>
        <h1>Whose adventure is this?</h1>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button key={profile.id} className={profile.id === activeProfileId ? "active" : ""} onClick={() => onSelect(profile.id)}>
              <span>{profile.avatar}</span>
              <strong>{profile.name}</strong>
              <small>Age {profile.age} · {AGE_WORLD_NAMES[ageWorldFor(profile.age)]}</small>
              <em>{profile.id === activeProfileId ? "Playing now" : "Choose profile"}</em>
            </button>
          ))}
          <button className="add-profile-card" onClick={onAdd}>
            <span>＋</span><strong>Add a child</strong><small>Create a separate private space</small>
          </button>
        </div>
      </section>
    </main>
  );
}
