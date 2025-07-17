import React from "react";
import { Link } from "react-router-dom";

const FeatureCard = (props) => {
  const { icon: Icon, title, description, buttonLabel, buttonLink } = props;

  return (
    <div className="bg-white rounded-2xl shadow-md px-6 py-12 hover:shadow-lg transition duration-300 flex flex-col items-center space-y-6 h-[400px] hover:scale-105">
      <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center">
        <Icon className="text-4xl text-orange-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        {title}
      </h3>
      <p className="text-gray-600 text-sm text-center px-4">{description}</p>
      {buttonLink && buttonLabel && (
        <Link
          to={buttonLink}
          className="bg-gray-100 rounded-lg text-orange-500 py-2 px-4 hover:bg-orange-500 hover:text-white transition duration-300 mt-auto"
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
};

export default FeatureCard;
