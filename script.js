/**
Copyright 2014 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var truncate = function(str, width, left) {
  if (!str) return "";

	if (str.length > width) {
    if (left) {
  		return str.slice(0, width) + "...";
    } else {
  		return "..." + str.slice(str.length - width, str.length);
    }
	}
	return str;
}

var pods = [];
var services = [];
var controllers = [];
var uses = {};

var groups = {};
var instance;
var timeoutFunction;
var repainting = false;

var insertByNameOrType = function(index, value) {
  if (!value || !value.metadata.labels || !value.metadata.name) {
    return;
  }
  var key = getNodeKey(value);
  addGroupName(key);
  if (!isVisibleGroup(key)){
   return;
  }
  var list = groups[key];
  if (!list) {
		list = [];
		groups[key] = list;
  }
  list.push(value);
};

function isVisibleGroup(key){
  if ($("input#"+key).length != 0 && $("input#"+key).prop("checked") ){
    return true;
  }
  return false;
}

function clearGroupNames(){
	$("group-names").clear();
}


function addGroupName(groupName){
     if ($("input#"+groupName).length == 0){
       $("#group-names").append("<input type=\"checkbox\" checked=\"checked\" name=\"availableGroups\" id=\""+groupName +"\">"+groupName+"");	
    }
}

function getNodeKey(itemNode){
	return (itemNode.metadata.labels.type ? itemNode.metadata.labels.type : itemNode.metadata.labels.name);
}

var groupByNameOrType = function() {
	$.each(pods.items, insertByNameOrType);
	$.each(controllers.items, insertByNameOrType);
	$.each(services.items, insertByNameOrType);
};

var matchesLabelQuery = function(labels, selector) {
	var match = true;
	$.each(selector, function(key, value) {
		if (labels[key] != value) {
			match = false;
		}
	});
	return match;
}

var connectControllers = function() {
    connectUses();
	for (var i = 0; i < controllers.items.length; i++) {
		var controller = controllers.items[i];
		//console.log("controller: " + controller.metadata.name)
		for (var j = 0; j < pods.items.length; j++) {
			var pod = pods.items[j];
			if (isVisibleGroup(getNodeKey(pod)) && getNodeKey(pod) == getNodeKey(controller)) {
				if (controller.metadata.labels.version && pod.metadata.labels.version && (controller.metadata.labels.version != pod.metadata.labels.version)) {
				  continue;
				}
				//console.log('connect controller: ' + 'controller-' + controller.metadata.name + ' to pod-' + pod.metadata.name);
				instance.connect({
					source: 'controller-' + controller.metadata.name,
					target: 'pod-' + pod.metadata.name,
					anchors:["Bottom", "Bottom"],
					paintStyle:{lineWidth:5,strokeStyle:'rgb(51,105,232)'},
					joinStyle:"round",
					endpointStyle:{ fillStyle: 'rgb(51,105,232)', radius: 7 },
					connector: ["Flowchart", { cornerRadius:5 }]});
			}
		}
	}
	for (var i = 0; i < services.items.length; i++) {
		var service = services.items[i];
		for (var j = 0; j < pods.items.length; j++) {
			var pod = pods.items[j];
			//console.log('connect service: ' + 'service-' + service.metadata.name + ' to pod-' + pod.metadata.name);
			if (isVisibleGroup(getNodeKey(pod)) && matchesLabelQuery(pod.metadata.labels, service.spec.selector)) {
				instance.connect(
					{
						source: 'service-' + service.metadata.name,
						target: 'pod-' + pod.metadata.name,
						anchors:["Bottom", "Top"],
						paintStyle:{lineWidth:5,strokeStyle:'rgb(0,153,57)'},
						endpointStyle:{ fillStyle: 'rgb(0,153,57)', radius: 7 },
						connector:["Flowchart", { cornerRadius:5 }]});
			}
		}
	}
};

var colors = [
	'rgb(213,15,37)',
	'rgb(238,178,17)',
	'rgb(17,178,238)'
]

var connectUses = function() {
	var colorIx = 0;
	var keys = [];
	$.each(uses, function(key) {
		keys.push(key);
	});
	keys.sort(function(a, b) { return a > b; });
	$.each(keys, function(idx) {
		var key = keys[idx];
		var list = uses[key];
		var color = colors[colorIx];
		colorIx++;
		if (colorIx >= colors.length) { colorIx = 0;};
		$.each(pods.items, function(i, pod) {
			var podKey = getNodeKey(pod);
			//console.log('connect uses key: ' +key + ', ' + podKey);
			if (podKey == key) {
				$.each(list, function(j, serviceId) {
			            //console.log('connect: ' + 'pod-' + pod.metadata.name + ' to service-' + serviceId);
			            if   ( ($('#service-' + serviceId).length != 0) && ($('#pod-' + pod.metadata.name).length != 0) ){ 
					instance.connect(
					{
						source: 'pod-' +  pod.metadata.name,
						target: 'service-' + serviceId,
						endpoint: "Blank",
						//anchors:["Bottom", "Top"],
						anchors:[[ 0.5, 1, 0, 1, -30, 0 ], "Top"],
						//connector: "Straight",
						connector: ["Bezier", { curviness:75 }],
						paintStyle:{lineWidth:2,strokeStyle:color},
						overlays:[
    						[ "Arrow", { width:15, length:30, location: 0.3}],
    						[ "Arrow", { width:15, length:30, location: 0.6}],
    						[ "Arrow", { width:15, length:30, location: 1}],
    					],
					});



                                    }else{
                                     console.log('Could not connect: ' + 'pod-' + pod.metadata.name + ' to service-' + serviceId + " Are you using meta.label.name of the service as the uses label?");
                                    }
				});
			}
		});
	});
};

var makeGroupOrder = function() {
  var groupScores = {};
  $.each(groups, function(key, val) {
    //console.log("group key: " + key);
		if (!groupScores[key]) {
		  groupScores[key] = 0;
		}
		if (uses[key]) {
		  value = uses[key];
		  $.each(value, function(ix, uses_label) {
				if (!groupScores[uses_label]) {
				    groupScores[uses_label] = 1;
				} else {
				    groupScores[uses_label]++;
				}
			});
                    groupScores[key]++;
		} else {
			if (!groupScores["no-service"]) {
				groupScores["no-service"] = 1;
			} else {
				groupScores["no-service"]++;
			}
		}
	});
	
  var groupOrder = [];
  $.each(groupScores, function(key, value) {
    groupOrder.push(key);
  });
	
  groupOrder.sort(function(a, b) { return groupScores[a] - groupScores[b]; });
  return groupOrder;
};

var renderNodes = function() {
	
    $.each(nodes.items, function(index, value) {
		console.log(value);
		var div = $('<div/>');
		var ready = isComponentReady(value);

		var eltDiv = $('<div class="window node ' + ready + '" title="' + value.metadata.name + '" id="node-' + value.metadata.name + '" />' );
		eltDiv.html('<span><b>Node</b><br/><br/>' + truncate(value.metadata.name, 6) +	'</span>');
		
		div.append(eltDiv);

		var elt = $('.nodesbar');
		elt.append(div);
	});
 
}

var renderGroups = function() {

	var elt = $('#sheet');
	var groupOrder = makeGroupOrder();
    var counts = {} 
	
	$.each(groupOrder, function(ix, key) {
		list = groups[key];
		// list = value;
		if (!list) {
			return;
		}
		
		var div = $('<div class="group"/>');
		var services = $('<div class="services" />');
		var pods = $('<div class="pods" />');
		var controllers= $('<div class="controllers" />');
		
		div.append(services);
		div.append(pods);
		div.append(controllers);
		
		$.each(list, function(index, value) {
			//console.log("render groups: " + value.type + ", " + value.metadata.name + ", " + index)
			var eltDiv = null;
			console.log(value);
			var phase = value.status.phase ? value.status.phase.toLowerCase() : '';
			
			if (value.type == "pod") {
				var status = phase;
				if (status == 'running'){
					status = isComponentReady(value);
				}else if ('deletionTimestamp' in value.metadata) {
					status = 'terminating';
				}
				
				eltDiv = $('<div class="window pod ' + status + '" title="' + value.metadata.name + '" id="pod-' + value.metadata.name +'" />');
				eltDiv.html('<span>' + 
							truncate(value.metadata.name, 8, true) +
							(value.metadata.labels.version ? "<br/>" + value.metadata.labels.version : "") + "<br/><br/>" +
							"(" + (value.spec.nodeName ? truncate(value.spec.nodeName, 6) : "None")  +")" +
							'</span>');
				pods.append(eltDiv);
			} else if (value.type == "service") {
				eltDiv = $('<div class="window wide service ' + phase + '" title="' + value.metadata.name + '" id="service-' + value.metadata.name +'" />');
				eltDiv.html('<span>' + 
							  value.metadata.name +
							  (value.metadata.labels.version ? "<br/><br/>" + value.metadata.labels.version : "") + 
							  (value.spec.clusterIP ? "<br/><br/>" + value.spec.clusterIP : "") +
							  (value.status.loadBalancer && value.status.loadBalancer.ingress ? "<br/><a style='color:white; text-decoration: underline' href='http://" + value.status.loadBalancer.ingress[0].ip + "'>" + value.status.loadBalancer.ingress[0].ip + "</a>" : "") +
							  '</span>');
				services.append(eltDiv);
			} else {
				eltDiv = $('<div class="window wide controller" title="' + value.metadata.name + '" id="controller-' + value.metadata.name +'" />');
				eltDiv.html('<span>' + value.metadata.name +
							(value.metadata.labels.version ? "<br/><br/>" + value.metadata.labels.version : "") + 
							'</span>');
				controllers.append(eltDiv);
			}
			
		});
		elt.append(div);
	});
};

var insertUse = function(name, use) {
  for (var i = 0; i < uses[name].length; i++) {
    if (uses[name][i] == use) {
      return;
    }
  }
  uses[name].push(use);
};

var loadData = function() {
	var deferred = new $.Deferred();
	var req1 = $.getJSON("/api/v1/pods?labelSelector=visualize%3Dtrue", function( data ) {
		pods = data;
		$.each(data.items, function(key, val) {
			val.type = 'pod';
			if (val.metadata.labels && val.metadata.labels.uses) {
				var key = getNodeKey(val); 
				if (!uses[key]) {
					uses[key] = val.metadata.labels.uses.split("_");
				} else {
					$.each(val.metadata.labels.uses.split("_"), function(ix, use) { insertUse(key, use); });
				 }
			}
		});
	});

	var req2 = $.getJSON("/api/v1/replicationcontrollers?labelSelector=visualize%3Dtrue", function( data ) {
		controllers = data;
		$.each(data.items, function(key, val) {
      val.type = 'replicationController';
      //console.log("Controller ID = " + val.metadata.name)
    });
	});


	var req3 = $.getJSON("/api/v1/services?labelSelector=visualize%3Dtrue", function( data ) {
		services = data;
		//console.log("loadData(): Services");
		//console.log(services);
		$.each(data.items, function(key, val) {
			val.type = 'service';
			//console.log("service ID = " + val.metadata.name)
		});
	});

	var req4 = $.getJSON("/api/v1/nodes", function( data ) {
		nodes = data;
		//console.log("loadData(): Services");
		//console.log(nodes);
		$.each(data.items, function(key, val) {
      val.type = 'node';
      //console.log("service ID = " + val.metadata.name)
    });
	});

	$.when(req1, req2, req3, req4).then(function() {
		deferred.resolve();
	});


	return deferred;
}

function refresh() {
		
	if (repainting){
		return;
	}
	
	pods = [];
	services = [];
	controllers = [];
	nodes = [];
	uses = {};
	groups = {};
			
	$.when(loadData()).then(function() {
		if (!repainting){
			groupByNameOrType();
			instance.reset();
			$('.nodesbar').empty();
			$('.group').empty();
			$('#sheet').empty();
			renderNodes();
			renderGroups();			
			connectControllers();
		}
  });
}

function isComponentReady (component){
    var ready = 'not_ready';
    $.each(component.status.conditions, function(index, condition) {
      if (condition.type === 'Ready') {
        ready = (condition.status === 'True' ? 'ready' : 'not_ready' )
      }
    });
	return ready;
}

jsPlumb.bind("ready", function() {

	instance = jsPlumb.getInstance({
		// default drag options
		DragOptions : { cursor: 'pointer', zIndex:2000 },
		// the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
		// case it returns the 'labelText' member that we set on each connection in the 'init' method below.
		ConnectionOverlays : [
			//[ "Arrow", { location:1 } ],
			//[ "Label", {
			//	location:0.1,
			//	id:"label",
			//	cssClass:"aLabel"
			//}]
		],
		Container:"flowchart-demo"
	});

	refresh();
	scheduleRefresh();
});

function scheduleRefresh(){
	timeoutFunction= setInterval(function() {
		refresh();
	}, 3000);	
}

$( window ).resize(function() {
	repainting = true;
	instance.repaintEverything();
	repainting = false;
});	
  
