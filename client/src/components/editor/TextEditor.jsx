import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { PageBreak } from "./extensions/PageBreak";
import EditorToolbar from "./EditorToolbar";
import EditorStats from "./EditorStats";
import "../../App.css";

const TextEditor = ({ content, setContent }) => {
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit, PageBreak],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none text-slate-900 dark:text-slate-100 text-base leading-relaxed focus:outline-none",
      },
    },
    onUpdate({ editor: activeEditor }) {
      const html = activeEditor.getHTML();
      const text = activeEditor.getText();
      setContent(html);

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      const contentHeight = activeEditor.view.dom.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(contentHeight / 900)));
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
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
