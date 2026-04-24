<template>
    <div>
        <label v-if="displayText" class="block text-base font-medium text-bodyColor mb-2">
            {{ displayText }}
        </label>
        
        <!-- Main drop zone container -->
        <div 
            class="w-full h-[280px] bg-white flex items-center justify-center"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            @click="triggerFileInput"
        >
            <!-- Inner dashed line container -->
                <div class="flex w-full h-full flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-bodyColor">
                    <!-- File drop icon -->
                    <img 
                        src="/assets/images/filedrop-icon.png" 
                        alt="File upload" 
                        class="h-20 mb-4"
                    />
                    
                    <!-- Text instructions -->
                    <div class="text-center">
                        <p class="text-lg font-semibold text-gray-900 mb-1">
                            Drop your image here, or 
                            <span class="text-accentColor1 cursor-pointer">browse</span>
                        </p>
                        <p class="text-sm text-gray-500">
                            Accepted file types include: docx, pdf, and images
                        </p>
                    </div>
                </div>
            
            <!-- Hidden file input -->
            <input 
                ref="fileInput"
                type="file" 
                class="hidden" 
                @change="handleFileChange"
                accept=".docx,.pdf,.png,.jpg,.jpeg,.gif"
            />
        </div>
        
        <!-- File selected indicator -->
        <div v-if="fileName" class="mt-3 text-sm text-green-600 font-medium">
            ✓ File selected: {{ fileName }}
        </div>
        <!-- Error message -->
        <div v-if="errorMessage" class="mt-3 text-sm text-red-600">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { convertFileToBase64, compressImageIfNeeded } from '~/utils/convertFile';

// --- TYPE DEFINITIONS ---
interface FileInputQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    required?: boolean;
}

// --- PROPS & EMITS ---
const props = defineProps<{
    question: FileInputQuestion;
    modelValue: { name: string; contentType: string; data: string } | null;
}>();

const emit = defineEmits(['update:modelValue']);

// --- COMPUTED ---
const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

// --- REACTIVE STATE ---
const fileName = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// --- METHODS ---
const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
        await processFile(file);
    }
};

const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    
    if (files && files.length > 0) {
        const file = files[0];
        if (file) {
            await processFile(file);
        }
    }
};

const processFile = async (file: File) => {
    // Clear previous error
    errorMessage.value = null;
    
    // Validate file type
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf', // .pdf
        'image/png', // .png
        'image/jpeg', // .jpg, .jpeg
        'image/jpg', // .jpg
        'image/gif' // .gif
    ];
    
    if (!allowedTypes.includes(file.type)) {
        errorMessage.value = 'Please select a valid file type (docx, pdf, or image)';
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        errorMessage.value = 'File size must be less than 10MB';
        return;
    }
    
    try {
        // Compress image if it's an image file (to reduce localStorage size)
        const processedFile = await compressImageIfNeeded(file);
        
        fileName.value = file.name;
        const base64Data = await convertFileToBase64(processedFile);
        emit('update:modelValue', {
            name: file.name,
            contentType: file.type,
            data: base64Data,
        });
    } catch (error) {
        console.error("Error converting file to base64:", error);
        
        // Provide user-friendly error message
        let userErrorMessage = 'Error reading file. Please try again.';
        
        if (error instanceof Error && error.message) {
            if (error.message.includes('size')) {
                userErrorMessage = 'File is too large. Please select a smaller file.';
            } else if (error.message.includes('type')) {
                userErrorMessage = 'Unsupported file type. Please select a different file.';
            } else if (error.message.includes('read')) {
                userErrorMessage = 'Cannot read file. Please try a different file.';
            } else {
                userErrorMessage = error.message;
            }
        }
        
        errorMessage.value = userErrorMessage;
        fileName.value = null;
        emit('update:modelValue', null);
        
        // Log error to console instead of showing toast
        if (process.client) {
          console.error('File upload error:', userErrorMessage);
        }
    }
};

// Initialize fileName from existing modelValue
const initializeFileName = () => {
    if (props.modelValue && props.modelValue.name) {
        fileName.value = props.modelValue.name;
    } else {
        fileName.value = null;
    }
};

// --- WATCHERS ---
// Watch for changes in modelValue (e.g., when form data is restored)
watch(() => props.modelValue, initializeFileName, { immediate: true });

// --- LIFECYCLE ---
onMounted(() => {
    initializeFileName();
});
</script>

<style scoped>
/* Custom cursor for the drop zone */
</style>