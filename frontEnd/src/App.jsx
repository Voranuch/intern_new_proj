import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FormA from "./Form/FormA";
import FormB from "./Form/FormB";
import FormC from "./Form/FormC";
import FormD from "./Form/FormD";
import FormHeader from "./Form_header";
import BuyOffForm from "./buyoff_form";
import AdminApp from "../../admin/src/AdminApp"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { favlevel0 as Fav0, centheader as Centheader } from "./centerprise";
import {
  Footer,
  Header,
  Client,
  Login,
  Register,
  Cent,
  Headeraf,
  Headeraf_admin,
} from "./containers";
import { Navbar } from "./Components";
import "./App.css";

function App() {
  const Layout = ({ children }) => (
    <div className="App">
      <div className="gradient__bg">
        <Navbar />
        <Header />
      </div>
      {children}
    </div>
  );

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    console.log("Token in ProtectedRoute:", token);
    return token ? children : <Navigate to="/login" />;
  };

  const isAdminRoute = window.location.pathname.startsWith("/admin"); // FIXED

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Header /></Layout>} />
        <Route path="/formheader" element={<FormHeader />} />
        <Route path="/headeraf" element={<ProtectedRoute><Headeraf /></ProtectedRoute>} />
        <Route path="/headerafadmin" element={<ProtectedRoute><Headeraf_admin /></ProtectedRoute>} />
        <Route path="/buyoff_form" element={<BuyOffForm />} />
        <Route path="/formA" element={<FormA />} />
        <Route path="/formB" element={<FormB />} />
        <Route path="/formC" element={<FormC />} />
        <Route path="/formD" element={<FormD />} />
        <Route path="/client" element={<Client />} />
        <Route path="/cent" element={<Cent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Fav0" element={<Fav0 />} />
        <Route path="/Centheader" element={<Centheader />} />
        <Route path="/admin" element={<Navigate to="http://localhost:3000/#/" replace />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </BrowserRouter>
  );
}

export default App;
