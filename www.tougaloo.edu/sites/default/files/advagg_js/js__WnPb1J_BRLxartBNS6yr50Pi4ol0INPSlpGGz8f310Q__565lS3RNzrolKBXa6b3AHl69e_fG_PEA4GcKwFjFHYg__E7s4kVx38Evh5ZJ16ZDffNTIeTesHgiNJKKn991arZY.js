(function ($) {

/**
 * Toggle the visibility of a fieldset using smooth animations.
 */
Drupal.toggleFieldset = function (fieldset) {
  var $fieldset = $(fieldset);
  if ($fieldset.is('.collapsed')) {
    var $content = $('> .fieldset-wrapper', fieldset).hide();
    $fieldset
      .removeClass('collapsed')
      .trigger({ type: 'collapsed', value: false })
      .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Hide'));
    $content.slideDown({
      duration: 'fast',
      easing: 'linear',
      complete: function () {
        Drupal.collapseScrollIntoView(fieldset);
        fieldset.animating = false;
      },
      step: function () {
        // Scroll the fieldset into view.
        Drupal.collapseScrollIntoView(fieldset);
      }
    });
  }
  else {
    $fieldset.trigger({ type: 'collapsed', value: true });
    $('> .fieldset-wrapper', fieldset).slideUp('fast', function () {
      $fieldset
        .addClass('collapsed')
        .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Show'));
      fieldset.animating = false;
    });
  }
};

/**
 * Scroll a given fieldset into view as much as possible.
 */
Drupal.collapseScrollIntoView = function (node) {
  var h = document.documentElement.clientHeight || document.body.clientHeight || 0;
  var offset = document.documentElement.scrollTop || document.body.scrollTop || 0;
  var posY = $(node).offset().top;
  var fudge = 55;
  if (posY + node.offsetHeight + fudge > h + offset) {
    if (node.offsetHeight > h) {
      window.scrollTo(0, posY);
    }
    else {
      window.scrollTo(0, posY + node.offsetHeight - h + fudge);
    }
  }
};

Drupal.behaviors.collapse = {
  attach: function (context, settings) {
    $('fieldset.collapsible', context).once('collapse', function () {
      var $fieldset = $(this);
      // Expand fieldset if there are errors inside, or if it contains an
      // element that is targeted by the URI fragment identifier.
      var anchor = location.hash && location.hash != '#' ? ', ' + location.hash : '';
      if ($fieldset.find('.error' + anchor).length) {
        $fieldset.removeClass('collapsed');
      }

      var summary = $('<span class="summary"></span>');
      $fieldset.
        bind('summaryUpdated', function () {
          var text = $.trim($fieldset.drupalGetSummary());
          summary.html(text ? ' (' + text + ')' : '');
        })
        .trigger('summaryUpdated');

      // Turn the legend into a clickable link, but retain span.fieldset-legend
      // for CSS positioning.
      var $legend = $('> legend .fieldset-legend', this);

      $('<span class="fieldset-legend-prefix element-invisible"></span>')
        .append($fieldset.hasClass('collapsed') ? Drupal.t('Show') : Drupal.t('Hide'))
        .prependTo($legend)
        .after(' ');

      // .wrapInner() does not retain bound events.
      var $link = $('<a class="fieldset-title" href="#"></a>')
        .prepend($legend.contents())
        .appendTo($legend)
        .click(function () {
          var fieldset = $fieldset.get(0);
          // Don't animate multiple times.
          if (!fieldset.animating) {
            fieldset.animating = true;
            Drupal.toggleFieldset(fieldset);
          }
          return false;
        });

      $legend.append(summary);
    });
  }
};

})(jQuery);

;/*})'"*/
;/*})'"*/
(function ($, Drupal, window, document, undefined) {


// To understand behaviors, see https://drupal.org/node/756722#behaviors
Drupal.behaviors.my_custom_behavior = {
  attach: function(context, settings) {

    // Place your code here.
//	$(".jcarousel-view--calendar-block--block li:first").before('<li class="filler">2016-2017 Academic Calendar</li>');

  var front = $('body.front').length;
  function mobileFix() {
    $mobile = $('.mean-nav').find('span').each(function(i, el) {
      $el = $(el);
      $el.replaceWith("<a href='#'>" + $el.text() + "</a>");
    }); 
    if (!$('.mean-bar #mobile-content').length) {
      $('#mobile-content').clone().appendTo('.mean-bar');
    }   
  }
  mobileFix();
  $(window).resize(mobileFix);


  $('.ms-top-bar .form-text').attr('placeholder', 'Search');

  //wrap entire front page boxes with their inner link
  $('.region-boxes p a').each(function(i,el) {
    var $this = $(this);
    var $link = $("<a></a>").attr('href',$this.attr('href'));
    $this.closest('.block > div:last-child').wrap($link);
    $this.replaceWith(this.innerHTML);
  }); 

  //animated slide in box
  var $special = $('.ms-special');
  var height = $(window).height();

  $special.show().css({bottom:height});

  $special.find('.block-content img').load(function() {
    $special.animate({bottom:0},7000, 'linear');
  });

  $('.ms-special .ms-close').click(function() {
    $special.stop();
    $special.hide();
  });

  $special.hover(function(){
    $special.stop();
  },function(){
    $special.animate({bottom:0},4000);
  });


  //front page news slider
  if(front){
    var $news = $('.ms-news-wrap .view-content');
    var $newSide = $('.ms-news-side ul');
    $news.find('.views-row').each(function(i) {
      var title = $(this).find('.views-field-title').text();
      var $li = $('<li></li>').attr({'data-row': i}).text(title);
      $newSide.append($li);
    });
    var slick = $news.slick({
      dots: true,
      autoplay: true
    });
    $newSide.find('li').click(function() {
      slick.slick('slickGoTo', $(this).data('row'));
    });
    $newSide.find('li:first-child').addClass('ms-active');

    slick.on('beforeChange', function(event, slick, currentSlide, nextSlide){
      $newSide.find('.ms-active').removeClass('ms-active');
      $newSide.find('li[data-row='+nextSlide+']').addClass('ms-active');
    });

    var $more = $('.ms-news .view-footer a');
    var $moreLi = $('<li></li>').addClass('ms-view-more').append($more);
    $('.ms-news .slick-dots').append($moreLi);
  }

//end
  }
};


})(jQuery, Drupal, this, this.document);


