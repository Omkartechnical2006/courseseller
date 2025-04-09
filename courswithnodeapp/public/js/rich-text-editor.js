class RichTextEditor {
    constructor(containerId, textareaId) {
        this.container = document.getElementById(containerId);
        this.textarea = document.getElementById(textareaId);
        this.toolbar = null;
        this.editor = null;
        this.init();
    }

    init() {
        // Create toolbar
        this.createToolbar();
        
        // Create editable div
        this.createEditor();
        
        // Initialize content
        this.editor.innerHTML = this.textarea.value;
        
        // Add event listeners
        this.addEventListeners();
        
        // Hide original textarea
        this.textarea.style.display = 'none';
    }

    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'rich-text-toolbar';
        
        const buttons = [
            { icon: 'B', command: 'bold', title: 'Bold' },
            { icon: 'I', command: 'italic', title: 'Italic' },
            { icon: 'U', command: 'underline', title: 'Underline' },
            { icon: 'H2', command: 'formatBlock', value: 'h2', title: 'Heading 2' },
            { icon: 'H3', command: 'formatBlock', value: 'h3', title: 'Heading 3' },
            { icon: '•', command: 'insertUnorderedList', title: 'Bullet List' },
            { icon: '1.', command: 'insertOrderedList', title: 'Numbered List' },
            { icon: '←', command: 'outdent', title: 'Decrease Indent' },
            { icon: '→', command: 'indent', title: 'Increase Indent' },
            { icon: '🔗', command: 'createLink', title: 'Insert Link' },
            { icon: '📷', command: 'insertImage', title: 'Insert Image' }
        ];

        // Add alignment buttons
        const alignmentButtons = [
            { icon: '⫷', command: 'justifyLeft', title: 'Align Left' },
            { icon: '⫸', command: 'justifyCenter', title: 'Align Center' },
            { icon: '⫹', command: 'justifyRight', title: 'Align Right' },
            { icon: '≣', command: 'justifyFull', title: 'Justify' }
        ];

        // Add a separator between formatting and alignment buttons
        const separator = document.createElement('div');
        separator.className = 'rich-text-separator';
        this.toolbar.appendChild(separator);

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rich-text-btn';
            button.innerHTML = btn.icon;
            button.title = btn.title;
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (btn.command === 'createLink') {
                    const url = prompt('Enter URL:');
                    if (url) document.execCommand(btn.command, false, url);
                } else if (btn.command === 'insertImage') {
                    const url = prompt('Enter image URL:');
                    if (url) document.execCommand(btn.command, false, url);
                } else if (btn.value) {
                    document.execCommand(btn.command, false, btn.value);
                } else {
                    document.execCommand(btn.command, false, null);
                }
            });
            
            this.toolbar.appendChild(button);
        });

        // Add another separator before alignment buttons
        const alignmentSeparator = document.createElement('div');
        alignmentSeparator.className = 'rich-text-separator';
        this.toolbar.appendChild(alignmentSeparator);

        // Add alignment buttons
        alignmentButtons.forEach(btn => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rich-text-btn';
            button.innerHTML = btn.icon;
            button.title = btn.title;
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand(btn.command, false, null);
            });
            
            this.toolbar.appendChild(button);
        });

        // Add another separator before font controls
        const fontSeparator = document.createElement('div');
        fontSeparator.className = 'rich-text-separator';
        this.toolbar.appendChild(fontSeparator);

        // Add font size dropdown
        const fontSizeContainer = document.createElement('div');
        fontSizeContainer.className = 'rich-text-dropdown-container';
        
        const fontSizeButton = document.createElement('button');
        fontSizeButton.type = 'button';
        fontSizeButton.className = 'rich-text-btn';
        fontSizeButton.innerHTML = 'A';
        fontSizeButton.title = 'Font Size';
        
        const fontSizeDropdown = document.createElement('div');
        fontSizeDropdown.className = 'rich-text-dropdown';
        
        // Set up font size options
        const fontSizes = [
            { value: '28', label: '28' },
            { value: '26', label: '26' },
            { value: '24', label: '24' },
            { value: '22', label: '22' },
            { value: '20', label: '20' },
            { value: '18', label: '18' },
            { value: '16', label: '16' },
            { value: '14', label: '14' },
            { value: '12', label: '12' },
            { value: '10', label: '10' },
            { value: '8', label: '8' }
        ];
        
        // Store selection state for hover previews
        let savedSelection = null;
        let tempSpan = null;
        let currentPreviewSize = null;
        
        // Helper function to save current selection
        const saveSelection = () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                savedSelection = selection.getRangeAt(0).cloneRange();
                return true;
            }
            return false;
        };
        
        // Helper function to restore saved selection
        const restoreSelection = () => {
            if (savedSelection) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedSelection);
                return true;
            }
            return false;
        };
        
        // Helper function to apply font size
        const applyFontSize = (size, isPermanent = false) => {
            if (!savedSelection) return false;
            
            // Restore the saved selection
            restoreSelection();
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                // Only proceed if there's actual text selected
                if (!range.collapsed) {
                    // If this is just a preview and we already have a preview span, update it
                    if (!isPermanent && tempSpan) {
                        tempSpan.style.fontSize = `${size}pt`;
                        currentPreviewSize = size;
                        return true;
                    }
                    
                    // Remove any previous preview
                    if (tempSpan) {
                        const parent = tempSpan.parentNode;
                        while (tempSpan.firstChild) {
                            parent.insertBefore(tempSpan.firstChild, tempSpan);
                        }
                        parent.removeChild(tempSpan);
                        tempSpan = null;
                    }
                    
                    // Create a new span with the selected font size
                    const span = document.createElement('span');
                    span.style.fontSize = `${size}pt`;
                    
                    try {
                        // Try to surround the selected content with the span
                        range.surroundContents(span);
                        
                        // If this is a preview, save reference to the span
                        if (!isPermanent) {
                            tempSpan = span;
                            currentPreviewSize = size;
                        }
                    } catch (e) {
                        // If that fails (e.g., selection crosses elements), use extractContents
                        console.log("Using alternative method for selection");
                        const fragment = range.extractContents();
                        span.appendChild(fragment);
                        range.insertNode(span);
                        
                        // If this is a preview, save reference to the span
                        if (!isPermanent) {
                            tempSpan = span;
                            currentPreviewSize = size;
                        }
                    }
                    
                    // If this is permanent, update the button text and clear the preview state
                    if (isPermanent) {
                        fontSizeButton.innerHTML = size + ' <span class="font-size-label">pt</span>';
                        tempSpan = null;
                        currentPreviewSize = null;
                        
                        // Update textarea with new content
                        this.textarea.value = this.editor.innerHTML;
                    }
                    
                    return true;
                }
            }
            
            return false;
        };
        
        // Add mousedown event to fontSizeButton to save selection before dropdown toggle
        fontSizeButton.addEventListener('mousedown', (e) => {
            // When button is clicked, save the current selection for later use
            saveSelection();
        });
        
        // Create font size options with hover preview
        fontSizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'rich-text-dropdown-item';
            option.innerHTML = `<span style="font-size: ${Math.min(parseInt(size.value), 24)}px;">${size.label}</span>`;
            
            // Preview on hover
            option.addEventListener('mouseenter', () => {
                // Apply preview font size on hover
                if (savedSelection) {
                    applyFontSize(size.value, false);
                }
            });
            
            // Apply permanently on click
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Apply the font size permanently
                applyFontSize(size.value, true);
                
                // Close the dropdown
                fontSizeDropdown.classList.remove('show');
            });
            
            fontSizeDropdown.appendChild(option);
        });
        
        // Reset preview when leaving dropdown
        fontSizeDropdown.addEventListener('mouseleave', () => {
            // If we have a temp preview, restore original text
            if (tempSpan) {
                const parent = tempSpan.parentNode;
                while (tempSpan.firstChild) {
                    parent.insertBefore(tempSpan.firstChild, tempSpan);
                }
                parent.removeChild(tempSpan);
                tempSpan = null;
                currentPreviewSize = null;
            }
        });
        
        // Add click event to toggle the dropdown
        fontSizeButton.addEventListener('click', (e) => {
            e.preventDefault();
            fontSizeDropdown.classList.toggle('show');
        });
        
        fontSizeContainer.appendChild(fontSizeButton);
        fontSizeContainer.appendChild(fontSizeDropdown);
        this.toolbar.appendChild(fontSizeContainer);

        // Add font color picker
        const fontColorContainer = document.createElement('div');
        fontColorContainer.className = 'rich-text-color-container';
        
        const fontColorButton = document.createElement('button');
        fontColorButton.type = 'button';
        fontColorButton.className = 'rich-text-btn';
        fontColorButton.innerHTML = '🎨';
        fontColorButton.title = 'Text Color';
        
        const fontColorInput = document.createElement('input');
        fontColorInput.type = 'color';
        fontColorInput.className = 'rich-text-color-input';
        fontColorInput.addEventListener('input', (e) => {
            document.execCommand('foreColor', false, e.target.value);
        });
        
        fontColorContainer.appendChild(fontColorButton);
        fontColorContainer.appendChild(fontColorInput);
        this.toolbar.appendChild(fontColorContainer);

        // Add background color picker
        const bgColorContainer = document.createElement('div');
        bgColorContainer.className = 'rich-text-color-container';
        
        const bgColorButton = document.createElement('button');
        bgColorButton.type = 'button';
        bgColorButton.className = 'rich-text-btn';
        bgColorButton.innerHTML = '🖌️';
        bgColorButton.title = 'Background Color';
        
        const bgColorInput = document.createElement('input');
        bgColorInput.type = 'color';
        bgColorInput.className = 'rich-text-color-input';
        bgColorInput.addEventListener('input', (e) => {
            document.execCommand('hiliteColor', false, e.target.value);
        });
        
        bgColorContainer.appendChild(bgColorButton);
        bgColorContainer.appendChild(bgColorInput);
        this.toolbar.appendChild(bgColorContainer);

        this.container.appendChild(this.toolbar);
    }

    createEditor() {
        this.editor = document.createElement('div');
        this.editor.className = 'rich-text-editor';
        this.editor.contentEditable = true;
        this.editor.spellcheck = true;
        this.container.appendChild(this.editor);
    }

    addEventListeners() {
        // Update textarea on editor change
        this.editor.addEventListener('input', () => {
            this.textarea.value = this.editor.innerHTML;
        });

        // Handle paste events to clean HTML
        this.editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Handle keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        document.execCommand('bold', false, null);
                        break;
                    case 'i':
                        e.preventDefault();
                        document.execCommand('italic', false, null);
                        break;
                    case 'u':
                        e.preventDefault();
                        document.execCommand('underline', false, null);
                        break;
                }
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.rich-text-dropdown-container')) {
                const dropdowns = document.querySelectorAll('.rich-text-dropdown');
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }

    // Public methods
    getContent() {
        return this.editor.innerHTML;
    }

    setContent(html) {
        this.editor.innerHTML = html;
        this.textarea.value = html;
    }

    clear() {
        this.editor.innerHTML = '';
        this.textarea.value = '';
    }
} 