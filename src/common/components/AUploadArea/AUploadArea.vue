<template>
    <div class="auploadarea" :class="{ 'auploadarea-disabled': disabled }">
        <div
            class="auploadarea_content"
            tabindex="0"
            @keyup.enter.space="onActionKey"
            @click="onClick"
            @dragover.prevent
            @drop.prevent="onDrop"
        >
            <input
                :accept="accept"
                ref="file"
                name="uploadImage"
                :multiple="multiple"
                type="file"
                autocomplete="off"
                style="display: none;"
                @change="updatePreview"
            />
            <video
                v-if="imagePreview && fileType.split('/')[0] == 'video'"
                :src="imagePreview"
                alt="Preview Image"
                class="auploadarea_preview"
            />
            <video
                v-else-if="imagePreview && fileType.split('/')[0] == 'audio'"
                :src="imagePreview"
                alt="Preview Image"
                poster="music-placeholder.jpg"
                class="auploadarea_preview"
            />
            <a-model v-else-if="imagePreview && fileType == ''" :src="imagePreview" alt="Preview Model" />
            <img
                v-else-if="imagePreview && fileType.split('/')[0] == 'image'"
                :src="imagePreview"
                alt="Preview Image"
                class="auploadarea_preview"
            />
            <div v-if="imagePreview" class="auploadarea_overlay">
                <button
                    aria-label="Remove image"
                    data-tooltip="Remove image"
                    @keyup.enter.space.stop="deleteImage"
                    @click.stop="deleteImage"
                >
                    <app-iconset icon="close" />
                </button>
            </div>
            <div v-if="imagePreview === null" class="auploadarea_text">
                <slot></slot>
            </div>
        </div>
    </div>
</template>
<script>
import AppIconset from '@/modules/app/components/AppIconset/AppIconset';
import AModel from '@/common/components/AModel/AModel';

export default {
    name: 'AUploadArea',

    components: { AppIconset, AModel },

    props: {
        accept: {
            type: String,
            default: '*/*',
        },
        /** Maximum file size in bytes */
        maxFileSize: {
            type: Number,
            default: -1,
        },
        /** Validator of file type */
        validator: {
            type: Function,
            default: null,
        },
        /** If true and validations failed, don't trigger 'input' event */
        strict: {
            type: Boolean,
            default: false,
        },
        multiple: {
            type: Boolean,
            default: false,
        },
        initialPreview: {
            type: String,
            default: null,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },

    data() {
        return {
            imagePreview: null,
        };
    },

    watch: {
        initialPreview(value) {
            this.imagePreview = value || '';
        },
    },

    methods: {
        updatePreview(e, forceUpdate = false) {
            if (this.actionsDisabled() && !forceUpdate) {
                return;
            }

            let files;
            e.type === 'drop' ? (files = e.dataTransfer.files) : (files = e.target.files);
            if (files.length === 0) {
                return;
            }

            const file = files[0];
            const valid = this.validate(file);

            if (valid) {
                this.fileType = file.type;
                this.imagePreview = URL.createObjectURL(file);
            }

            if (!this.strict || valid) {
                this.$emit('input', files);
            }

            console.log(this.imagePreview, this.fileType);
        },

        /**
         * @param {File} file
         * @return {boolean}
         */
        validate(file) {
            let ok = true;

            if (file) {
                ok = this.maxFileSize === -1 || file.size < this.maxFileSize;

                if (ok && typeof this.validator === 'function') {
                    ok = this.validator(file);
                }
            }

            return ok;
        },

        deleteImage() {
            if (this.actionsDisabled()) {
                return;
            }

            this.imagePreview = null;
            this.$refs.file.value = '';
            this.$emit('input', []);
        },

        showFilePicker() {
            if (!this.actionsDisabled()) {
                this.$refs.file.click();
            }
        },

        isFocused() {
            return document.activeElement.closest('.auploadarea') !== null;
        },

        actionsDisabled() {
            return this.disabled || !this.isFocused();
        },

        onClick() {
            this.showFilePicker();
        },

        onActionKey() {
            this.showFilePicker();
        },

        onDrop(event) {
            this.updatePreview(event, true);
        },
    },
};
</script>
<style lang="scss">
@use 'style';
</style>
