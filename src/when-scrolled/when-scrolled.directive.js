angular.module('tcLib').directive("whenScrolled", function() {
	return {
		restrict: 'A',
		scope: {
			scrollerApi: '=?',
			whenScrolled: '&'
		},
		link: function(scope, elem, attrs) {
			var prevScrollTop = 0;
			raw = elem[0];

            elem.bind("scroll", function() {
				if ((prevScrollTop < raw.scrollTop) && (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight)) {
					scope.whenScrolled();
					prevScrollTop = raw.scrollTop;
				}
			});
			
			function scrollerApi() {
				function resetScroll() {
					prevScrollTop = 0;
					raw.scrollTop = 0;
				}

				return {
					resetScroll: resetScroll
				};
			}

			scope.scrollerApi = scrollerApi();
		}
	};
});