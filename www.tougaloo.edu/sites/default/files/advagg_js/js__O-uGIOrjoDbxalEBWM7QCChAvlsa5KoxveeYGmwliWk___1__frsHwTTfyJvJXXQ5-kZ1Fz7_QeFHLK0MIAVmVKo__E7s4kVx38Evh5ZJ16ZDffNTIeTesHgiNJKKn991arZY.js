(function ($) {

/**
 * Retrieves the summary for the first element.
 */
$.fn.drupalGetSummary = function () {
  var callback = this.data('summaryCallback');
  return (this[0] && callback) ? $.trim(callback(this[0])) : '';
};

/**
 * Sets the summary for all matched elements.
 *
 * @param callback
 *   Either a function that will be called each time the summary is
 *   retrieved or a string (which is returned each time).
 */
$.fn.drupalSetSummary = function (callback) {
  var self = this;

  // To facilitate things, the callback should always be a function. If it's
  // not, we wrap it into an anonymous function which just returns the value.
  if (typeof callback != 'function') {
    var val = callback;
    callback = function () { return val; };
  }

  return this
    .data('summaryCallback', callback)
    // To prevent duplicate events, the handlers are first removed and then
    // (re-)added.
    .unbind('formUpdated.summary')
    .bind('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    })
    // The actual summaryUpdated handler doesn't fire when the callback is
    // changed, so we have to do this manually.
    .trigger('summaryUpdated');
};

/**
 * Sends a 'formUpdated' event each time a form element is modified.
 */
Drupal.behaviors.formUpdated = {
  attach: function (context) {
    // These events are namespaced so that we can remove them later.
    var events = 'change.formUpdated click.formUpdated blur.formUpdated keyup.formUpdated';
    $(context)
      // Since context could be an input element itself, it's added back to
      // the jQuery object and filtered again.
      .find(':input').andSelf().filter(':input')
      // To prevent duplicate events, the handlers are first removed and then
      // (re-)added.
      .unbind(events).bind(events, function () {
        $(this).trigger('formUpdated');
      });
  }
};

/**
 * Prepopulate form fields with information from the visitor cookie.
 */
Drupal.behaviors.fillUserInfoFromCookie = {
  attach: function (context, settings) {
    $('form.user-info-from-cookie').once('user-info-from-cookie', function () {
      var formContext = this;
      $.each(['name', 'mail', 'homepage'], function () {
        var $element = $('[name=' + this + ']', formContext);
        var cookie = $.cookie('Drupal.visitor.' + this);
        if ($element.length && cookie) {
          $element.val(cookie);
        }
      });
    });
  }
};

})(jQuery);

;/*})'"*/
;/*})'"*/
/**
 * @file
 * Views Slideshow Xtra Javascript.
 */
(function ($) {
  Drupal.behaviors.viewsSlideshowXtraOverlay = {
    attach: function (context) {

      // Return if there are no vsx elements on the page
      if ($('.views-slideshow-xtra-overlay').length == 0) {
        return;
      }

      // Hide all overlays for all slides.
      $('.views-slideshow-xtra-overlay-row').hide();

      var pageX = 0, pageY = 0, timeout;

      // Modify the slideshow(s) that have a vsx overlay.
      $('.views_slideshow_main').each(function() {
        var slideshowMain = $(this);

        // Get the view for this slideshow
        var view = slideshowMain.closest('.view');

        // Process the view if it has at least one overlay.
        if ($('.views-slideshow-xtra-overlay', view).length > 0) {

          // Get the View ID and Display ID so we can get the settings.
          var viewClasses = classList(view);

          $.each( viewClasses, function(index, item) {
            // We need this code because the id of the element selected will be something like:
            // "views_slideshow_cycle_main_views_slideshow_xtra_example-page"
            // We don't want to reference the string "cycle" in our code, and there is not a way to
            // get the "View ID - Display ID" substring from the id string, unless the string "cycle"
            // is referenced in a string manipulation function.

            // Get the View ID
            if((/^view-id-/).test(item)) {
              viewId = item.substring('view-id-'.length);
            }

            // Get the Display ID
            if((/^view-display-id-/).test(item)) {
              viewDisplayId = item.substring('view-display-id-'.length);
            }

          });

          if(typeof viewId != "undefined") {

            // Get the settings.
            var settings = Drupal.settings.viewsSlideshowXtraOverlay[viewId + '-' + viewDisplayId];

            // Set Pause after mouse movement setting.
            if (settings.hasOwnProperty('pauseAfterMouseMove')) {
              var pauseAfterMouseMove = settings.pauseAfterMouseMove;
              if (pauseAfterMouseMove > 0) {
                $(this).mousemove(function(e) {
                  if (pageX - e.pageX > 5 || pageY - e.pageY > 5) {
                    Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": viewId + '-' + viewDisplayId });
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": viewId + '-' + viewDisplayId });
                        }, 2000);
                  }
                  pageX = e.pageX;
                  pageY = e.pageY;
                });
              }
            }

          }

          // Process the overlay(s).
          $('.views-slideshow-xtra-overlay:not(.views-slideshow-xtra-overlay-processed)', view).addClass('views-slideshow-xtra-overlay-processed').each(function() {
              // Remove the overlay html from the dom
              var overlayHTML = $(this).detach();
              // Attach the overlay to the slideshow main div.
              $(overlayHTML).appendTo(slideshowMain);
          });

        }

      });
    }
  };

  Drupal.viewsSlideshowXtraOverlay = Drupal.viewsSlideshowXtraOverlay || {};

  Drupal.viewsSlideshowXtraOverlay.transitionBegin = function (options) {

    // Hide all overlays for all slides.
    $('#views_slideshow_cycle_main_' + options.slideshowID + ' .views-slideshow-xtra-overlay-row').hide();

    // Show the overlays for the current slide.
    $('#views_slideshow_cycle_main_' + options.slideshowID + ' [id^="views-slideshow-xtra-overlay-"]' + ' .views-slideshow-xtra-overlay-row-' + options.slideNum).each(function() {

      // Get the overlay settings.
      var overlay = $(this);
      var overlayContainerId = overlay.parent().attr('id');
      var settings = Drupal.settings.viewsSlideshowXtraOverlay[overlayContainerId];

      // Fade in or show overlay with optional delay.
      setTimeout(function() {
        if(settings.overlayFadeIn) {
          overlay.fadeIn(settings.overlayFadeIn);
        } else {
          overlay.show();
        }
      },
        settings.overlayDelay
      );

      // Fade out overlay with optional delay.
      if(settings.overlayFadeOut) {
        setTimeout(function() {
          overlay.fadeOut(settings.overlayFadeOut);
        },
        settings.overlayFadeOutDelay
        );
      }

    });
  };

  function classList(elem){
    var classList = elem.attr('class').split(/\s+/);
     var classes = new Array(classList.length);
     $.each( classList, function(index, item){
         classes[index] = item;
     });

     return classes;
  }

})(jQuery);

;/*})'"*/
;/*})'"*/
// Image Node Auto-Format with Auto Image Grouping.
// Original version by Steve McKenzie.
// Altered by Stella Power for jQuery version.

