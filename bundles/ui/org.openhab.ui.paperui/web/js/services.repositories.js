var DataCache = function($q, $rootScope, remoteService, dataType, staticData) {
	var self = this;
	var cacheEnabled = true;
	var dirty = false;
	var initialFetch = false;
	
	this.setDirty = function() {
		this.dirty = true;
	}
	this.getAll = function(callback, refresh) {
		var deferred = $q.defer();
		var progressFn = null, successFn = null;
		if (angular.isFunction(callback)) {
			successFn = function (res) {
				if (res !== 'No update') {
					return callback(res);
				}
			};
			progressFn =  callback; // Simply call with resolved data
		}
		deferred.promise.then(successFn, null, progressFn);

		if(cacheEnabled && staticData && self.initialFetch) {
		    deferred.resolve($rootScope.data[dataType]);
		} else {
    		remoteService.getAll(function(data) {
    			if((!cacheEnabled || (data.length != $rootScope.data[dataType].length) || self.dirty || refresh)) {
    			    self.initialFetch = true;
    			    $rootScope.data[dataType] = data;
    				self.dirty = false;
    				deferred.resolve(data);
    			} else {
    			    // set initial data
    			    if(!self.initialFetch) {
    			        self.initialFetch = true;
    			        $rootScope.data[dataType] = data;
    			        self.dirty = false;
    			    }
    				deferred.resolve('No update');
    			}
    		});
				if(cacheEnabled && self.initialFetch) {
						deferred.notify($rootScope.data[dataType]);
				}
		}
        return deferred.promise;
	};
	this.getOne = function(condition, callback, refresh) {
		var element = self.find(condition);
		if(element != null && !this.dirty && !refresh) {
			callback(element);
		} else {
			self.getAll(null, true).then(function() {
				if(angular.isFunction(callback)) {
					callback(self.find(condition));
	      }
	    }, angular.bind(this, callback, null));
		}
	};
	this.find = function(condition) {
		for (var i = 0; i < $rootScope.data[dataType].length; i++) {
			var element = $rootScope.data[dataType][i];
			if(condition(element)) {
				if(condition(element)) {
					return element;
				}
			}
		}
		return null;
	};
	this.add = function(element) {
		$rootScope.data[dataType].push(element);
	};
	this.remove = function(element) {
	    $rootScope.data[dataType].splice($rootScope.data[dataType].indexOf(element), 1);
	};
	this.update = function(element) {
        var index = $rootScope.data[dataType].indexOf(element);
        $rootScope.data[dataType][index] = element;
    };
}

angular.module('SmartHomeManagerApp.services.repositories', []).factory('bindingRepository', 
		function($q, $rootScope, bindingService) {
	$rootScope.data.bindings = [];
	return new DataCache($q, $rootScope, bindingService, 'bindings', true);
}).factory('thingTypeRepository', 
		function($q, $rootScope, thingTypeService) {
	$rootScope.data.thingTypes = [];
	return new DataCache($q, $rootScope, thingTypeService, 'thingTypes', true);
}).factory('discoveryResultRepository', 
		function($q, $rootScope, inboxService, eventService) {
	var dataCache = new DataCache($q, $rootScope, inboxService, 'discoveryResults')
	$rootScope.data.discoveryResults = [];
	eventService.onEvent('smarthome/inbox/added/*', function(topic, discoveryResult) {
		dataCache.add(discoveryResult);
	});
	eventService.onEvent('smarthome/inbox/removed/*', function(topic, discoveryResult) {
		dataCache.remove(discoveryResult);
	});
	return dataCache;
}).factory('thingRepository', 
		function($q, $rootScope, thingSetupService) {
	var dataCache = new DataCache($q, $rootScope, thingSetupService, 'things')
	$rootScope.data.things = [];
	return dataCache;
}).factory('homeGroupRepository', 
		function($q, $rootScope, groupSetupService) {
	var dataCache = new DataCache($q, $rootScope, groupSetupService, 'homeGroups')
	$rootScope.data.homeGroups = [];
	return dataCache;
}).factory('itemRepository', 
		function($q, $rootScope, itemService) {
	var dataCache = new DataCache($q, $rootScope, itemService, 'items')
	$rootScope.data.items = [];
	return dataCache;
});