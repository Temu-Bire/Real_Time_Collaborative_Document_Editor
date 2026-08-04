import { useEffect, useState, useRef, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

import { PageBreak } from "./extensions/PageBreak";
import EditorToolbar from "./EditorToolbar";
import EditorStats from "./EditorStats";
import DocumentPages from "./DocumentPages";

const CURSOR_COLORS = [
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

const getColorFromName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const getAccessToken = () => localStorage.getItem("accessToken") || "";

const TextEditor = ({
  content,
  setContent,
  documentId = "default-doc",
  userName = "Anonymous",
  userId,
  isReadOnly = false,
  onPresenceChange,
  editorRef,
}) => {
  const [pageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [ydoc] = useState(() => new Y.Doc());
  const initialContentApplied = useRef(false);
  const typingTimerRef = useRef(null);
  const userColor = useMemo(() => getColorFromName(userName), [userName]);

  const provider = useMemo(
    () =>
      new SocketIOProvider(SOCKET_URL, `document-${documentId}`, ydoc, {
        autoConnect: true,
        // Function form: Socket.IO calls this on every (re)connect so a
        // freshly refreshed access token is always used.
        auth: () => ({ token: getAccessToken() }),
      }),
    [documentId, ydoc]
  );

  useEffect(() => {
    return () => {
      provider.destroy();
    };
  }, [provider]);

  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      id: userId || userName,
      name: userName,
      color: userColor,
    });

    const updatePresence = () => {
      const states = provider.awareness.getStates();
      const userMap = new Map();
      const now = Date.now();

      states.forEach((state, clientId) => {
        if (state?.user?.name) {
          const key = state.user.id || state.user.name;
          const isTyping =
            !!state.typing?.at && now - state.typing.at < 3000;
          if (!userMap.has(key)) {
            userMap.set(key, {
              clientId,
              id: key,
              name: state.user.name,
              color: state.user.color,
              typing: isTyping,
            });
          }
        }
      });

      onPresenceChange?.(Array.from(userMap.values()), provider.awareness.clientID);
    };

    provider.awareness.on("change", updatePresence);
    updatePresence();

    return () => {
      provider.awareness.off("change", updatePresence);
    };
  }, [provider, userName, userId, userColor, onPresenceChange]);

  const editor = useEditor(
    {
      editable: !isReadOnly,
      extensions: [
        StarterKit.configure({
          history: false,
          heading: { levels: [1, 2, 3] },
          bulletList: { keepMarks: true, keepAttributes: false },
          orderedList: { keepMarks: true, keepAttributes: false },
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

        Collaboration.configure({
          document: ydoc,
        }),

        CollaborationCaret.configure({
          provider,
          user: {
            name: userName,
            color: userColor,
          },
        }),
      ],

      editorProps: {
        attributes: {
          class: "tiptap-editor-content",
          spellcheck: "true",
        },
      },

      onUpdate({ editor: ed }) {
        if (isReadOnly) return;
        const html = ed.getHTML();
        const text = ed.getText();

        setContent(html);

        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setWordCount(words);
        setCharCount(text.length);
      },
    },
    [provider, userName, userColor, ydoc, isReadOnly]
  );

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  // Typing indicator: broadcast a timestamped "typing" flag over the Yjs
  // awareness channel so other collaborators can see who is actively editing.
  useEffect(() => {
    if (!editor || isReadOnly) return;

    const dom = editor.view.dom;

    const markTyping = () => {
      provider.awareness.setLocalStateField("typing", { at: Date.now() });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        provider.awareness.setLocalStateField("typing", null);
      }, 1600);
    };

    dom.addEventListener("beforeinput", markTyping);
    dom.addEventListener("keydown", markTyping);
    dom.addEventListener("input", markTyping);

    return () => {
      clearTimeout(typingTimerRef.current);
      provider.awareness.setLocalStateField("typing", null);
      dom.removeEventListener("beforeinput", markTyping);
      dom.removeEventListener("keydown", markTyping);
      dom.removeEventListener("input", markTyping);
    };
  }, [editor, provider, isReadOnly]);

  useEffect(() => {
    if (!editor) return;

    const seedInitialContent = () => {
      if (initialContentApplied.current) return;

      const fragment = ydoc.getXmlFragment("default");
      if (fragment.length === 0 && content) {
        editor.commands.setContent(content, false);
      }
      initialContentApplied.current = true;
    };

    const onSync = (isSynced) => {
      if (isSynced) seedInitialContent();
    };

    provider.on("sync", onSync);
    if (provider.synced) seedInitialContent();

    return () => {
      provider.off("sync", onSync);
    };
  }, [provider, editor, content, ydoc]);

  useEffect(() => {
    initialContentApplied.current = false;
  }, [documentId]);

  if (!editor) return null;

  return (
    <div className="document-canvas">
      <EditorToolbar editor={editor} pageCount={pageCount} isReadOnly={isReadOnly} />

      <DocumentPages pageCount={pageCount}>
        <EditorContent editor={editor} />
      </DocumentPages>

      <EditorStats wordCount={wordCount} charCount={charCount} />
    </div>
  );
};

export default TextEditor;
