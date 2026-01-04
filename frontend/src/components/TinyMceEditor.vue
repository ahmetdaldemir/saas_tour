<template>
  <div class="rich-text-editor" v-if="dialogVisible">
    <div v-if="editor" class="editor-toolbar">
      <v-btn
        :variant="editor.isActive('bold') ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-bold"
        @click="editor.chain().focus().toggleBold().run()"
      />
      <v-btn
        :variant="editor.isActive('italic') ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-italic"
        @click="editor.chain().focus().toggleItalic().run()"
      />
      <v-btn
        :variant="editor.isActive('underline') ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      />
      <v-divider vertical class="mx-1" />
      <v-btn
        :variant="editor.isActive({ heading: { level: 1 } }) ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-header-1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      />
      <v-btn
        :variant="editor.isActive({ heading: { level: 2 } }) ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-header-2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <v-btn
        :variant="editor.isActive({ heading: { level: 3 } }) ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-header-3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      />
      <v-divider vertical class="mx-1" />
      <v-btn
        :variant="editor.isActive('bulletList') ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-list-bulleted"
        @click="editor.chain().focus().toggleBulletList().run()"
      />
      <v-btn
        :variant="editor.isActive('orderedList') ? 'flat' : 'text'"
        size="small"
        icon="mdi-format-list-numbered"
        @click="editor.chain().focus().toggleOrderedList().run()"
      />
      <v-divider vertical class="mx-1" />
      <v-btn
        size="small"
        icon="mdi-link"
        @click="setLink"
      />
      <v-btn
        size="small"
        icon="mdi-image"
        @click="addImage"
      />
      <v-btn
        size="small"
        icon="mdi-table"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
      />
      <v-divider vertical class="mx-1" />
      <v-btn
        size="small"
        icon="mdi-format-quote-close"
        @click="editor.chain().focus().toggleBlockquote().run()"
      />
      <v-btn
        size="small"
        icon="mdi-code-tags"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      />
      <v-spacer />
      <v-btn
        size="small"
        icon="mdi-undo"
        @click="editor.chain().focus().undo().run()"
      />
      <v-btn
        size="small"
        icon="mdi-redo"
        @click="editor.chain().focus().redo().run()"
      />
    </div>
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';

interface Props {
  modelValue?: string;
  height?: number;
  placeholder?: string;
  dialogVisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: 400,
  placeholder: 'İçerik girin...',
  dialogVisible: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  content: props.modelValue || '',
  editorProps: {
    attributes: {
      class: 'prose prose-sm mx-auto focus:outline-none',
      style: `min-height: ${props.height}px; padding: 16px;`,
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) {
    return;
  }

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};

const addImage = () => {
  const url = window.prompt('Resim URL');
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run();
  }
};

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue || '');
  }
});

watch(() => props.dialogVisible, (visible) => {
  if (visible && !editor.value) {
    // Editor will be created on mount
  }
});

onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 4px;
}

.editor-content {
  min-height: 300px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
  padding: 16px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
}

.editor-content :deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 16px 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.editor-content :deep(.ProseMirror table td),
.editor-content :deep(.ProseMirror table th) {
  border: 1px solid #ced4da;
  box-sizing: border-box;
  min-width: 1em;
  padding: 8px;
  position: relative;
  vertical-align: top;
}

.editor-content :deep(.ProseMirror table th) {
  background-color: #f1f3f5;
  font-weight: bold;
}

.editor-content :deep(.ProseMirror a) {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
}

.editor-content :deep(.ProseMirror h1),
.editor-content :deep(.ProseMirror h2),
.editor-content :deep(.ProseMirror h3) {
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.editor-content :deep(.ProseMirror h1) { font-size: 2em; }
.editor-content :deep(.ProseMirror h2) { font-size: 1.5em; }
.editor-content :deep(.ProseMirror h3) { font-size: 1.25em; }

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid #e0e0e0;
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
}

.editor-content :deep(.ProseMirror code) {
  background-color: #f5f5f5;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.editor-content :deep(.ProseMirror pre) {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 1em 0;
}

.editor-content :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
}
</style>
