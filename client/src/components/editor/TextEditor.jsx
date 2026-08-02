import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

import { PageBreak } from "./extensions/PageBreak";

import EditorToolbar from "./EditorToolbar";
import EditorStats from "./EditorStats";
import "../../App.css";

const TextEditor = ({ content, setContent }) => {
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      // 1. Explicitly configure StarterKit to enable Headings & Lists
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),

      Underline,

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      PageBreak,
    ],

    content: content || "",

    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none text-slate-900 dark:text-slate-100 text-base leading-relaxed focus:outline-none min-h-[500px]",
      },
    },

    onUpdate({ editor }) {
      const html = editor.getHTML();
      const text = editor.getText();

      setContent(html);

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;

      setWordCount(words);
      setCharCount(text.length);

      const contentHeight = editor.view.dom.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(contentHeight / 900)));
    },
  });

  // 2. Prevent feedback loops when setting content externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="w-full flex flex-col items-center document-canvas-container">
      <EditorToolbar editor={editor} pageCount={pageCount} />

      <div className="tiptap-page-editor w-full flex justify-center">
        <EditorContent editor={editor} />
      </div>

      <EditorStats wordCount={wordCount} charCount={charCount} />
    </div>
  );
};

export default TextEditor;