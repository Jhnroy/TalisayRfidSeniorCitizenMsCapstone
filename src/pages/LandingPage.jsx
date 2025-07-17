import React from "react";

import FeatureCard from "../components/FeatureCard";
import SeniorHeroImage from "../assets/seniors-hero.png";
import Accordion from "../components/Accordion";

import { LuSearch, LuClock2 } from "react-icons/lu";
import { FaMicrophone } from "react-icons/fa";
import { FaRegFolder } from "react-icons/fa6";
import { CgFileDocument } from "react-icons/cg";
import { TbMessageCircleQuestion } from "react-icons/tb";

const LandingPage = () => {
  const FeatureList = [
    {
      icon: CgFileDocument,
      title: "Check Pension Status",
      description: "View your current pension status and upcoming payments.",
      buttonLabel: "Check Status",
      buttonLink: "/status",
    },
    {
      icon: FaRegFolder,
      title: "Document Requirements",
      description: "Learn what documents you need for pension applications.",
      buttonLabel: "View Documents",
      buttonLink: "/documents",
    },
    {
      icon: LuClock2,
      title: "Payment Schedule",
      description: "Find out when your pension payments will be deposited.",
      buttonLabel: "View Schedule",
      buttonLink: "/schedule",
    },
    {
      icon: TbMessageCircleQuestion,
      title: "Contact Support",
      description: "Get help from our dedicated pension support team.",
      buttonLabel: "Contact Us",
      buttonLink: "/contact",
    },
  ];

  return (
    <main>
      <section className="relative h-[400px] flex items-center justify-start overflow-hidden">
        <img
          src={SeniorHeroImage}
          alt="Senior Citizens"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-600/15 to-orange-600/70"></div>
        <div className="relative z-10 text-white px-10 max-w-xl">
          <h1 className="text-4xl font-roboto font-bold leading-tight">
            SENIOR CITIZEN <br /> MANAGEMENT <br /> SYSTEM
          </h1>
          <p className="mt-4  font-inter text-sm">
            Welcome to our registration portal, exclusively designed to serve
            and support our esteemed senior citizens.
          </p>
          <button className="mt-6 bg-white border-2 border-orange-500 text-orange-600 px-6 py-2 rounded-md font-inter font-semibold hover:bg-orange-500 hover:border-white hover:text-white cursor-pointer transition">
            Learn More
          </button>
        </div>
      </section>

      <section className="mt-10 flex flex-col items-center p-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-inter text-gray-700 font-semibold">
            How Can We Help You Today?
          </h1>
        </div>
        <div className="mt-6 flex items-center bg-gray-100 rounded-xl shadow-md px-5 py-4 w-full max-w-4xl h-16">
          <LuSearch className="text-gray-500 text-2xl mr-3" />
          <input
            type="text"
            placeholder="Enter your questions here……"
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-lg"
          />
          <FaMicrophone className="text-gray-500 text-2xl ml-3" />
        </div>
        <button className="mt-6 cursor-pointer w-full max-w-4xl bg-orange-600 text-white text-lg font-semibold py-3 rounded-xl shadow-md hover:bg-orange-700 transition">
          Search
        </button>

        <p className="mt-3 text-sm text-gray-500">
          Popular searches: pension eligibility, payment dates, document
          requirements
        </p>
      </section>

      <section className="mt-10 flex flex-col items-center p-4 bg-gray-100">
        <div className="mt-10">
          <h1 className="text-3xl md:text-4xl font-inter text-gray-700 font-semibold">
            Quick Access
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {FeatureList.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      <section className="mt-10 flex flex-col items-center p-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-inter text-gray-700 font-semibold">
            Frequently Asked Questions
          </h1>
        </div>
        <div className="max-w-xl mx-auto mt-8 p-6">
          <Accordion title="Test" content="Test Description" />
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
