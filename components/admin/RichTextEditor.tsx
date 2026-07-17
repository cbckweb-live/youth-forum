"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import { decodeHtmlEntities } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Heading.configure({ levels: [2, 3] }),
    ],
    content: decodeHtmlEntities(value),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[240px] px-4 py-3 focus:outline-none prose prose-sm max-w-none [&_blockquote]:border-l-0 [&_blockquote]:pl-0 [&_blockquote]:before:content-none [&_blockquote]:after:content-none dark:prose-invert",
      },
    },
  });

  if (!editor) return null;

  const btn = (action: () => boolean, label: string, active?: boolean) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={`px-2 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] ${active ? "bg-gray-200 dark:bg-[#3a3a3a] font-semibold" : ""}`}
    >
      {label}
    </button>
  );

  const headingBtn = (level: 2 | 3, label: string) => {
    const isActive = editor.isActive("heading", { level });
    return btn(
      () => {
        if (isActive) {
          return editor.chain().focus().setNode("paragraph").run();
        }
        return editor.chain().focus().toggleHeading({ level }).run();
      },
      label,
      isActive
    );
  };

  return (
    <div className="border border-gray-300 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1e1e1e]">
        {btn(() => editor.chain().focus().toggleBold().run(), "B", editor.isActive("bold"))}
        {btn(() => editor.chain().focus().toggleItalic().run(), "I", editor.isActive("italic"))}
        {btn(() => editor.chain().focus().toggleUnderline().run(), "U", editor.isActive("underline"))}
        {headingBtn(2, "H2")}
        {headingBtn(3, "H3")}
        {btn(
          () => editor.chain().focus().setNode("paragraph").run(),
          "P",
          editor.isActive("paragraph")
        )}
        {btn(() => editor.chain().focus().toggleBulletList().run(), "• List", editor.isActive("bulletList"))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), "1. List", editor.isActive("orderedList"))}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), "❝", editor.isActive("blockquote"))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
