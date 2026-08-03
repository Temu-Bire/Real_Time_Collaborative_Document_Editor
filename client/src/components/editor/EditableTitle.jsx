import React, { useState, useRef, useEffect } from "react";
const EditableTitle = ({ title, onTitleChange, onTitleSave, isReadOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const textareaRef = useRef(null);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  };

  return (
    <div className="flex-1 max-w-xl min-w-[180px]">
      {isEditing && !isReadOnly ? (
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
          className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-lg sm:text-xl px-2 py-1 rounded border border-indigo-500 outline-none resize-none overflow-hidden leading-tight font-sans"
        />
      ) : (
        <h1
          onClick={() => !isReadOnly && setIsEditing(true)}
          className={`font-semibold text-lg sm:text-xl text-slate-900 dark:text-slate-100 px-2 py-1 rounded transition-colors whitespace-pre-wrap break-words leading-tight ${
            !isReadOnly ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60" : "cursor-default"
          }`}
          title={!isReadOnly ? "Click to rename" : title}
        >
          {currentTitle || "Untitled Document"}
        </h1>
      )}
    </div>
  );
};

export default EditableTitle;
