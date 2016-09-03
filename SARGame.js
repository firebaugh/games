/*jshint esversion: 6 */
/* depends on Phaser, ROS*/

var path_to_assets='assets/';
var path_to_sprites=path_to_assets+'sprites/';
var path_to_images=path_to_assets+'images/';

const Games = Object.freeze({STORYTELLING:0, ROCKET_BARRIER:1, GALACTIC_TRAVELER:2, SPACESHIP_TIDYUP:3, ALIEN_CODES:4});
const GameCommands = Object.freeze({START:0, CONTINUE:1, PAUSE:2, END:3, WAIT_FOR_RESPONSE:4, SKIP_RESPONSE:5});


class SARGame {
    
    constructor(url){
        
        /* Phaser Game */
        this.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '', { preload: this.preload, create: this.create, update: this.update, render: this.render });
        
        /* ROS for SAR */
        this.url = url;
        this.ros = new ROSLIB.Ros({
            url : this.url
	});

        // SUBSCRIBERS
        // Game Commands
        this.game_command = new ROSLIB.Topic({
            ros : this.ros,
            name : '/sar/game_command',
            messageType : 'sar_game_command_msgs/GameCommand' 
        });
        this.game_command.subscribe( message => {
            switch(message.command){

                case GameCommands.PAUSE:
                    console.log('Received game PAUSE message.');
                    this.game.paused = true;
                    break;
                
                case GameCommands.CONTINUE:
                    console.log('Received game CONTINUE message.');
                    this.game.paused = false;
                    break;
                
                default:
                    break;
            }
        });

        /* Robot States
        this.Games = Object.freeze({STORYTELLING:0, ROCKET_BARRIER:1, OUTERSPACE:2});
        this.GameCommands = Object.freeze({START:0, CONTINUE:1, PAUSE:2, END:3, WAIT_FOR_RESPONSE:4, SKIP_RESPONSE:5});
        this.robot_state_msg = null;
        
        this.robot_state = new ROSLIB.Topic({
            ros : this.ros,
            name : '/sar/robot_state',
            messageType : 'sar_robot_state_msgs/GameCommand' 
        });

        this.game_command.subscribe( function(message) {
            console.log('Received COMMAND=' + message.command + ' for GAME=' + message.game);
            this.game_command_msg = message;
        });*/
 

        // PUBLISHERS
        // Game States
        this.game_state = new ROSLIB.Topic({
            ros : this.ros,
            name : '/sar/game_state',
            messageType : 'sar_game_command_msgs/GameState' 
        });
        // Robot Commands
        this.robot_command = new ROSLIB.Topic({
            ros : this.ros,
            name : '/sar/robot_command',
            messageType : 'sar_robot_command_msgs/RobotCommand' 
        });


        // ROS CONNECTION INFO
        this.ros.on('connection', function() {
            console.log('Connected to websocket server.');
        });
        this.ros.on('error', function(error) {
            console.log('Error connecting to websocket server: ', error);
        });
        this.ros.on('close', function() {
            console.log('Connection to websocket server closed.');
        });
    }

    init() {
    }

    preload() {
    }

    create() {
    }

    update() {
    }

    render() {
    }

    end() {
        this.game.destroy();
    }
}



class SpaceGame extends SARGame {
   
    constructor(url) {
        super(url);
    }

    preload() {
        console.log('Loading space game and waiting on SAR game command...');    
        
        //window.addEventListener('resize', event => { this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;  this.game.scale.updateLayout();};

        this.game.load.image('splash', path_to_images+'Backgrounds/HomeScreen.png');
        this.game.load.atlasJSONHash('bot', path_to_sprites+'running_bot.png', path_to_sprites+'running_bot.json');
    }

    create() {
        // LOADING SPRITE
        var splash = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'splash');
        splash.anchor.setTo(0.5, 0.5);
            
        var bot = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'bot');
        bot.anchor.setTo(0.5, 0.5);
        bot.animations.add('run');
        bot.animations.play('run', 15, true); // 15 fps, true = loops
    }

}


/*
 * Galactic Traveler
 * -----------------
 *      Help Vega, a robot space explorer, prepare for their long trip home!
 *      Vega needs your help to complete various tasks around their spaceship,
 *      including packing moon rocks, charging and navigating her spaceship, 
 *      and feeding their space pets.
 *
 * Target Skill: Sequencing/Ordering
 *
 * Levels: 1-3
 *
 * Activities:
 *      1) Pack [1-3, 4-6. 7-9] moonrocks
 *      2) Charge spaceship with [1-3, 4-6, 7-9] energy crystals
 *      3) Select galaxy that has more stars [difference of 5, 3, 1]
 *      4) Select planet number p1-3, 4-6, 7-9]
 *      5) Feed space pets the same amount of star dust [divide 2, 4, 6]
 *
 */

