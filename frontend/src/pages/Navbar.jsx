import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "./NavBar.module.css";

export default function Navbar() {
  const { user, signOut } = useContext(AuthContext);
  const nav = useNavigate();

  const handleLogout = () => {
    signOut();
    nav("/login");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Left side - Logo / Home */}
        <div className={styles.leftLinks}>
          <Link to="/" className={styles.logo}>
            QuizApp
          </Link>
{/*           <Link to="/quizzes" className={styles.navLink}> */}
{/*             Quizzes */}
{/*           </Link> */}
{/*           <Link to="/create" className={styles.navLink}> */}
{/*             Create Quiz */}
{/*           </Link> */}
{/*           <Link to="/results" className={styles.navLink}> */}
{/*             My Results */}
{/*           </Link> */}
        </div>

        {/* Right side - Auth */}
        <div className={styles.rightSection}>
          {user ? (
            <div className={styles.userDropdownWrapper}>
              <span className={styles.userName} tabIndex={0}>
                {user.name || user.email}
              </span>
              <div className={styles.userDropdown}>
                <div className={styles.dropdownItem}>
                   {user.name}
                </div>
                <div className={styles.dropdownItem}>
                   {user.email}
                </div>
                <div className={styles.dropdownItem}>
                  <button
                    className={styles.dropdownEditBtn}
                    onClick={() => nav("/profile")}
                  >
                    Edit Name
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {user && (
            <button
              onClick={handleLogout}
              className={`${styles.button} ${styles.buttonLogout}`}
              type="button"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}