import React, { useState, useEffect, useRef } from "react";
import { Edit2, Check } from "lucide-react";

const EditableTitle = ({ title, onTitleChange, onTitleSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title || "Untitled Document");
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentTitle(title || "Untitled Document");
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const finalTitle = currentTitle.trim() || "Untitled Document";
    setCurrentTitle(finalTitle);
    if (onTitleChange) onTitleChange(finalTitle);
    if (onTitleSave) onTitleSave(finalTitle);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setCurrentTitle(title || "Untitled Document");
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const newTitle = e.target.value;
    setCurrentTitle(newTitle);
    if (onTitleChange) onTitleChange(newTitle);
  };

  return (
    <div className="relative flex items-center group max-w-md">
      {isEditing ? (
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={currentTitle}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-lg sm:text-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1 rounded-lg border-2 border-indigo-600 outline-none shadow-xs transition"
          />
          <button
            type="button"
            onMouseDown={handleBlur}
            className="absolute right-2 top-2 text-indigo-600 dark:text-indigo-400 p-0.5 rounded"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-text"
          title="Click to rename document"
        >
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-[400px]">
            {currentTitle}
          </span>
          <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      )}
    </div>
  );
};

export default EditableTitle;
