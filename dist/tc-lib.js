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
		    		template:'src/scripts/camera/camera-modal.html',
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

angular.module('tcLib').directive('tcDatePicker', ['$parse', function ($parse) {
	return {
		restrict: 'E',
		scope: {
			name: '@',
			options: '=?',
			disabled: '=?',
			placeholder: '@',
			model: "=ngModel",
		},
		templateUrl: function (ele, args) {
			var tpl = 'src/scripts/date-picker/date-picker.html';
			if (args.hasOwnProperty('datetime')) {
				tpl = 'src/scripts/date-picker/date-time-picker.html';
			}
			return tpl;
		},
		link: function (scope, attr, e) {

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

			scope.openCalendar = function () {
				scope.calendarPanel.opened = true;
			};

			scope.$watch('options', function (newVal, oldVal) {
				updateOptions();
			});

			function getDayClass(data) {
				var date = data.date,
					mode = data.mode;
				if (mode === 'day') {
					var dayToCheck = new Date(date).setHours(0, 0, 0, 0);
					for (var i = 0; i < ($parse('events.length')(scope) || 0); i++) {
						var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);
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

angular.module('tcLib')
    .constant('uiDatetimePickerConfig', {
        dateFormat: 'yyyy-MM-dd HH:mm',
        defaultTime: '00:00:00',
        html5Types: {
            date: 'yyyy-MM-dd',
            'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
            'month': 'yyyy-MM'
        },
        initialPicker: 'date',
        reOpenDefault: false,
        enableDate: true,
        enableTime: true,
        buttonBar: {
            show: true,
            now: {
                show: true,
                text: 'Now'
            },
            today: {
                show: true,
                text: 'Today'
            },
            clear: {
                show: true,
                text: 'Clear'
            },
            date: {
                show: true,
                text: 'Date'
            },
            time: {
                show: true,
                text: 'Time'
            },
            close: {
                show: true,
                text: 'Close'
            }
        },
        closeOnDateSelection: true,
        appendToBody: false,
        altInputFormats: [],
        ngModelOptions: {}
    })
    .controller('DateTimePickerController', ['$scope', '$element', '$attrs', '$compile', '$parse', '$document', '$timeout', '$uibPosition', 'dateFilter', 'uibDateParser', 'uiDatetimePickerConfig', '$rootScope',
        function (scope, element, attrs, $compile, $parse, $document, $timeout, $uibPosition, dateFilter, uibDateParser, uiDatetimePickerConfig, $rootScope) {
            var dateFormat = uiDatetimePickerConfig.dateFormat,
                ngModel, ngModelOptions, $popup, cache = {}, watchListeners = [],
                closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : uiDatetimePickerConfig.closeOnDateSelection,
                appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : uiDatetimePickerConfig.appendToBody,
                altInputFormats = angular.isDefined(attrs.altInputFormats) ? scope.$parent.$eval(attrs.altInputFormats) : uiDatetimePickerConfig.altInputFormats;

            this.init = function (_ngModel) {
                ngModel = _ngModel;
                ngModelOptions = ngModel.$options || uiDatetimePickerConfig.ngModelOptions;

                scope.watchData = {};
                scope.buttonBar = angular.isDefined(attrs.buttonBar) ? scope.$parent.$eval(attrs.buttonBar) : uiDatetimePickerConfig.buttonBar;

                // determine which pickers should be available. Defaults to date and time
                scope.enableDate = angular.isDefined(scope.enableDate) ? scope.enableDate : uiDatetimePickerConfig.enableDate;
                scope.enableTime = angular.isDefined(scope.enableTime) ? scope.enableTime : uiDatetimePickerConfig.enableTime;

                // determine default picker
                scope.initialPicker = angular.isDefined(attrs.initialPicker) ? attrs.initialPicker : (scope.enableDate ? uiDatetimePickerConfig.initialPicker : 'time');

                // determine the picker to open when control is re-opened
                scope.reOpenDefault = angular.isDefined(attrs.reOpenDefault) ? attrs.reOpenDefault : uiDatetimePickerConfig.reOpenDefault;

                // check if an illegal combination of options exists
                if (scope.initialPicker == 'date' && !scope.enableDate) {
                    throw new Error("datetimePicker can't have initialPicker set to date and have enableDate set to false.");
                }

                // default picker view
                scope.showPicker = !scope.enableDate ? 'time' : scope.initialPicker;

                var isHtml5DateInput = false;

                if (uiDatetimePickerConfig.html5Types[attrs.type]) {
                    dateFormat = uiDatetimePickerConfig.html5Types[attrs.type];
                    isHtml5DateInput = true;
                } else {
                    dateFormat = attrs.datepickerPopup || uiDatetimePickerConfig.dateFormat;
                    attrs.$observe('datetimePicker', function (value) {
                        var newDateFormat = value || uiDatetimePickerConfig.dateFormat;

                        if (newDateFormat !== dateFormat) {
                            dateFormat = newDateFormat;
                            ngModel.$modelValue = null;

                            if (!dateFormat) {
                                throw new Error('datetimePicker must have a date format specified.');
                            }
                        }
                    });
                }

                // popup element used to display calendar
                var popupEl = angular.element('' +
                    '<div class=uib-datetimepicker-popup-wrap>' +
                    '<div date-picker-wrap>' +
                    '<div uib-datepicker></div>' +
                    '</div>' +
                    '<div time-picker-wrap>' +
                    '<div uib-timepicker style="margin:0 auto"></div>' +
                    '</div>' +
                    '</div>');

                scope.ngModelOptions = angular.copy(ngModelOptions);
                scope.ngModelOptions.timezone = null;

                // get attributes from directive
                popupEl.attr({
                    'ng-model': 'date',
                    'ng-model-options': 'ngModelOptions',
                    'ng-change': 'dateSelection(date)'
                });

                // datepicker element
                var datepickerEl = angular.element(popupEl.children()[0]);

                if (isHtml5DateInput) {
                    if (attrs.type === 'month') {
                        datepickerEl.attr('datepicker-mode', '"month"');
                        datepickerEl.attr('min-mode', 'month');
                    }
                }

                if (attrs.datepickerOptions) {
                    var options = scope.$parent.$eval(attrs.datepickerOptions);

                    if (options && options.initDate) {
                        scope.initDate = uibDateParser.fromTimezone(options.initDate, ngModelOptions.timezone);
                        datepickerEl.attr('init-date', 'initDate');
                        delete options.initDate;
                    }

                    angular.forEach(options, function (value, option) {
                        datepickerEl.attr(cameltoDash(option), value);
                    });
                }

                // set datepickerMode to day by default as need to create watch
                // else disabled cannot pass in mode
                if (!angular.isDefined(attrs['datepickerMode'])) {
                    attrs['datepickerMode'] = 'day';
                }

                if (attrs.dateDisabled) {
                    datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
                }

                angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle', 'showWeeks', 'startingDay', 'yearRows', 'yearColumns'], function (key) {
                    if (angular.isDefined(attrs[key])) {
                        datepickerEl.attr(cameltoDash(key), attrs[key]);
                    }
                });

                if (attrs.customClass) {
                    datepickerEl.attr('custom-class', 'customClass({ date: date, mode: mode })');
                }

                angular.forEach(['minMode', 'maxMode', 'datepickerMode', 'shortcutPropagation'], function (key) {
                    if (attrs[key]) {
                        var getAttribute = $parse(attrs[key]);

                        watchListeners.push(scope.$parent.$watch(getAttribute, function (value) {
                            scope.watchData[key] = value;
                        }));
                        datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                        // Propagate changes from datepicker to outside
                        if (key === 'datepickerMode') {
                            var setAttribute = getAttribute.assign;
                            watchListeners.push(scope.$watch('watchData.' + key, function (value, oldvalue) {
                                if (angular.isFunction(setAttribute) && value !== oldvalue) {
                                    setAttribute(scope.$parent, value);
                                }
                            }));
                        }
                    }
                });

                // timepicker element
                var timepickerEl = angular.element(popupEl.children()[1]);

                if (attrs.timepickerOptions) {
                    var options = scope.$parent.$eval(attrs.timepickerOptions);

                    angular.forEach(options, function (value, option) {
                        scope.watchData[option] = value;
                        timepickerEl.attr(cameltoDash(option), 'watchData.' + option);
                    });
                }

                // watch attrs - NOTE: minDate and maxDate are used with datePicker and timePicker.  By using the minDate and maxDate
                // with the timePicker, you can dynamically set the min and max time values.  This cannot be done using the min and max values
                // with the timePickerOptions
                angular.forEach(['minDate', 'maxDate', 'initDate'], function (key) {
                    if (attrs[key]) {
                        var getAttribute = $parse(attrs[key]);

                        watchListeners.push(scope.$parent.$watch(getAttribute, function (value) {
                            scope.watchData[key] = value;
                        }));
                        datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                        if (key == 'minDate') {
                            timepickerEl.attr('min', 'watchData.minDate');
                        } else if (key == 'maxDate')
                            timepickerEl.attr('max', 'watchData.maxDate');
                    }
                });

                // do not check showWeeks attr, as should be used via datePickerOptions

                if (!isHtml5DateInput) {
                    // Internal API to maintain the correct ng-invalid-[key] class
                    ngModel.$$parserName = 'datetime';
                    ngModel.$validators.datetime = validator;
                    ngModel.$parsers.unshift(parseDate);
                    ngModel.$formatters.push(function (value) {
                        if (ngModel.$isEmpty(value)) {
                            scope.date = value;
                            return value;
                        }
                        scope.date = uibDateParser.fromTimezone(value, ngModelOptions.timezone);
                        dateFormat = dateFormat.replace(/M!/, 'MM')
                            .replace(/d!/, 'dd');

                        return dateFilter(scope.date, dateFormat);
                    });
                } else {
                    ngModel.$formatters.push(function (value) {
                        scope.date = uibDateParser.fromTimezone(value, ngModelOptions.timezone);;
                        return value;
                    });
                }

                // Detect changes in the view from the text box
                ngModel.$viewChangeListeners.push(function () {
                    scope.date = parseDateString(ngModel.$viewValue);
                });

                element.bind('keydown', inputKeydownBind);

                $popup = $compile(popupEl)(scope);
                // Prevent jQuery cache memory leak (template is now redundant after linking)
                popupEl.remove();

                if (appendToBody) {
                    $document.find('body').append($popup);
                } else {
                    element.after($popup);
                }

            };

            // get text
            scope.getText = function (key) {
                return scope.buttonBar[key].text || uiDatetimePickerConfig.buttonBar[key].text;
            };

            // determine if button is to be shown or not
            scope.doShow = function (key) {
                if (angular.isDefined(scope.buttonBar[key].show))
                    return scope.buttonBar[key].show;
                else
                    return uiDatetimePickerConfig.buttonBar[key].show;
            };

            // Inner change
            scope.dateSelection = function (dt) {

                // check if timePicker is being shown and merge dates, so that the date
                // part is never changed, only the time
                if (scope.enableTime && scope.showPicker === 'time') {

                    // only proceed if dt is a date
                    if (dt || dt != null) {
                        // check if our scope.date is null, and if so, set to todays date
                        if (!angular.isDefined(scope.date) || scope.date == null) {
                            scope.date = new Date();
                        }

                        // dt will not be undefined if the now or today button is pressed
                        if (dt && dt != null) {
                            // get the existing date and update the time
                            var date = new Date(scope.date);
                            date.setHours(dt.getHours());
                            date.setMinutes(dt.getMinutes());
                            date.setSeconds(dt.getSeconds());
                            date.setMilliseconds(dt.getMilliseconds());
                            dt = date;
                        }
                    }
                }

                if (angular.isDefined(dt)) {
                    if (!scope.date) {
                        var defaultTime = angular.isDefined(attrs.defaultTime) ? attrs.defaultTime : uiDatetimePickerConfig.defaultTime;
                        var t = new Date('2001-01-01 ' + defaultTime);

                        if (!isNaN(t) && dt != null) {
                            dt.setHours(t.getHours());
                            dt.setMinutes(t.getMinutes());
                            dt.setSeconds(t.getSeconds());
                            dt.setMilliseconds(t.getMilliseconds());
                        }
                    }
                    scope.date = dt;
                }

                var date = scope.date ? dateFilter(scope.date, dateFormat, ngModelOptions.timezone) : null;

                element.val(date);
                ngModel.$setViewValue(date);

                if (closeOnDateSelection) {
                    // do not close when using timePicker as make impossible to choose a time
                    if (scope.showPicker != 'time' && date != null) {
                        // if time is enabled, swap to timePicker
                        if (scope.enableTime) {
                            scope.open('time');
                        } else {
                            scope.close(false);
                        }
                    }
                }

            };

            scope.keydown = function (evt) {
                if (evt.which === 27) {
                    scope.close(false);
                    element[0].focus();
                }
            };

            scope.$watch('isOpen', function (value) {
                scope.dropdownStyle = {
                    display: value ? 'block' : 'none'
                };

                if (value) {
                    cache['openDate'] = scope.date;

                    var position = appendToBody ? $uibPosition.offset(element) : $uibPosition.position(element);

                    if (appendToBody) {
                        scope.dropdownStyle.top = (position.top + element.prop('offsetHeight')) + 'px';
                    } else {
                        scope.dropdownStyle.top = undefined;
                    }

                    scope.dropdownStyle.left = position.left + 'px';

                    $timeout(function () {
                        scope.$broadcast('uib:datepicker.focus');
                        $document.bind('click', documentClickBind);
                    }, 0, false);

                    scope.open(scope.showPicker);
                } else {
                    $document.unbind('click', documentClickBind);
                }
            });

            scope.isDisabled = function (date) {
                if (date === 'today' || date === 'now') {
                    date = new Date();
                }

                return scope.watchData.minDate && scope.compare(date, scope.watchData.minDate) < 0 ||
                    scope.watchData.maxDate && scope.compare(date, scope.watchData.maxDate) > 0;
            };

            scope.compare = function (date1, date2) {
                return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
            };

            scope.select = function (opt) {

                var date = null;
                var isNow = opt === 'now';

                if (opt === 'today' || opt == 'now') {
                    var now = new Date();
                    if (angular.isDate(scope.date)) {
                        date = new Date(scope.date);
                        date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
                        date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                    } else {
                        date = now;
                    }
                }

                scope.dateSelection(date);

                if (opt == 'clear')
                    scope.close();
            };

            scope.open = function (picker, evt) {
                if (angular.isDefined(evt)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                // need to delay this, else timePicker never shown
                $timeout(function () {
                    scope.showPicker = picker;
                }, 0);

                // in order to update the timePicker, we need to update the model reference!
                // as found here https://angular-ui.github.io/bootstrap/#/timepicker
                $timeout(function () {
                    scope.date = new Date(scope.date);
                }, 50);
            };

            scope.close = function (closePressed) {
                scope.isOpen = false;

                // if enableDate and enableTime are true, reopen the picker in date mode first
                if (scope.enableDate && scope.enableTime)
                    scope.showPicker = scope.reOpenDefault === false ? 'date' : scope.reOpenDefault;

                // if a on-close-fn has been defined, lets call it
                // we only call this if closePressed is defined!
                if (angular.isDefined(closePressed))
                    scope.whenClosed({ args: { closePressed: closePressed, openDate: cache['openDate'] || null, closeDate: scope.date } });

                element[0].focus();
            };

            scope.$on('$destroy', function () {
                if (scope.isOpen === true) {
                    if (!$rootScope.$$phase) {
                        scope.$apply(function () {
                            scope.close();
                        });
                    }
                }

                watchListeners.forEach(function (a) { a(); });
                $popup.remove();
                element.unbind('keydown', inputKeydownBind);
                $document.unbind('click', documentClickBind);
            });

            function documentClickBind(evt) {
                var popup = $popup[0];
                var dpContainsTarget = element[0].contains(evt.target);

                // The popup node may not be an element node
                // In some browsers (IE only) element nodes have the 'contains' function
                var popupContainsTarget = popup.contains !== undefined && popup.contains(evt.target);

                if (scope.isOpen && !(dpContainsTarget || popupContainsTarget)) {
                    scope.$apply(function () {
                        scope.close(false);
                    });
                }
            }

            function inputKeydownBind(evt) {
                if (evt.which === 27 && scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    scope.$apply(function () {
                        scope.close(false);
                    });
                    element[0].focus();
                } else if (evt.which === 40 && !scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    scope.$apply(function () {
                        scope.isOpen = true;
                    });
                }
            }

            function cameltoDash(string) {
                return string.replace(/([A-Z])/g, function ($1) { return '-' + $1.toLowerCase(); });
            }

            function parseDateString(viewValue) {
                var date = uibDateParser.parse(viewValue, dateFormat, scope.date);
                if (isNaN(date)) {
                    for (var i = 0; i < altInputFormats.length; i++) {
                        date = uibDateParser.parse(viewValue, altInputFormats[i], scope.date);
                        if (!isNaN(date)) {
                            return date;
                        }
                    }
                }
                return date;
            }

            function parseDate(viewValue) {
                if (angular.isNumber(viewValue)) {
                    // presumably timestamp to date object
                    viewValue = new Date(viewValue);
                }

                if (!viewValue) {
                    return null;
                } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                    return viewValue;
                } else if (angular.isString(viewValue)) {
                    var date = parseDateString(viewValue);
                    if (!isNaN(date)) {
                        return uibDateParser.toTimezone(date, ngModelOptions.timezone);
                    }

                    return undefined;
                } else {
                    return undefined;
                }
            }

            function validator(modelValue, viewValue) {
                var value = modelValue || viewValue;

                if (!(attrs.ngRequired || attrs.required) && !value) {
                    return true;
                }

                if (angular.isNumber(value)) {
                    value = new Date(value);
                }

                if (!value) {
                    return true;
                } else if (angular.isDate(value) && !isNaN(value)) {
                    return true;
                } else if (angular.isDate(new Date(value)) && !isNaN(new Date(value).valueOf())) {
                    return true;
                } else if (angular.isString(value)) {
                    return !isNaN(parseDateString(viewValue));
                } else {
                    return false;
                }
            }

        }])
    .directive('datetimePicker', function () {
        return {
            restrict: 'A',
            require: ['ngModel', 'datetimePicker'],
            controller: 'DateTimePickerController',
            scope: {
                isOpen: '=?',
                enableDate: '=?',
                enableTime: '=?',
                initialPicker: '=?',
                reOpenDefault: '=?',
                dateDisabled: '&',
                customClass: '&',
                whenClosed: '&'
            },
            link: function (scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1];

                ctrl.init(ngModel);
            }
        };
    })
    .directive('datePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'src/scripts/date-time-picker/date-picker.html'
        };
    })
    .directive('timePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'src/scripts/date-time-picker/time-picker.html'
        };
    });

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
        templateUrl: 'src/scripts/messages/message.html'
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
angular.module('tcLib').run(['$templateCache', function($templateCache) {
$templateCache.put('src/scripts/camera/camera-modal.html',
    "<div class=\"camera-wrapper row\"><ng-camera capture-message=\"Done!\" class=\"grid-md-5\" countdown=\"3\" output-height=\"240\" output-width=\"320\" viewer-height=\"315\" viewer-width=\"420\" image-format=\"jpeg\" jpeg-quality=\"100\" action-message=\"Take picture\" snapshot=\"model\" overlay-url=\"./assets/images/overlay.png\" shutter-url=\"./assets/sounds/camera-click.mp3\" on-capture=\"onCamCapture($snap)\"></ng-camera><div class=\"preview-wrapper grid-md-5\" ng-if=\"model\"><img ng-src=\"{{model}}\" alt=\"Click capture to see preview\"><div class=\"grid-md-4 ngdialog-buttons\"><button class=\"btn btn-md btn-green\" ng-if=\"confirmText && model\" ng-click=\"confirm();closeThisDialog(0)\">{{confirmText}}</button> <button class=\"btn btn-md btn-grey\" ng-if=\"confirmText\" ng-click=\"cancel();closeThisDialog(0);\">Cancel</button></div></div></div>"
  );


  $templateCache.put('src/scripts/date-picker/date-picker.html',
    "<input placeholder=\"{{placeholder}}\" class=\"form-field grid-md-12\" ng-attr-name=\"{{name}}\" ng-model=\"model\" uib-datepicker-popup is-open=\"calendarPanel.opened\" datepicker-options=\"dateOptions\" ng-disabled=\"disabled\" ng-required=\"{{required}}\" close-text=\"Close\"> <span class=\"form-field-icon\" ng-if=\"disabled\"><button type=\"button\" class=\"btn btn-sm btn-sky-blue\" ng-click=\"openCalendar()\"><i class=\"fa fa-calendar\"></i></button></span>"
  );


  $templateCache.put('src/scripts/date-picker/date-time-picker.html',
    "<input placeholder=\"{{placeholder}}\" class=\"form-field grid-md-12\" ng-attr-name=\"{{name}}\" ng-model=\"model\" datetime-picker=\"MM/dd/yyyy HH:mm\" is-open=\"calendarPanel.opened\" datepicker-options=\"dateOptions\" ng-required=\"{{required}}\" close-text=\"Close\"> <span class=\"form-field-icon\"><button type=\"button\" class=\"btn btn-sm btn-sky-blue\" ng-click=\"openCalendar()\"><i class=\"fa fa-calendar\"></i></button></span>"
  );


  $templateCache.put('src/scripts/date-time-picker/date-picker.html',
    "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'date'\" ng-style=\"dropdownStyle\" style=\"left:inherit\" ng-keydown=\"keydown($event)\" ng-click=\"$event.stopPropagation()\"><li class=\"date-picker-menu\"><div ng-transclude></div></li><li class=\"row\" style=\"margin-top: 5px\" ng-if=\"buttonBar.show\"><span class=\"btn-group pull-left\" style=\"margin-right:10px\" ng-if=\"doShow('today') || doShow('clear')\"><button type=\"button\" class=\"btn btn-sm btn-info\" ng-if=\"doShow('today')\" ng-click=\"select('today')\" ng-disabled=\"isDisabled('today')\">{{getText('today')}}</button> <button type=\"button\" class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{getText('clear')}}</button> </span><span class=\"btn-group pull-right\" ng-if=\"(doShow('time') && enableTime) || doShow('close')\"><button type=\"button\" class=\"btn btn-sm btn-default\" ng-if=\"doShow('time') && enableTime\" ng-click=\"open('time', $event)\">{{getText('time')}}</button> <button type=\"button\" class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=\"close(true)\">{{getText('close')}}</button></span></li></ul>"
  );


  $templateCache.put('src/scripts/date-time-picker/time-picker.html',
    "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'time'\" ng-style=\"dropdownStyle\" style=\"left:inherit\" ng-keydown=\"keydown($event)\" ng-click=\"$event.stopPropagation()\"><li style=\"padding:0 5px 5px 5px\" class=\"time-picker-menu\"><div ng-transclude></div></li><li class=\"row\" style=\"margin-top:5px\" ng-if=\"buttonBar.show\"><span class=\"btn-group pull-left\" style=\"margin-right:10px\" ng-if=\"doShow('now') || doShow('clear')\"><button type=\"button\" class=\"btn btn-sm btn-info\" ng-if=\"doShow('now')\" ng-click=\"select('now')\" ng-disabled=\"isDisabled('now')\">{{getText('now') }}</button> <button type=\"button\" class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{ getText('clear') }}</button> </span><span class=\"btn-group pull-right\" ng-if=\"(doShow('date') && enableDate) || doShow('close')\"><button type=\"button\" class=\"btn btn-sm btn-default\" ng-if=\"doShow('date') && enableDate\" ng-click=\"open('date', $event)\">{{ getText('date')}}</button> <button type=\"button\" class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=\"close(true)\">{{getText('close')}}</button></span></li></ul>"
  );


  $templateCache.put('src/scripts/messages/message.html',
    "<div class=\"message-wrapper\"><div ng-repeat=\"msg in globalMsgs\" class=\"alert alert-{{msg.type}}\"><i class=\"fa fa-times pull-right\" ng-click=\"remove($index)\"></i> <strong>{{msg.title}}:</strong> <span>{{msg.msg}}</span></div></div>"
  );
}]);
