import React from "react";
import FloatingDockDesktop from "./components/FloatingDockDesktop";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Lamp } from "./components/Lamp";
import Developers from "./components/Developers";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lamp />} />
        <Route path="/developers" element={<Developers />} />
        {/* <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />  */}
      </Routes>
    </Router>

  );
};

export default App;
{/* <div>
<div className="bg-black min-h-screen w-full select-none font-serif">
  <Lamp />

  <FloatingDockDesktop className="fixed bottom-20 left-1/2 -translate-x-1/2" />
</div>
</div> */}