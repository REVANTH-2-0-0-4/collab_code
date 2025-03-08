import React from "react";
import { useLocation } from "react-router-dom";
import { TbUsers } from "react-icons/tb";
import { TbUsersPlus } from "react-icons/tb";
const Editor = () => {
  const location = useLocation();
  const projectData = location?.state?.projectdata;
  // console.log(projectData);

  return (
    <div className="font-serif flex h-screen p-4 justify-center w-full bg-gradient-to-br from-[#02091B] to-[#014860] select-none">
      {/* Left sidebar */}
      <div className="w-[26vw] text-gray-400 p-1 text-2xl  bg-gray-700 h-full rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-800 flex  justify-between items-center  px-4 py-2 rounded-lg">
          <span>{projectData.name}</span>
          <span className="flex space-x-3">
            <TbUsers />
            <TbUsersPlus />
          </span>
        </div>
        <div className="bg-blue-800 h-auto flex  justify-between items-center  px-4 py-2 rounded-lg">
          space to display messages
        </div>
        <div className="bg-gray-800 flex  justify-between items-center  px-4 py-2 rounded-lg">
          input bar
        </div>
      </div>

      {/* Main content area */}
      <div className="w-[70vw] flex h-full rounded-lg ml-2">
        {/* Secondary sidebar */}
        <div className="w-[18%] bg-gray-700 h-full rounded-lg shadow-lg overflow-hidden"></div>

        {/* Main editor space */}
        <div className="w-[82%] ml-2 h-full rounded-lg flex flex-col gap-2">
          {/* Top panel */}
          <div className="w-full text-white p-4 rounded-lg h-[10%] bg-gray-700 shadow-lg"></div>

          {/* Bottom panel */}
          <div className="w-full text-white p-5 rounded-lg h-[90%] bg-gray-700 shadow-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
