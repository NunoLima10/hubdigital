import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";

export function DescriptionEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      Placeholder.configure({ placeholder: "Descreve o projeto em detalhes" }),
    ],
    content: value ?? "",
    onUpdate: ({ editor }) =>
      onChange?.(editor.isEmpty ? "" : editor.getHTML()),
  });
  if (!editor)
    return <div className="min-h-36 rounded-md border bg-muted/30" />;
  const controls = [
    {
      label: "Negrito",
      icon: Bold,
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      label: "Itálico",
      icon: Italic,
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      label: "Lista",
      icon: List,
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      label: "Lista numerada",
      icon: ListOrdered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      label: "Link",
      icon: Link2,
      run: () => {
        const url = window.prompt(
          "URL do link",
          editor.getAttributes("link").href ?? "https://",
        );
        if (url) editor.chain().focus().setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
    },
    {
      label: "Desfazer",
      icon: Undo2,
      run: () => editor.chain().focus().undo().run(),
      active: false,
    },
    {
      label: "Refazer",
      icon: Redo2,
      run: () => editor.chain().focus().redo().run(),
      active: false,
    },
    {
      label: "Limpar",
      icon: Trash2,
      run: () => editor.commands.clearContent(),
      active: false,
    },
  ];
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex flex-wrap gap-1 border-b bg-muted/30 p-1">
        {controls.map(({ label, icon: Icon, run, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={run}
            className={`rounded p-2 hover:bg-muted ${active ? "bg-primary/10 text-primary" : ""}`}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="prose-project min-h-36 px-3 py-2 text-sm [&_.tiptap]:min-h-32 [&_.tiptap]:outline-none"
      />
    </div>
  );
}
