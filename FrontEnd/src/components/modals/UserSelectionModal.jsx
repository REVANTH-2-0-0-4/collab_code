import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbX } from "react-icons/tb";

const UserSelectionModal = ({ isOpen, onClose, users, selectedUsers, setSelectedUsers }) => {
  if (!isOpen) return null;

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId) // Remove if already selected
        : [...prevSelected, userId] // Add if not selected
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-md z-50 "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 1.5 } }} // Ultra-slow fade-in
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
      >
        <motion.div
          className="bg-[#0A1E2E] text-white rounded-lg shadow-lg w-full max-w-lg p-6 relative "
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 1.5, ease: "easeOut" } }} // Ultra-slow opening
          exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.5 } }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
          >
            <TbX size={24} />
          </button>

          {/* Modal Header */}
          <h2 className="text-2xl font-semibold mb-4 text-center">Select Users</h2>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto pr-2" style={{ scrollbarWidth: "none" }}>
            {users.map((user) => (
              <div
                key={user._id} // Now correctly using user._id
                className={`flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition ${
                  selectedUsers.includes(user._id)
                    ? "bg-[#0E3A5A] text-[#00BEDE] shadow-md"
                    : "bg-[#112233] hover:bg-[#0D2A46]"
                }`}
                onClick={() => toggleUserSelection(user._id)} // Corrected toggle function
              >
                <div>
                  <p className="font-medium">{user.firstname}</p>
                  <p className="text-sm text-gray-300 mt-1 w-[250px] truncate">{user.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)} // Correctly reflects state
                  readOnly
                  className="w-5 h-5 accent-[#00BEDE]"
                />
              </div>
            ))}
          </div>

          {/* Glowing "Done" Button with Continuous Shine Effect */}
          <motion.button
            onClick={onClose}
            className="w-full mt-4 py-3 text-lg font-semibold text-white rounded-lg relative overflow-hidden bg-[#0088A8] shadow-lg"
            animate={{
              boxShadow: [
                "0px 0px 15px 5px #00BEDE",
                "0px 0px 25px 8px #00BEDE",
                "0px 0px 15px 5px #00BEDE",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            Done
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserSelectionModal;
