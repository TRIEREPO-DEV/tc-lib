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