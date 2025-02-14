import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import logo from '../../assets/logo.png';
import './client.css';

const Client = () => {
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");

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
    

    const handleSelect = (label) => {
        setSelected(label);
        console.log(`${label} selected`);
    };

    // Navbar Component inside Client
    const Navbar = ({ firstname, lastname }) => {
        return (
            <nav className="navbar">
                <div className="gpt3__navbar-links">
                    <div className="gpt3__navbar-links_logo">
                        <img src={logo} alt="Western Digital Logo" className="logo" />
                    </div>
                    <div className="gpt3__navbar-links_container">
                        <p onClick={() => navigate("/headeraf")}>Home</p>
                        <p onClick={() => navigate("/cent")}>C-Enterprise</p>
                    </div>
                    <div className="gpt3__navbar-user">
                        <p>Welcome, <strong>{firstname} {lastname}</strong>!</p>
                    </div>
                </div>
            </nav>
        );
    };

    return (
        <div className="client-container gradient__bg">
            <Navbar firstname={firstname} lastname={lastname} />
            <div className="hero-sectionm text-center">
                <h1 className="gradient__text">Welcome to Client / Hybrid</h1>
                <p style={{color:"white"}}>buy-off system</p>
            </div>
            <div className="content">
                <div className="card-container">
                    <div className="card" onClick={() => handleSelect('Carton Label')}>
                        <h3>Carton Label</h3>
                        <button className="btn" onClick={(e) => { e.stopPropagation(); navigate("/formheader"); }}>
                            Click
                        </button>
                    </div>
                    <div className="card" onClick={() => navigate("/formheader")}>
                        <h3>Pallet Label</h3>
                        <button className="btn">Click</button>
                    </div>
                </div>
            </div>
            {selected && <div className="selection">You selected: {selected}</div>}
        </div>
    );
};

export default Client;
