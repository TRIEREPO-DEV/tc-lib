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

