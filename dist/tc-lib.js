angular.module('tcLib', ['camera', 'ngDialog', 'ui.bootstrap']);
angular.module('tcLib').provider('httpService', function() {
	var basePath = '';
	try {
		basePath = location.href.split('/')[3];
	} catch(err) {
		basePath = '';
	}

	this.setBasePath = function(_basePath) {
		basePath = _basePath;
	};

	this.$get = ['$http', '$q', '$parse', 'msgService', function httpService($http, $q, $parse, msgService) {
		return {
			get: reqWithoutPayload.bind(null, 'GET'),
			del: reqWithoutPayload.bind(null, 'DELETE'),
			put: reqWithPayload.bind(null, 'PUT'),
			post: reqWithPayload.bind(null, 'POST'),
			upload: upload.bind(null, 'POST'),
			getJSON: getJSON.bind(null, 'GET')
		};
	
		function reqWithoutPayload(reqType, url, urlParams, nullAllowed) {
			url = _appendUrlParams(url, urlParams, nullAllowed);
			return _sendRequest({
				method: reqType,
				url: url
			});
		}
	
		function reqWithPayload(reqType, url, payload, urlParams, nullAllowed) {
			url = _appendUrlParams(url, urlParams, nullAllowed);
			return _sendRequest({
				method: reqType,
				url: url,
				data: payload
			});
		}
		
		function upload(reqType, url, formData, urlParams, nullAllowed) {
			url = _appendUrlParams(url, urlParams, nullAllowed);
			return _sendRequest({
				url: url,
				method: reqType,
				data: formData,
				transformRequest: angular.identity,
				headers: { 'Content-Type': undefined }
			});
		}
		
		function getJSON(reqType, url, cacheKey) {
			if (cacheKey && localStorage.getItem(cacheKey)) {
				return $q.when(null).then(function() {
					var cacheData = localStorage.getItem(cacheKey);
					return JSON.parse(cacheData);
				});
			} else {
				return reqWithoutPayload(reqType, url).then(function(res) {
					localStorage.setItem(cacheKey, res.json);
					return res;
				});
			}
		}
		
		function _appendUrlParams(url, urlParams, nullAllowed) {
			if (urlParams) {
				url += '?' + toURLParams(urlParams, nullAllowed);
			}
			return '/' + basePath + '/' + url;
		}
		
		function _sendRequest(req) {
			var defer = $q.defer();
			$http(req).success(function(res) {
				if (res.isSuccess) {
					defer.resolve(res.response);
				} else {
                    defer.reject(res);
                    msgService.showMsg({
                        msg: $parse('response')(res) || res,
                        type: 'danger',
                        title: 'Error',
                    });
				}
			}).error(function(err) {
                defer.reject(err);
                msgService.showMsg({
                    msg: err,
                    type: 'danger',
                    title: 'Error',
                });
			});
			return defer.promise;
		}
	}];
});

angular.module('tcLib').directive('bindHtmlCompile', ['$compile', function($compile) {
	return {
        restrict : 'A',
        link : function(scope, element, attrs) {
            scope.$watch(function() {
                return scope.$eval(attrs.bindHtmlCompile);
            }, function(value) {
                element.html(value);
                $compile(element.contents())(scope);
            });
        }
    };
}]);

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

angular.module('tcLib').controller('cameraModelCtrl', ['$scope', 'ngDialog', function($scope, ngDialog) {
	$scope.onCamCapture = function(snap) {
		$scope.setModel(snap);
		if ($scope.autoClose) {
			$scope.confirm();
		}
	};
	
	$scope.confirm = function() {
		$scope.setConfirmed(true);
	};

	$scope.cancel = function() {
		$scope.setConfirmed(false);
	};
}]);

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

angular.module('tcLib').directive('tcDatePicker', ['$parse', function($parse) {
	return {
		restrict: 'E',
		scope: {
			name: '@',
			options: '=?',
			placeholder: '@',
			model: "=ngModel",
		},
		templateUrl: 'src/date-picker/date-picker.html',
		link: function(scope, attr, e) {

			function updateOptions() {
				scope.dateOptions = {
					formatYear: 'yy',
					showWeeks: false,
					customClass: getDayClass,
					minDate: $parse('options.minDate')(scope) || null,
					maxDate: $parse('options.maxDate')(scope) || new Date(2040, 12, 31),
					startingDay: 1
				};
			}
			scope.calendarPanel = {
				opened: false
			};
			
			scope.openCalendar = function() {
				scope.calendarPanel.opened = true;
			};

			scope.$watch('options', function(newVal, oldVal) {
				updateOptions();
			});
			
			function getDayClass(data) {
				var date = data.date,
					mode = data.mode;
				if (mode === 'day') {
					var dayToCheck = new Date(date).setHours(0, 0, 0, 0);
					for (var i = 0; i < ($parse('events.length')(scope) || 0); i++) {
						var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);
						if (dayToCheck === currentDay) {
							return $scope.events[i].status;
						}
					}
				}
				return '';
		  	}
		}
	};
}]);

