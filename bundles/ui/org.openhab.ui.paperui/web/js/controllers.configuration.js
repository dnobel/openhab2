function getThingTypeUID(thingUID) {
	var segments = thingUID.split(':');
	return segments[0] + ':' + segments[1];
};
    
angular.module('SmartHomeManagerApp.controllers.configuration', 
[]).controller('ConfigurationPageController', function($scope, $location) {
    $scope.navigateTo = function(path) {
        $location.path('configuration/' + path);
    }
}).controller('BindingController', function($scope, $mdDialog, bindingRepository) {
	$scope.setSubtitle(['Bindings']);
	$scope.setHeaderText('Shows all installed bindings.');
	$scope.refresh = function refresh() {
		bindingRepository.getAll();	
	};
	$scope.openBindingInfoDialog = function openBindingInfoDialog(bindingId, event) {
		$mdDialog.show({
			controller : 'BindingInfoDialogController',
			templateUrl : 'partials/dialog.bindinginfo.html',
			targetEvent : event,
			hasBackdrop: true,
			locals: {bindingId: bindingId}
		});
	};
	bindingRepository.getAll();
}).controller('BindingInfoDialogController', function($scope, $mdDialog, bindingRepository, bindingId) {
	$scope.binding = undefined;
	bindingRepository.getOne(function(binding) {
		return binding.id === bindingId;
	}, function(binding) {
		$scope.binding = binding;
	});
	$scope.close = function() {
		$mdDialog.hide();
	}
}).controller('GroupController', function($scope, $mdDialog, toastService, homeGroupRepository, groupSetupService) {
	$scope.setSubtitle(['Home Groups']);
	$scope.setHeaderText('Shows all configured Home Groups.');
	$scope.getAll = function() {
		homeGroupRepository.getAll();	
	};
	$scope.add = function add() {
		$mdDialog.show({
			controller : 'AddGroupDialogController',
			templateUrl : 'partials/dialog.addgroup.html',
			targetEvent : event
		}).then(function(label) {
			var homeGroup = {
	                name : 'home_group_' + $scope.generateUUID(),
	                label: label
            };
		    groupSetupService.add(homeGroup, function() {
	            homeGroupRepository.add(homeGroup);
	            toastService.showDefaultToast('Group added.');
	        });
		});
	};
	$scope.remove = function remove(homeGroup, event) {
    	var confirm = $mdDialog.confirm()
	      .title('Remove ' + homeGroup.label)
	      .content('Would you like to remove the group?')
	      .ariaLabel('Remove Group')
	      .ok('Remove')
	      .cancel('Cancel')
	      .targetEvent(event);
	    $mdDialog.show(confirm).then(function() {
	    	groupSetupService.remove({
	            itemName : homeGroup.name
	        }, function() {
	            homeGroupRepository.remove(homeGroup);
	            toastService.showSuccessToast('Group removed');
	        });
	    });
    };
	$scope.getAll();
}).controller('AddGroupDialogController', function($scope, $mdDialog) {
	$scope.binding = undefined;
	
	$scope.close = function closeDialog() {
		$mdDialog.cancel();
	};
	$scope.add  = function addDialogLabel(label) {
		$mdDialog.hide(label);
	}
}).controller('ThingController', function($scope, $timeout, $mdDialog, thingRepository, 
        thingSetupService, toastService, homeGroupRepository) {
	$scope.setSubtitle(['Things']);
	$scope.setHeaderText('Shows all configured Things.');
	
	thingRepository.getAll();
	
	$scope.refresh = function refresh() {
		thingRepository.getAll();	
	};
	$scope.remove = function remove(thing, event) {
		var label = thing.item ? thing.item.label : thing.UID;
		var confirm = $mdDialog.confirm()
	      .title('Remove ' + label)
	      .content('Would you like to remove the thing from the system?')
	      .ariaLabel('Remove Thing')
	      .ok('Remove')
	      .cancel('Cancel')
	      .targetEvent(event);
	    $mdDialog.show(confirm).then(function() {
	    	thingSetupService.remove({thingUID: thing.UID}, function() {
                thingRepository.remove(thing);
                homeGroupRepository.setDirty(true);
                toastService.showDefaultToast('Thing removed');
                $scope.navigateTo('things');
            });
	    });
	    event.stopImmediatePropagation();
	};
	
}).controller('ViewThingController', function($scope, $mdDialog, toastService, thingTypeRepository, 
		thingRepository, thingSetupService, homeGroupRepository) {
	
	var thingUID = $scope.path[4];
	var thingTypeUID = getThingTypeUID(thingUID);
	
	$scope.thing;
	$scope.thingType;
	$scope.edit = function edit(thing, event) {
		$mdDialog.show({
			controller : 'EditThingDialogController',
			templateUrl : 'partials/dialog.editthing.html',
			targetEvent : event,
			hasBackdrop: true,
			locals: {thing: thing}
		});
	};
	$scope.remove = function remove(thing, event) {
		var confirm = $mdDialog.confirm()
	      .title('Remove ' + thing.item.label)
	      .content('Would you like to remove the thing from the system?')
	      .ariaLabel('Remove Thing')
	      .ok('Remove')
	      .cancel('Cancel')
	      .targetEvent(event);
	    $mdDialog.show(confirm).then(function() {
	    	thingSetupService.remove({thingUID: thing.UID}, function() {
	    	    thingRepository.remove(thing);
	    	    homeGroupRepository.setDirty(true);
	    	    toastService.showDefaultToast('Thing removed');
	            $scope.navigateTo('things');
            });
	    });
	};
	
	$scope.enableChannel = function enableChannel(thingUID, channelID) {
		thingSetupService.enableChannel({channelUID: thingUID + ':' + channelID}, function() {
			$scope.getThing(true);
			toastService.showDefaultToast('Channel enabled');
		});
	};
	
	$scope.disableChannel = function disableChannel(thingUID, channelID) {
		thingSetupService.disableChannel({channelUID: thingUID + ':' + channelID}, function() {
			$scope.getThing(true);
			toastService.showDefaultToast('Channel disabled');
		});
	};
	
    $scope.getChannelById = function getChannelById(channelId) {
        if (!$scope.thingType) {
            return;
        }
        return $.grep($scope.thingType.channels, function(channel, i) {
            return channelId == channel.id;
        })[0];
    };
    
    $scope.getChannels = function getChannels(advanced) {
        if (!$scope.thingType || !$scope.thing) {
            return;
        }
        return $.grep($scope.thing.channels, function(channel, i) {
           var channelType = $scope.getChannelById(channel.id);
           return channelType ? advanced == channelType.advanced : false;
        });
    };
	
    $scope.getThing = function getThing(refresh) {
    	thingRepository.getOne(function(thing) {
    		return thing.UID === thingUID;
    	}, function(thing) {
    		$scope.thing = thing;
		if (!thing) return;
		$scope.setTitle(thing.item ? thing.item.label : thing.UID);
    	}, refresh);	
	};
	$scope.getThing(false);
	
	thingTypeRepository.getOne(function(thingType) {
		return thingType.UID === thingTypeUID;
	}, function(thingType) {
		$scope.thingType = thingType;
		$scope.setHeaderText(thingType.description);
	});
}).controller('EditThingController', function($scope, $mdDialog, toastService, 
		thingTypeRepository, thingRepository, thingSetupService, homeGroupRepository) {
	
	$scope.setHeaderText('Click the \'Save\' button to apply the changes.');
	
	var thingUID = $scope.path[4];
	var thingTypeUID = getThingTypeUID(thingUID);
	
	$scope.thing;
	$scope.groups = [];
	$scope.thingType;
	
	$scope.homeGroups = [];
    $scope.groupNames = [];
	
	$scope.update = function update(thing) {
		if (!$scope.thingType.configParameters) {
			return;
		}
		for (var i = 0; i < $scope.thingType.configParameters.length; i++) {
			var parameter = $scope.thingType.configParameters[i];
			if(thing.configuration[parameter.name]) {
				if(parameter.type === 'TEXT') {
					// no conversation
				} else if(parameter.type === 'BOOLEAN') {
					thing.configuration[parameter.name] = new Boolean(thing.configuration[parameter.name]);
				} else if(parameter.type === 'INTEGER' || parameter.type === 'DECIMAL') {
					thing.configuration[parameter.name] = parseInt(thing.configuration[parameter.name]);
				} else {
					// no conversation
				}
			}
		}
		for (var groupName in $scope.groupNames) {
            if($scope.groupNames[groupName]) {
                thing.item.groupNames.push(groupName);
            } else {
                var index = thing.item.groupNames.indexOf(groupName);
                if (index > -1) {
                    thing.item.groupNames.splice(index, 1);
                }
            }
        }
		thingSetupService.update(thing, function() {
	        thingRepository.update(thing);
	        homeGroupRepository.setDirty(true);
			toastService.showDefaultToast('Thing updated');
			$scope.navigateTo('things/view/' + thing.UID);
		});
	};
	
	$scope.getThing = function refresh(refresh) {
	    	thingRepository.getOne(function(thing) {
	    		return thing.UID === thingUID;
	    	}, function(thing) {
	    		$scope.thing = thing;
	    	    homeGroupRepository.getAll(function(homeGroups) {
	    	        $.each(homeGroups, function(i, homeGroup) {
	    	            if($scope.thing.item.groupNames.indexOf(homeGroup.name) >= 0) {
	    	                $scope.groupNames[homeGroup.name] = true;
	    	            } else {
	    	                $scope.groupNames[homeGroup.name] = false;
	    	            }
	    	        });
	    	        $scope.homeGroups = homeGroups;
	    	    });
	    		$scope.setTitle('Edit ' + thing.item.label);
	    	}, refresh);	
		};
	$scope.getThing(false);
	
	thingTypeRepository.getOne(function(thingType) {
		return thingType.UID === thingTypeUID;
	}, function(thingType) {
		$scope.thingType = thingType;
	});
});