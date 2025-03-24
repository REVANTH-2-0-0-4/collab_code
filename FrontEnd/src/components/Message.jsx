import React, { useState } from "react";

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Message = ({
  message,
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
    <div className={`mb-2 flex ${isSender ? "justify-end" : "justify-start"} relative`}>
      {/* Buttons for Sender (Edit & Delete) */}
      {isSender && menuOpen && (
        <div className="flex flex-col mr-2 bg-gray-800 p-2 rounded-md shadow-md text-white text-xs z-10">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 hover:bg-gray-700 rounded"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 hover:bg-gray-700 rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => {
              onDelete(message._id);
              setMenuOpen(false);
            }}
            className="px-2 py-1 hover:bg-gray-700 rounded text-red-300"
          >
            Delete
          </button>
        </div>
      )}

      {/* Message Container */}
      <div
        className={cn(
          "relative px-4 py-2 rounded-lg shadow-md max-w-[75%] w-fit group",
          isSender ? "bg-cyan-700/70 text-white" : "bg-gray-700/70 text-gray-200"
        )}
        style={{ minWidth: "100px" }} // Prevents size change on edit
      >
        {/* Sender's name */}
        <small className="text-[10px] block text-emerald-400">{sender}</small>

        {/* Message Text or Edit Mode */}
        {isEditing ? (
          <textarea
            className="text-sm font-inter break-words mb-2 w-full bg-transparent text-white border border-gray-400 rounded px-2 py-1 resize-none"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ height: "auto", minHeight: "40px" }} // Maintains original size
          />
        ) : (
          <p className="text-sm font-inter break-words mb-2">{content}</p>
        )}

        {/* Timestamp */}
        <div className="absolute bottom-0 right-2 text-indigo-300">
          <small className="text-[10px]">
            {timestamp?.split(",")[1]}
          </small>
        </div>

        {/* Down Arrow Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-1 right-1 text-gray-200 hover:text-gray-50"
        >hi
          <i className="ri-arrow-down-s-line text-lg"></i>
        </button>
      </div>

      {/* Buttons for Receiver (Only Delete) */}
      {!isSender && menuOpen && (
        <div className="flex flex-col ml-2 bg-gray-800 p-2 rounded-md shadow-md text-white text-xs z-10">
          <button
            onClick={() => {
              onDelete(message._id);
              setMenuOpen(false);
            }}
            className="px-2 py-1 hover:bg-gray-700 rounded text-red-300"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
