// src/components/navbar/navbar.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Admin, Instructor, Student } from '../../enums/enums';
import axios from 'axios';
import { Badge, Spinner } from 'react-bootstrap';
import {
  NAVIGATE_TO_ABOUT,
  NAVIGATE_TO_ADMIN_PROFILE,
  NAVIGATE_TO_FAQ,
  NAVIGATE_TO_HOME,
  NAVIGATE_TO_LOGIN,
  NAVIGATE_TO_NEWS,
  NAVIGATE_TO_PRICING,
  NAVIGATE_TO_PROFILE,
  NAVIGATE_TO_REGISTER,
  NAVIGATE_TO_COMMUNITY_SUPPORT,
  NAVIGATE_TO_URGENT
} from '../../constant/routeConstant';
import { LOGO } from '../../constant/imageConstant';
import CryptoJS from "crypto-js";
import { handleLogout } from '../../utils/utility';

function CommunitySupportLink({ urgentCount }) {
  return (
    <li className="nav-item">
      <Link
        to={NAVIGATE_TO_COMMUNITY_SUPPORT}
        className="nav-link d-inline-flex align-items-center"
        style={{ padding: '0.5rem 0.75rem' }}       // match your other nav-links
      >
        Community Support
        {urgentCount === null ? (
          <Spinner
            size="sm"
            animation="border"
            role="status"
            className="ms-2"
            style={{ width: '1rem', height: '1rem' }}
          />
        ) : urgentCount > 0 ? (
          <Link
            to={NAVIGATE_TO_URGENT}
            className="ms-2 d-inline-flex align-items-center"
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <Badge bg="danger" pill style={{ lineHeight: 1 }}>
              {urgentCount}
            </Badge>
          </Link>
        ) : null}
      </Link>
    </li>
  );
}


