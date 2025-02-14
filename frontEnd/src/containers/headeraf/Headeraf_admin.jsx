import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import axios from "axios";
import ai from '../../assets/ai.png';
import './headeraf.css';

const Navbar = ({ firstname, lastname, handleSignOut }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="gpt3__navbar-links">
        <div className="gpt3__navbar-links_logo">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="gpt3__navbar-links_container">
          <p onClick={() => navigate("/headeraf")}>Home</p>
          <p onClick={() => navigate("/client")}>Client</p>
          <p onClick={() => navigate("/cent")}>C-Enterprise</p>
          <p 
            onClick={() => window.open("http://localhost:3000/#/", "_blank")}
            style={{ fontWeight: "bold", color: "#800020", cursor: "pointer" }}
            >
            Admin Dashboard
            </p>

        
        </div>
        
      </div>
      <div className="gpt3__navbar-user">
        <p>Welcome, <strong>{firstname || "Guest"} {lastname || ""}</strong>!</p>
      </div>
      <div className="gpt3__navbar-sign">
        <button type="button" onClick={handleSignOut}>Sign Out</button>
      </div>
    </nav>
  );
};

const Headeraf_admin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
    
      axios.get("http://localhost:5000/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setFirstname(response.data.firstname);
        setLastname(response.data.lastname);
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
      });
    
    }, [navigate]);
  

  const handleSignOut = () => {
    localStorage.clear();
    alert("Logged out successfully!");
    navigate("/login"); 
  };

  return (
    <div className="client-container gradient__bg">
      <Navbar firstname={firstname} lastname={lastname} handleSignOut={handleSignOut} />
      <div className="gpt3__header section__padding" id="home">
        <div className="gpt3__header-content">
          <h1 className="gradient__text">Welcome Back!</h1>
          <p>You are successfully logged in.</p>
          <div className="gpt3__header-content__input">
            <button type="button" onClick={() => navigate("/client")}>Get Started</button>
          </div>
        </div>
        <div className="gpt3__header-image">
          <img src={ai} alt="AI" />
        </div>
      </div>
    </div>
  );
};

export default Headeraf_admin;