jQuery(document).ready(function(e) {
// Create a clone of the menu, right next to original.
jQuery('.tmenucontainer').addClass('original').clone().insertAfter('.tmenucontainer').addClass('cloned').css('position','fixed').css('top','0').css('margin-top','0').css('z-index','500').removeClass('original').hide();

scrollIntervalID = setInterval(stickIt, 10);


function stickIt() {

  var orgElementPos = jQuery('.original').offset();
  orgElementTop = orgElementPos.top;               

  if (jQuery(window).scrollTop() >= (orgElementTop)) {
    // scrolled past the original position; now only show the cloned, sticky element.

    // Cloned element should always have same left position and width as original element.     
    orgElement = jQuery('.original');
    coordsOrgElement = orgElement.offset();
    leftOrgElement = coordsOrgElement.left;  
    widthOrgElement = orgElement.css('width');
    jQuery('.cloned').css('left',leftOrgElement+'px').css('top',0).css('width',widthOrgElement).show();
    jQuery('.original').css('visibility','hidden');
  } else {
    // not scrolled past the menu; only show the original menu.
    jQuery('.cloned').hide();
    jQuery('.original').css('visibility','visible');
  }
}
	});

;/*})'"*/
;/*})'"*/
/*
 * Collapse plugin for jQuery
 * --
 * source: http://github.com/danielstocks/jQuery-Collapse/
 * site: http://webcloud.se/jQuery-Collapse
 *
 * @author Daniel Stocks (http://webcloud.se)
 * Copyright 2013, Daniel Stocks
 * Released under the MIT, BSD, and GPL Licenses.
 */

