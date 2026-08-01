import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  FileText,
  BookOpen,
} from "lucide-react";

const TextEditor = ({ content, setContent }) => {
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[900px] text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-relaxed",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const text = editor.getText();
      setContent(html);

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      setWordCount(words);
      setCharCount(chars);

      // Estimate document pages (standard ~350 words per A4 page, min 1)
      const estimatedPages = Math.max(1, Math.ceil(words / 350));
      setPageCount(estimatedPages);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
      setPageCount(Math.max(1, Math.ceil(words / 350)));
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Editor Formatting Toolbar */}
      <div className="sticky top-[65px] z-30 w-full max-w-4xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm p-2 mb-6 flex flex-wrap items-center justify-between gap-1 transition-colors">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {/* Bold */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("bold")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("italic")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("strike")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* H1 */}
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("heading", { level: 1 })
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          {/* H2 */}
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Bullet List */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("bulletList")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Ordered List */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("orderedList")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Blockquote */}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-xl text-xs font-semibold transition ${
              editor.isActive("blockquote")
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Undo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Page Badge info */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>Page 1 of {pageCount}</span>
        </div>
      </div>

      {/* Visual A4 Paper Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-14 md:p-16 min-h-[1050px] transition-all">
        {/* Editor Content Area */}
        <EditorContent editor={editor} />

        {/* Visual Page Break Indicators */}
        {Array.from({ length: pageCount }).map((_, idx) => (
          <div
            key={idx}
            className="absolute left-0 right-0 border-b-2 border-dashed border-slate-200 dark:border-slate-700/60 pointer-events-none flex justify-end pr-6 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-600"
            style={{ top: `${(idx + 1) * 980}px` }}
          >
            <span>Page Break — Page {idx + 1}</span>
          </div>
        ))}
      </div>

      {/* Editor Stats Footer Bar */}
      <div className="w-full max-w-4xl mt-6 px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            {wordCount} words
          </span>
          <span>{charCount} characters</span>
          <span>~{Math.ceil(wordCount / 200)} min read</span>
        </div>

        <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
          <span>A4 Document Canvas</span>
          <span>•</span>
          <span>{pageCount} Page{pageCount > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;