export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [uData, setUData]       = useState(null);

  // ─── fetch live urgent‐count ───────────────────────────────────────────
  const [urgentCount, setUrgentCount] = useState(null);
  useEffect(() => {
    axios
      .get('http://localhost:5002/api/community/questions/urgent/count')
      .then(res => setUrgentCount(res.data.count))
      .catch(() => setUrgentCount(0));
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  // decrypt user data
  useEffect(() => {
    const encrypted = localStorage.getItem('uData');
    if (encrypted) {
      const decrypted = CryptoJS.AES
        .decrypt(encrypted, process.env.REACT_APP_ENCRYPTION_SECRET)
        .toString(CryptoJS.enc.Utf8);
      setUData(JSON.parse(decrypted));
    }
  }, []);

  // mobile‐view toggle
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isAdmin      = uData?.role === Admin;
  const isInstructor = uData?.role === Instructor;
  const isStudent    = uData?.role === Student;

  // Helper to render the common support link + badge
  const CSLink = <CommunitySupportLink urgentCount={urgentCount} />;

  return (
    <div>
      {/* ─── ADMIN NAVBAR ─────────────────────────────────────────────── */}
      {isAdmin && (
        <nav className="navbar navbar-expand-lg p-3 mb-5 navbar-dark custom-bg-color fixed-top">
          <div className="container-fluid"
               style={{ marginLeft: isMobile ? 0 : '15%', marginRight: isMobile ? 0 : '15%' }}>
            <a className="navbar-brand" href={NAVIGATE_TO_HOME}>
              <img src={LOGO} width="130" height="45" alt="Logo" />
              <span style={{ color: 'gray', fontSize: 12 }}> admin</span>
            </a>
            <button className="navbar-toggler" type="button"
                    data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto d-flex align-items-center">

                {CSLink}
               <li className="nav-item">
                  <a className="nav-link" href={NAVIGATE_TO_LOGIN} onClick={handleLogout}>
                    <h6 style={{ color: '#0056d2' }}>Logout</h6>
                  </a>
                </li>
                <div className="dropdown m-2 nav-item text-center">
                  <Link to={NAVIGATE_TO_ADMIN_PROFILE} className="nav-link d-flex align-items-center">
                    <h6 style={{ margin: 0, marginRight: '10px', color: '#0056d2' }}>
                      Hi, {uData?.username?.split(' ')[0]}
                    </h6>
                    <img
                      src="https://aui.atlassian.com/aui/8.7/docs/images/avatar-person.svg"
                      width="30" height="30"
                      alt="User Avatar"
                    />
                  </Link>
                </div>
              </ul>
            </div>
          </div>
        </nav>
      )}

      {/* ─── INSTRUCTOR NAVBAR ─────────────────────────────────────────── */}
      {isInstructor && (
        <nav className="navbar navbar-expand-lg p-3 mb-5 navbar-dark custom-bg-color fixed-top">
          <div className="container-fluid"
               style={{ marginLeft: isMobile ? 0 : '15%', marginRight: isMobile ? 0 : '15%' }}>
            <a className="navbar-brand" href={NAVIGATE_TO_HOME}>
              <img src={LOGO} width="130" height="45" alt="Logo" />
              <span style={{ color: 'gray', fontSize: 12 }}> instructor</span>
            </a>
            <button className="navbar-toggler" type="button"
                    data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                {CSLink}
                <li className="nav-item mt-1 text-center">
                  <a className="nav-link" href={NAVIGATE_TO_LOGIN} onClick={handleLogout}>
                    <h6 style={{ color: '#0056d2' }}>Logout</h6>
                  </a>
                </li>
                <div className="dropdown m-2 nav-item text-center">
                  <Link to={NAVIGATE_TO_ADMIN_PROFILE} className="nav-link d-flex align-items-center">
                    <h6 style={{ margin: 0, marginRight: '10px', color: '#0056d2' }}>
                      Hi, {uData?.username?.split(' ')[0]}
                    </h6>
                    <img
                      src="https://aui.atlassian.com/aui/8.7/docs/images/avatar-person.svg"
                      width="30" height="30"
                      alt="User Avatar"
                    />
                  </Link>
                </div>
              </ul>
            </div>
          </div>
        </nav>
      )}

      {/* ─── STUDENT & UNAUTH NAVBAR ───────────────────────────────────── */}
      {(isStudent || (!isAdmin && !isInstructor && !isStudent)) && (
        <nav className="navbar navbar-expand-lg p-3 mb-5 navbar-dark custom-bg-color fixed-top">
          <div className="container-fluid"
               style={{ marginLeft: isMobile ? 0 : '15%', marginRight: isMobile ? 0 : '15%' }}>
            <a className="navbar-brand" href={NAVIGATE_TO_HOME}>
              <img src={LOGO} width="130" height="45" alt="Logo" />
            </a>
            <button className="navbar-toggler" type="button"
                    data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item mt-1 text-center">
                  <a className="nav-link" href={NAVIGATE_TO_PRICING}>
                    <h6 style={{ color: '#404040', fontWeight: 400 }}>Pricing</h6>
                  </a>
                </li>
                <li className="nav-item mt-1 text-center">
                  <a className="nav-link" href={NAVIGATE_TO_ABOUT}>
                    <h6 style={{ color: '#404040', fontWeight: 400 }}>About Us</h6>
                  </a>
                </li>
                <li className="nav-item mt-1 text-center">
                  <a className="nav-link" href={NAVIGATE_TO_NEWS}>
                    <h6 style={{ color: '#404040', fontWeight: 400 }}>News</h6>
                  </a>
                </li>
                <li className="nav-item mt-1 text-center">
                  <a className="nav-link" href={NAVIGATE_TO_FAQ}>
                    <h6 style={{ color: '#404040', fontWeight: 400 }}>FAQ</h6>
                  </a>
                </li>

                {CSLink}

                {isStudent ? (
                  <>
                    <li className="nav-item mt-1 text-center">
                      <a className="nav-link" href={NAVIGATE_TO_LOGIN} onClick={handleLogout}>
                        <h6 style={{ color: '#0056d2' }}>Logout</h6>
                      </a>
                    </li>
                    <div className="dropdown m-1 nav-item text-center">
                      <Link to={NAVIGATE_TO_PROFILE} className="nav-link d-flex align-items-center">
                        <h6 style={{ margin:0, marginRight:'10px', color:'#0056d2' }}>
                          Hi, {uData?.username?.split(' ')[0]}
                        </h6>
                        <img
                          src="https://aui.atlassian.com/aui/8.7/docs/images/avatar-person.svg"
                          width="30" height="30"
                          alt="User Avatar"
                        />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <li className="nav-item mt-1 text-center">
                      <a className="nav-link" href={NAVIGATE_TO_LOGIN}>
                        <h6 style={{ color: '#0056d2' }}>Login</h6>
                      </a>
                    </li>
                    <li className="nav-item mt-1 text-center" style={{
                      paddingLeft: '10px',
                      border: '2px solid #0056d2',
                      borderRadius: '5px',
                      height: '45px'
                    }}>
                      <a className="nav-link" href={NAVIGATE_TO_REGISTER}>
                        <h6 style={{ color: '#0056d2', fontWeight: 'bold' }}>Join for free</h6>
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