(function($) {

  // Constructor
  function Collapse (el, options) {
    options = options || {};
    var _this = this,
      query = options.query || "> :even";

    $.extend(_this, {
      $el: el,
      options : options,
      sections: [],
      isAccordion : options.accordion || false,
      db : options.persist ? jQueryCollapseStorage(el.get(0).id) : false
    });

    // Figure out what sections are open if storage is used
    _this.states = _this.db ? _this.db.read() : [];

    // For every pair of elements in given
    // element, create a section
    _this.$el.find(query).each(function() {
      new jQueryCollapseSection($(this), _this);
    });

    // Capute ALL the clicks!
    (function(scope) {
      _this.$el.on("click", "[data-collapse-summary] " + (scope.options.clickQuery || ""),
        $.proxy(_this.handleClick, scope));

      _this.$el.bind("toggle close open",
        $.proxy(_this.handleEvent, scope));

    }(_this));
  }

  Collapse.prototype = {
    handleClick: function(e, state) {
      e.preventDefault();
      var state = state || "toggle"
      var sections = this.sections,
        l = sections.length;
      while(l--) {
        if($.contains(sections[l].$summary[0], e.target)) {
          sections[l][state]();
          break;
        }
      }
    },
    handleEvent: function(e) {
      if(e.target == this.$el.get(0)) return this[e.type]();
      this.handleClick(e, e.type);
    },
    open: function(eq) {
      if(isFinite(eq)) return this.sections[eq].open();
      $.each(this.sections, function(i, section) {
        section.open();
      })
    },
    close: function(eq) {
      if(isFinite(eq)) return this.sections[eq].close();
      $.each(this.sections, function(i, section) {
        section.close();
      })
    },
    toggle: function(eq) {
      if(isFinite(eq)) return this.sections[eq].toggle();
      $.each(this.sections, function(i, section) {
        section.toggle();
      })
    }
  };

  // Section constructor
  function Section($el, parent) {

    if(!parent.options.clickQuery) $el.wrapInner('<a href="#"/>');

    $.extend(this, {
      isOpen : false,
      $summary : $el.attr("data-collapse-summary",""),
      $details : $el.next(),
      options: parent.options,
      parent: parent
    });
    parent.sections.push(this);

    // Check current state of section
    var state = parent.states[this._index()];

    if(state === 0) {
      this.close(true)
    }
    else if(this.$summary.is(".open") || state === 1) {
      this.open(true);
    } else {
      this.close(true)
    }
  }

  Section.prototype = {
    toggle : function() {
      this.isOpen ? this.close() : this.open();
    },
    close: function(bypass) {
      this._changeState("close", bypass);
    },
    open: function(bypass) {
      var _this = this;
      if(_this.options.accordion && !bypass) {
        $.each(_this.parent.sections, function(i, section) {
          section.close()
        });
      }
      _this._changeState("open", bypass);
    },
    _index: function() {
      return $.inArray(this, this.parent.sections);
    },
    _changeState: function(state, bypass) {

      var _this = this;
      _this.isOpen = state == "open";
      if($.isFunction(_this.options[state]) && !bypass) {
        _this.options[state].apply(_this.$details);
      } else {
        _this.$details[_this.isOpen ? "show" : "hide"]();
      }

      _this.$summary.toggleClass("open", state != "close")
      _this.$details.attr("aria-hidden", state == "close");
      _this.$summary.attr("aria-expanded", state == "open");
      _this.$summary.trigger(state == "open" ? "opened" : "closed", _this);
      if(_this.parent.db) {
        _this.parent.db.write(_this._index(), _this.isOpen);
      }
    }
  };

  // Expose in jQuery API
  $.fn.extend({
    collapse: function(options, scan) {
      var nodes = (scan) ? $("body").find("[data-collapse]") : $(this);
      return nodes.each(function() {
        var settings = (scan) ? {} : options,
          values = $(this).attr("data-collapse") || "";
        $.each(values.split(" "), function(i,v) {
          if(v) settings[v] = true;
        });
        new Collapse($(this), settings);
      });
    }
  });

  //jQuery DOM Ready
  $(function() {
    $.fn.collapse(false, true);
  });

  // Expose constructor to
  // global namespace
  jQueryCollapse = Collapse;
  jQueryCollapseSection = Section;

})(window.jQuery);

;/*})'"*/
;/*})'"*/
/*!
* Collapsible.js 1.0.0
* https://github.com/jordnkr/collapsible
*
* Copyright 2013, Jordan Ruedy
* This content is released under the MIT license
* http://opensource.org/licenses/MIT
*/

(function($, undefined) {
    $.fn.collapsible = function(effect, options) {

        var defaults = {
            accordionUpSpeed: 400,
            accordionDownSpeed: 400,
            collapseSpeed: 400,
			contentOpen: 0,
            arrowRclass: 'arrow-r',
            arrowDclass: 'arrow-d',
            animate: true
        };

        if (typeof effect === "object") {
            var settings = $.extend(defaults, effect);
        } else {
            var settings = $.extend(defaults, options);
        }

        return this.each(function() {
            if (settings.animate === false) {
                settings.accordionUpSpeed = 0;
                settings.accordionDownSpeed = 0;
                settings.collapseSpeed = 0;
            }

            var $thisEven = $(this).children(':even');
            var $thisOdd = $(this).children(':odd');
			var accord = 'accordion-active';

            switch (effect) {
				case 'accordion-open':
					/* FALLTHROUGH */
                case 'accordion':
					if (effect === 'accordion-open') {
						$($thisEven[settings.contentOpen]).children(':first-child').toggleClass(settings.arrowRclass + ' ' + settings.arrowDclass);
						$($thisOdd[settings.contentOpen]).show().addClass(accord);
					}
                    $($thisEven).click(function() {
                        if ($(this).next().attr('class') === accord) {
                            $(this).next().slideUp(settings.accordionUpSpeed).removeClass(accord);
                            $(this).children(':first-child').toggleClass(settings.arrowRclass + ' ' + settings.arrowDclass);
                        } else {
                            $($thisEven).children().removeClass(settings.arrowDclass).addClass(settings.arrowRclass); 
                            $($thisOdd).slideUp(settings.accordionUpSpeed).removeClass(accord);
                            $(this).next().slideDown(settings.accordionDownSpeed).addClass(accord); 
                            $(this).children(':first-child').toggleClass(settings.arrowRclass + ' ' + settings.arrowDclass);              
                        }
                    });
                    break;
				case 'default-open':
					/* FALLTHROUGH */
                default:
					if (effect === 'default-open') {
						$($thisEven[settings.contentOpen]).children(':first-child').toggleClass(settings.arrowRclass + ' ' + settings.arrowDclass);
						$($thisOdd[settings.contentOpen]).show();
					}
                    $($thisEven).click(function() {
                        $(this).children(':first-child').toggleClass(settings.arrowRclass + ' ' + settings.arrowDclass);
                        $(this).next().slideToggle(settings.collapseSpeed);
                    });  
					break;
            }      
        });
    };
})(jQuery);
;/*})'"*/
;/*})'"*/
