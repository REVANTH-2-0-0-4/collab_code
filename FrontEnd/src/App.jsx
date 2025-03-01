import React from "react";
import FloatingDockDesktop from "./components/FloatingDockDesktop";
import { Lamp } from "./components/Lamp";

const App = () => {
  return (
    <div>
      <div className="bg-black min-h-screen w-full select-none">
        <Lamp />

        <FloatingDockDesktop className="fixed bottom-20 left-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};

export default App;
