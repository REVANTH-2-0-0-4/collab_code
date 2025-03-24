import React, { useState } from "react";
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Message = ({
  message,         // full message object (for _id, etc.)
  sender, 
  content, 
  timestamp, 
  userEmail, 
  onDelete, 
  onEdit 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const isSender = sender === userEmail;

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit(message._id, editedContent);
      setIsEditing(false);
      setMenuOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
    setMenuOpen(false);
  };

  return (
    <div className={`mb-2 flex ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={cn(
          "relative px-4 py-2 rounded-lg shadow-md max-w-[75%] w-fit group",
          isSender
            ? "bg-cyan-700/70 text-white self-end"
            : "bg-gray-700/70 text-gray-200 self-start"
        )}
      >
        {/* Sender's name */}
        <small className="text-[10px] block text-emerald-400">{sender}</small>

        {/* If editing, show textarea; otherwise show message content */}
        {isEditing ? (
          <textarea
            className="text-sm font-inter break-words mb-2 w-full bg-transparent text-white"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        ) : (
          <p className="text-sm font-inter break-words mb-2">{content}</p>
        )}

        {/* Timestamp at bottom-right */}
        <div className="absolute bottom-0 right-2 text-indigo-300">
          <small className="text-[10px]">
            {timestamp?.split(",")[1]}
          </small>
        </div>

        {/* Down arrow button (always visible) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-1 right-1 text-gray-200 hover:text-gray-50"
        >
          <i className="ri-arrow-down-double-line text-lg"></i>
        </button>

        {/* On arrow click, show Edit/Delete options */}
        {menuOpen && (
          <div
            className={`absolute top-6 ${isSender ? "left-1" : "right-1"} bg-gray-800 text-white rounded-md shadow-md p-2 text-xs z-10`}
          >
            {/* If not editing, show Edit button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Delete button */}
            <button
              onClick={() => {
                onDelete(message._id);
                setMenuOpen(false);
              }}
              className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-red-300"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