// Activity 1: Pack [1-3, 4-6, 7-9] moonrocks
class Activity1 extends SARGame {

    constructor(url, level){
        super(url);
        this.level = level;
    
        this.ROCK_AMOUNT = 10;
        this.COLUMNS_PANEL = 4;
        this.COLUMNS_BOX = 4;

        this.cockpit = null;
	this.controlPanel = null;
        this.button = null;
        this.box = null;
        this.onPanel = null;
        this.onBox = null; 
        
        this.panel = {
	    CoordX : [],
	    CoordY : []
	};

        this.gameWidth = 1920;
        this.gameHeight = 1080;
        this.sx = window.innerWidth/this.gameWidth;
        this.sy = window.innerHeight/this.gameHeight;

        this.count=0;
        this.scoreText = '';
        this.promptText = '';
        this.target = null;
        this.attempts=1;
        this.stat=false;
    }

    preload() {
        this.game.load.image('cockpit', path_to_images+'Backgrounds/ShipInterior.png');
        this.game.load.image('controlPanel',path_to_images+'Backgrounds/ControlPanelcrop.png');

        this.game.load.spritesheet('button',path_to_images+'Buttons/Button_sheet.png',288,288,2);
        this.game.load.spritesheet('box',path_to_images+'Boxes/Box_sheet.png',881,730,2);
        
        this.game.load.spritesheet('moonrock1',path_to_images+'Rocks/Moonrock1_sheet.png',610,400,2);
        this.game.load.spritesheet('moonrock2',path_to_images+'Rocks/Moonrock2_sheet.png',460,360,2);
        this.game.load.spritesheet('moonrock3',path_to_images+'Rocks/Moonrock3_sheet.png',660,360,2);
        this.game.load.spritesheet('moonrock4',path_to_images+'Rocks/Moonrock4_sheet.png',510,410,2);
        this.game.load.spritesheet('moonrock5',path_to_images+'Rocks/Moonrock5_sheet.png',660,360,2);
       
        // TODO game activity ROS messages 
        /*var log_start = new ROSLIB.Message({
            header: {
                frame_id: '0'
            },
            message_type: "Activity Started",
            activity_name: "MoveByName",
            attempts: attempts,
            target: target
        });
        activity_status.publish(log_start);

        var do_start = new ROSLIB.Message({
            header: {
                frame_id: '1'
            },
            command: 2,
            id: 'MoveByName_Intro_EN',
            properties: '<wakeup> I want to bring moon rocks home to show my friends. Will you help me pack some?'
        });
        
        robot_command.publish(do_start);
        
        do_start.id = 'MoveByName_'+target+'_EN';
        do_start.properties = 'Put '+target+' moon rocks into the box.';
        robot_command.publish(do_start);*/

    }
    
    create () {
        // COCKPIT
        this.cockpit = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'cockpit');
        this.cockpit.anchor.setTo(0.5, 0.5);
        