(function ($) {

function parse_url(url, param) {
  param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  url = url.replace(/&amp;/, "&");
  var regexS = "[\\?&]"+param+"=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(url);
  if (results === null) {
    return "";
  }
  else {
    return results[1];
  }
}


function lightbox2_init_triggers(classes, rel_type, custom_class) {
  if (classes == '' || rel_type == 0) {
    return;
  }
  var settings = Drupal.settings.lightbox2;

  var link_target  = "";
  if (settings.node_link_target !== 0) {
    link_target = 'target="'+ settings.node_link_target +'"';
  }

  $("a:has("+classes+")").each(function(i) {
    if ((!settings.disable_for_gallery_lists && !settings.disable_for_acidfree_gallery_lists) || (!$(this).parents("td.giAlbumCell").attr("class") && !$(this).parents(".galleries").length && !$(this).parents(".acidfree-folder").length && !$(this).parents(".acidfree-list").length) || ($(this).parents(".galleries").length && !settings.disable_for_gallery_lists) || (($(this).parents(".acidfree-folder").length || $(this).parents(".acidfree-list").length) && !settings.disable_for_acidfree_gallery_lists)) {
      var child = $(this).find(classes);
      // Ensure the child has a class attribute we can work with.
      if ($(child).attr("class")) {
        // Set the alt text.
        var alt = $(child).attr("alt");
        if (!alt) {
          alt = "";
        }

        // Set the image node link text.
        var link_text = settings.node_link_text;
        var download_link_text = settings.download_link_text;
        var rewrite = 1;

        // Set the rel attribute.
        var rel = "lightbox";
        var lightframe = false;
        if (rel_type == "lightframe_ungrouped") {
          rel = "lightframe[]";
          lightframe = true;
        }
        else if (rel_type == "lightframe") {
          lightframe = true;
        }
        else if (rel_type == "lightbox_ungrouped") {
          rel = "lightbox[]";
        }
        if (rel_type != "lightbox_ungrouped" && rel_type != "lightframe_ungrouped") {
          rel = rel_type + "[" + $(child).attr("class") + "]";
        }

        // Set the basic href attribute - need to ensure there's no language
        // string (e.g. /en) prepended to the URL.
        var id = null;
        var href = $(child).attr("src");
        var download = null;
        var orig_href = $(this).attr("href");
        var pattern = new RegExp(settings.file_path);
        if (orig_href.match(pattern)) {
          var lang_pattern = new RegExp(Drupal.settings.basePath + "\\w\\w\\/");
          orig_href = orig_href.replace(lang_pattern, Drupal.settings.basePath);
        }
        var frame_href = orig_href;
        // Handle flickr images.
        if ($(child).attr("class").match("flickr-photo-img") ||
          $(child).attr("class").match("flickr-photoset-img")) {
          href = $(child).attr("src").replace("_s.", ".").replace("_t.", ".").replace("_m.", ".").replace("_b.", ".");
          if (rel_type != "lightbox_ungrouped" && rel_type != "lightframe_ungrouped") {
            rel = rel_type + "[flickr]";
            if ($(child).parents("div.block-flickr").attr("class")) {
              id = $(child).parents("div.block-flickr").attr("id");
              rel = rel_type + "["+ id +"]";
            }
          }
          download = href;
        }

        // Handle "image-img_assist_custom" images.
        else if ($(child).filter("img[class*=img_assist_custom]").size()) {
          // Image assist uses "+" signs for spaces which doesn't work for
          // normal links.
          if (settings.display_image_size != "original") {
            orig_href = orig_href.replace(/\+/, " ");
            href = $(child).attr("src").replace(new RegExp("\\.img_assist_custom-[0-9]+x[0-9]+"), ((settings.display_image_size === "")?settings.display_image_size:"."+ settings.display_image_size));
            if (rel_type != "lightbox_ungrouped" && rel_type != "lightframe_ungrouped") {
              rel = rel_type + "[node_images]";
            }
            if (lightframe) {
              frame_href = orig_href + "/lightbox2";
            }
          }
          else {
            rewrite = 0;
          }
        }

        // Handle "inline" images.
        else if ($(child).attr("class").match("inline")) {
          href = orig_href;
        }

        // Handle gallery2 block images.
        else if ($(child).attr("class").match("ImageFrame_image") || $(child).attr("class").match("ImageFrame_none")) {
          var thumb_id = parse_url(href, "g2_itemId");
          var new_id = parse_url(orig_href, "g2_itemId");
          if (new_id && thumb_id) {
            var g2pattern = new RegExp("g2_itemId="+thumb_id);
            var replacement = "g2_itemId="+ new_id;
            href = href.replace(g2pattern, replacement);
          }
          rel = rel_type + "[gallery2]";
          if ($(child).parents("div.block-gallery").attr("class")) {
            id = $(child).parents("div.block-gallery").attr("id");
            rel = rel_type + "["+ id +"]";
          }
          download = href;
        }


        // Set the href attribute.
        else if (settings.image_node_sizes != '()' && !custom_class) {
          if (settings.display_image_size != "original") {
            href = $(child).attr("src").replace(new RegExp(settings.image_node_sizes), ((settings.display_image_size === "")?settings.display_image_size:"."+ settings.display_image_size)).replace(/(image\/view\/\d+)(\/[\w\-]*)/, ((settings.display_image_size === "")?"$1/_original":"$1/"+ settings.display_image_size));
            if (rel_type != "lightbox_ungrouped" && rel_type != "lightframe_ungrouped") {
              rel = rel_type + "[node_images]";
              if ($(child).parents("div.block-multiblock,div.block-image").attr("class")) {
                id = $(child).parents("div.block-multiblock,div.block-image").attr("id");
                rel = rel_type + "["+ id +"]";
              }
            }
            download = $(child).attr("src").replace(new RegExp(settings.image_node_sizes), "").replace(/(image\/view\/\d+)(\/[\w\-]*)/, "$1/_original");
            if (lightframe) {
              frame_href = orig_href + "/lightbox2";
            }
          }
          else {
            rewrite = 0;
          }
        }
        // Modify the image url.
        var img_title = $(child).attr("title");
        if (!img_title) {
          img_title = $(this).attr("title");
          if (!img_title) {
            img_title = $(child).attr("alt");
          }
          $(child).attr({title: img_title});
        }
        if (lightframe) {
          href = frame_href;
        }
        if (rewrite) {
          if (!custom_class) {
            var title_link = "";
            if (link_text.length) {
              title_link = "<br /><br /><a href=\"" + orig_href + "\" id=\"lightbox2-node-link-text\" "+ link_target +" >"+ link_text + "</a>";
            }
            if (download_link_text.length && download) {
              title_link = title_link + " - <a href=\"" + download + "\" id=\"lightbox2-download-link-text\" target=\"_blank\">" + download_link_text + "</a>";
            }
            rel = rel + "[" + img_title + title_link + "]";
            $(this).attr({
              rel: rel,
              href: href
            });
          }
          else {
            if (rel_type != "lightbox_ungrouped" && rel_type != "lightframe_ungrouped") {
              rel = rel_type + "[" + $(child).attr("class") + "]";
              if ($(child).parents("div.block-image").attr("class")) {
                id = $(child).parents("div.block-image").attr("id");
                rel = rel_type + "["+ id +"]";
              }
            }
            rel = rel + "[" + img_title + "]";
            $(this).attr({
              rel: rel,
              href: orig_href
            });
          }
        }
      }
    }

  });
}

function lightbox2_image_nodes() {
  var settings = Drupal.settings.lightbox2;

  // Don't do it on the image assist popup selection screen.
  var img_assist = document.getElementById("img_assist_thumbs");
  if (!img_assist) {

    // Select the enabled image types.
    lightbox2_init_triggers(settings.trigger_lightbox_classes, "lightbox_ungrouped");
    lightbox2_init_triggers(settings.custom_trigger_classes, settings.custom_class_handler, true);
    lightbox2_init_triggers(settings.trigger_lightbox_group_classes, "lightbox");
    lightbox2_init_triggers(settings.trigger_slideshow_classes, "lightshow");
    lightbox2_init_triggers(settings.trigger_lightframe_classes, "lightframe_ungrouped");
    lightbox2_init_triggers(settings.trigger_lightframe_group_classes, "lightframe");
  }
}

Drupal.behaviors.initAutoLightbox = {
  attach: function(context, settings) {
    lightbox2_image_nodes();
  }
};

//End jQuery block
}(jQuery));

;/*})'"*/
;/*})'"*/
/* $Id: lightbox.js,v 1.5.2.6.2.136 2010/09/24 08:39:40 snpower Exp $ */

/**
 * jQuery Lightbox
 * @author
 *   Stella Power, <http://drupal.org/user/66894>
 *
 * Based on Lightbox v2.03.3 by Lokesh Dhakar
 * <http://www.huddletogether.com/projects/lightbox2/>
 * Also partially based on the jQuery Lightbox by Warren Krewenki
 *   <http://warren.mesozen.com>
 *
 * Permission has been granted to Mark Ashmead & other Drupal Lightbox2 module
 * maintainers to distribute this file via Drupal.org
 * Under GPL license.
 *
 * Slideshow, iframe and video functionality added by Stella Power.
 */

