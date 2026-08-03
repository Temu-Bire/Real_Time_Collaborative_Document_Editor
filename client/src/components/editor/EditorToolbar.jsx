import React from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
  BookOpen,
  Scissors,
} from "lucide-react";
const ToolbarButton = ({ active, onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded border-none bg-transparent cursor-pointer transition-colors inline-flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold" : ""
    }`}
    title={title}
  >
    {children}
  </button>
);

const EditorToolbar = ({ editor, pageCount, isReadOnly = false }) => {
  if (!editor) return null;

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-[57px] z-30 w-full max-w-[210mm] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-1.5 mb-6 flex flex-wrap items-center justify-between gap-1 transition-colors">
      <div className="flex items-center gap-0.5 overflow-x-auto py-0.5 max-w-full">
        {isReadOnly ? (
          <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800">
            Read-only mode — editing disabled
          </span>
        ) : (
          <>
            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={isReadOnly}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={isReadOnly}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={isReadOnly}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={isReadOnly}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <ToolbarButton
              active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              disabled={isReadOnly}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={isReadOnly}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={isReadOnly}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={isReadOnly}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              disabled={isReadOnly}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              disabled={isReadOnly}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              disabled={isReadOnly}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <ToolbarButton
              active={editor.isActive("link")}
              onClick={handleSetLink}
              disabled={isReadOnly}
              title="Hyperlink"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={isReadOnly}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setPageBreak().run()}
              disabled={isReadOnly}
              title="Insert Page Break"
            >
              <Scissors className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={isReadOnly || !editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={isReadOnly || !editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
        <BookOpen className="w-3.5 h-3.5" />
        <span>
          {pageCount} Page{pageCount > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};

export default EditorToolbar;
