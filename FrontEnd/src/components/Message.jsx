import React, { useState, useRef, useEffect } from 'react';
import { FiEdit3, FiTrash2, FiCopy, FiX } from 'react-icons/fi';

const Message = ({
  message,
  sender,
  content,
  timestamp,
  userEmail,
  onDelete,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef(null);
  const messageRef = useRef(null);
  const editTextareaRef = useRef(null);

  const isSender = sender === userEmail;

  // Handle outside click to close context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current && 
        !contextMenuRef.current.contains(event.target) &&
        messageRef.current &&
        !messageRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit(message._id, editedContent);
      setIsEditing(false);
      setShowContextMenu(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
    setShowContextMenu(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setShowContextMenu(false);
  };

  return (
    <div 
      ref={messageRef}
      onContextMenu={handleContextMenu}
      className={`
        relative flex ${isSender ? 'justify-end' : 'justify-start'} 
        mb-4 group
      `}
    >
      {/* Message Container */}
      <div 
        className={`
          relative max-w-[75%] w-full p-3 rounded-lg shadow-md
          ${isSender 
            ? 'bg-cyan-700/70 text-white' 
            : 'bg-gray-700/70 text-gray-200'}
          transition-all duration-300
        `}
        style={{ minWidth: "100px" }}
      >
        {/* Sender Name */}
        <div className="flex justify-between items-center mb-2">
          <span className={`
            text-xs font-semibold 
            ${isSender ? 'text-emerald-400' : 'text-gray-400'}
          `}>
            {sender}
          </span>
        </div>

        {/* Message Content */}
        {isEditing ? (
          <div 
            className="relative"
            style={{ width: '100%', overscrollBehavior: 'contain' }}
          >
            <textarea
              ref={editTextareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={`
                w-full p-2 rounded-md 
                ${isSender 
                  ? 'bg-cyan-700/70 text-white' 
                  : 'bg-gray-700/70 text-gray-200'}
                focus:outline-none
                resize-none
                overflow-hidden
              `}
              style={{
                height: 'auto',
                minHeight: '100px',
                overflowY: 'auto',
                scrollbarWidth: 'none', // For Firefox
                msOverflowStyle: 'none', // For Internet Explorer and Edge
              }}
              rows={5}
              autoFocus
            />
            {/* Hide scrollbar for WebKit browsers */}
            <style jsx>{`
              textarea::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        ) : (
          <p className="text-sm break-words">{content}</p>
        )}

        {/* Timestamp */}
        <div className={`
          text-right text-xs opacity-70 mt-2
          ${isSender ? 'text-indigo-300' : 'text-gray-400'}
        `}>
          {timestamp?.split(',')[1]}
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          ref={contextMenuRef}
          className="
            absolute z-50 right-0 top-full 
            bg-gray-800 shadow-lg rounded-md 
            py-2 w-48 text-white
            text-xs
          "
        >
          {isSender && !isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setShowContextMenu(true);
              }}
              className="
                flex items-center w-full px-4 py-2 
                hover:bg-gray-700 rounded
              "
            >
              <FiEdit3 className="mr-2" /> Edit
            </button>
          )}
          
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="
                  flex items-center w-full px-4 py-2 
                  hover:bg-gray-700 rounded
                "
              >
                <FiEdit3 className="mr-2" /> Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="
                  flex items-center w-full px-4 py-2 
                  hover:bg-gray-700 rounded
                "
              >
                <FiX className="mr-2" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="
                  flex items-center w-full px-4 py-2 
                  hover:bg-gray-700 rounded
                "
              >
                <FiCopy className="mr-2" /> Copy
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;