var Lightbox;
(function($) {
Lightbox = {
  auto_modal : false,
  overlayOpacity : 0.8, // Controls transparency of shadow overlay.
  overlayColor : '000', // Controls colour of shadow overlay.
  disableCloseClick : true,
  // Controls the order of the lightbox resizing animation sequence.
  resizeSequence: 0, // 0: simultaneous, 1: width then height, 2: height then width.
  resizeSpeed: 'normal', // Controls the speed of the lightbox resizing animation.
  fadeInSpeed: 'normal', // Controls the speed of the image appearance.
  slideDownSpeed: 'slow', // Controls the speed of the image details appearance.
  minWidth: 240,
  borderSize : 10,
  boxColor : 'fff',
  fontColor : '000',
  topPosition : '',
  infoHeight: 20,
  alternative_layout : false,
  imageArray : [],
  imageNum : null,
  total : 0,
  activeImage : null,
  inprogress : false,
  disableResize : false,
  disableZoom : false,
  isZoomedIn : false,
  rtl : false,
  loopItems : false,
  keysClose : ['c', 'x', 27],
  keysPrevious : ['p', 37],
  keysNext : ['n', 39],
  keysZoom : ['z'],
  keysPlayPause : [32],

  // Slideshow options.
  slideInterval : 5000, // In milliseconds.
  showPlayPause : true,
  autoStart : true,
  autoExit : true,
  pauseOnNextClick : false, // True to pause the slideshow when the "Next" button is clicked.
  pauseOnPrevClick : true, // True to pause the slideshow when the "Prev" button is clicked.
  slideIdArray : [],
  slideIdCount : 0,
  isSlideshow : false,
  isPaused : false,
  loopSlides : false,

  // Iframe options.
  isLightframe : false,
  iframe_width : 600,
  iframe_height : 400,
  iframe_border : 1,

  // Video and modal options.
  enableVideo : false,
  flvPlayer : '/flvplayer.swf',
  flvFlashvars : '',
  isModal : false,
  isVideo : false,
  videoId : false,
  modalWidth : 400,
  modalHeight : 400,
  modalHTML : null,


  // initialize()
  // Constructor runs on completion of the DOM loading.
  // The function inserts html at the bottom of the page which is used
  // to display the shadow overlay and the image container.
  initialize: function() {

    var s = Drupal.settings.lightbox2;
    Lightbox.overlayOpacity = s.overlay_opacity;
    Lightbox.overlayColor = s.overlay_color;
    Lightbox.disableCloseClick = s.disable_close_click;
    Lightbox.resizeSequence = s.resize_sequence;
    Lightbox.resizeSpeed = s.resize_speed;
    Lightbox.fadeInSpeed = s.fade_in_speed;
    Lightbox.slideDownSpeed = s.slide_down_speed;
    Lightbox.borderSize = s.border_size;
    Lightbox.boxColor = s.box_color;
    Lightbox.fontColor = s.font_color;
    Lightbox.topPosition = s.top_position;
    Lightbox.rtl = s.rtl;
    Lightbox.loopItems = s.loop_items;
    Lightbox.keysClose = s.keys_close.split(" ");
    Lightbox.keysPrevious = s.keys_previous.split(" ");
    Lightbox.keysNext = s.keys_next.split(" ");
    Lightbox.keysZoom = s.keys_zoom.split(" ");
    Lightbox.keysPlayPause = s.keys_play_pause.split(" ");
    Lightbox.disableResize = s.disable_resize;
    Lightbox.disableZoom = s.disable_zoom;
    Lightbox.slideInterval = s.slideshow_interval;
    Lightbox.showPlayPause = s.show_play_pause;
    Lightbox.showCaption = s.show_caption;
    Lightbox.autoStart = s.slideshow_automatic_start;
    Lightbox.autoExit = s.slideshow_automatic_exit;
    Lightbox.pauseOnNextClick = s.pause_on_next_click;
    Lightbox.pauseOnPrevClick = s.pause_on_previous_click;
    Lightbox.loopSlides = s.loop_slides;
    Lightbox.alternative_layout = s.use_alt_layout;
    Lightbox.iframe_width = s.iframe_width;
    Lightbox.iframe_height = s.iframe_height;
    Lightbox.iframe_border = s.iframe_border;
    Lightbox.enableVideo = s.enable_video;
    if (s.enable_video) {
      Lightbox.flvPlayer = s.flvPlayer;
      Lightbox.flvFlashvars = s.flvFlashvars;
    }

    // Make the lightbox divs.
    var layout_class = (s.use_alt_layout ? 'lightbox2-alt-layout' : 'lightbox2-orig-layout');
    var output = '<div id="lightbox2-overlay" style="display: none;"></div>\
      <div id="lightbox" style="display: none;" class="' + layout_class + '">\
        <div id="outerImageContainer"></div>\
        <div id="imageDataContainer" class="clearfix">\
          <div id="imageData"></div>\
        </div>\
      </div>';
    var loading = '<div id="loading"><a href="#" id="loadingLink"></a></div>';
    var modal = '<div id="modalContainer" style="display: none;"></div>';
    var frame = '<div id="frameContainer" style="display: none;"></div>';
    var imageContainer = '<div id="imageContainer" style="display: none;"></div>';
    var details = '<div id="imageDetails"></div>';
    var bottomNav = '<div id="bottomNav"></div>';
    var image = '<img id="lightboxImage" alt="" />';
    var hoverNav = '<div id="hoverNav"><a id="prevLink" href="#"></a><a id="nextLink" href="#"></a></div>';
    var frameNav = '<div id="frameHoverNav"><a id="framePrevLink" href="#"></a><a id="frameNextLink" href="#"></a></div>';
    var hoverNav = '<div id="hoverNav"><a id="prevLink" title="' + Drupal.t('Previous') + '" href="#"></a><a id="nextLink" title="' + Drupal.t('Next') + '" href="#"></a></div>';
    var frameNav = '<div id="frameHoverNav"><a id="framePrevLink" title="' + Drupal.t('Previous') + '" href="#"></a><a id="frameNextLink" title="' + Drupal.t('Next') + '" href="#"></a></div>';
    var caption = '<span id="caption"></span>';
    var numberDisplay = '<span id="numberDisplay"></span>';
    var close = '<a id="bottomNavClose" title="' + Drupal.t('Close') + '" href="#"></a>';
    var zoom = '<a id="bottomNavZoom" href="#"></a>';
    var zoomOut = '<a id="bottomNavZoomOut" href="#"></a>';
    var pause = '<a id="lightshowPause" title="' + Drupal.t('Pause Slideshow') + '" href="#" style="display: none;"></a>';
    var play = '<a id="lightshowPlay" title="' + Drupal.t('Play Slideshow') + '" href="#" style="display: none;"></a>';

    $("body").append(output);
    $('#outerImageContainer').append(modal + frame + imageContainer + loading);
    if (!s.use_alt_layout) {
      $('#imageContainer').append(image + hoverNav);
      $('#imageData').append(details + bottomNav);
      $('#imageDetails').append(caption + numberDisplay);
      $('#bottomNav').append(frameNav + close + zoom + zoomOut + pause + play);
    }
    else {
      $('#outerImageContainer').append(bottomNav);
      $('#imageContainer').append(image);
      $('#bottomNav').append(close + zoom + zoomOut);
      $('#imageData').append(hoverNav + details);
      $('#imageDetails').append(caption + numberDisplay + pause + play);
    }

    // Setup onclick handlers.
    if (Lightbox.disableCloseClick) {
      $('#lightbox2-overlay').click(function() { Lightbox.end(); return false; } ).hide();
    }
    $('#loadingLink, #bottomNavClose').click(function() { Lightbox.end('forceClose'); return false; } );
    $('#prevLink, #framePrevLink').click(function() { Lightbox.changeData(Lightbox.activeImage - 1); return false; } );
    $('#nextLink, #frameNextLink').click(function() { Lightbox.changeData(Lightbox.activeImage + 1); return false; } );
    $('#bottomNavZoom').click(function() { Lightbox.changeData(Lightbox.activeImage, true); return false; } );
    $('#bottomNavZoomOut').click(function() { Lightbox.changeData(Lightbox.activeImage, false); return false; } );
    $('#lightshowPause').click(function() { Lightbox.togglePlayPause("lightshowPause", "lightshowPlay"); return false; } );
    $('#lightshowPlay').click(function() { Lightbox.togglePlayPause("lightshowPlay", "lightshowPause"); return false; } );

    // Fix positioning.
    $('#prevLink, #nextLink, #framePrevLink, #frameNextLink').css({ 'paddingTop': Lightbox.borderSize + 'px'});
    $('#imageContainer, #frameContainer, #modalContainer').css({ 'padding': Lightbox.borderSize + 'px'});
    $('#outerImageContainer, #imageDataContainer, #bottomNavClose').css({'backgroundColor': '#' + Lightbox.boxColor, 'color': '#'+Lightbox.fontColor});
    if (Lightbox.alternative_layout) {
      $('#bottomNavZoom, #bottomNavZoomOut').css({'bottom': Lightbox.borderSize + 'px', 'right': Lightbox.borderSize + 'px'});
    }
    else if (Lightbox.rtl == 1 && Drupal.settings.lightbox2.useragent.search('MSIE') !== -1) {
      $('#bottomNavZoom, #bottomNavZoomOut').css({'left': '0px'});
    }

    // Force navigation links to always be displayed
    if (s.force_show_nav) {
      $('#prevLink, #nextLink').addClass("force_show_nav");
    }

  },

  // initList()
  // Loops through anchor tags looking for 'lightbox', 'lightshow' and
  // 'lightframe', etc, references and applies onclick events to appropriate
  // links. You can rerun after dynamically adding images w/ajax.
  initList : function(context) {

    if (context == undefined || context == null) {
      context = document;
    }

    // Attach lightbox to any links with rel 'lightbox', 'lightshow' or
    // 'lightframe', etc.
    $("a[rel^='lightbox']:not(.lightbox-processed), area[rel^='lightbox']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
      if (Lightbox.disableCloseClick) {
        $('#lightbox').unbind('click');
        $('#lightbox').click(function() { Lightbox.end('forceClose'); } );
      }
      Lightbox.start(this, false, false, false, false);
      if (e.preventDefault) { e.preventDefault(); }
      return false;
    });
    $("a[rel^='lightshow']:not(.lightbox-processed), area[rel^='lightshow']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
      if (Lightbox.disableCloseClick) {
        $('#lightbox').unbind('click');
        $('#lightbox').click(function() { Lightbox.end('forceClose'); } );
      }
      Lightbox.start(this, true, false, false, false);
      if (e.preventDefault) { e.preventDefault(); }
      return false;
    });
    $("a[rel^='lightframe']:not(.lightbox-processed), area[rel^='lightframe']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
      if (Lightbox.disableCloseClick) {
        $('#lightbox').unbind('click');
        $('#lightbox').click(function() { Lightbox.end('forceClose'); } );
      }
      Lightbox.start(this, false, true, false, false);
      if (e.preventDefault) { e.preventDefault(); }
      return false;
    });
    if (Lightbox.enableVideo) {
      $("a[rel^='lightvideo']:not(.lightbox-processed), area[rel^='lightvideo']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
        if (Lightbox.disableCloseClick) {
          $('#lightbox').unbind('click');
          $('#lightbox').click(function() { Lightbox.end('forceClose'); } );
        }
        Lightbox.start(this, false, false, true, false);
        if (e.preventDefault) { e.preventDefault(); }
        return false;
      });
    }
    $("a[rel^='lightmodal']:not(.lightbox-processed), area[rel^='lightmodal']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
      $('#lightbox').unbind('click');
      // Add classes from the link to the lightbox div - don't include lightbox-processed
      $('#lightbox').addClass($(this).attr('class'));
      $('#lightbox').removeClass('lightbox-processed');
      Lightbox.start(this, false, false, false, true);
      if (e.preventDefault) { e.preventDefault(); }
      return false;
    });
    $("#lightboxAutoModal:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function(e) {
      Lightbox.auto_modal = true;
      $('#lightbox').unbind('click');
      Lightbox.start(this, false, false, false, true);
      if (e.preventDefault) { e.preventDefault(); }
      return false;
    });
  },

  // start()
  // Display overlay and lightbox. If image is part of a set, add siblings to
  // imageArray.
  start: function(imageLink, slideshow, lightframe, lightvideo, lightmodal) {

    Lightbox.isPaused = !Lightbox.autoStart;

    // Replaces hideSelectBoxes() and hideFlash() calls in original lightbox2.
    Lightbox.toggleSelectsFlash('hide');

    // Stretch overlay to fill page and fade in.
    var arrayPageSize = Lightbox.getPageSize();
    $("#lightbox2-overlay").hide().css({
      'width': '100%',
      'zIndex': '10090',
      'height': arrayPageSize[1] + 'px',
      'backgroundColor' : '#' + Lightbox.overlayColor
    });
    // Detect OS X FF2 opacity + flash issue.
    if (lightvideo && this.detectMacFF2()) {
      $("#lightbox2-overlay").removeClass("overlay_default");
      $("#lightbox2-overlay").addClass("overlay_macff2");
      $("#lightbox2-overlay").css({'opacity' : null});
    }
    else {
      $("#lightbox2-overlay").removeClass("overlay_macff2");
      $("#lightbox2-overlay").addClass("overlay_default");
      $("#lightbox2-overlay").css({'opacity' : Lightbox.overlayOpacity});
    }
    $("#lightbox2-overlay").fadeIn(Lightbox.fadeInSpeed);


    Lightbox.isSlideshow = slideshow;
    Lightbox.isLightframe = lightframe;
    Lightbox.isVideo = lightvideo;
    Lightbox.isModal = lightmodal;
    Lightbox.imageArray = [];
    Lightbox.imageNum = 0;

    var anchors = $(imageLink.tagName);
    var anchor = null;
    var rel_parts = Lightbox.parseRel(imageLink);
    var rel = rel_parts["rel"];
    var rel_group = rel_parts["group"];
    var title = (rel_parts["title"] ? rel_parts["title"] : imageLink.title);
    var rel_style = null;
    var i = 0;

    if (rel_parts["flashvars"]) {
      Lightbox.flvFlashvars = Lightbox.flvFlashvars + '&' + rel_parts["flashvars"];
    }

    // Set the title for image alternative text.
    var alt = imageLink.title;
    if (!alt) {
      var img = $(imageLink).find("img");
      if (img && $(img).attr("alt")) {
        alt = $(img).attr("alt");
      }
      else {
        alt = title;
      }
    }

    if ($(imageLink).attr('id') == 'lightboxAutoModal') {
      rel_style = rel_parts["style"];
      Lightbox.imageArray.push(['#lightboxAutoModal > *', title, alt, rel_style, 1]);
    }
    else {
      // Handle lightbox images with no grouping.
      if ((rel == 'lightbox' || rel == 'lightshow') && !rel_group) {
        Lightbox.imageArray.push([imageLink.href, title, alt]);
      }

      // Handle other items with no grouping.
      else if (!rel_group) {
        rel_style = rel_parts["style"];
        Lightbox.imageArray.push([imageLink.href, title, alt, rel_style]);
      }

      // Handle grouped items.
      else {

        // Loop through anchors and add them to imageArray.
        for (i = 0; i < anchors.length; i++) {
          anchor = anchors[i];
          if (anchor.href && typeof(anchor.href) == "string" && $(anchor).attr('rel')) {
            var rel_data = Lightbox.parseRel(anchor);
            var anchor_title = (rel_data["title"] ? rel_data["title"] : anchor.title);
            img_alt = anchor.title;
            if (!img_alt) {
              var anchor_img = $(anchor).find("img");
              if (anchor_img && $(anchor_img).attr("alt")) {
                img_alt = $(anchor_img).attr("alt");
              }
              else {
                img_alt = title;
              }
            }
            if (rel_data["rel"] == rel) {
              if (rel_data["group"] == rel_group) {
                if (Lightbox.isLightframe || Lightbox.isModal || Lightbox.isVideo) {
                  rel_style = rel_data["style"];
                }
                Lightbox.imageArray.push([anchor.href, anchor_title, img_alt, rel_style]);
              }
            }
          }
        }

        // Remove duplicates.
        for (i = 0; i < Lightbox.imageArray.length; i++) {
          for (j = Lightbox.imageArray.length-1; j > i; j--) {
            if (Lightbox.imageArray[i][0] == Lightbox.imageArray[j][0]) {
              Lightbox.imageArray.splice(j,1);
            }
          }
        }
        while (Lightbox.imageArray[Lightbox.imageNum][0] != imageLink.href) {
          Lightbox.imageNum++;
        }
      }
    }

    if (Lightbox.isSlideshow && Lightbox.showPlayPause && Lightbox.isPaused) {
      $('#lightshowPlay').show();
      $('#lightshowPause').hide();
    }

    // Calculate top and left offset for the lightbox.
    var arrayPageScroll = Lightbox.getPageScroll();
    var lightboxTop = arrayPageScroll[1] + (Lightbox.topPosition == '' ? (arrayPageSize[3] / 10) : Lightbox.topPosition) * 1;
    var lightboxLeft = arrayPageScroll[0];
    $('#frameContainer, #modalContainer, #lightboxImage').hide();
    $('#hoverNav, #prevLink, #nextLink, #frameHoverNav, #framePrevLink, #frameNextLink').hide();
    $('#imageDataContainer, #numberDisplay, #bottomNavZoom, #bottomNavZoomOut').hide();
    $('#outerImageContainer').css({'width': '250px', 'height': '250px'});
    $('#lightbox').css({
      'zIndex': '10500',
      'top': lightboxTop + 'px',
      'left': lightboxLeft + 'px'
    }).show();

    Lightbox.total = Lightbox.imageArray.length;
    Lightbox.changeData(Lightbox.imageNum);
  },

  // changeData()
  // Hide most elements and preload image in preparation for resizing image
  // container.
  changeData: function(imageNum, zoomIn) {

    if (Lightbox.inprogress === false) {
      if (Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) {
        if (imageNum >= Lightbox.total) imageNum = 0;
        if (imageNum < 0) imageNum = Lightbox.total - 1;
      }

      if (Lightbox.isSlideshow) {
        for (var i = 0; i < Lightbox.slideIdCount; i++) {
          window.clearTimeout(Lightbox.slideIdArray[i]);
        }
      }
      Lightbox.inprogress = true;
      Lightbox.activeImage = imageNum;

      if (Lightbox.disableResize && !Lightbox.isSlideshow) {
        zoomIn = true;
      }
      Lightbox.isZoomedIn = zoomIn;


      // Hide elements during transition.
      $('#loading').css({'zIndex': '10500'}).show();
      if (!Lightbox.alternative_layout) {
        $('#imageContainer').hide();
      }
      $('#frameContainer, #modalContainer, #lightboxImage').hide();
      $('#hoverNav, #prevLink, #nextLink, #frameHoverNav, #framePrevLink, #frameNextLink').hide();
      $('#imageDataContainer, #numberDisplay, #bottomNavZoom, #bottomNavZoomOut').hide();

      // Preload image content, but not iframe pages.
      if (!Lightbox.isLightframe && !Lightbox.isVideo && !Lightbox.isModal) {
        $("#lightbox #imageDataContainer").removeClass('lightbox2-alt-layout-data');
        imgPreloader = new Image();
        imgPreloader.onerror = function() { Lightbox.imgNodeLoadingError(this); };

        imgPreloader.onload = function() {
          var photo = document.getElementById('lightboxImage');
          photo.src = Lightbox.imageArray[Lightbox.activeImage][0];
          photo.alt = Lightbox.imageArray[Lightbox.activeImage][2];

          var imageWidth = imgPreloader.width;
          var imageHeight = imgPreloader.height;

          // Resize code.
          var arrayPageSize = Lightbox.getPageSize();
          var targ = { w:arrayPageSize[2] - (Lightbox.borderSize * 2), h:arrayPageSize[3] - (Lightbox.borderSize * 6) - (Lightbox.infoHeight * 4) - (arrayPageSize[3] / 10) };
          var orig = { w:imgPreloader.width, h:imgPreloader.height };

          // Image is very large, so show a smaller version of the larger image
          // with zoom button.
          if (zoomIn !== true) {
            var ratio = 1.0; // Shrink image with the same aspect.
            $('#bottomNavZoomOut, #bottomNavZoom').hide();
            if ((orig.w >= targ.w || orig.h >= targ.h) && orig.h && orig.w) {
              ratio = ((targ.w / orig.w) < (targ.h / orig.h)) ? targ.w / orig.w : targ.h / orig.h;
              if (!Lightbox.disableZoom && !Lightbox.isSlideshow) {
                $('#bottomNavZoom').css({'zIndex': '10500'}).show();
              }
            }

            imageWidth  = Math.floor(orig.w * ratio);
            imageHeight = Math.floor(orig.h * ratio);
          }

          else {
            $('#bottomNavZoom').hide();
            // Only display zoom out button if the image is zoomed in already.
            if ((orig.w >= targ.w || orig.h >= targ.h) && orig.h && orig.w) {
              // Only display zoom out button if not a slideshow and if the
              // buttons aren't disabled.
              if (!Lightbox.disableResize && Lightbox.isSlideshow === false && !Lightbox.disableZoom) {
                $('#bottomNavZoomOut').css({'zIndex': '10500'}).show();
              }
            }
          }

          photo.style.width = (imageWidth) + 'px';
          photo.style.height = (imageHeight) + 'px';
          Lightbox.resizeContainer(imageWidth, imageHeight);

          // Clear onLoad, IE behaves irratically with animated gifs otherwise.
          imgPreloader.onload = function() {};
        };

        imgPreloader.src = Lightbox.imageArray[Lightbox.activeImage][0];
        imgPreloader.alt = Lightbox.imageArray[Lightbox.activeImage][2];
      }

      // Set up frame size, etc.
      else if (Lightbox.isLightframe) {
        $("#lightbox #imageDataContainer").addClass('lightbox2-alt-layout-data');
        var src = Lightbox.imageArray[Lightbox.activeImage][0];
        $('#frameContainer').html('<iframe id="lightboxFrame" style="display: none;" src="'+src+'"></iframe>');

        // Enable swf support in Gecko browsers.
        if (Drupal.settings.lightbox2.useragent.search('Mozilla') !== -1 && src.indexOf('.swf') != -1) {
          setTimeout(function () {
            document.getElementById("lightboxFrame").src = Lightbox.imageArray[Lightbox.activeImage][0];
          }, 1000);
        }

        if (!Lightbox.iframe_border) {
          $('#lightboxFrame').css({'border': 'none'});
          $('#lightboxFrame').attr('frameborder', '0');
        }
        var iframe = document.getElementById('lightboxFrame');
        var iframeStyles = Lightbox.imageArray[Lightbox.activeImage][3];
        iframe = Lightbox.setStyles(iframe, iframeStyles);
        Lightbox.resizeContainer(parseInt(iframe.width, 10), parseInt(iframe.height, 10));
      }
      else if (Lightbox.isVideo || Lightbox.isModal) {
        $("#lightbox #imageDataContainer").addClass('lightbox2-alt-layout-data');
        var container = document.getElementById('modalContainer');
        var modalStyles = Lightbox.imageArray[Lightbox.activeImage][3];
        container = Lightbox.setStyles(container, modalStyles);
        if (Lightbox.isVideo) {
          Lightbox.modalHeight =  parseInt(container.height, 10) - 10;
          Lightbox.modalWidth =  parseInt(container.width, 10) - 10;
          Lightvideo.startVideo(Lightbox.imageArray[Lightbox.activeImage][0]);
        }
        Lightbox.resizeContainer(parseInt(container.width, 10), parseInt(container.height, 10));
      }
    }
  },

  // imgNodeLoadingError()
  imgNodeLoadingError: function(image) {
    var s = Drupal.settings.lightbox2;
    var original_image = Lightbox.imageArray[Lightbox.activeImage][0];
    if (s.display_image_size !== "") {
      original_image = original_image.replace(new RegExp("."+s.display_image_size), "");
    }
    Lightbox.imageArray[Lightbox.activeImage][0] = original_image;
    image.onerror = function() { Lightbox.imgLoadingError(image); };
    image.src = original_image;
  },

  // imgLoadingError()
  imgLoadingError: function(image) {
    var s = Drupal.settings.lightbox2;
    Lightbox.imageArray[Lightbox.activeImage][0] = s.default_image;
    image.src = s.default_image;
  },

  // resizeContainer()
  resizeContainer: function(imgWidth, imgHeight) {

    imgWidth = (imgWidth < Lightbox.minWidth ? Lightbox.minWidth : imgWidth);

    this.widthCurrent = $('#outerImageContainer').width();
    this.heightCurrent = $('#outerImageContainer').height();

    var widthNew = (imgWidth  + (Lightbox.borderSize * 2));
    var heightNew = (imgHeight  + (Lightbox.borderSize * 2));

    // Scalars based on change from old to new.
    this.xScale = ( widthNew / this.widthCurrent) * 100;
    this.yScale = ( heightNew / this.heightCurrent) * 100;

    // Calculate size difference between new and old image, and resize if
    // necessary.
    wDiff = this.widthCurrent - widthNew;
    hDiff = this.heightCurrent - heightNew;

    $('#modalContainer').css({'width': imgWidth, 'height': imgHeight});
    // Detect animation sequence.
    if (Lightbox.resizeSequence) {
      var animate1 = {width: widthNew};
      var animate2 = {height: heightNew};
      if (Lightbox.resizeSequence == 2) {
        animate1 = {height: heightNew};
        animate2 = {width: widthNew};
      }
      $('#outerImageContainer').animate(animate1, Lightbox.resizeSpeed).animate(animate2, Lightbox.resizeSpeed, 'linear', function() { Lightbox.showData(); });
    }
    // Simultaneous.
    else {
      $('#outerImageContainer').animate({'width': widthNew, 'height': heightNew}, Lightbox.resizeSpeed, 'linear', function() { Lightbox.showData(); });
    }

    // If new and old image are same size and no scaling transition is necessary
    // do a quick pause to prevent image flicker.
    if ((hDiff === 0) && (wDiff === 0)) {
      if (Drupal.settings.lightbox2.useragent.search('MSIE') !== -1) {
        Lightbox.pause(250);
      }
      else {
        Lightbox.pause(100);
      }
    }

    var s = Drupal.settings.lightbox2;
    if (!s.use_alt_layout) {
      $('#prevLink, #nextLink').css({'height': imgHeight + 'px'});
    }
    $('#imageDataContainer').css({'width': widthNew + 'px'});
  },

  // showData()
  // Display image and begin preloading neighbors.
  showData: function() {
    $('#loading').hide();

    if (Lightbox.isLightframe || Lightbox.isVideo || Lightbox.isModal) {
      Lightbox.updateDetails();
      if (Lightbox.isLightframe) {
        $('#frameContainer').show();
        if (Drupal.settings.lightbox2.useragent.search('Safari') !== -1 || Lightbox.fadeInSpeed === 0) {
          $('#lightboxFrame').css({'zIndex': '10500'}).show();
        }
        else {
          $('#lightboxFrame').css({'zIndex': '10500'}).fadeIn(Lightbox.fadeInSpeed);
        }
      }
      else {
        if (Lightbox.isVideo) {
          $("#modalContainer").html(Lightbox.modalHTML).click(function(){return false;}).css('zIndex', '10500').show();
        }
        else {
          var src = unescape(Lightbox.imageArray[Lightbox.activeImage][0]);
          if (Lightbox.imageArray[Lightbox.activeImage][4]) {
            $(src).appendTo("#modalContainer");
            $('#modalContainer').css({'zIndex': '10500'}).show();
          }
          else {
            // Use a callback to show the new image, otherwise you get flicker.
            $("#modalContainer").hide().load(src, function () {$('#modalContainer').css({'zIndex': '10500'}).show();});
          }
          $('#modalContainer').unbind('click');
        }
        // This might be needed in the Lightframe section above.
        //$('#modalContainer').css({'zIndex': '10500'}).show();
      }
    }

    // Handle display of image content.
    else {
      $('#imageContainer').show();
      if (Drupal.settings.lightbox2.useragent.search('Safari') !== -1 || Lightbox.fadeInSpeed === 0) {
        $('#lightboxImage').css({'zIndex': '10500'}).show();
      }
      else {
        $('#lightboxImage').css({'zIndex': '10500'}).fadeIn(Lightbox.fadeInSpeed);
      }
      Lightbox.updateDetails();
      this.preloadNeighborImages();
    }
    Lightbox.inprogress = false;

    // Slideshow specific stuff.
    if (Lightbox.isSlideshow) {
      if (!Lightbox.loopSlides && Lightbox.activeImage == (Lightbox.total - 1)) {
        if (Lightbox.autoExit) {
          Lightbox.slideIdArray[Lightbox.slideIdCount++] = setTimeout(function () {Lightbox.end('slideshow');}, Lightbox.slideInterval);
        }
      }
      else {
        if (!Lightbox.isPaused && Lightbox.total > 1) {
          Lightbox.slideIdArray[Lightbox.slideIdCount++] = setTimeout(function () {Lightbox.changeData(Lightbox.activeImage + 1);}, Lightbox.slideInterval);
        }
      }
      if (Lightbox.showPlayPause && Lightbox.total > 1 && !Lightbox.isPaused) {
        $('#lightshowPause').show();
        $('#lightshowPlay').hide();
      }
      else if (Lightbox.showPlayPause && Lightbox.total > 1) {
        $('#lightshowPause').hide();
        $('#lightshowPlay').show();
      }
    }

    // Adjust the page overlay size.
    var arrayPageSize = Lightbox.getPageSize();
    var arrayPageScroll = Lightbox.getPageScroll();
    var pageHeight = arrayPageSize[1];
    if (Lightbox.isZoomedIn && arrayPageSize[1] > arrayPageSize[3]) {
      var lightboxTop = (Lightbox.topPosition == '' ? (arrayPageSize[3] / 10) : Lightbox.topPosition) * 1;
      pageHeight = pageHeight + arrayPageScroll[1] + lightboxTop;
    }
    $('#lightbox2-overlay').css({'height': pageHeight + 'px', 'width': arrayPageSize[0] + 'px'});

    // Gecko browsers (e.g. Firefox, SeaMonkey, etc) don't handle pdfs as
    // expected.
    if (Drupal.settings.lightbox2.useragent.search('Mozilla') !== -1) {
      if (Lightbox.imageArray[Lightbox.activeImage][0].indexOf(".pdf") != -1) {
        setTimeout(function () {
          document.getElementById("lightboxFrame").src = Lightbox.imageArray[Lightbox.activeImage][0];
        }, 1000);
      }
    }
  },

  // updateDetails()
  // Display caption, image number, and bottom nav.
  updateDetails: function() {

    $("#imageDataContainer").hide();

    var s = Drupal.settings.lightbox2;

    if (s.show_caption) {
      var caption = Lightbox.filterXSS(Lightbox.imageArray[Lightbox.activeImage][1]);
      if (!caption) caption = '';
      $('#caption').html(caption).css({'zIndex': '10500'}).show();
    }

    // If image is part of set display 'Image x of x'.
    var numberDisplay = null;
    if (s.image_count && Lightbox.total > 1) {
      var currentImage = Lightbox.activeImage + 1;
      if (!Lightbox.isLightframe && !Lightbox.isModal && !Lightbox.isVideo) {
        numberDisplay = s.image_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
      }
      else if (Lightbox.isVideo) {
        numberDisplay = s.video_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
      }
      else {
        numberDisplay = s.page_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
      }
      $('#numberDisplay').html(numberDisplay).css({'zIndex': '10500'}).show();
    }
    else {
      $('#numberDisplay').hide();
    }

    $("#imageDataContainer").hide().slideDown(Lightbox.slideDownSpeed, function() {
      $("#bottomNav").show();
    });
    if (Lightbox.rtl == 1) {
      $("#bottomNav").css({'float': 'left'});
    }
    Lightbox.updateNav();
  },

  // updateNav()
  // Display appropriate previous and next hover navigation.
  updateNav: function() {

    $('#hoverNav').css({'zIndex': '10500'}).show();
    var prevLink = '#prevLink';
    var nextLink = '#nextLink';

    // Slideshow is separated as we need to show play / pause button.
    if (Lightbox.isSlideshow) {
      if ((Lightbox.total > 1 && Lightbox.loopSlides) || Lightbox.activeImage !== 0) {
        $(prevLink).css({'zIndex': '10500'}).show().click(function() {
          if (Lightbox.pauseOnPrevClick) {
            Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
          }
          Lightbox.changeData(Lightbox.activeImage - 1); return false;
        });
      }
      else {
        $(prevLink).hide();
      }

      // If not last image in set, display next image button.
      if ((Lightbox.total > 1 && Lightbox.loopSlides) || Lightbox.activeImage != (Lightbox.total - 1)) {
        $(nextLink).css({'zIndex': '10500'}).show().click(function() {
          if (Lightbox.pauseOnNextClick) {
            Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
          }
          Lightbox.changeData(Lightbox.activeImage + 1); return false;
        });
      }
      // Safari browsers need to have hide() called again.
      else {
        $(nextLink).hide();
      }
    }

    // All other types of content.
    else {

      if ((Lightbox.isLightframe || Lightbox.isModal || Lightbox.isVideo) && !Lightbox.alternative_layout) {
        $('#frameHoverNav').css({'zIndex': '10500'}).show();
        $('#hoverNav').css({'zIndex': '10500'}).hide();
        prevLink = '#framePrevLink';
        nextLink = '#frameNextLink';
      }

      // If not first image in set, display prev image button.
      if ((Lightbox.total > 1 && Lightbox.loopItems) || Lightbox.activeImage !== 0) {
        // Unbind any other click handlers, otherwise this adds a new click handler
        // each time the arrow is clicked.
        $(prevLink).css({'zIndex': '10500'}).show().unbind().click(function() {
          Lightbox.changeData(Lightbox.activeImage - 1); return false;
        });
      }
      // Safari browsers need to have hide() called again.
      else {
        $(prevLink).hide();
      }

      // If not last image in set, display next image button.
      if ((Lightbox.total > 1 && Lightbox.loopItems) || Lightbox.activeImage != (Lightbox.total - 1)) {
        // Unbind any other click handlers, otherwise this adds a new click handler
        // each time the arrow is clicked.
        $(nextLink).css({'zIndex': '10500'}).show().unbind().click(function() {
          Lightbox.changeData(Lightbox.activeImage + 1); return false;
        });
      }
      // Safari browsers need to have hide() called again.
      else {
        $(nextLink).hide();
      }
    }

    // Don't enable keyboard shortcuts so forms will work.
    if (!Lightbox.isModal) {
      this.enableKeyboardNav();
    }
  },


  // enableKeyboardNav()
  enableKeyboardNav: function() {
    $(document).bind("keydown", this.keyboardAction);
  },

  // disableKeyboardNav()
  disableKeyboardNav: function() {
    $(document).unbind("keydown", this.keyboardAction);
  },

  // keyboardAction()
  keyboardAction: function(e) {
    if (e === null) { // IE.
      keycode = event.keyCode;
      escapeKey = 27;
    }
    else { // Mozilla.
      keycode = e.keyCode;
      escapeKey = e.DOM_VK_ESCAPE;
    }

    key = String.fromCharCode(keycode).toLowerCase();

    // Close lightbox.
    if (Lightbox.checkKey(Lightbox.keysClose, key, keycode)) {
      Lightbox.end('forceClose');
    }
    // Display previous image (p, <-).
    else if (Lightbox.checkKey(Lightbox.keysPrevious, key, keycode)) {
      if ((Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) || Lightbox.activeImage !== 0) {
        Lightbox.changeData(Lightbox.activeImage - 1);
      }

    }
    // Display next image (n, ->).
    else if (Lightbox.checkKey(Lightbox.keysNext, key, keycode)) {
      if ((Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) || Lightbox.activeImage != (Lightbox.total - 1)) {
        Lightbox.changeData(Lightbox.activeImage + 1);
      }
    }
    // Zoom in.
    else if (Lightbox.checkKey(Lightbox.keysZoom, key, keycode) && !Lightbox.disableResize && !Lightbox.disableZoom && !Lightbox.isSlideshow && !Lightbox.isLightframe) {
      if (Lightbox.isZoomedIn) {
        Lightbox.changeData(Lightbox.activeImage, false);
      }
      else if (!Lightbox.isZoomedIn) {
        Lightbox.changeData(Lightbox.activeImage, true);
      }
      return false;
    }
    // Toggle play / pause (space).
    else if (Lightbox.checkKey(Lightbox.keysPlayPause, key, keycode) && Lightbox.isSlideshow) {

      if (Lightbox.isPaused) {
        Lightbox.togglePlayPause("lightshowPlay", "lightshowPause");
      }
      else {
        Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
      }
      return false;
    }
  },

  preloadNeighborImages: function() {

    if ((Lightbox.total - 1) > Lightbox.activeImage) {
      preloadNextImage = new Image();
      preloadNextImage.src = Lightbox.imageArray[Lightbox.activeImage + 1][0];
    }
    if (Lightbox.activeImage > 0) {
      preloadPrevImage = new Image();
      preloadPrevImage.src = Lightbox.imageArray[Lightbox.activeImage - 1][0];
    }

  },

  end: function(caller) {
    var closeClick = (caller == 'slideshow' ? false : true);
    if (Lightbox.isSlideshow && Lightbox.isPaused && !closeClick) {
      return;
    }
    // To prevent double clicks on navigation links.
    if (Lightbox.inprogress === true && caller != 'forceClose') {
      return;
    }
    Lightbox.disableKeyboardNav();
    $('#lightbox').hide();
    $("#lightbox2-overlay").fadeOut();
    Lightbox.isPaused = true;
    Lightbox.inprogress = false;
    Lightbox.imageArray = [];
    Lightbox.imageNum = 0;
    // Replaces calls to showSelectBoxes() and showFlash() in original
    // lightbox2.
    Lightbox.toggleSelectsFlash('visible');
    if (Lightbox.isSlideshow) {
      for (var i = 0; i < Lightbox.slideIdCount; i++) {
        window.clearTimeout(Lightbox.slideIdArray[i]);
      }
      $('#lightshowPause, #lightshowPlay').hide();
    }
    else if (Lightbox.isLightframe) {
      $('#frameContainer').empty().hide();
    }
    else if (Lightbox.isVideo || Lightbox.isModal) {
      if (!Lightbox.auto_modal) {
        $('#modalContainer').hide().html("");
      }
      Lightbox.auto_modal = false;
    }
  },


  // getPageScroll()
  // Returns array with x,y page scroll values.
  // Core code from - quirksmode.com.
  getPageScroll : function() {

    var xScroll, yScroll;

    if (self.pageYOffset || self.pageXOffset) {
      yScroll = self.pageYOffset;
      xScroll = self.pageXOffset;
    }
    else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {  // Explorer 6 Strict.
      yScroll = document.documentElement.scrollTop;
      xScroll = document.documentElement.scrollLeft;
    }
    else if (document.body) {// All other Explorers.
      yScroll = document.body.scrollTop;
      xScroll = document.body.scrollLeft;
    }

    arrayPageScroll = [xScroll,yScroll];
    return arrayPageScroll;
  },

  // getPageSize()
  // Returns array with page width, height and window width, height.
  // Core code from - quirksmode.com.
  // Edit for Firefox by pHaez.

  getPageSize : function() {

    var xScroll, yScroll;

    if (window.innerHeight && window.scrollMaxY) {
      xScroll = window.innerWidth + window.scrollMaxX;
      yScroll = window.innerHeight + window.scrollMaxY;
    }
    else if (document.body.scrollHeight > document.body.offsetHeight) { // All but Explorer Mac.
      xScroll = document.body.scrollWidth;
      yScroll = document.body.scrollHeight;
    }
    else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari.
      xScroll = document.body.offsetWidth;
      yScroll = document.body.offsetHeight;
    }

    var windowWidth, windowHeight;

    if (self.innerHeight) { // All except Explorer.
      if (document.documentElement.clientWidth) {
        windowWidth = document.documentElement.clientWidth;
      }
      else {
        windowWidth = self.innerWidth;
      }
      windowHeight = self.innerHeight;
    }
    else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode.
      windowWidth = document.documentElement.clientWidth;
      windowHeight = document.documentElement.clientHeight;
    }
    else if (document.body) { // Other Explorers.
      windowWidth = document.body.clientWidth;
      windowHeight = document.body.clientHeight;
    }
    // For small pages with total height less than height of the viewport.
    if (yScroll < windowHeight) {
      pageHeight = windowHeight;
    }
    else {
      pageHeight = yScroll;
    }
    // For small pages with total width less than width of the viewport.
    if (xScroll < windowWidth) {
      pageWidth = xScroll;
    }
    else {
      pageWidth = windowWidth;
    }
    arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight);
    return arrayPageSize;
  },


  // pause(numberMillis)
  pause : function(ms) {
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while (curDate - date < ms);
  },


  // toggleSelectsFlash()
  // Hide / unhide select lists and flash objects as they appear above the
  // lightbox in some browsers.
  toggleSelectsFlash: function (state) {
    if (state == 'visible') {
      $("select.lightbox_hidden, embed.lightbox_hidden, object.lightbox_hidden").show();
    }
    else if (state == 'hide') {
      $("select:visible, embed:visible, object:visible").not('#lightboxAutoModal select, #lightboxAutoModal embed, #lightboxAutoModal object').addClass("lightbox_hidden");
      $("select.lightbox_hidden, embed.lightbox_hidden, object.lightbox_hidden").hide();
    }
  },


  // parseRel()
  parseRel: function (link) {
    var parts = [];
    parts["rel"] = parts["title"] = parts["group"] = parts["style"] = parts["flashvars"] = null;
    if (!$(link).attr('rel')) return parts;
    parts["rel"] = $(link).attr('rel').match(/\w+/)[0];

    if ($(link).attr('rel').match(/\[(.*)\]/)) {
      var info = $(link).attr('rel').match(/\[(.*?)\]/)[1].split('|');
      parts["group"] = info[0];
      parts["style"] = info[1];
      if (parts["style"] != undefined && parts["style"].match(/flashvars:\s?(.*?);/)) {
        parts["flashvars"] = parts["style"].match(/flashvars:\s?(.*?);/)[1];
      }
    }
    if ($(link).attr('rel').match(/\[.*\]\[([\s\S]*)\]/)) {
      var title = $(link).attr('rel').match(/\[.*\]\[([\s\S]*)\]/)[1];
      parts["title"] = title.replace(/\n/g, '<br />');
    }
    return parts;
  },

  // setStyles()
  setStyles: function(item, styles) {
    item.width = Lightbox.iframe_width;
    item.height = Lightbox.iframe_height;
    item.scrolling = "auto";

    if (!styles) return item;
    var stylesArray = styles.split(';');
    for (var i = 0; i< stylesArray.length; i++) {
      if (stylesArray[i].indexOf('width:') >= 0) {
        var w = stylesArray[i].replace('width:', '');
        item.width = jQuery.trim(w);
      }
      else if (stylesArray[i].indexOf('height:') >= 0) {
        var h = stylesArray[i].replace('height:', '');
        item.height = jQuery.trim(h);
      }
      else if (stylesArray[i].indexOf('scrolling:') >= 0) {
        var scrolling = stylesArray[i].replace('scrolling:', '');
        item.scrolling = jQuery.trim(scrolling);
      }
      else if (stylesArray[i].indexOf('overflow:') >= 0) {
        var overflow = stylesArray[i].replace('overflow:', '');
        item.overflow = jQuery.trim(overflow);
      }
    }
    return item;
  },


  // togglePlayPause()
  // Hide the pause / play button as appropriate.  If pausing the slideshow also
  // clear the timers, otherwise move onto the next image.
  togglePlayPause: function(hideId, showId) {
    if (Lightbox.isSlideshow && hideId == "lightshowPause") {
      for (var i = 0; i < Lightbox.slideIdCount; i++) {
        window.clearTimeout(Lightbox.slideIdArray[i]);
      }
    }
    $('#' + hideId).hide();
    $('#' + showId).show();

    if (hideId == "lightshowPlay") {
      Lightbox.isPaused = false;
      if (!Lightbox.loopSlides && Lightbox.activeImage == (Lightbox.total - 1)) {
        Lightbox.end();
      }
      else if (Lightbox.total > 1) {
        Lightbox.changeData(Lightbox.activeImage + 1);
      }
    }
    else {
      Lightbox.isPaused = true;
    }
  },

  triggerLightbox: function (rel_type, rel_group) {
    if (rel_type.length) {
      if (rel_group && rel_group.length) {
        $("a[rel^='" + rel_type +"\[" + rel_group + "\]'], area[rel^='" + rel_type +"\[" + rel_group + "\]']").eq(0).trigger("click");
      }
      else {
        $("a[rel^='" + rel_type +"'], area[rel^='" + rel_type +"']").eq(0).trigger("click");
      }
    }
  },

  detectMacFF2: function() {
    var ua = navigator.userAgent.toLowerCase();
    if (/firefox[\/\s](\d+\.\d+)/.test(ua)) {
      var ffversion = new Number(RegExp.$1);
      if (ffversion < 3 && ua.indexOf('mac') != -1) {
        return true;
      }
    }
    return false;
  },

  checkKey: function(keys, key, code) {
    return (jQuery.inArray(key, keys) != -1 || jQuery.inArray(String(code), keys) != -1);
  },

  filterXSS: function(str, allowed_tags) {
    var output = "";
    var prefix = Drupal.settings.pathPrefix;
    if (!prefix) prefix = '';
    $.ajax({
      url: Drupal.settings.basePath + prefix + '?q=system/lightbox2/filter-xss',
      data: {
        'string' : str,
        'allowed_tags' : allowed_tags
      },
      type: "POST",
      async: false,
      dataType:  "json",
      success: function(data) {
        output = data;
      }
    });
    return output;
  }

};

