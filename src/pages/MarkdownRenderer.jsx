import React, { useState, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import hljs from "highlight.js/lib/core";

// Register required languages
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import typescript from "highlight.js/lib/languages/typescript";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("java", java);
hljs.registerLanguage("python", python);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("plaintext", plaintext);

import "highlight.js/styles/github-dark.css";
import "./MarkdownRenderer.css";

/* ================================================= */
/* SAFE MARKDOWN RENDERER                           */
/* ================================================= */

const MarkdownRenderer = memo(({ content }) => {

  const safeContent = useMemo(() => {
    return typeof content === "string"
      ? content
      : String(content || "");
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children }) {

          const codeString = String(children).replace(/\n$/, "");
          const match = /language-([\w-]+)/.exec(className || "");
          const detectedLang = match?.[1];

          if (inline) {
            return (
              <code className="cgpt-inline-code">
                {children}
              </code>
            );
          }

          return (
            <CodeBlock
              code={codeString}
              language={detectedLang}
            />
          );
        },

        p({ children }) {
          return <p className="cgpt-paragraph">{children}</p>;
        },

        ul: ({ children }) =>
          <ul className="cgpt-list">{children}</ul>,

        ol: ({ children }) =>
          <ol className="cgpt-list">{children}</ol>
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
});


/* ================================================= */
/* CODE BLOCK COMPONENT                             */
/* ================================================= */

const CodeBlock = memo(({ code, language }) => {

  const [copied, setCopied] = useState(false);

  const normalizedCode = useMemo(() => {
    return code.trim();
  }, [code]);

  /* ========================= */
  /* MCQ Detection (Priority)  */
  /* ========================= */

  const isMcqBlock = useMemo(() => {
    return (
      /FINAL\s+ANSWER:/i.test(normalizedCode) &&
      /ANSWER:/i.test(normalizedCode)
    );
  }, [normalizedCode]);

  /* ========================= */
  /* Smart Code Detection      */
  /* ========================= */

  const isLikelyCode = useMemo(() => {
    return /[{}();=<>]|function|class|import|public|def|#include/.test(normalizedCode);
  }, [normalizedCode]);

  /* ========================= */
  /* Highlight Logic           */
  /* ========================= */

  const { highlightedCode, detectedLanguage } = useMemo(() => {

    try {

      /* 1️⃣ MCQ Handling */
      if (isMcqBlock) {
        return {
          detectedLanguage: "mcq",
          highlightedCode: normalizedCode
            .replace(/FINAL ANSWER:/gi, "<strong>FINAL ANSWER:</strong>")
            .replace(/ANSWER:/gi, "<strong>ANSWER:</strong>")
        };
      }

      /* 2️⃣ Explicit language provided */
      if (language && hljs.getLanguage(language)) {
        return {
          detectedLanguage: language,
          highlightedCode: hljs.highlight(normalizedCode, {
            language
          }).value
        };
      }

      /* 3️⃣ If not likely code → plaintext */
      if (!isLikelyCode) {
        return {
          detectedLanguage: "text",
          highlightedCode: hljs.highlight(normalizedCode, {
            language: "plaintext"
          }).value
        };
      }

      /* 4️⃣ Controlled auto-detect */
      const auto = hljs.highlightAuto(normalizedCode, [
        "javascript",
        "java",
        "python",
        "cpp",
        "json",
        "bash",
        "typescript"
      ]);

      return {
        detectedLanguage: auto.language || "text",
        highlightedCode: auto.value
      };

    } catch (err) {
      console.error("Highlighting failed:", err);
      return {
        detectedLanguage: "text",
        highlightedCode: normalizedCode
      };
    }

  }, [normalizedCode, language, isLikelyCode, isMcqBlock]);

  /* ========================= */
  /* Copy Handler              */
  /* ========================= */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalizedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  /* ========================= */
  /* Render                    */
  /* ========================= */

  return (
    <div className="cgpt-code-wrapper">

      <div className="cgpt-code-header">
        <span className="cgpt-code-lang">
          {detectedLanguage}
        </span>

        <button
          className="cgpt-code-copy"
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="cgpt-code-block">
        <code
          dangerouslySetInnerHTML={{
            __html: highlightedCode
          }}
        />
      </pre>

    </div>
  );
});

export default MarkdownRenderer;