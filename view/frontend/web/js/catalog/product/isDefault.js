$.widget('mageworxOptionFeaturesIsDefault', {
    component: 'optionFeaturesIsDefault',

    options: {
    },

    /**
     * Triggers one time after init price (from base.js)
     * @param optionConfig
     * @param productConfig
     * @param base
     * @param self
     */
    firstRun: function firstRun(optionConfig, productConfig, base, self)
    {
        return;
    },

    /**
     * Triggers each time when option is updated\changed (from the base.js)
     * @param option
     * @param optionConfig
     * @param productConfig
     * @param base
     */
    update: function update(option, optionConfig, productConfig, base)
    {
        var isDefaultArray = this.getIsDefaultValues(),
            optionValues = base.getNewlyShowedOptionValues();
        if (_.isEmpty(optionValues) || _.isEmpty(isDefaultArray)) {
            return;
        }

        $.each(optionValues, function (index, value) {
            var optionType = isDefaultArray[value],
                $field = $('[data-option_type_id="' + value + '"]');

            if ($field.css('display') == 'none') {
                return;
            }
            var $option = $field.parents('.field');
            var optionId = $option.attr('data-option_id');
            var apoData = base.getApoData();
            if ($.inArray(optionType, ['drop_down', 'multiple']) !== -1) {
                if ($.inArray(optionType, ['multiple']) !== -1) {
                    var selectedValues = $field.closest('select').val();
                    if (selectedValues === null) {
                        selectedValues = [];
                        selectedValues.push($field.val());
                    } else if ($.isArray(selectedValues)){
                        selectedValues.push($field.val());
                    }
                    base.removeNewlyShowedOptionValue(value);
                    $field.closest('select').val(selectedValues);
                    apoData[optionId].push(parseInt($field.val()));
                    $field.closest('select').trigger('change');
                } else {
                    base.removeNewlyShowedOptionValue(value);
                    if (!$field.closest('select').val()) {
                        $field.closest('select').val($field.val());
                        apoData[optionId].push(parseInt($field.val()));
                        $field.closest('select').trigger('change');
                    }
                }
            } else if ($.inArray(optionType, ['checkbox', 'radio']) !== -1) {
                base.removeNewlyShowedOptionValue(value);
                var canCheck = false;
                if ($.inArray(optionType, ['checkbox']) !== -1) {
                    canCheck = true;
                } else {
                    if (!_.isUndefined(apoData[optionId]) && apoData[optionId].length < 1) {
                        canCheck = true;
                    }
                }
                if (canCheck === true) {
                    // var $el = $field.find(':input');
                    var $el = $field.find('input, select, checkbox, textarea');
                    $el.prop('checked', true);
                    apoData[optionId].push(parseInt(value));
                    $el.trigger('change');
                }
            }
        });
    },

    /**
     * Get predefined isDefault values array
     * @return array
     */
    getIsDefaultValues: function update()
    {
        return this.options.is_default_values;
    }
});