// Initialize the lightbox.
Drupal.behaviors.initLightbox = {
  attach: function(context) {

  $('body:not(.lightbox-processed)', context).addClass('lightbox-processed').each(function() {
    Lightbox.initialize();
    return false; // Break the each loop.
  });

  // Attach lightbox to any links with lightbox rels.
  Lightbox.initList(context);
  $('#lightboxAutoModal', context).triggerHandler('click');
  }
};
})(jQuery);

;/*})'"*/
;/*})'"*/
/**
* @file
* Javascript, modifications of DOM.
*
* Manipulates links to include jquery load funciton
*/

(function ($) {
  Drupal.behaviors.parallax_bg = {
    attach: function (context, settings) {
      var triggers = Drupal.settings.parallax_bg.triggers_fieldset;
      //.parallax(xPosition, speedFactor, outerHeight) options:
      //xPosition - Horizontal position of the element
      //inertia - speed to move relative to vertical scroll. 
      //Example: 0.1 is one tenth the speed of scrolling, 2 is twice the
      //speed of scrolling
      //outerHeight (true/false) - Whether or not jQuery should use it's 
      //outerHeight option to determine when a section is in the     viewport
      $.each(triggers, function(key, trigger) {
        $(trigger.element).parallax(trigger.position, parseFloat(trigger.speed));
      });
    }
  };  

}(jQuery));

