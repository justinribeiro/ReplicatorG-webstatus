function Mqtt(dest){
    this.url = dest;
    this.ui = new Ui();
    this.interval = null;
}

Mqtt.prototype = {

    connect: function(){
    	var self = this;
    	
    	// Fallback in case client doesn't have web socket
    	if (!Modernizr.websockets) {
    		WEB_SOCKET_SWF_LOCATION = "/swf/WebSocketMain.swf";
    	}
    	
        this.ws = new WebSocket(this.url);
        
        // heartbeat to keep web socket alive
        this.interval = setInterval(function() { this.ws.send('heartbeat'); }, 60000);
        
        this.ws.onopen = function(event){
        	self.onOpen(event);
        };
        
        this.ws.onclose =  function(event){
        	self.onClose(event);
        };
        
        this.ws.onmessage =  function(event){
        	self.onMessage(event);
        };
        
        this.ws.onerror =  function(event){
        	self.onError(event);
        };
    },
    
    close: function() {
    	
    	// stop the heartbeat
    	clearInterval(this.interval);
    	
    	// close the socket
    	this.ws.disconnect();
    	
    	// write to log
    	this.ui.domUpdateConsole({"message": "Web socket connection closed."});
    },

    onOpen: function(event)   {
        console.log(event);
        this.publish("topic", "info", 2);
        this.publish("topic", "state", 2);
    },
    
    onClose: function(event)   {
        this.ui.domUpdateConsole({"message": "Web socket connection lost."});
    },
    
    onMessage: function(event) {
    	this.ui.process(event.data);
    },
    
    onError: function(event) {
    	console.log(event);
    },
    
    publish: function(topic, message, qos) {
    	this.ws.send(message);
    }
    
};

function Ui(){
   
}

Ui.prototype = { 
	process: function(string) {
		var obj = JSON.parse(string);
		
		switch (obj.topic) {
			case replicatorg.config.topicBase + "/info":
				this.domUpdateInfo(obj.message);
				break;
		      
			case replicatorg.config.topicBase + "/tools":
				this.domUpdateTools(obj.message);
				break;
		      
			case replicatorg.config.topicBase + "/build":
				this.domUpdateBuild(obj.message);
				break;
				
			case replicatorg.config.topicBase + "/state":
				this.domUpdateState(obj.message);
				break;
				
			case replicatorg.config.topicBase + "/machine":
				this.domUpdateMachine(obj.message);
				break;
		      
			case replicatorg.config.topicBase + "/console":
				this.domUpdateConsole(obj.message);
				break;
			      
			case replicatorg.config.topicBase + "/server":
				this.domUpdateServer(obj.message);
				break;
			      
			default:
		      
		}
	},
	domUpdateInfo: function(obj) {
		
		var parseBase = JSON.parse(obj);
		var message = JSON.parse(parseBase.message);
		
		document.getElementById("machine-bot").textContent = parseBase.bot;
		document.getElementById("machine-org").textContent = message.org;
		document.getElementById("machine-loc").textContent = message.loc;
		document.getElementById("machine-type").textContent = message.machine;
		document.getElementById("machine-driver").textContent = message.driver;
		document.getElementById("machine-firmware").textContent = message.firmware;

	},
	domUpdateTools: function(obj) {
		var parseBase = JSON.parse(obj);
		var message = JSON.parse(parseBase.message);
		
		for (var i = 1; i < message.length+1; i++) {
			
			document.getElementById("tools-t" + i).textContent = message[i-1].tool;
			document.getElementById("tools-t" + i + "-temp").textContent = message[i-1].temp;
		}
		
	},
	domUpdateState: function(obj) {
		var parseBase = JSON.parse(obj);
		
		document.getElementById("state-machine").textContent = parseBase.message;
		
		//$("#state-machine").html(parseBase.message);
		
	},
	domUpdateBuild: function(obj) {
		
		var parseBase = JSON.parse(obj);
		var message = JSON.parse(parseBase.message);
		
		document.getElementById("build-percentagecomplete").textContent = message.complete;
		document.getElementById("build-elapsed").textContent = message.elapsed;
		document.getElementById("build-remaining").textContent = message.remaining;
		document.getElementById("build-completelines").textContent = message.completelines;
		document.getElementById("build-totallines").textContent = message.totallines;
	},
	domUpdateMachine: function(obj) {
		var parseBase = JSON.parse(obj);
		
		//$("#state-machine").html(parseBase.message);
		document.getElementById("state-machine").textContent = parseBase.message;
	},
	domUpdateConsole: function(obj) {
		var parseBase = JSON.parse(obj);
		
		var liElem = document.createElement("li");
		liElem.textContent = parseBase.message;
		document.getElementById("machine-console").appendChild(liElem);

	},
	domUpdateServer: function(string) {
		
		var liElem = document.createElement("li");
		liElem.textContent = string;
		document.getElementById("server-console").appendChild(liElem);

	}	
};

var replicatorg = {};

replicatorg.config = {
	webSocketUrl:	"ws://where_the_replicatorg-websocketserver_lives:8899/broker",
	topicBase:		"makerbot/status"
};

replicatorg.site = {
	init: function(){

		var broker = new Mqtt(replicatorg.config.webSocketUrl);
		broker.connect();
		
		window.onbeforeunload = replicatorg.site.exit(broker);

	},
	exit: function(broker) {

		// close the socket
		broker.close();
	}
};

