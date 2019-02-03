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
