// Version 1.5.5 / PlethoraThemes Release: 1
(function(window, $, undefined){

	// Prepare our Variables
	var History  = window.History;
	var document = window.document;

	// Check to see if History.js is enabled for our Browser
	if ( !History.enabled ) return false;

	// Wait for Document
	$(function(){

		var rootUrl         = aws_data['rootUrl'];
		var contentSelector = aws_data['container_id'];
		var $content        = $(contentSelector);
		var contentNode     = $content.get(0);
		var $body           = $(document.body);
		var scrollOptions   = {
				duration : 800,
				easing   :'swing'
			};

		// Ensure Content
		if ( $content.length === 0 ) $content = $body;

		// Internal Helper
		$.expr[':'].internal = function(obj, index, meta, stack){

			// Prepare
			var	$this = $(obj);
			var url = $this.attr('href')||'';
			var isInternalLink;

			// Check link
			isInternalLink = url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;

			// Ignore or Keep
			return isInternalLink;
		};

		// HTML Helper
		var documentHtml = function(html){

			var result = String(html).replace(/<\!DOCTYPE[^>]*>/i, '')
			// 						 .replace(/<(html|head|body|title|script)([\s\>])/gi,'<div id="document-$1"$2')
									 .replace(/<(html|head|body|title)([\s\>])/gi,'<div id="document-$1"$2')
			// 						 .replace(/<\/(html|head|body|title|script)\>/gi,'</div>');
									 .replace(/<\/(html|head|body|title)\>/gi,'</div>');
			return result;
		};

		// Ajaxify Helper
		$.fn.ajaxify = function(){

			var $this = $(this);
			$this
			.find('a:internal:not(.no-ajaxy,[href^="#"], [href*="wp-login"], [href*="wp-admin"])')
			.on('click', function(event){

				var $this	= $(this);
				var url		= $this.attr('href');
				var title 	= $this.attr('title') || null;

				// Continue as normal for cmd clicks etc
				if ( event.which == 2 || event.metaKey ) return true;

				// Ajaxify this link
				History.pushState( null, title, url );
				event.preventDefault();
				return false;
			});
			// Chain
			return $this;
		};

		// Ajaxify our Internal Links
		$body.ajaxify();

		// Hook into State Changes
		$(window).bind('statechange',function(e){

			var State 		= History.getState();
			var url			= State.url;
			var relativeUrl = url.replace(rootUrl,'');

			// Set Loading
			// $body.addClass('loading');
			
			// Start Fade Out
			// Animating to opacity to 0 still keeps the element's height intact
			// Which prevents that annoying pop bang issue when loading in new content
			
			if ( '' != aws_data['transition'] ) {
				$content.animate({opacity:0},800);
			}
			// if( '' != aws_data['loader'] ) {
			// 	$content
			// 	.html('<img src="' +rootUrl+ 'wp-content/plugins/ajaxify-wordpress-site/images/' +aws_data['loader']+ '" />')
			// 	.css('text-align', 'center');
			// }

			// Ajax Request the Traditional Page
			$.ajax({
				url     : url,
				success : function(data, textStatus, jqXHR){
					// Prepare
					var $data 			= $(documentHtml(data));
					var $dataBody		= $data.find('#document-body:first ' + contentSelector);
					var bodyClasses 	= $data.find('#document-body:first').attr('class');
					var contentHtml;
					var $scripts;
					
					var $menu_list = $data.find('.' + aws_data['mcdc']);
					
					//Add classes to body
					jQuery('body').attr('class', bodyClasses);
					
					// Fetch the scripts
					// $scripts = $dataBody.find('#document-script');
					$scripts = $data.find('script');
					if ( $scripts.length ) $scripts.detach();

					// Fetch the content
					contentHtml = $dataBody.html()||$data.html();

					if ( !contentHtml ) {
						document.location.href = url;
						return false;
					}

					$data
					.find('style[data-type="vc_custom-css"], style[data-type="vc_shortcodes-custom-css"]')
					.each(function(){
						document.getElementsByTagName('head')[0].appendChild(this);
					});

					// Update the content
					$content.stop(true,true);
					$content.html(contentHtml)
							.ajaxify()
							.css('text-align', '')
							.animate({opacity: 1, visibility: "visible"});
					
					//Scroll to the top of ajax container
					if ( '' != aws_data['scrollTop'] ) {
						jQuery('html, body').animate({
									scrollTop: jQuery(contentSelector).offset().top
									}, 1000);
					}
					
					//Append new menu HTML to provided classs
					$('.' + aws_data['mcdc']).html($menu_list.html());
					$body.ajaxify();
					//Adding no-ajaxy class to a tags present under ids provided
					$(aws_data['ids']).each(function(){
						jQuery(this).addClass('no-ajaxy');
					});
					
					// Update the title
					document.title = $data.find('#document-title:first').text();
					try {
						document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;')
																							.replace('>','&gt;')
																							.replace(' & ',' &amp; ');
					}
					catch ( Exception ) { }

					// Add the scripts
					$scripts.each(function(){
						var src = this.src;
						if ( src ){
							$.getScript( src );
						} else {
							contentNode.appendChild(this);
						}
					});
					
					// BuddyPress Support
					if ( aws_data['bp_status'] ) {
						$.getScript(rootUrl + '/wp-content/plugins/buddypress/bp-templates/bp-legacy/js/buddypress.js');
					}
					
					console.log('[Ajax page loaded]');
					$body.removeClass('loading');

					// Inform Google Analytics of the change
					if ( typeof window.pageTracker !== 'undefined' ) window.pageTracker._trackPageview(relativeUrl);

					// Inform ReInvigorate of a state change
					if ( typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined' )
						reinvigorate.ajax_track(url);// ^ we use the full url here as that is what reinvigorate supports
				},
				error: function(jqXHR, textStatus, errorThrown){
					document.location.href = url;
					return false;
				}

			}); // end ajax

		}); // end onStateChange

	}); // end onDomLoad
 
})(window, jQuery); // end closure

jQuery(function($){

	//Adding no-ajaxy class to a tags present under ids provided
	$(aws_data['ids']).each(function(){ 
		$(this).addClass('no-ajaxy');
	});
	
	//append anchor tag to DOM to make the search in site ajaxify.
	var searchButtonHtml = '<span id="ajax-search" style="display:none;"><a href=""></a></span>'
	$("body").prepend(searchButtonHtml);
	
	//Make the link ajaxify.
	$("#ajax-search").ajaxify();
	
	//After submitting the search form search the post without refreshing the browser.
	$(aws_data['searchID']).on('submit',
		function(d){
			d.preventDefault();
			var host = aws_data['rootUrl'] + "?s=";
			var $ajaxSearchAnchor = $("#ajax-search a");
				$ajaxSearchAnchor.attr("href", host + $(this).find('input[type="search"]').val());
				$ajaxSearchAnchor.trigger("click");
		}
	);
});