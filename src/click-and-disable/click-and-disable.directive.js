angular.module('tcLib').directive('clickAndDisable', [function() {
	return {
        restrict: 'A',
		scope: {
			clickAndDisable: '&'
		},
		link: function(scope, iElement, iAttrs) {
			iElement.bind('click', function() {
                scope.clickAndDisable = scope.clickAndDisable || $timeout(angular.noop, 5000);
				iElement.prop('disabled',true);
				scope.clickAndDisable().finally(function() {
					iElement.prop('disabled',false);
				});
			});
		}
	};
}]);
