<template>
  <div class="tinymce-editor">
    <Editor
      v-if="dialogVisible"
      :model-value="modelValue"
      :api-key="apiKey"
      :init="editorConfig"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';
// TinyMCE core
import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/models/dom';

// Plugins - Only import plugins that exist in the free version
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/code';
import 'tinymce/plugins/codesample';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/help';
import 'tinymce/plugins/image';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/pagebreak';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/quickbars';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/visualchars';
import 'tinymce/plugins/wordcount';

// Language pack - TinyMCE 8.x language files are loaded dynamically
// We'll configure it in the editor config below

// CSS
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/content/default/content.min.css';

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

// TinyMCE API Key
const apiKey = 'oeyw4fczbgzgtessykwa9j2ow3stvtz54fnla42oahw3aosa';

const editorConfig = {
  height: props.height,
  menubar: true,
  setup: (editor: any) => {
    // Ensure editor is editable
    editor.on('init', () => {
      // Editor is already in design mode by default
    });
  },
  plugins: [
    'advlist', 'anchor', 'autolink', 'autoresize', 'charmap', 'code', 'codesample',
    'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'insertdatetime',
    'link', 'lists', 'media', 'nonbreaking', 'pagebreak', 'preview', 'quickbars',
    'searchreplace', 'table', 'visualblocks', 'visualchars', 'wordcount'
  ],
  toolbar: 'undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code preview fullscreen | removeformat',
  content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
  placeholder: props.placeholder,
  // Language: Try Turkish, fallback to English if file not found
  // TinyMCE will automatically fall back to English if Turkish language file is not available
  branding: false,
  promotion: false,
  resize: true,
  autosave_ask_before_unload: false,
  paste_as_text: false,
  paste_data_images: true,
  image_advtab: true,
  image_caption: true,
  image_title: true,
  link_title: true,
  table_default_attributes: {
    border: '1'
  },
  table_default_styles: {
    'border-collapse': 'collapse',
    'width': '100%'
  },
  quickbars_selection_toolbar: 'bold italic | quicklink quickimage quicktable',
  quickbars_insert_toolbar: 'quickimage quicktable',
  noneditable_class: 'mceNonEditable',
  toolbar_mode: 'sliding',
  contextmenu: 'link image table',
};

const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};

// Fix for TinyMCE in modals - allow focus on TinyMCE dialogs
const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  if (target && (target.closest('.tox-tinymce-aux') || target.closest('.moxman-window') || target.closest('.tam-assetmanager-root'))) {
    e.stopImmediatePropagation();
  }
};

onMounted(() => {
  document.addEventListener('focusin', handleFocusIn, true);
});

onUnmounted(() => {
  document.removeEventListener('focusin', handleFocusIn, true);
});

watch(() => props.modelValue, (newValue) => {
  // External updates to modelValue will be handled by v-model
}, { immediate: true });
</script>

<style scoped>
.tinymce-editor {
  width: 100%;
}

.tinymce-editor :deep(.tox-tinymce) {
  border-radius: 4px;
}

.tinymce-editor :deep(.tox-edit-area__iframe) {
  min-height: 300px;
}
</style>

