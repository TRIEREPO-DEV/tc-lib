angular.module('tcLib').directive('tcCamera', ['ngDialog', function(ngDialog) {
    return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			onCapture: '&',
			confirmText: '@'
		},
		link: function(scope, ele, attr, ngModel) {
			angular.element(ele).bind('click', function() {
				scope.capturePhoto();
			});
			scope.autoClose = !scope.confirmText;
			scope.setModel = function(snap) {
				scope.tempModel = snap;
			};
			scope.setConfirmed = function(confirmed) {
				scope.confirmed = confirmed;
			};
			scope.capturePhoto = function() {
				ngDialog.open({
		    		template:'src/camera/camera-modal.html',
		    		className: 'ngdialog-theme-default ngdialog-lg',
					controller: 'cameraModelCtrl',
					closeByDocument : false,
		    		scope: scope
		    	}).closePromise.then(function() {
		    		if (typeof scope.onCapture === 'function') {
		    			if (scope.confirmed) {
							debugger;
		    				ngModel.$setViewValue(scope.tempModel);
		    			}
		    			scope.onCapture({$snap: scope.tempModel});
		    		}
		    	});
			};	
		}
	};
}]);