;/*})'"*/
;/*})'"*/
/*!
 * jQuery.scrollTo
 * Copyright (c) 2007-2014 Ariel Flesler - aflesler<a>gmail<d>com | http://flesler.blogspot.com
 * Licensed under MIT
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 * @projectDescription Easy element scrolling using jQuery.
 * @author Ariel Flesler
 * @version 1.4.13
 */
;(function (define) {
	'use strict';

	define(['jquery'], function ($) {

		var $scrollTo = $.scrollTo = function( target, duration, settings ) {
			return $(window).scrollTo( target, duration, settings );
		};

		$scrollTo.defaults = {
			axis:'xy',
			duration: parseFloat($.fn.jquery) >= 1.3 ? 0 : 1,
			limit:true
		};

		// Returns the element that needs to be animated to scroll the window.
		// Kept for backwards compatibility (specially for localScroll & serialScroll)
		$scrollTo.window = function( scope ) {
			return $(window)._scrollable();
		};

		// Hack, hack, hack :)
		// Returns the real elements to scroll (supports window/iframes, documents and regular nodes)
		$.fn._scrollable = function() {
			return this.map(function() {
				var elem = this,
					isWin = !elem.nodeName || $.inArray( elem.nodeName.toLowerCase(), ['iframe','#document','html','body'] ) != -1;

					if (!isWin)
						return elem;

				var doc = (elem.contentWindow || elem).document || elem.ownerDocument || elem;

				return /webkit/i.test(navigator.userAgent) || doc.compatMode == 'BackCompat' ?
					doc.body :
					doc.documentElement;
			});
		};

		$.fn.scrollTo = function( target, duration, settings ) {
			if (typeof duration == 'object') {
				settings = duration;
				duration = 0;
			}
			if (typeof settings == 'function')
				settings = { onAfter:settings };

			if (target == 'max')
				target = 9e9;

			settings = $.extend( {}, $scrollTo.defaults, settings );
			// Speed is still recognized for backwards compatibility
			duration = duration || settings.duration;
			// Make sure the settings are given right
			settings.queue = settings.queue && settings.axis.length > 1;

			if (settings.queue)
				// Let's keep the overall duration
				duration /= 2;
			settings.offset = both( settings.offset );
			settings.over = both( settings.over );

			return this._scrollable().each(function() {
				// Null target yields nothing, just like jQuery does
				if (target == null) return;

				var elem = this,
					$elem = $(elem),
					targ = target, toff, attr = {},
					win = $elem.is('html,body');

				switch (typeof targ) {
					// A number will pass the regex
					case 'number':
					case 'string':
						if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
							targ = both( targ );
							// We are done
							break;
						}
						// Relative/Absolute selector, no break!
						targ = win ? $(targ) : $(targ, this);
						if (!targ.length) return;
					case 'object':
						// DOMElement / jQuery
						if (targ.is || targ.style)
							// Get the real position of the target
							toff = (targ = $(targ)).offset();
				}

				var offset = $.isFunction(settings.offset) && settings.offset(elem, targ) || settings.offset;

				$.each( settings.axis.split(''), function( i, axis ) {
					var Pos	= axis == 'x' ? 'Left' : 'Top',
						pos = Pos.toLowerCase(),
						key = 'scroll' + Pos,
						old = elem[key],
						max = $scrollTo.max(elem, axis);

					if (toff) {// jQuery / DOMElement
						attr[key] = toff[pos] + ( win ? 0 : old - $elem.offset()[pos] );

						// If it's a dom element, reduce the margin
						if (settings.margin) {
							attr[key] -= parseInt(targ.css('margin'+Pos)) || 0;
							attr[key] -= parseInt(targ.css('border'+Pos+'Width')) || 0;
						}

						attr[key] += offset[pos] || 0;

						if(settings.over[pos])
							// Scroll to a fraction of its width/height
							attr[key] += targ[axis=='x'?'width':'height']() * settings.over[pos];
					} else {
						var val = targ[pos];
						// Handle percentage values
						attr[key] = val.slice && val.slice(-1) == '%' ?
							parseFloat(val) / 100 * max
							: val;
					}

					// Number or 'number'
					if (settings.limit && /^\d+$/.test(attr[key]))
						// Check the limits
						attr[key] = attr[key] <= 0 ? 0 : Math.min( attr[key], max );

					// Queueing axes
					if (!i && settings.queue) {
						// Don't waste time animating, if there's no need.
						if (old != attr[key])
							// Intermediate animation
							animate( settings.onAfterFirst );
						// Don't animate this axis again in the next iteration.
						delete attr[key];
					}
				});

				animate( settings.onAfter );

				function animate( callback ) {
					$elem.animate( attr, duration, settings.easing, callback && function() {
						callback.call(this, targ, settings);
					});
				}
			}).end();
		};

		// Max scrolling position, works on quirks mode
		// It only fails (not too badly) on IE, quirks mode.
		$scrollTo.max = function( elem, axis ) {
			var Dim = axis == 'x' ? 'Width' : 'Height',
				scroll = 'scroll'+Dim;

			if (!$(elem).is('html,body'))
				return elem[scroll] - $(elem)[Dim.toLowerCase()]();

			var size = 'client' + Dim,
				html = elem.ownerDocument.documentElement,
				body = elem.ownerDocument.body;

			return Math.max( html[scroll], body[scroll] ) - Math.min( html[size]  , body[size]   );
		};

		function both( val ) {
			return $.isFunction(val) || typeof val == 'object' ? val : { top:val, left:val };
		}

		// AMD requirement
		return $scrollTo;
	})
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		// Node
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}));

