import React from "react";
import { Link } from "react-router-dom";

import { BsTelephoneFill } from "react-icons/bs";

import TalisayLogo from "../assets/Talisay-Logo.png";
const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="grid grid-cols-2 items-center p-4">
        <div>
          <Link to="/">
            <img src={TalisayLogo} alt="talisay-logo" className="w-16" />
          </Link>
        </div>
        <div className="flex justify-end">
          <ul className="flex items-center space-x-10">
            <li>
              <Link to="/home" className="hover:text-orange-500">
                Home
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-orange-500">
                Services
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-orange-500">
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="group flex items-center gap-2 bg-gray-300 py-2 px-10 rounded-2xl mr-10 hover:bg-orange-500 hover:text-white"
              >
                <BsTelephoneFill className="text-2xl text-orange-500 group-hover:text-white transition-colors duration-200" />
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
