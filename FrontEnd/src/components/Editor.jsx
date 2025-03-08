import React from "react";
import { useLocation } from "react-router-dom";

const Editor = () => {
  const location = useLocation();
  const projectData = location?.state?.projectdata;
  // console.log(projectData);

  return (
    <div className="flex flex-col font-serif h-screen items-center select-none justify-center w-full bg-gradient-to-br from-[#02091B] to-[#014860]">
      <div className="text-4xl text-white">
        THIS IS THE EDITOR PAGE OF {projectData.name.toUpperCase()}
      </div>
      <div className="text-xl text-gray-500">
        ..........................development under progress
      </div>
    </div>
  );
};

export default Editor;