;/*})'"*/
;/*})'"*/
/*
Plugin: jQuery Parallax
Version 1.1.3
Author: Ian Lunn
Twitter: @IanLunn
Author URL: http://www.ianlunn.co.uk/
Plugin URL: http://www.ianlunn.co.uk/plugins/jquery-parallax/

Dual licensed under the MIT and GPL licenses:
http://www.opensource.org/licenses/mit-license.php
http://www.gnu.org/licenses/gpl.html
*/

(function( $ ){
	var $window = $(window);
	var windowHeight = $window.height();

	$window.resize(function () {
		windowHeight = $window.height();
	});

	$.fn.parallax = function(xpos, speedFactor, outerHeight) {
		var $this = $(this);
		var getHeight;
		var firstTop;
		var paddingTop = 0;
		
		//get the starting position of each element to have parallax applied to it		
		$this.each(function(){
		    firstTop = $this.offset().top;
		});

		if (outerHeight) {
			getHeight = function(jqo) {
				return jqo.outerHeight(true);
			};
		} else {
			getHeight = function(jqo) {
				return jqo.height();
			};
		}
			
		// setup defaults if arguments aren't specified
		if (arguments.length < 1 || xpos === null) xpos = "50%";
		if (arguments.length < 2 || speedFactor === null) speedFactor = 0.1;
		if (arguments.length < 3 || outerHeight === null) outerHeight = true;
		
		// function to be called whenever the window is scrolled or resized
		function update(){
			var pos = $window.scrollTop();				

			$this.each(function(){
				var $element = $(this);
				var top = $element.offset().top;
				var height = getHeight($element);

				// Check if totally above or totally below viewport
				if (top + height < pos || top > pos + windowHeight) {
					return;
				}

				$this.css('backgroundPosition', xpos + " " + Math.round((firstTop - pos) * speedFactor) + "px");
			});
		}		

		$window.bind('scroll', update).resize(update);
		update();
	};
})(jQuery);

