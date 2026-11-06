<script setup lang="ts">
  import { Bold, Heading, Italic, List, ListOrdered } from '@lucide/vue'
  import StarterKit from '@tiptap/starter-kit'
  import { EditorContent, useEditor } from '@tiptap/vue-3'

  const props = defineProps<{ id?: string; invalid?: boolean }>()
  const html = defineModel<string>({ default: '' })

  const editor = useEditor({
    content: html.value,
    extensions: [StarterKit.configure({ heading: { levels: [3] } })],
    editorProps: {
      attributes: {
        class: [
          'min-h-40 px-3 py-2 outline-none',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
          '[&_h3]:text-base [&_h3]:font-bold [&_p]:my-1',
        ].join(' '),
        ...(props.id ? { id: props.id } : {}),
      },
    },
    onUpdate: ({ editor }) => (html.value = editor.getHTML()),
  })

  const tools = [
    {
      label: 'form.richtext.heading',
      icon: Heading,
      mark: 'heading',
      run: () =>
        editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'form.richtext.bold',
      icon: Bold,
      mark: 'bold',
      run: () => editor.value?.chain().focus().toggleBold().run(),
    },
    {
      label: 'form.richtext.italic',
      icon: Italic,
      mark: 'italic',
      run: () => editor.value?.chain().focus().toggleItalic().run(),
    },
    {
      label: 'form.richtext.bullets',
      icon: List,
      mark: 'bulletList',
      run: () => editor.value?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'form.richtext.numbers',
      icon: ListOrdered,
      mark: 'orderedList',
      run: () => editor.value?.chain().focus().toggleOrderedList().run(),
    },
  ]

  onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div
    class="rounded-md border bg-card focus-within:border-ring"
    :class="invalid ? 'border-destructive' : ''"
  >
    <div
      role="toolbar"
      :aria-label="$t('form.richtext.toolbar')"
      class="flex gap-1 border-b p-1"
    >
      <button
        v-for="tool in tools"
        :key="tool.mark"
        type="button"
        :aria-label="$t(tool.label)"
        :title="$t(tool.label)"
        :aria-pressed="editor?.isActive(tool.mark) ?? false"
        class="grid size-8 place-items-center rounded-sm hover:bg-accent aria-pressed:bg-secondary"
        @click="tool.run"
      >
        <component :is="tool.icon" class="size-4" aria-hidden="true" />
      </button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>