        // CONTROL PANEL
        this.controlPanel = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'controlPanel');
        this.controlPanel.x = this.game.world.centerX - this.controlPanel.width/2;
        this.controlPanel.y = 0;
        
        // FINISH BUTTON
        this.button = this.game.add.sprite(this.controlPanel.x, this.controlPanel.y, 'button');
        this.button.scale.setTo(0.3);
        this.button.x = this.controlPanel.x + this.controlPanel.width/2 - this.button.width/2;
        this.button.y = this.controlPanel.y + this.controlPanel.height - this.button.height - 0.1*this.game.height;
        this.button.frame = 0;
        this.button.inputEnabled = true;
        // button events
        //this.button.events.onInputDown.add(this.onButtonPress,this);
        //this.button.events.onInputUp.add(this.onButtonRelease,this);

        // BOX
        this.box = this.game.add.sprite(0, 0, 'box');
        this.box.scale.setTo(0.3);
        this.box.x = this.controlPanel.width - this.box.width;
        this.box.y = this.controlPanel.y;
        this.box.frame = 0;
        this.box.inputEnabled = true;
        this.box.CoordX = [];
        this.box.CoordY = [];
       
        // GROUPING
        this.onPanel = this.game.add.group();
	this.onBox = this.game.add.group();
	for (var i = 0; i < this.ROCK_AMOUNT; i++){
	    objectname = "object" + this.game.rnd.integerInRange(1,5);
            this.panel.CoordX[i] = this.controlPanel.x + 220*this.sx + (i%this.COLUMNS_PANEL)*150*this.sx;
	    this.panel.CoordY[i] = this.controlPanel.y + 130*this.sy + Math.floor(i/this.COLUMNS_PANEL)*150*this.sy;
	    this.onPanel.create(this.panel.CoordX[i], this.panel.CoordY[i], objectname);
	    this.box.CoordX[i] = this.controlPanel.x + 960*this.sx + i%3*150*this.sx;
	    this.box.CoordY[i] = this.controlPanel.y + 160*this.sy + Math.floor(i/3)*100*this.sy;
	}
        this.onPanel.forEach( function(object){
            object.anchor.setTo(0.5,0.5);
            object.frame=0;
            object.scale.setTo(0.25*sx);
            object.inputEnabled=true;
            object.input.enableDrag(false,false,false,255,null,this.controlPanel);
            object.events.onDragStart.add(this.onDragStart,this);
            object.events.onDragStop.add(this.onDragStop,this);
            object.events.onDragUpdate.add(this.onDragUpdate,this);
        });

        /*	
        scoreText = game.add.text(game.width/2,0.1*game.height,'Count: 0',{fontSize:'24px',fill:'#000'});
        scoreText.x=game.width/2-scoreText.width/2;

        promptText = game.add.text(game.width/2,0.03*game.height,'Please move moonrocks into the box',{fontSize:'24px',fill:'#fff'});
        promptText.x = game.width/2-promptText.width/2;
        var question = 'Please move ' + target + ' moonrocks into the box';
        promptText.setText(question);
        */
    }
        
    update () {
    }

    onButtonPress (sprite, pointer) {
        sprite.frame=1;
        //this.stat = this.countRocks();
        //if (!this.stat[0]) this.attempts++;

        /*
        var log_complete = new ROSLIB.Message({
            header: {
                frame_id: '1'
            },
            message_type : "Activity Completed",
            activity_name : "MoveByName",
            target: target,
            attempts: attempts,
            status: stat[0]
        });
        activity_status.publish(log_complete);

        var do_complete = new ROSLIB.Message({
            header: {
                frame_id: '1'
            },
            command: 2
        });
        */

        /*if (stat[0]){
            do_complete.id = "Congrat_"+game.rnd.integerInRange(1,6)+"_EN";
            do_complete.properties = "Great job!";
        }
        else {
            if (stat[1] == 'less') {
                do_complete.id = "too-few-"+game.rnd.integerInRange(1,3)+"_EN";
                do_complete.properties = "Do we need more?";
            }
            else if (stat[1] == 'more') {
                do_complete.id = "too-many-"+game.rnd.integerInRange(1,3)+"_EN";
                do_complete.properties = "Is that too many?";
            }
        }*/
        //robot_command.publish(do_complete);
    }

    onButtonRelease (sprite, pointer) {
        sprite.frame=0;
    }

    onDragStart (sprite, pointer) {
        sprite.frame=1;
    }

    onDragStop (sprite, pointer) {
        sprite.frame=0;
        this.box.frame = 0;
            			
        if (this.isInside(sprite) && this.onPanel.removeChild(sprite)) {
            this.onBox.add(sprite);
	}
	else if (!this.isInside(sprite) && this.onBox.removeChild(sprite)) {
	    this.onPanel.add(sprite);
	}
	
        console.log("onPanel.total: " + this.onPanel.total + " onBox.total: " + this.onBox.total);
			
	//Reorders the rocks on the Panel
	for (var i = 0; i < this.onPanel.total; i++) {
	    this.onPanel.getChildAt(i).x = this.panel.CoordX[i];
	    this.onPanel.getChildAt(i).y = this.panel.CoordY[i];
	}
			
	//Reorders the rocks on the Box
	for (i = 0; i < this.onBox.total; i++) {
	    this.onBox.getChildAt(i).x = this.box.CoordX[i];
	    this.onBox.getChildAt(i).y = this.box.CoordY[i];
	}
    }

    onDragUpdate (sprite, pointer) {
        if (this.isInside(sprite)) {
            this.box.frame = 1;
        }
        else if (!this.isInside(sprite)) {
	    this.box.frame = 0;
	}
    }

    isInside (object) {
        if ( object.x > this.box.x + 0.01*this.game.width &&
             object.y > this.box.y + 0.01*this.game.height &&
             object.x < this.box.x + this.box.width - 0.01*this.game.width &&
             object.y < this.box.y + this.box.height - 0.01*this.game.height )
        {
            return true;
        }
        else {
            return false;
        }
    }

    countRocks(){
	//make use of total properties of onBox group
        this.count = this.onBox.total;
        console.log("Count in box! : " + this.onBox.total);

        this.scoreText.setText('Count: '+ this.count);
        
        if (this.count==this.target){
	    alert('Well done!'); 
	    //disable the drag properties
	    this.onBox.forEach(function(object){object.input.draggable = false;});
	    this.onPanel.forEach(function(object){object.input.draggable = false;});
	    //game.input.mouse.enabled = false;
	    return true;
        }

        else return [false,(this.count<this.target)?"less":"more"];
    }
}