;/*})'"*/
;/*})'"*/
/**
 * @file
 * Adds some show/hide to the admin form to make the UXP easier.
 */
(function($){
  Drupal.behaviors.video = {
    attach: function (context, settings) {
      //lets see if we have any jmedia movies
      if($.fn.media) {
        $('.jmedia').media();
      }
	
      if(settings.video) {
        $.fn.media.defaults.flvPlayer = settings.video.flvplayer;
      }
	
      //lets setup our colorbox videos
      $('.video-box').each(function() {
        var url = $(this).attr('href');
        var data = $(this).metadata();
        var width = data.width;
        var height= data.height;
        var player = settings.video.player; //player can be either jwplayer or flowplayer.
        $(this).colorbox({
          html: '<a id="video-overlay" href="'+url+'" style="height:'+height+'; width:'+width+'; display: block;"></a>',
          onComplete:function() {
            if(player == 'flowplayer') {
              flowplayer("video-overlay", settings.video.flvplayer, {
                clip: {
                  autoPlay: settings.video.autoplay,
                  autoBuffering: settings.video.autobuffer
                }
              });
            } else {
              $('#video-overlay').media({
                flashvars: {
                  autostart: settings.video.autoplay
                },
                width:width,
                height:height
              });
            }
          }
        });
      });
    }
  };

  // On change of the thumbnails when edit.
  Drupal.behaviors.videoEdit = {
    attach : function(context, settings) {
      function setThumbnail(widget, type) {
        var thumbnails = widget.find('.video-thumbnails input');
        var defaultthumbnail = widget.find('.video-use-default-video-thumb');
        var largeimage = widget.find('.video-preview img');

        var activeThumbnail = thumbnails.filter(':checked');
        if (activeThumbnail.length > 0 && type != 'default') {
          var smallimage = activeThumbnail.next('label.option').find('img');
          largeimage.attr('src', smallimage.attr('src'));
          defaultthumbnail.attr('checked', false);
        }
        else if(defaultthumbnail.is(':checked')) {
          thumbnails.attr('checked', false);
          largeimage.attr('src', defaultthumbnail.data('defaultimage'));
        }
        else {
          // try to select the first thumbnail.
          if (thumbnails.length > 0) {
            thumbnails.first().attr('checked', 'checked');
            setThumbnail(widget, 'thumb');
          }
        }
      }

      $('.video-thumbnails input', context).change(function() {
        setThumbnail($(this).parents('.video-widget'), 'thumb');
      });

      $('.video-use-default-video-thumb', context).change(function() {
        setThumbnail($(this).parents('.video-widget'), 'default');
      });

      $('.video-widget', context).each(function() {
        setThumbnail($(this), 'both');
      });
    }
  }
})(jQuery);

