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
