/* @global cash */

/**
 * Base widget. Used to render swatch images beside the option or when a value is selected
 * and for replacing the main gallery image on the product page, in case this option is enabled in
 * the option config.
 */
$.widget('mageworxOptionAdditionalImages', {
    component: 'optionAdditionalImages',

    options: {
        productImageClassSelectorActive: '.fotorama__active',
        productImageClassSelector: '.fotorama__img',
        customOptionClassSelector: '.product-custom-option',
        imagesContainerClass: 'option_images_gallery',
        currentOptionId: null,
        images: [],
        $element: null,
        templates: {
            'drop_down': $('#MageWorx_OptionFeatures_option_gallery_dropdown').html(),
            'radio': $('#MageWorx_OptionFeatures_option_gallery_radio').html(),
            'checkbox': $('#MageWorx_OptionFeatures_option_gallery_checkbox').html(),
            'multiple': $('#MageWorx_OptionFeatures_option_gallery_dropdown').html()
        },
        image_replacement_candidates: {}
    },

    /**
     * Triggers one time at first run (from base.js)
     * @param optionConfig
     * @param productConfig
     * @param base
     * @param self
     */
    firstRun: function firstRun(optionConfig, productConfig, base, self) {
        var params = this.options;

        $(params.customOptionClassSelector).each(function () {
            var $element = $(this);
            params.$element = $element;

            if (self.out()) {
                return;
            }

            var imagesContainer = '<div class="' + params.imagesContainerClass + '"></div>';
            $element.parent().append(imagesContainer);

            if (self.getOGType() == self.getOGTypeBesideOption() || self.getOGType() == self.getOGTypeOnceSelected()) {
                self.elementChange();
            }

            if (self.getOptionType() == 'drop_down' || self.getOptionType() == 'multiple') {
                self._observeStyleOptions();
            }
        });

        if (this.isEnabledAnyOptionOverlayMode()) {
            var target = $('.gallery-placeholder')[0];

            var observer = new MutationObserver(function( mutations ) {
                mutations.forEach(function( mutation ) {
                    var newNodes = mutation.addedNodes;
                    if( newNodes !== null ) {
                        var $nodes = $( newNodes );
                        $nodes.each(function() {
                            var $node = $( this );
                            if( $node.hasClass('fotorama-item') ) {
                                setTimeout(function () {
                                    self.processOverlayImages();
                                    observer.disconnect();
                                }, 500)
                            }
                        });
                    }
                });
            });

            var config = {
                attributes: true,
                childList: true,
                characterData: true
            };

            observer.observe(target, config);
        }
    },

    /**
     * Triggers each time when option is updated\changed (from the base.js)
     * @param option
     * @param optionConfig
     * @param productConfig
     * @param base
     */
    update: function update(option, optionConfig, productConfig, base) {
        this.options.$element = $(option);

        if (this.out()) {
            return;
        }

        this.elementChange();
    },

    /**
     * Check conditions (non-selectable option type) to go out
     *
     * @return boolean
     */
    out: function () {
        var optionId = this.resolveOptionId();
        this.options.currentOptionId = optionId;
        var optionType = this.getOptionType();

        return !optionId
            || !optionType
            || _.isUndefined(this.options.render_images_for_option_types)
            || this.options.render_images_for_option_types.indexOf(optionType) == -1;
    },

    /**
     * Find option id by parsing option html
     *
     * @returns {*}
     * @private
     */
    resolveOptionId: function () {
        var id = this.options.$element.attr('id');
        id = id.replace('select_', '')
            .replace('options_', '');
        if (id.match(/_/)) {
            return id.split('_')[0];
        }

        return id;
    },

    _observeStyleOptions: function () {
        var self = this,
            params = this.options,
            target = params.$element.find('option');

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutationRecord) {
                params.$element = $(mutationRecord.target).closest('.product-custom-option');
                params.currentOptionId = self.resolveOptionId();
                self.elementChange();
            });
        });

        $.each(target, function (i, e) {
            observer.observe(e, {attributes: true, attributeFilter: ['style']});
        });
    },

    /**
     * Main method.
     * Change images, mark them as selected, collect candidates for the replacement (main-image),
     * trigger replace.
     *
     * @private
     */
    elementChange: function () {
        this.clearImagesContainer();
        var self = this;

        var valueIds = this.options.$element.val();
        if (this.getOGType() != this.getOGTypeDisabled()) {
            if (!valueIds && this.isEnabledOptionReplaceMode()) {
                var sortOrder = this.getOptionValueSortOrder(this.getOptionId(), null);
                this._removeCandidateForReplacement(sortOrder);
                replacer.forceRefresh();
            }
        }

        if (this.isEnabledOptionReplaceMode()) {
            this._removeUnselectedCandidates(this.getOptionId(), valueIds);
            replacer.forceRefresh();
        }
        this._renderImages(valueIds);
        if (this.isEnabledOptionReplaceMode()) {
            replacer.replace();
        }

        if (this.isEnabledOptionOverlayMode()) {
            self.processOverlayImages();
        }
    },

    /**
     * Check selected values and show/hide their overlay images
     */
    processOverlayImages: function () {
        var self = this;
        $('.mageworx-overlay-images-' + this.getOptionId()).remove();

        if (!_.isUndefined(window.apoData[this.getOptionId()])) {
            $.each(window.apoData[this.getOptionId()], function (i, valueId) {
                self.addOverlayImage(valueId);
            });
        }
    },

    /**
     * Add overlay image for selected value
     *
     * @param valueId
     */
    addOverlayImage: function (valueId) {
        $(this.options.productImageClassSelectorActive)
            .find(this.options.productImageClassSelector)
            .parent()
            .append('<img ' +
                'class="fotorama__img mageworx-overlay-images-' + this.getOptionId() + '" ' +
                'src="' + this.options.options[this.getOptionId()]['values'][valueId]['overlay_image_url'] + '" ' +
                'style="position: absolute; z-index: ' + valueId + ';">');
    },

    /**
     * Find corresponding image from list of candidates and replace main image
     *
     * @param valueIds
     * @private
     */
    _renderImages: function (valueIds) {
        var images = this._prepareOptionImages(valueIds),
            currentOptionGalleryTemplate = this._resolveTemplateByOptionType(this.getOptionType());

        if (Object.keys(images).length > 0) {
            if (this.getOGType() == this.getOGTypeBesideOption() || this._isValueSelected()) {
                if (this.getOptionType() == 'radio' && this.getOGType() != this.getOGTypeBesideOption()) {
                    this._clearRadioImagesContainer();
                }
                var template = _.template(currentOptionGalleryTemplate)({"images": images});

                var $imagesContainer = this.getOptionGalleryContainer();
                $imagesContainer.append(template);
            }
        } else if (this.isEnabledOptionReplaceMode()) {
            var sortOrder = this.getOptionValueSortOrder(this.getOptionId(), null);
            this._removeCandidateForReplacement(sortOrder);
            replacer.forceRefresh();
        }
    },

    getOptionValueSortOrder: function (optionId, valueId) {
        var params = this.options,
            sortOrder = params.options[optionId]['sort_order'] * 1000;
        if (!valueId) {
            return sortOrder;
        }

        if (params.$element.is('input[type="checkbox"]') || params.$element.is('select[multiple="multiple"]')) {
            sortOrder += parseInt(params.options[optionId]['values'][valueId]['sort_order']);
        }

        return sortOrder;
    },

    /**
     * Collect all images and image candidates for the replacement
     *
     * @param valueId
     * @returns {{}}
     * @private
     */
    _prepareOptionImages: function (valueIds) {
        var self = this;
        var images = {};
        if (_.isArray(valueIds)) {
            _.each(valueIds, function (valueId, index) {
                _.extend(images, self._prepareImages(valueId));
            });
        } else {
            var valueId = valueIds;
            images = this._prepareImages(valueId);
        }

        return images;
    },

    /**
     * Collect all images and image candidates for the replacement
     *
     * @param valueId
     * @returns {{}}
     * @private
     */
    _prepareImages: function (valueId) {
        var images = {},
            optionId = this.getOptionId(),
            params = this.options;

        if (valueId
            && !_.isUndefined(params.options[optionId])
            && !_.isUndefined(params.options[optionId]['values'])
            && !_.isUndefined(params.options[optionId]['values'][valueId])
            && !_.isUndefined(params.options[optionId]['values'][valueId]['images'])
        ) {
            images = $.extend(true, {}, params.options[optionId]['values'][valueId]['images']);
        }

        if (typeof params.$element == 'undefined' || !params.$element instanceof cash) {
            return;
        }

        if (params.options[optionId]['mageworx_option_image_mode'] != 0) {
            for (var imageKey in images) {
                images[imageKey]['additional_class'] = 'mageworx-optionfeatures-option-gallery_image_selected';
                var sortOrder = this.getOptionValueSortOrder(optionId, valueId);
                if (images[imageKey]['replace_main_gallery_image'] == '1') {
                    if (this.isElementSelected()) {
                        this._addCandidateForReplacement(images[imageKey], sortOrder);
                    } else {
                        this._removeCandidateForReplacement(sortOrder);
                    }
                }
            }
        }

        if ((this.getOptionType() == 'drop_down' || this.getOptionType() == 'multiple') && this.getOGType() == this.getOGTypeBesideOption()) {
            var values = params.options[optionId]['values'];
            for (var valueKey in values) {
                if (valueKey == valueId || _.isUndefined(values[valueKey]['images'])) {
                    continue;
                }

                var imagesClone = {};
                var $swatches = params.$element.parent().find('.mageworx-swatch-option');
                if ($swatches.length > 0) {
                    $.each($swatches, function (index, element) {
                        var imageOptionId = $(element).attr('data-option-id');
                        var imageOptionTypeId = $(element).attr('data-option-type-id');
                        if ($(element).css('display') != 'none' &&
                            !_.isUndefined(params.options[imageOptionId]) &&
                            !_.isUndefined(params.options[imageOptionId]['values']) &&
                            !_.isUndefined(params.options[imageOptionId]['values'][imageOptionTypeId]) &&
                            !_.isUndefined(params.options[imageOptionId]['values'][imageOptionTypeId]['images']) &&
                            params.$element.closest('[data-option_id]').css('display') != 'none') {
                            imagesClone = $.extend(true, imagesClone, params.options[imageOptionId]['values'][imageOptionTypeId]['images']);
                        }
                    });
                } else {
                    $(params.$element).find('option').each(function () {
                        var imageOptionId = params.currentOptionId;
                        var imageOptionTypeId = $(this).val();
                        if (imageOptionTypeId &&
                            params.$element.closest('[data-option_id]').css('display') != 'none' &&
                            !_.isUndefined(params.options[imageOptionId]) &&
                            !_.isUndefined(params.options[imageOptionId]['values']) &&
                            !_.isUndefined(params.options[imageOptionId]['values'][imageOptionTypeId]) &&
                            !_.isUndefined(params.options[imageOptionId]['values'][imageOptionTypeId]['images']) &&
                            $(this).css('display') != 'none'
                        ) {
                            imagesClone = $.extend(true, imagesClone, params.options[imageOptionId]['values'][imageOptionTypeId]['images']);
                        }
                    });
                }

                _.extend(images, imagesClone);
            }
        }
        return images;
    },

    /**
     * Save candidate for replacement in the replacer
     *
     * @param image
     * @param sortOrder
     * @private
     */
    _addCandidateForReplacement: function (image, sortOrder) {
        replacer.addCandidate(image, sortOrder);
    },

    /**
     * Remove candidate for replacement from replaces cache
     *
     * @param sortOrder
     * @private
     */
    _removeCandidateForReplacement: function (sortOrder) {
        replacer.removeCandidate(sortOrder);
    },

    /**
     * Remove all unselected option candidates for replacement from replace's cache
     *
     * @param optionId
     * @param selectedValues
     * @private
     */
    _removeUnselectedCandidates: function (optionId, selectedValues) {
        var self = this;
        var isCheckbox = false;
        var isUncheckedCheckbox = false;
        if (this.options.$element.is('input[type="checkbox"]')) {
            isCheckbox = true;
        }
        if (!this.options.$element.is(':checked')) {
            isUncheckedCheckbox = true;
        }
        if (isCheckbox && isUncheckedCheckbox) {
            var sortOrder = self.getOptionValueSortOrder(optionId, this.options.$element.val());
            replacer.removeCandidate(sortOrder);
        } else {
            for (var valueId in this.options.options[optionId]['values']) {
                if (!isCheckbox && !_.contains(selectedValues, valueId) && selectedValues != valueId) {
                    var sortOrder = self.getOptionValueSortOrder(optionId, valueId);
                    replacer.removeCandidate(sortOrder);
                }
            }
        }
    },

    /**
     * Clear html container
     */
    clearImagesContainer: function () {
        var params = this.options;
        var $imagesContainer = this.getOptionGalleryContainer();
        if (!_.isUndefined($imagesContainer) && $imagesContainer instanceof cash) {
            $imagesContainer.html('');
        }
    },

    /**
     * Clear html container for all radiobuttons of this option
     */
    _clearRadioImagesContainer: function () {
        var params = this.options,
            $imagesContainer = this.getOptionGalleryContainer(),
            $radioListContainer = $imagesContainer.parent().parent();
        $radioListContainer.find('input:radio').each(function () {
            $(this).parent().find('.option_images_gallery').html('');
        })
    },

    /**
     * Check if option in Once Selected option gallery mode and value is selected
     */
    _isValueSelected: function () {
        var params = this.options;
        return this.getOGType() == this.getOGTypeOnceSelected()
            && (params.$element.is(':checked')
                || ((this.getOptionType() == 'drop_down' || this.getOptionType() == 'multiple')
                    && params.$element.val()
                )
            )
    },

    /**
     * Returns corresponding HTML template for the current option type
     *
     * @param optionType
     * @returns {*}
     * @private
     */
    _resolveTemplateByOptionType: function (optionType) {
        return this.options.templates[optionType];
    },

    /**
     * Returns current option type
     * @returns string
     */
    getOptionType: function () {
        if (_.isUndefined(this.options.options[this.getOptionId()])) {
            return '';
        }
        return this.options.options[this.getOptionId()]['type'];
    },

    /**
     * Returns current option id
     *
     * @returns int
     */
    getOptionId: function () {
        return this.options.currentOptionId;
    },

    /**
     * Returns option type disabled value
     *
     * @returns int
     */
    getOGTypeDisabled: function () {
        return this.options.option_gallery_type.disabled;
    },

    /**
     * Returns option type beside option value
     *
     * @returns int
     */
    getOGTypeBesideOption: function () {
        return this.options.option_gallery_type.beside_option;
    },

    /**
     * Returns option type once selected value
     *
     * @returns int
     */
    getOGTypeOnceSelected: function () {
        return this.options.option_gallery_type.once_selected;
    },

    /**
     * Get current options OG type
     *
     * @returns int
     */
    getOGType: function () {
        return this.options.options[this.getOptionId()]['mageworx_option_gallery'];
    },

    /**
     * Check if current option's image mode is replacement
     *
     * @returns boolean
     */
    isEnabledOptionReplaceMode: function () {
        return this.options.options[this.getOptionId()]['mageworx_option_image_mode'] === '1';
    },

    /**
     * Check if current option's image mode is overlay
     *
     * @returns boolean
     */
    isEnabledOptionOverlayMode: function () {
        return this.options.options[this.getOptionId()]['mageworx_option_image_mode'] === '3';
    },

    /**
     * Check if any option's image mode is overlay
     *
     * @returns boolean
     */
    isEnabledAnyOptionOverlayMode: function () {
        var result = false;
        $.each(this.options.options, function(index, option) {
            if (option['mageworx_option_image_mode'] === '3') {
                result = true;
            }
        })
        return result;
    },

    /**
     * Get option gallery container
     *
     * @returns object
     */
    getOptionGalleryContainer: function () {
        return this.options.$element.parent().find('.' + this.options.imagesContainerClass);
    },

    /**
     * Check current element is selected (in html)
     *
     * @returns boolean
     */
    isElementSelected: function () {
        var $element = this.options.$element;
        if ($element.is('input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select')) {
            return Boolean($element.val());
        } else if ($element.is('input[type="radio"]') || $element.is('input[type="checkbox"]')) {
            return $element.is(':checked');
        }

        return false;
    }
});