;/*})'"*/
;/*})'"*/
(function ($) {
/**
 *  @file
 *  Views Slideshow DDblock admin page functionality 
 */


function initPagerPositionOptions(key, value) {
  this.key = key;
  this.value = value;
}

function setPagerPositionOptions(pagerPositionOptions) {
  var oldPagerPosition = $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-position').val();
  $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-position').find('option').remove();
  var options = '' ;
  for (var i = 0; i < pagerPositionOptions.length; i++) {
    if (i==0) { 
      options += '<option selected value="' + pagerPositionOptions[i].key + '">' + pagerPositionOptions[i].value + '</option>'; 
    }
    else {
      options += '<option value="' + pagerPositionOptions[i].key + '">' + pagerPositionOptions[i].value + '</option>';
    }
  }
  // populate select box with array
  $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-position').html(options);  
  $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-position').val(oldPagerPosition);  
}

/**
 * Change pager container depending on the pager.
 */
Drupal.behaviors.ddblockChangePagerContainerOptions = {
  attach: function(context, settings) {
  // Change pager container option depending on select.
  $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager:not(.ddblock-change-pager-container-options-processed)', context)
  .addClass('ddblock-change-pager-container-options-processed')
  .bind("change", function() {
    val = $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').val();
    switch (val) {
      case "number-pager" :
      case "prev-next-pager" :
      case "custom-pager" :
        $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.custom-pager-item');
      break;
      case "scrollable-pager" :
        $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.scrollable-pager-item');
      break;
    }
    return false;
  }).trigger('change').trigger('change')
}
};



/**
 * Show/hide custom template settings sections on the views_slideshow_ddblock configuration page.
 */
Drupal.behaviors.ddblockShowHideCustomTemplateOptions = {
  attach: function(context, settings) {

  // Show/hide imagefolder/contenttype options depending on the select.
  $('#edit-style-options-views-slideshow-ddblock-template:not(.ddblock-show-hide-custom-template-options-processed)', context)
  .addClass('ddblock-show-hide-custom-template-options-processed')
  .bind("change", function() {
    val = $('#edit-style-options-views-slideshow-ddblock-template').val();
    if (val.match('default') == "default" ) {
      $('#ddblock-pager-settings-wrapper').hide();
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-toggle-wrapper').hide();
      $('#edit-style-options-views-slideshow-ddblock-settings-pager2-settings-pager2-position-pager-wrapper').hide();
      $('ddblock-pager2-pager-settings-wrapper').hide();
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').find('option').remove().end().append('<option value="custom-pager">Custom pager</option>').val('custom-pager');
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.custom-pager-item');
      $('#ddblock-nr-of-pager-items-wrapper').hide();
    }  
    else {
      $('#ddblock-pager-settings-wrapper').show();
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-toggle-wrapper').show();
      $('#edit-style-options-views-slideshow-ddblock-settings-pager2-settings-pager2-position-pager-wrapper').show();
      $('#ddblock-pager2-pager-settings-wrapper').show();
    }      
    if (val.match("10p") == "10p" || val.match("10l") == "10l") {
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.custom-pager-item');
      $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').find('option').remove().end().append('<option value="number-pager">Number pager</option>').val('number-pager');
      $('#ddblock-nr-of-pager-items-wrapper').hide();
    }
    else {
      if (val.match("20p") == "20p" || val.match("20l") == "20l") {
        $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.custom-pager-item');
        $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').find('option').remove().end().append('<option value="prev-next-pager">Prev/Next pager</option>').val('prev-next-pager');
        $('#ddblock-nr-of-pager-items-wrapper').hide();
      }
      else {
        if (val.match("30p") == "30p" || val.match("30l") == "30l" ||
            val.match("40p") == "40p" || val.match("40l") == "40l" ||
            val.match("50p") == "50p" || val.match("50l") == "50l") {
          $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.custom-pager-item');
          $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').find('option').remove().end().append('<option value="custom-pager">Custom pager</option>').val('custom-pager');
          $('#ddblock-nr-of-pager-items-wrapper').show();
        }
        else {
          if (val.match("60p") == "60p" || val.match("60l") == "60l") {
            $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').val('scrollable-pager');
            $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager-container').val('.scrollable-pager-item');
          $('#edit-style-options-views-slideshow-ddblock-settings-pager-settings-pager').find('option').remove().end().append('<option value="scrollable-pager">Scrollable pager</option>').val('scrollable-pager');
          $('#ddblock-nr-of-pager-items-wrapper').show();
          }
        }  
      }  
    }    
    // portrait themes
    if (val.match("10p") == "10p" || val.match("20p") == "20p" ||
        val.match("30p") == "30p" || val.match("40p") == "40p" ||
        val.match("50p") == "50p" || val.match("60p") == "60p") {
      var pagerPositionOptions = new Array();  
      pagerPositionOptions[0] = new initPagerPositionOptions('top', 'Top');
      pagerPositionOptions[1] = new initPagerPositionOptions('bottom', 'Bottom');
      
      setPagerPositionOptions(pagerPositionOptions);
    }
    // landscape themes
    else {
      var pagerPositionOptions = new Array();  
      pagerPositionOptions[0] = new initPagerPositionOptions('left', 'Left');
      pagerPositionOptions[1] = new initPagerPositionOptions('right', 'Right');
 
      setPagerPositionOptions(pagerPositionOptions);
    }           
    return false;
  }).trigger('change').trigger('change')
}
};

})(jQuery);
;/*})'"*/
;/*})'"*/
