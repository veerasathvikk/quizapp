import { useState } from "react";
import api from '../api/axios';
import styles from './ProfileEdit.module.css';

export default function ProfileEdit({ user }) {
  const [name, setName] = useState(user?.name || "");

  const handleSave = async () => {
    try {
      await api.put("/users/me", { name });
      alert("Name updated!");
    } catch (err) {
      alert("Failed to update name. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Edit Profile</h2>
      <input
        type="text"
        className={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={handleSave} className={styles.button} type="button">
        Save
      </button>
    </div>
  );
}