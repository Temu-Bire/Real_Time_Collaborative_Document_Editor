import React, { useState, useRef, useEffect } from "react";

const EditableTitle = ({ title, onTitleChange, onTitleSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const textareaRef = useRef(null);

  // Sync internal state if prop updates externally
  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  // Dynamically resize height based on content length
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustHeight();
    }
  }, [isEditing, currentTitle]);

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = currentTitle.trim() || "Untitled Document";
    setCurrentTitle(trimmed);
    if (trimmed !== title) {
      onTitleSave(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    // Save on Enter without shift (Shift+Enter allows deliberate multi-line titles if needed)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  };

  return (
    <div className="flex-1 max-w-2xl min-w-[200px]">
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={currentTitle}
          onChange={(e) => {
            setCurrentTitle(e.target.value);
            onTitleChange(e.target.value);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={1}
          autoFocus
          className="w-full bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-slate-100 font-bold text-lg sm:text-xl px-2 py-1 rounded-lg border border-indigo-500 focus:outline-none resize-none overflow-hidden transition-all leading-snug"
        />
      ) : (
        <h1
          onClick={() => setIsEditing(true)}
          className="font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition whitespace-pre-wrap break-words leading-snug"
          title="Click to rename"
        >
          {currentTitle || "Untitled Document"}
        </h1>
      )}
    </div>
  );
};

export default EditableTitle;