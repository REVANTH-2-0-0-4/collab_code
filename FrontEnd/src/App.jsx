import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Lamp } from "./components/Lamp";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { HoverEffect } from "./components/project-page/projects";

import { Developers } from "./components/Developers";

const App = () => {
  const items = [
    {
      title: "Item 1",
      description: "This is the description for item 1.",
      link: "https://example.com/1",
    },
    {
      title: "Item 2",
      description: "This is the description for item 2.",
      link: "https://example.com/2",
    },
    {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    },
    {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    },
    {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    }, {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    }, {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    }, {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    }, {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    }, {
      title: "Item 3",
      description: "This is the description for item 3.",
      link: "https://example.com/3",
    },
  ];

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lamp />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/projects" element={  <HoverEffect items={items} className="custom-class" />} />
        {/* <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />  */}
      </Routes>
    </Router>
  );
};

export default App;
{
  /* <div>
<div className="bg-black min-h-screen w-full select-none font-serif">
  <Lamp />

  <FloatingDockDesktop className="fixed bottom-20 left-1/2 -translate-x-1/2" />
</div>
</div> */
}
