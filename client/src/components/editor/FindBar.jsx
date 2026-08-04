import { useState, useRef, useEffect, useCallback } from "react";
import { TextSelection } from "prosemirror-state";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";

const getTextNodes = (editor) => {
  const treeWalker = document.createTreeWalker(
    editor.view.dom,
    NodeFilter.SHOW_TEXT
  );
  const nodes = [];
  let currentNode;
  while ((currentNode = treeWalker.nextNode())) {
    if (currentNode.nodeValue && currentNode.nodeValue.trim()) {
      nodes.push(currentNode);
    }
  }
  return nodes;
};

const findMatches = (editor, query) => {
  if (!query) return [];
  const nodes = getTextNodes(editor);
  let fullText = "";
  const boundaries = [];
  for (const node of nodes) {
    const value = node.nodeValue || "";
    boundaries.push({ node, start: fullText.length, end: fullText.length + value.length });
    fullText += value;
  }

  const lowerText = fullText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches = [];
  let idx = 0;
  while (idx < lowerText.length) {
    const found = lowerText.indexOf(lowerQuery, idx);
    if (found === -1) break;
    matches.push({ start: found, end: found + lowerQuery.length });
    idx = found + lowerQuery.length;
  }
  return { matches, boundaries };
};

const selectMatch = (editor, match, boundaries) => {
  if (!editor || !match) return;
  const boundary = boundaries.find(
    (b) => match.start >= b.start && match.start < b.end
  );
  if (!boundary) return;

  const localStart = match.start - boundary.start;
  const localEnd = Math.min(match.end - boundary.start, boundary.node.nodeValue.length);

  let from = null;
  let to = null;
  try {
    from = editor.view.posAtDOM(boundary.node, localStart);
    to = editor.view.posAtDOM(boundary.node, localEnd);
  } catch {
    return;
  }

  if (from === null || to === null || from === undefined || to === undefined) return;

  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to))
  );
  editor.commands.scrollIntoView();
  editor.view.focus();
};

const FindBar = ({ editorRef, isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const inputRef = useRef(null);

  const runFind = useCallback(
    (q, index) => {
      const editor = editorRef?.current;
      if (!editor) {
        setMatchCount(0);
        return;
      }
      if (!q) {
        setMatchCount(0);
        return;
      }
      const result = findMatches(editor, q);
      if (!result.matches.length) {
        setMatchCount(0);
        return;
      }
      const count = result.matches.length;
      const safeIndex = ((index % count) + count) % count;
      setMatchCount(count);
      setActiveIndex(safeIndex);
      selectMatch(editor, result.matches[safeIndex], result.boundaries);
    },
    [editorRef]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setMatchCount(0);
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query) return;
    runFind(query, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen]);

  const goNext = () => runFind(query, activeIndex + 1);
  const goPrev = () => runFind(query, activeIndex - 1);

  if (!isOpen) return null;

  return (
    <div className="find-bar absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg animate-fade-in">
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) goPrev();
            else goNext();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        placeholder="Find in document…"
        className="w-44 sm:w-56 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
      />
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 min-w-[3.5rem] text-center">
        {matchCount > 0 ? `${activeIndex + 1}/${matchCount}` : "0/0"}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={goPrev}
          className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Previous match (Shift+Enter)"
          disabled={matchCount === 0}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Next match (Enter)"
          disabled={matchCount === 0}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FindBar;
