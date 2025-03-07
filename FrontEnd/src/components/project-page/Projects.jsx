import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FloatingDockDesktop from "../FloatingDockDesktop";
import axios from "../../config/axios.js";


export const HoverEffect = () => {
 
  const [projects, setProjects] = useState([]);
  const fetchProjects = useCallback(async () => {

    try {
      const res = await axios.get("/projects/all");
      console.log("Fetched projects:", res.data);
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, []);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (

    <div className=" bg-[#02162A] select-none min-h-screen p-10">
      <FloatingDockDesktop
        visibleItems={{
          home: true,
        }}
        className={`fixed top-15  left-[95%] -translate-x-1/2 `}
      />
      <div
        className={`grid grid-cols-1 md:grid-cols-2 pt-30 lg:grid-cols-6 py-10 `}
      >
        {projects?.map((item, idx) => (
          <a
            href={item?.link}
            key={item?.link}
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-gray-500 dark:bg-slate-800/[0.8] block rounded-3xl"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <Card>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
};

export const Card = ({ className, children }) => {
  return (
    <div
      className={`rounded-2xl h-full w-full p-4 overflow-hidden  bg-gray-600 border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20 ${className}`}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({ className, children }) => {
  return (
    <h4 className={`text-zinc-100 font-bold tracking-wide mt-4 ${className}`}>
      {children}
    </h4>
  );
};

export const CardDescription = ({ className, children }) => {
  return (
    <p
      className={`mt-8 text-zinc-400 tracking-wide leading-relaxed text-sm ${className}`}
    >
      {children}
    </p>
  );
};