angular.module('tcLib').directive('tcFileInput', [function() {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=',
        },
        link: function(scope, elem, attr, ngModel) {
            elem.on("change", function(e) {
                var files = elem[0].files;
                ngModel.$setViewValue(null);
                if (attr.multiple) {
                    ngModel.$setViewValue(files.length ? files: null);
                } else {
                    ngModel.$setViewValue(files[0]);
                }
            });
        }
    }
}]);

angular.module('tcLib').directive('messages', function () {

    messagesCtrl.$inject = ['$scope'];

    function messagesCtrl($scope) {
        $scope.globalMsgs = [];
        $scope.remove = remove;
        $scope.$on('MESSAGE_SHOW', function (event, msg) {
            $scope.globalMsgs.splice(0, 0, msg);
        });
        $scope.$on('MESSAGE_HIDE', function (event, msg) {
            var index = $scope.globalMsgs.indexOf(msg);
            if (index != -1) {
                remove(index);
            }
        });
        $scope.$on('MESSAGE_HIDE_ALL', function (msg) {
            $scope.globalMsgs = [];
        });

        function remove(index){
            $scope.globalMsgs.splice(index, 1);
        }

    }

    return {
        restrict: 'E',
        controller: messagesCtrl,
        templateUrl: 'src/messages/message.html'
    }
}).service('msgService', ['$timeout', '$rootScope', '$parse', function ($timeout, $rootScope, $parse) {
    return {
        showMsg: showMsg,
        hideAll: hideAll
    };

    function showMsg(message) {
        $rootScope.$broadcast('MESSAGE_SHOW', message);

        var messageWrapper = document.querySelector('.message-wrapper');
        messageWrapper.scrollTop = 0;
        if ($parse('type')(message) !== 'danger') {
            $timeout(function () {
                $rootScope.$broadcast('MESSAGE_HIDE', message);
            }, $parse('time')(message) || 2000);
        }
    }

    function hideAll() {
        $rootScope.$broadCast('MESSAGE_HIDE_ALL');
    };
}]);


angular.module('tcLib').filter('tcCamelCase', function() {
	return function(input) {
		input = input || ''; 
		return input.replace(/\w\S*/g, function(txt){
			var str = txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			for (var i=0;i<str.length;i++) {
				if(str[i]==='.') {
					str = str.replace(str.charAt(i+1),function(a){return a.toUpperCase();});
				}
			}
			return str;
		});
	};
})
angular.module('tcLib').run(['$templateCache', function($templateCache) {
$templateCache.put('src/camera/camera-modal.html',
    "<div class=\"camera-wrapper row\"><ng-camera capture-message=\"Done!\" class=\"grid-md-5\" countdown=\"3\" output-height=\"240\" output-width=\"320\" viewer-height=\"315\" viewer-width=\"420\" image-format=\"jpeg\" jpeg-quality=\"100\" action-message=\"Take picture\" snapshot=\"model\" overlay-url=\"./assets/images/overlay.png\" shutter-url=\"./assets/sounds/camera-click.mp3\" on-capture=\"onCamCapture($snap)\"></ng-camera><div class=\"preview-wrapper grid-md-5\" ng-if=\"model\"><img ng-src=\"{{model}}\" alt=\"Click capture to see preview\"><div class=\"grid-md-4 ngdialog-buttons\"><button class=\"btn btn-md btn-green\" ng-if=\"confirmText && model\" ng-click=\"confirm();closeThisDialog(0)\">{{confirmText}}</button> <button class=\"btn btn-md btn-grey\" ng-if=\"confirmText\" ng-click=\"cancel();closeThisDialog(0);\">Cancel</button></div></div></div>"
  );


  $templateCache.put('src/date-picker/date-picker.html',
    "<input placeholder=\"{{placeholder}}\" class=\"form-field grid-md-12\" ng-attr-name=\"{{name}}\" ng-model=\"model\" uib-datepicker-popup is-open=\"calendarPanel.opened\" datepicker-options=\"dateOptions\" ng-required=\"{{required}}\" close-text=\"Close\"> <span class=\"form-field-icon\"><button type=\"button\" class=\"btn btn-sm btn-sky-blue\" ng-click=\"openCalendar()\"><i class=\"fa fa-calendar\"></i></button></span>"
  );


  $templateCache.put('src/messages/message.html',
    "<div class=\"message-wrapper\"><div ng-repeat=\"msg in globalMsgs\" class=\"alert alert-{{msg.type}}\"><i class=\"fa fa-times pull-right\" ng-click=\"remove($index)\"></i> <strong>{{msg.title}}:</strong> <span>{{msg.msg}}</span></div></div>"
  );
}]);

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