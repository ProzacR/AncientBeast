/*	Class UI
*
*	Object containing UI DOM element, update functions and event managment on UI.
*
*/
var UI = Class.create({

	/*	Attributes
	*	
	*	NOTE : attributes and variables starting with $ are jquery element 
	*	and jquery function can be called dirrectly from them.
	*
	*	$display :		UI container 
	*	$queue :		Queue container
	*	$textbox :		Chat and log container
	*	$activebox :	Current active creature panel (left panel) container
	*	$dash :			Overview container
	*	$grid :			Creature grid container
	*
	*	selectedCreature : 	String : 	ID of the visible creature card
	*	selectedPlayer : 	Integer : 	ID of the selected player in the dash
	*
	*/


	/*	Constructor
	*	
	* 	Create attributes and default buttons
	*
	*/
	initialize: function(){
		this.$display = $j("#ui");
		this.$queue = $j("#queuewrapper");
		this.$dash = $j("#dash");
		this.$grid = $j("#creaturegrid");

		//Dash button
		$j(".toggledash").bind('click',function(e){ G.UI.toggleDash() });

		//End turn button
		this.$button = $j("#end.button");
		this.$button.bind('click',function(e){ G.endTurn() });

		//Wait Button
		this.$button = $j("#delay.button");
		this.$button.bind('click',function(e){ G.delayTurn() });

		//Surrender Button
		this.$button = $j("#surrender.button");
		this.$button.bind('click',function(e){ G.activeCreature.player.surrender() });

		this.$textbox = $j("#textbox > #textcontent");

		this.$activebox = $j("#activebox");

		this.$dash.children("#playertabswrapper").addClass("numplayer"+G.nbrPlayer);

		this.selectedCreature = "";
		this.selectedPlayer = 0;

		//Show UI
		this.$display.show();
	},


	/*	queryCreature(fnCallback,optArgs)
	*	
	*	fnCallback : 	Function : 	Callback function used like this fnCallback(creatureType,optArgs)
	*	optArgs : 		Any : 		Optional argument for Callback function
	*	plasma : 	Integer : 	Additional plasma cost. set it to -1 if not a summoning
	*
	* 	Query a creature in the available creatures of the active player
	*
	*/
	queryCreature: function(fnCallback,optArgs,plasma){
		this.selectedCreature = "";
		this.$dash.addClass("active"); //Show dash
		if(!!(plasma+1)) this.$dash.children("#tooltip").text("Choose a creature to summon.").addClass("active"); //Show tooltip
		this.$dash.children("#playertabswrapper").removeClass("active"); //Remove Player Tabs
		this.changePlayerTab(G.activeCreature.team); //Change to active player grid

		this.$grid.children('.vignette:not([class*="locked"]):not([class*="queued"]):not([class*="dead"])').unbind('click').bind("click",function(e){
			e.preventDefault();

			var creatureType = $j(this).attr("creature");

			if(!!(plasma+1)){
				//Plasma cost
				var lvl = creatureType.substring(1,2)-0;
				var size = G.retreiveCreatureStats(creatureType).size-0;
				plasmaCost = lvl+size+(plasma-0);

				if(plasmaCost>G.activeCreature.player.plasma){
					G.UI.$dash.children("#tooltip").text("Not enough plasma. You need "+plasmaCost+" plasma points to summon this creature.");
				}else{
					G.UI.$dash.children("#tooltip").text("Click again to summon this creature at the cost of "+plasmaCost+" plasma points.");
					if(creatureType == G.UI.selectedCreature){
						fnCallback(creatureType,optArgs); //Call the callback function
						G.UI.$dash.removeClass("active"); //Hide dash
						G.UI.$grid.children(".vignette").removeClass("active")
						G.UI.selectedCreature = "";
					}else{
						G.UI.showCreature(creatureType,G.UI.selectedPlayer);
					}
				}
			}
		});
	},


	/*	showCreature(creatureType,player)
	*	
	*	creatureType : 	String : 	Creature type
	*	player : 		Integer : 	Player ID
	*
	* 	Query a creature in the available creatures of the active player
	*
	*/
	showCreature: function(creatureType,player){
		if(!this.$dash.hasClass("active")) this.toggleDash();

		if(player != G.UI.selectedPlayer){this.changePlayerTab(player);}

		this.$grid.children(".vignette").removeClass("active")
		.filter("[creature='"+creatureType+"']").addClass("active");

		this.selectedCreature = creatureType;

		var stats = G.retreiveCreatureStats(creatureType);

		//TODO card animation
		if( $j.inArray(creatureType, G.players[player].availableCreatures)>0 || creatureType=="--"){
			//If creature is available

			//Recto
			$j("#card .card.recto").css({"background-image":"url('../bestiary/"+stats.name+"/artwork.jpg')"});
			$j("#card .card.recto .section.info").removeClass("sin- sinA sinE sinG sinL sinP sinS sinW").addClass("sin"+stats.type.substring(0,1));
			$j("#card .card.recto .type").text(stats.type);
			$j("#card .card.recto .name").text(stats.name);
			$j("#card .card.recto .hexs").text(stats.size+"H");

			//Verso
			$j.each(stats.stats,function(key,value){
				$j("#card .card.verso ."+key+" .value").text(value);
			});
			$j.each(abilities[stats.type],function(key,value){
				$ability = $j("#card .card.verso .abilities .ability:eq("+key+")");
				$ability.children('.icon').css({"background-image":"url('../bestiary/"+stats.name+"/"+key+".svg')"});
				$ability.children(".wrapper").children(".info").children("h3").text(value.title);
				$ability.children(".wrapper").children(".info").children(".desc").text(value.desc);
			});

		}else{
			//TODO Locked card
			//$j("#card").text("Locked");
		}
	},


	/*	changePlayerTab(id)
	*
	*	id : 	Integer : 	player id
	*
	*	Change to the specified player tab in the dash
	*
	*/
	changePlayerTab: function(id){
		this.selectedPlayer = id;
		this.$dash //Dash class
		.removeClass("selected0 selected1 selected2 selected3")
		.addClass("selected"+id);

		this.$grid.children(".vignette") //vignettes class
		.removeClass("active dead queued")
		.addClass("locked");

		//change creature status
		G.players[id].availableCreatures.each(function(){
			G.UI.$grid.children(".vignette[creature='"+this+"']").removeClass("locked");
		});
		G.players[id].creatures.each(function(){
			if(this.dead == true){
				G.UI.$grid.children(".vignette[creature='"+this.type+"']").addClass("dead");
			}else{
				G.UI.$grid.children(".vignette[creature='"+this.type+"']").addClass("queued");
			}
		});

		//Bind creature vignette click
		this.$grid.children(".vignette").unbind('click').bind("click",function(e){
			e.preventDefault();

			if($j(this).hasClass("locked")){
				G.UI.$dash.children("#tooltip").text("Creature locked.");
			}

			var creatureType = $j(this).attr("creature");
			G.UI.showCreature(creatureType,G.UI.selectedPlayer);
		});

	},


	/*	toggleDash()
	*
	*	Show the dash and hide some buttons
	*
	*/
	toggleDash: function(){
		this.$dash.toggleClass("active");
		this.$dash.children("#tooltip").removeClass("active");
		this.$dash.children("#playertabswrapper").addClass("active");
		this.changePlayerTab(G.activeCreature.team);

		this.$dash.children("#playertabswrapper").children(".playertabs").unbind('click').bind('click',function(e){
			G.UI.showCreature("--",$j(this).attr("player")-0);
		});

		//Change player infos
		for (var i = G.players.length - 1; i >= 0; i--) {
			$j("#dash .playertabs.p"+i+" .plasma").text("Plasma "+G.players[i].plasma);
			$j("#dash .playertabs.p"+i+" .score").text(G.players[i].getScore().total+" Score");
		};

		//TODO Change Dash button to return
	},


	/*	updateActiveBox()
	*
	*	Update activebox with new current creature's abilities
	*
	*/
	updateActivebox: function(){
		$j("#playerbutton").removeClass("p0 p1 p2 p3")
		.addClass("type-- p"+G.activeCreature.player.id)
		$j("#playerinfos .name").text(G.activeCreature.player.name);
		$j("#playerinfos .points span").text(G.activeCreature.player.getScore().total);
		$j("#playerinfos .plasma span").text(G.activeCreature.player.plasma);

		var $abilitiesButtons = G.UI.$activebox.children("#abilities").children(".ability");
		$abilitiesButtons.unbind("click");

		this.$activebox.children("#abilities").clearQueue().transition({y:"-420px"},function(){//Hide panel	
			//Change abilities buttons
			$abilitiesButtons.each(function(){
				var id = $j(this).attr("ability") - 0;
				$j(this).css("background-image","url('../bestiary/"+G.activeCreature.name+"/"+id+".svg')");
				$j(this).children(".desc").html("<span>"+G.activeCreature.abilities[id].title+"</span><p>"+G.activeCreature.abilities[id].desc+"</p>");
				$j(this).bind('click', function(e){
					G.activeCreature.abilities[id].use() 
				});
			});

			G.UI.$activebox.children("#abilities").transition({y:"0px"}); //Show panel
		}); 
	},


	/*	updateTimer()
	*	
	*/
	updateTimer:function(){
		var date = new Date();

		//TurnTimePool
		if( G.turnTimePool >= 0 ){
			var remainingTime = G.turnTimePool - Math.round((date - G.activeCreature.player.startTime)/1000);
			if(G.timePool > 0)
				remainingTime = Math.min(remainingTime, Math.round( (G.activeCreature.player.totalTimePool-(date - G.activeCreature.player.startTime))/1000) );
			var minutes = Math.floor(remainingTime/60);
			var seconds = remainingTime-minutes*60;
			$j("#playerinfos .time span").text(zfill(minutes,2)+":"+zfill(seconds,2));
			//Time Alert
			if( remainingTime < G.turnTimePool*.25 ) 
				$j("#playerinfos .time span").addClass("alert");
			else
				$j("#playerinfos .time span").removeClass("alert");
		}else{
			$j("#playerinfos .time span").text("∞");
		}

		//TotalTimePool
		if( G.timePool >= 0 ){
			G.players.each(function(){
				var remainingTime = (this.id == G.activeCreature.player.id) ? this.totalTimePool - (date - this.startTime) : this.totalTimePool;
				remainingTime = Math.max(Math.round(remainingTime/1000),0);
				var minutes = Math.floor(remainingTime/60);
				var seconds = remainingTime-minutes*60;
				$j(".playertabs.p"+this.id+" .timepool").text("TimePool "+zfill(minutes,2)+":"+zfill(seconds,2));
			});
		}else{
			$j(".playertabs .timepool").text("TimePool ∞");
		}
	},


	/*	updateQueueDisplay()
	*	
	* 	Delete and add element to the Queue container based on the game's queues
	*
	*/
	updateQueueDisplay: function(){ //Ugly as hell need rewrite

		if(!G.nextQueue.length || !G.activeCreature ) return false; //Abort to avoid infinite loop

		var queueAnimSpeed = 500;

		var $vignettes = this.$queue.children('.queue[turn]').children('.vignette');
		var $queues = this.$queue.children('.queue[turn]');

		if( ($queues.first().attr("turn")-0) < G.turn){ //If first queue turn is lower than game turn 
			$vignettes.each(function(){
				$j(this).attr("queue",$j(this).attr("queue")-1); //decrement vignettes
			});
			$queues.each(function(){
				$j(this).attr("queue",$j(this).attr("queue")-1); //decrement queues
				if($j(this).attr("queue")-0<0){ 
					$j(this).children(".vignette").transition({width:0},queueAnimSpeed,function(){ this.remove(); });
					$j(this).transition({opacity:1},queueAnimSpeed,function(){ this.remove(); }); //Let vignette fade and remove ancients queues
					$j(this).removeAttr("turn");
				 };
			});
		}

		//Prepend Current creature to queue after copying it
		var completeQueue = G.queue.slice(0);
		completeQueue.unshift(G.activeCreature);
		completeQueue = completeQueue.concat(G.delayQueue);

		var u = 0;		
		while(	u < 2 || //Only display 2 queues 
			//$vignettes.size() < 12 || //While queue does not contain enough vignette OR
			u < $queues.size() ){ //not all queue has been verified
			var queue = (u==0)? completeQueue : G.nextQueue ;

			//Updating
			var $vignettes = this.$queue.children('.queue[turn]').children('.vignette');
			var $queues = this.$queue.children('.queue[turn]');

			if($queues[u] == undefined){ //If queue doenst exists
				if(u==0){
					this.$queue.append('<div queue="'+u+'" class="queue" turn="'+(u+G.turn)+'"></div>');
				}else{
					$j($queues[u-1]).after('<div queue="'+u+'" class="queue" turn="'+(u+G.turn)+'"></div>');
				}
				var $queues = this.$queue.children('.queue[turn]');
			}

			var $Q = $vignettes.filter('[queue="'+u+'"]');

			//For all element of this queue
			for (var i = 0; i < queue.length; i++) {

				var initiative =  queue[i].getInitiative( (u==0) );

				//If this element doesnot exists
				if($Q[i] == undefined){
					if(i==0){
						$j($queues[u]).append('<div queue="'+u+'" creatureid="'+queue[i].id+'" initiative="'+initiative+'" class="vignette hidden p'+queue[i].team+" type"+queue[i].type+'"><div></div></div>');
					}else{
						$j($Q[i-1]).after('<div queue="'+u+'" creatureid="'+queue[i].id+'" initiative="'+initiative+'" class="vignette hidden p'+queue[i].team+" type"+queue[i].type+'"><div></div></div>');
					}
					//Updating
					var $Q = this.$queue.children('.queue').children('.vignette').filter('[queue="'+u+'"]');
					var $queues = this.$queue.children('.queue[turn]');

					$Q.filter('[creatureid="'+queue[i].id+'"][queue="'+u+'"]').css({width:0}).transition({width:80},queueAnimSpeed,function(){ $j(this).removeAttr("style"); });
				}else if(queue[i] == undefined){
					$j($Q[i]).attr("queue","-1").transition({width:0},queueAnimSpeed,function(){ this.remove(); });
					//Updating
					var $Q = this.$queue.children('.queue').children('.vignette').filter('[queue="'+u+'"]');
					var $queues = this.$queue.children('.queue[turn]');
				}else{
					while( $j($Q[i]).attr("creatureid") != queue[i].id ){
						if( $j($Q[i]).attr("initiative") < initiative ) {
							$j($Q[i]).before('<div queue="'+u+'" creatureid="'+queue[i].id+'" initiative="'+initiative+'" class="vignette hidden p'+queue[i].team+" type"+queue[i].type+'"><div></div></div>');
							this.$queue.children('.queue').children('.vignette').filter('[creatureid="'+queue[i].id+'"][queue="'+u+'"]').css({width:0}).transition({width:80},queueAnimSpeed,function(){ $j(this).removeAttr("style"); });
						}else{
							$j($Q[i]).attr("queue","-1").transition({width:0},queueAnimSpeed,function(){ this.remove(); });
						}

						//Updating
						var $Q = this.$queue.children('.queue').children('.vignette').filter('[queue="'+u+'"]');
						var $queues = this.$queue.children('.queue[turn]');
					}
				}
			};

			if( queue.length < $Q.length ){ //If displayed queue is longer compared to real queue
				for(var i = 0; i < $Q.length - queue.length; i++){
					//Chop the excess
					$Q.last().attr("queue","-1").transition({width:0},queueAnimSpeed,function(){ this.remove(); });
					var $Q = this.$queue.children('.queue').children('.vignette').filter('[queue="'+u+'"]');
				}
			}

			//Set active creature
			this.$queue.children('.queue').children('.vignette').filter(".active").removeClass("active"); //Avoid bugs
			this.$queue.children('.queue[queue="0"]').children('.vignette[queue="0"]').first().addClass("active");

			//Add mouseover effect
			this.$queue.children('.queue').children('.vignette').unbind("mouseover").unbind("mouseleave").bind("mouseover",function(){
				var creaID = $j(this).attr("creatureid")-0;
				G.creatures.each(function(){
					if(this instanceof Creature){
						this.$display.removeClass("ghosted");
						if(this.id != creaID){ this.$display.addClass("ghosted"); };
					}
				});
			}).bind("mouseleave",function(){ //On mouseleave cancel effect
				G.creatures.each(function(){
					if(this instanceof Creature){
						this.$display.removeClass("ghosted");
					}
				});
			}).bind("click",function(){ //Show dash on click
				var creaID = $j(this).attr("creatureid")-0;
				G.UI.showCreature(G.creatures[creaID].type,G.creatures[creaID].team);
			});

			u++;
		}
	},

});
