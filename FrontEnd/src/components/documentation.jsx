import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TypewriterEffect } from './TypewriterEffect';
import { Lamp, LampContainer } from './Lamp';
import { World } from '../components/globe/globe';
import FloatingDockDesktop from './FloatingDockDesktop';

const DocumentationPage = () => {
  // Configuration for globe
  const globeConfig = {
    ambientLight: "#ffffff",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    globeColor: "#020E1A",
    emissive: "#014860",
    emissiveIntensity: 0.2,
    shininess: 0.9,
  };
  
  // Sample data for globe connections
  const globeData = [
    { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060, arcAlt: 0.3, color: "#4FD1C5", order: 1 },
    { startLat: 51.5074, startLng: -0.1278, endLat: 48.8566, endLng: 2.3522, arcAlt: 0.2, color: "#4FD1C5", order: 2 },
    { startLat: 35.6762, startLng: 139.6503, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.4, color: "#4FD1C5", order: 3 },
    { startLat: -33.8688, startLng: 151.2093, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.3, color: "#4FD1C5", order: 4 },
    { startLat: 19.4326, startLng: -99.1332, endLat: -34.6037, endLng: -58.3816, arcAlt: 0.5, color: "#4FD1C5", order: 5 },
  ];

  // All sections for the documentation
  const sections = [
    {
      id: "overview",
      title: "Overview",
      content: "Collab Code is a modern messaging application leveraging Socket.io for real-time communication and integrating Gemini AI for AI-powered responses. Users can interact with Gemini AI during conversations by starting their messages with @ai. The application is built using the MERN stack (MongoDB, Express, React, Node.js) and incorporates various technologies to ensure seamless functionality."
    },
    {
      id: "features",
      title: "Features",
      content: [
        "Real-time messaging using Socket.io",
        "AI-powered responses with Gemini AI",
        "Secure authentication and session management",
        "Scalable architecture with robust backend and frontend segregation",
        "Comprehensive input validation and error handling"
      ]
    },
    {
      id: "tech-stack",
      title: "Tech Stack",
      content: [
        "Frontend: React.js",
        "Backend: Node.js, Express.js",
        "Database: MongoDB (with Mongoose for ODM)",
        "Real-time Communication: Socket.io"
      ]
    },
    {
      id: "folder-structure",
      title: "Folder Structure",
      codeBlock: `COLLAB CODE
├── backend
│   ├── routes
│   ├── services
│   ├── controllers
│   ├── db
│   │   └── models
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend
│   └── [React.js architecture]
├── notes.md`
    },
    {
      id: "npm-packages",
      title: "Key NPM Packages",
      tables: [
        {
          title: "Backend Packages",
          headers: ["Package", "Description"],
          rows: [
            ["express", "Web framework for handling routes, middleware, and HTTP requests/responses"],
            ["mongoose", "Object Data Modeling (ODM) library for MongoDB"],
            ["bcrypt", "Library for hashing passwords securely"],
            ["cookie-parser", "Middleware to parse cookies from incoming requests"],
            ["jsonwebtoken", "Used for token-based authentication"],
            ["nodemon", "Development tool for automatic server restarting"],
            ["morgan", "HTTP request logger middleware"],
            ["dotenv", "Loads environment variables from .env file"],
            ["cors", "Middleware for handling Cross-Origin Resource Sharing"],
            ["express-validator", "Library for validating and sanitizing user inputs"]
          ]
        },
        {
          title: "Frontend Packages",
          headers: ["Package", "Description"],
          rows: [
            ["react", "JavaScript library for building user interfaces"],
            ["react-dom", "Handles rendering React components to the DOM"],
            ["axios", "Promise-based HTTP client for API requests"]
          ]
        }
      ]
    },
    {
      id: "installation",
      title: "Installation",
      subsections: [
        {
          title: "Prerequisites",
          content: [
            "Node.js and npm installed",
            "MongoDB installed and running"
          ]
        },
        {
          title: "Steps",
          steps: [
            {
              text: "Clone the repository:",
              code: "git clone https://github.com/your-repo/COLLAB-CODE.git"
            },
            {
              text: "Navigate to the project folder:",
              code: "cd COLLAB-CODE"
            },
            {
              text: "Install backend dependencies:",
              code: "cd backend\nnpm install"
            },
            {
              text: "Install frontend dependencies:",
              code: "cd ../frontend\nnpm install"
            },
            {
              text: "Configure environment variables:",
              subtext: "Create a .env file in the backend folder.",
              code: "PORT=3000\nMONGO_URI=your_mongodb_connection_string\nJWT_SECRET=your_jwt_secret"
            },
            {
              text: "Start the development server:",
              subtext: "For backend:",
              code: "cd backend\nnpm run dev",
              secondSubtext: "For frontend:",
              secondCode: "cd ../frontend\nnpm start"
            }
          ]
        }
      ]
    },
    {
      id: "usage",
      title: "Usage",
      steps: [
        {
          text: "Open the application in your browser at http://localhost:3000."
        },
        {
          text: "Sign up or log in to access the messaging interface."
        },
        {
          text: "To interact with Gemini AI, start your message with @ai. For example:",
          code: "@ai What is the weather today?"
        }
      ]
    },
    {
      id: "contributing",
      title: "Contributing",
      content: "We welcome contributions to enhance the functionality and performance of Collab Code. Please create a pull request with a detailed description of your changes."
    },
    {
      id: "license",
      title: "License",
      content: "This project is licensed under the MIT License."
    },
    {
      id: "acknowledgments",
      title: "Acknowledgments",
      content: [
        "Socket.io for enabling real-time communication",
        "Gemini AI for intelligent, conversational responses",
        "The open-source community for providing inspiration and tools"
      ]
    }
  ];

  const [activeSection, setActiveSection] = useState(sections[0].id);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-serif bg-gradient-to-br from-[#02091B] to-[#014860] text-white overflow-hidden">
      <div className="h-16"></div> {/* Space for floating dock */}
      
      {/* Floating dock */}
      <FloatingDockDesktop
        visibleItems={{
          login: true,
          signup: true,
          home: true,
          docs: true,
          team: true,
          projects: true,
        }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      />
      
      {/* Header with lamp effect */}
      <div className="h-96 mb-8">
        <LampContainer className="h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="z-50 flex -translate-y-80 flex-col items-center px-5"
          >
            <motion.h1
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="mt-8 bg-gradient-to-br from-slate-100 to-cyan-200 py-4 bg-clip-text text-center text-4xl font-medium tracking-tighter text-transparent md:text-6xl"
            >
              Collab Code<br />
              <span className="text-2xl md:text-4xl">Documentation</span>
            </motion.h1>
            <div className="mt-4 md:mt-8">
              <TypewriterEffect
                words={[
                  { text: "Real-time " },
                  { text: "Collaboration " },
                  { text: "and" },
                  { text: "AI " },
                  { text: "Integration." }
                ]}
                className="bg-gradient-to-br from-slate-300 to-cyan-300 bg-clip-text text-transparent text-xl md:text-3xl"
              />
            </div>
          </motion.div>
        </LampContainer>
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Navigation sidebar */}
        <div className="lg:flex gap-8">
          <div className="w-full lg:w-64 lg:sticky lg:top-8 h-fit mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#031A2B]/60 p-4 rounded-lg backdrop-blur-sm border border-cyan-800/30"
            >
              <h2 className="text-xl font-bold mb-4 text-cyan-300">Contents</h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`text-left w-full py-1 px-2 rounded transition-colors ${
                        activeSection === section.id
                          ? "bg-cyan-700/30 text-cyan-200"
                          : "hover:bg-[#031E34] text-slate-300"
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Globe visualization */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-8 h-64 bg-[#031A2B]/60 rounded-lg overflow-hidden border border-cyan-800/30"
            >
              <div className="h-full">
                <World globeConfig={globeConfig} data={globeData} />
              </div>
            </motion.div>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-16"
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 1 }}
                  className="h-0.5 bg-gradient-to-r from-cyan-600 via-cyan-400 to-transparent mb-4"
                />
                
                <h2 className="text-3xl font-bold mb-6 text-cyan-300">{section.title}</h2>
                
                {section.content && !Array.isArray(section.content) && (
                  <p className="text-slate-300 mb-6 leading-relaxed">{section.content}</p>
                )}
                
                {section.content && Array.isArray(section.content) && (
                  <ul className="list-disc list-inside space-y-2 mb-6">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-slate-300">{item}</li>
                    ))}
                  </ul>
                )}
                
                {section.codeBlock && (
                  <div className="bg-[#031E34] rounded-lg p-4 mb-6 overflow-x-auto">
                    <pre className="text-slate-300 font-mono text-sm">
                      {section.codeBlock}
                    </pre>
                  </div>
                )}
                
                {section.tables && section.tables.map((table, i) => (
                  <div key={i} className="mb-8">
                    <h3 className="text-xl font-semibold mb-3 text-cyan-200">{table.title}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse mb-6">
                        <thead>
                          <tr className="bg-[#031E34] border-b border-cyan-800/50">
                            {table.headers.map((header, j) => (
                              <th key={j} className="p-3 text-left text-cyan-400">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, j) => (
                            <tr key={j} className="border-b border-cyan-900/30 hover:bg-[#031E34]/50">
                              {row.map((cell, k) => (
                                <td key={k} className="p-3 text-slate-300">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                {section.subsections && section.subsections.map((subsection, i) => (
                  <div key={i} className="mb-6">
                    <h3 className="text-xl font-semibold mb-3 text-cyan-200">{subsection.title}</h3>
                    
                    {subsection.content && Array.isArray(subsection.content) && (
                      <ul className="list-disc list-inside space-y-2 mb-4">
                        {subsection.content.map((item, j) => (
                          <li key={j} className="text-slate-300">{item}</li>
                        ))}
                      </ul>
                    )}
                    
                    {subsection.steps && (
                      <ol className="space-y-4 mb-4">
                        {subsection.steps.map((step, j) => (
                          <li key={j} className="text-slate-300">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                {j + 1}
                              </span>
                              <span className="font-medium">{step.text}</span>
                            </div>
                            
                            {step.subtext && (
                              <p className="ml-8 text-slate-400 mb-2">{step.subtext}</p>
                            )}
                            
                            {step.code && (
                              <div className="ml-8 bg-[#031E34] rounded-lg p-3 mb-3 overflow-x-auto">
                                <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                                  {step.code}
                                </pre>
                              </div>
                            )}
                            
                            {step.secondSubtext && (
                              <p className="ml-8 text-slate-400 mb-2">{step.secondSubtext}</p>
                            )}
                            
                            {step.secondCode && (
                              <div className="ml-8 bg-[#031E34] rounded-lg p-3 mb-2 overflow-x-auto">
                                <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                                  {step.secondCode}
                                </pre>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
                
                {section.steps && (
                  <ol className="space-y-4 mb-6">
                    {section.steps.map((step, i) => (
                      <li key={i} className="text-slate-300">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {i + 1}
                          </span>
                          <span className="font-medium">{step.text}</span>
                        </div>
                        
                        {step.code && (
                          <div className="ml-8 bg-[#031E34] rounded-lg p-3 my-2 overflow-x-auto">
                            <pre className="text-slate-300 font-mono text-sm">
                              {step.code}
                            </pre>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </motion.section>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-16 mb-24 pt-8 border-t border-cyan-800/30">
          <div className="text-center text-slate-400">
            <p>© 2025 Collab Code. All rights reserved.</p>
            <p className="mt-2">For questions or feedback, please contact us.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;