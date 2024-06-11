# Mageworx Advanced Product Options Integration

## Description

This extension does its best to integrate all storefront features of Advanced Product Options extension form Mageworx vendor.

## Required patches

`mageworx/module-optionbase/view/base/web/js/catalog/product/base.js`

```diff
@@ -50,7 +50,7 @@
         _init: function initPriceBundle() {
             var self = this;
             $(document).ready(function () {
-                $('#product-addtocart-button').attr('disabled', true);
+                $('#product-addtocart-button').prop('disabled', true);
                 // Get existing updaters from registry
                 var updaters = registry.get('mageworxOptionUpdaters');
                 if (!updaters) {
@@ -240,7 +240,7 @@
             }
 
             this._updateSelectOptions(options.filter('select'), optionConfig, priceSymbol);
-            this._updateInputOptions(options.filter('input[type!="hidden"]'), optionConfig, priceSymbol);
+            this._updateInputOptions(options.filter($.breeze ? 'input:not([type="hidden"])' : 'input[type!="hidden"]'), optionConfig, priceSymbol);
         },
 
         /**

```

`mageworx/module-optionfeatures/view/base/web/js/catalog/product/features.js`

```diff
@@ -840,7 +840,7 @@
                         }
                     });
                 } else {
-                    var $image = $('<img>', {
+                    var $image = $('<img>').attr({
                         src: self.options.question_image,
                         alt: 'tooltip',
                         "class": 'option-select-tooltip-' + optionId,

```

`mageworx/module-optionfeatures/view/frontend/web/js/swatches/additional.js`

```diff
@@ -331,7 +331,7 @@
                     images = $.extend(true, {}, params.options[optionId]['values'][valueId]['images']);
                 }
 
-                if (typeof params.$element == 'undefined' || !params.$element instanceof jQuery) {
+                if (typeof params.$element == 'undefined') {
                     return;
                 }
 
@@ -451,7 +451,7 @@
             clearImagesContainer: function () {
                 var params = this.options;
                 var $imagesContainer = this.getOptionGalleryContainer();
-                if (!_.isUndefined($imagesContainer) && $imagesContainer instanceof jQuery) {
+                if (!_.isUndefined($imagesContainer)) {
                     $imagesContainer.html('');
                 }
             },
```

`mageworx/module-optionadvancedpricing/view/base/web/js/advanced-pricing.js`

```diff
@@ -25,7 +25,7 @@
                 config = base.options,
                 options = $(config.optionsSelector, form);
 
-            options.filter('input[type!="hidden"]').each(function (index, element) {
+            options.filter($.breeze ? 'input:not([type="hidden"])' : 'input[type!="hidden"]').each(function (index, element) {
                 var $element = $(element),
                     optionId = utils.findOptionId($element),
                     values = $element.val();
```

## Installation

```bash
composer require swissup/module-breeze-mageworx-advancedproductoptions
bin/magento module:enable Swissup_BreezeMageworxAdvancedproductoptions
```
