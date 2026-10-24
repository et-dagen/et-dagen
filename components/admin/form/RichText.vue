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
          'tw:min-h-40 tw:px-3 tw:py-2 tw:outline-none',
          'tw:[&_ul]:list-disc tw:[&_ol]:list-decimal tw:[&_ul]:pl-5 tw:[&_ol]:pl-5',
          'tw:[&_h3]:text-base tw:[&_h3]:font-bold tw:[&_p]:my-1',
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
    class="tw:rounded-md tw:border tw:bg-card tw:focus-within:border-ring"
    :class="invalid ? 'tw:border-destructive' : ''"
  >
    <div
      role="toolbar"
      :aria-label="$t('form.richtext.toolbar')"
      class="tw:flex tw:gap-1 tw:border-b tw:p-1"
    >
      <button
        v-for="tool in tools"
        :key="tool.mark"
        type="button"
        :aria-label="$t(tool.label)"
        :title="$t(tool.label)"
        :aria-pressed="editor?.isActive(tool.mark) ?? false"
        class="tw:grid tw:size-8 tw:place-items-center tw:rounded-sm tw:hover:bg-accent tw:aria-pressed:bg-secondary"
        @click="tool.run"
      >
        <component :is="tool.icon" class="tw:size-4" aria-hidden="true" />
      </button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>
