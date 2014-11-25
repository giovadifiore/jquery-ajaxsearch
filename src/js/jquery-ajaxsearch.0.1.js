/**
*
* - A jQuery plugin for ajax searches
*
* - Creation date: 11/2014
* - Version: 0.1 
* - Author: Giovanni Di Fiore
* - Email: giovadf@gmail.com
*
*/

(function($){
	
	$.fn.ajaxSearch = function(inputSettings) {
		
		var settings = $.extend({
			contentSourceUrl: null,
    		placeholder: "Type to search",
    		showLoader: true,
    		onSelected: function(source) {},
    		onUnselectedEnter : function(text) {}
        }, inputSettings );
		
	    return this.each(function(inputSettings) {
	    	
	    	if (settings.contentSourceUrl == null)
    		{
	    		throw('jQueryAjaxSearch: property contentSourceUrl not specified. Unable to instantiate the plugin.');
	    		return false;
    		}
	    	
	    	var $searchField = $(this),
	    		$wrapper = $('<div/>', {'class': 'ajax-search-wrapper'}),
	    		$searchResultWrapper = $('<div/>', {'class': 'ajax-searchresult-wrapper'}),
	    		$searchResult = $('<div/>', {'class': 'ajax-searchresult-container'}),
	    		$searchResultList = $('<ul/>', {'class': 'ajax-searchresult-list'}),
	    		$loadingCircle = $('<div/>', {'class': 'ajax-loading-circle'}),
	    		$liSelected = null,
	    		options = [],
	    		fetched = false,
	    		filterMouseEvents = false;
	    	
	    	// build the html object
	    	$searchField.attr({
	    		'placeholder':  settings.placeholder,
	    		'autocomplete': 'off'
	    	});
	    	$searchField.wrap($wrapper);
	    	$searchField.after($searchResultWrapper.append($searchResult.append($searchResultList)));
	    	$searchResultWrapper.addClass('hide').css('top', $searchField.outerHeight());
	    	
	    	if (settings.showLoader)
    		{
	    		$loadingCircle.addClass('hide');
	    		$loadingCircle.append('\
	    			<div class="f_circleG" id="frotateG_01"></div>\
					<div class="f_circleG" id="frotateG_02"></div>\
					<div class="f_circleG" id="frotateG_03"></div>\
					<div class="f_circleG" id="frotateG_04"></div>\
					<div class="f_circleG" id="frotateG_05"></div>\
					<div class="f_circleG" id="frotateG_06"></div>\
					<div class="f_circleG" id="frotateG_07"></div>\
					<div class="f_circleG" id="frotateG_08"></div>'
	    		);
	    		$searchResultWrapper.append($loadingCircle);
    		}
	    	
	    	// stop propagation of events above the $wrapper element
	    	$wrapper.click(function(e) {
	    		e.stopPropagation();
	    	});	    	
	    	
	    	// when clicked outside, hide the search result box
	    	$(document).click(function(e) {
	    		$searchResultWrapper.addClass('hide');
	    		$searchField.val(null);
	    	});
	    	
	    	// capture user keyboard inputs
	    	$searchField.keyup(function(e) {
	    		e.preventDefault();
	    		return __keyEventDispatcher(e);	
	    	});
	    	
	    	// remove the selected element
	    	$searchField.click(function(e) {
	    		if ($liSelected != null)
    			{
	    			$liSelected.removeClass('selected');
		    		$liSelected = null;
    			}
	    		if ($searchResultWrapper.hasClass('hide'))
    			{
	    			__performSearch();
    			}
	    	});
	    	
	    	// re-enable mouse events when the mouse moves
	    	$searchResultWrapper.mousemove(function(){
	    		filterMouseEvents = false;
	    	});
	    	
	    	// debouncer used to defer search when user inputs
	    	function debouncer( func , timeout )
	    	{
	    	   var timeoutID , timeout = timeout || 200;
	    	   return function () {
	    	      var scope = this , args = arguments;
	    	      clearTimeout( timeoutID );
	    	      timeoutID = setTimeout( function () {
	    	          func.apply( scope , Array.prototype.slice.call( args ) );
	    	      } , timeout );
	    	   };
	    	}
	    	
	    	// main keyboard event dispatcher
	    	function __keyEventDispatcher(e)
	    	{
	    		if (e.which === 40 || e.which === 38)
    			{	    			
	    			return __keyEventArrowsUpDown(e);
    			}	    		
	    		if (e.which === 13)
    			{
	    			return __keyEventEnter(e);
    			}	    		
	    		return debouncer(__performSearch(), 300);
	    	}
	    	
	    	function __performSearch()
	    	{
	    		var text = $searchField.val();
	    		
	    		// empty list when a new search is performed 
    			$searchResultList.empty();
    			$searchResultWrapper.scrollTop(0);
	    		
	    		if (text.length>2)
	    		{	    			
	    			// load options (this will fire the ajax call only on the first load)
	    			__loadOptions(function() {

	    				// update text
	    	    		text = $searchField.val();
	    	    		
	    	    		if (text.length<3)
	    	    		{
	    	    			// if not enough text was typed, hide the result list
	    	    			$searchResultWrapper.addClass('hide');
	    	    			return false;
	    	    		}
	    	    		
	    				// perform search
	    	    		var i = 0;
	    				$.each(options, function(k, v) {
	    					if (v.textToLower.search(text.toLowerCase()) >= 0)
    						{
	    						i++;
	    						
	    						$li = $('<li/>', {'data-object-key': k});
	    						$mainWrapper = $('<div/>', {'class': 'list-item-main-wrapper'});
	    						
	    						$a = $('<a/>', {'class': 'list-item-anchor'}).html(__highlightText(v.text, text, ['<span class="searched">', '</span>']));
	    						$aWrapper = $('<div/>', {'class': 'list-item-anchor-wrapper'});
	    						$aWrapper.append($a);
	    						
	    						$img = $('<img/>', {'class': 'list-item-image', 'src': v.thumbUrl});
	    						$imgWrapper = $('<div/>', {'class': 'list-item-image-wrapper'});
	    						$imgWrapper.append($img);
	    						
	    						$readmoreIconWrapper = $('<div/>', {'class': 'list-item-readmore-wrapper'});
	    						$readmoreIcon = $('<i/>', {'class': 'fa fa-sign-out'});
	    						$readmoreIconWrapper.append($readmoreIcon);
	    						
	    						$mainWrapper.append($imgWrapper);
	    						$mainWrapper.append($aWrapper);
	    						$mainWrapper.append($readmoreIconWrapper);
	    						
	    						$li.append($mainWrapper);
	    						
	    						// bind events
	    						$li.bind('mouseenter', __mouseEventEnter);
	    						$li.bind('click', __mouseListClick);
	    						
	    						// append li
	    						$searchResultList.append($li);
    						}
	    				});
	    				
	    				// hide result wrapper
	    				$searchResultWrapper.removeClass('hide');
	    				
	    			});
	    			
	    		} else {

	    			// if not enough text was typed, hide the result list
	    			$searchResultWrapper.addClass('hide');
	    		}
	    	}
	    	
	    	function __highlightText(subject, text, highlightWrapper)
	    	{
	    		if (typeof subject != 'string' || typeof text != 'string' || typeof highlightWrapper != 'object') return false;
	    		// we have to highlight the 'text' into 'subject' 
	    		var startIndex = subject.toLowerCase().search(text.toLowerCase());
	    		var highlightChunk = subject.substring(startIndex, startIndex+text.length);
	    		return subject.replace(highlightChunk, highlightWrapper[0] + highlightChunk + highlightWrapper[1]);	    		
	    	}
	    	
	    	function __loadOptions(onOptionsReady)
	    	{
	    		if (fetched)
	    		{
	    			if (typeof onOptionsReady == 'function')
					{
    					onOptionsReady();
    					return true;
					} else {
						return false;
					}
	    		}
	    		
	    		__showLoader();
	    		
				fetched = true;
	    		
    			$.getJSON(settings.contentSourceUrl, function(data) {
    				$.each(data, function(k, v) {
    					var option = {
    						'source' : v,
    						'id' : v.id,
    						'value' : v.url,
    						'text' : v.title,
    						'thumbUrl' : v.thumbUrl,
    						'textToLower' : v.title.toLowerCase()
    					};
    					options[k] = option;
    				});   
    				
    				__hideLoader();
    				
    				if (typeof onOptionsReady == 'function')
					{
    					onOptionsReady();
					}
    			});
	    	}
	    	
	    	function __showLoader()
	    	{
	    		if (settings.showLoader)
    			{
	    			$loadingCircle.removeClass('hide');
    			}
	    	}
	    	
	    	function __hideLoader()
	    	{
	    		if (settings.showLoader)
    			{
					$loadingCircle.addClass('hide');
    			}
	    	}
	    	
	    	function __keyEventEnter(e)
	    	{
	    		$selected = $searchResultList.find('li.selected');

				e.preventDefault();
	    		
	    		if ($selected.size()==1)
    			{
	    			var k = $selected.attr('data-object-key');
	    			if (typeof settings.onSelected == 'function')
    				{
	    				return settings.onSelected(options[k].source);
    				}
    			} else {
    				if (typeof settings.onUnselectedEnter == 'function')
					{
    					return settings.onUnselectedEnter($searchField.val());
					}
    			}
	    		
	    		return false;
	    	}
	    	
	    	// list focus with arrow keys
	    	function __keyEventArrowsUpDown(e) {
	    	    
	    		$li = $searchResultList.find('li');
	    		
	    	    if (e.which === 40)
	    	    {
	    	        if ($liSelected)
	    	        {
	    	            $liSelected.removeClass('selected');
	    	            next = $liSelected.next();
	    	            if (next.length > 0) {
	    	                $liSelected = next.addClass('selected');
	    	            } else {
	    	                $liSelected = $li.eq(0).addClass('selected');
	    	            }
	    	        } else {
	    	            $liSelected = $li.eq(0).addClass('selected');
	    	        }
	    	    }
	    	    else if (e.which === 38)
	    	    {
	    	        if ($liSelected)
	    	        {
	    	            $liSelected.removeClass('selected');
	    	            next = $liSelected.prev();
	    	            if (next.length > 0) {
	    	                $liSelected = next.addClass('selected');
	    	            } else {
	    	                $liSelected = $li.last().addClass('selected');
	    	            }
	    	        } else {
	    	            $liSelected = $li.last().addClass('selected');
	    	        }
	    	    }
	    	    
	    	    if (!__isInSearchViewport($liSelected))
    	    	{
	    	    	filterMouseEvents = true;
	    	    	$searchResultWrapper.scrollTop($liSelected.position().top);
    	    	}
	    	    
	    	    // stop all other events on this field
	    	    return false;
	    	}
	    	
	    	function __mouseEventEnter(e)
	    	{
	    		if (filterMouseEvents) return false;
	    		$li = $(this);
	    		if ($liSelected != null)
	    		{
	    			$liSelected.removeClass('selected');
	    		}
	    		$liSelected = $li.addClass('selected');
	    	}
	    	
	    	function __isInSearchViewport($obj)
	    	{
	    		var liOffsetTop = $obj.position().top,
	    			scrollTop = $searchResultWrapper.scrollTop(),
	    			viewportHeight = $searchResultWrapper.height();    		
	    		return (liOffsetTop >= scrollTop && liOffsetTop-scrollTop <= (viewportHeight - $obj.height()));
	    	}
	    	
	    	function __mouseListClick(e)
	    	{
	    		e.preventDefault();
	    		
	    		var $li = $(this),
	    			k = $li.attr('data-object-key');
	    		
	    		// trigger event when clicked
	    		if (typeof settings.onSelected == 'function')
				{
    				return settings.onSelected(options[k].source);
				}
	    	}
	    	
	    });
	 
	};	
	
}(jQuery));
