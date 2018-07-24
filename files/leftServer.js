const Discord=require('discord.js');
const bot=new Discord.Client();
const fs=require('fs');
const config=require('./files/config.json');
const servers=require('./files/servers.json'); 



// GRAB THE SPOOFING SERVERS FROM JSON AND REFORMAT IT
spoofServers=servers.servers; myServer=config.myServer;

// GRAB WEBHOOK FROM CONFIG.JSON AND REFORMAT IT
let webhook=config.webhook; webhook=webhook.split("webhooks"); webhook=webhook[1]; webhook=webhook.split("/");
	webhookID=webhook[1]; webhookToken=webhook[2]; 
// DIRECT CALL TO THE WEBHOOK
const WHchan=new Discord.WebhookClient(webhookID,webhookToken);


// START SCRIPT
bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
	console.info('-- DISCORD SpoofNinjaBOT IS READY --');
	
	console.info(timeStampSys+"I have loaded "+spoofServers.length+" Spoofing Servers");
	
	if(config.botSupport==="no"){console.info('[PLEASE NOTE]:\n'
		+'You should consider enabling "botSupport" in order to:\n'
		+'» Get notifications about updates for either:\n'
		+'-- SpoofNinja.js, servers.json, and/or config.json\n'
		+'» Direct replies in your server when using "!bug" reports\n'
		+'-- You\'re sharing your webhook in order for Jenner to send to reply\n'
		+'----------------------------------------------------------\n'
		+'» How to ENABLE it? very easy: \n'
		+'-- Edit config.json [Line3]: "botSupport": "yes"\n'
		+'----------------------------------------------------------\n');
	}
	
	// SET BOT AS INVISIBLE = NINJA <(^.^<) 
	bot.user.setPresence({"status":"invisible"});
});



//
//				DEFINE GLOBAL AND COMMON VARIABLES
//
var serverCount, noobFound, stillServer, slackmsg, myServerFound;



//
//				CHECK CONFIG FOR RIGHT INFO INPUT BY USER
//
if(!Number.isInteger(parseInt(config.botID))){ return console.info(".\n[ERROR] config.json » \"botID\" » wrong format, it needs to be numbers\n."); }
if(!Number.isInteger(parseInt(config.ownerID))){ return console.info(".\n[ERROR] config.json » \"ownerID\" » wrong format, it needs to be numbers\n."); }
if(!Number.isInteger(parseInt(config.myServer.server))){ return console.info(".\n[ERROR] config.json » myServer » \"server\" » wrong format, it needs to be numbers\n."); }
if(!Number.isInteger(parseInt(config.cmdChanID))){ return console.info(".\n[ERROR] config.json » \"cmdChanID\" » wrong format, it needs to be numbers\n."); }




// ##########################################################################
// #############################  MEMBER LEFT  ##############################
// ##########################################################################

bot.on("guidMemberRemove", member => {
	
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";

	let guild=member.guild; myServerFound="no";
	
	
	
// USERNAMES REPLACE SPACE WITH UNDERLINE
	let user=member.user; let userNoSpace=user.username; 
		nuser=userNoSpace.split(" "); for(var xn="0";xn < nuser.length; xn++){ userNoSpace=userNoSpace.replace(" ","_"); }
	
	
	
// CHECK ALL SERVERS FROM SERVERLIST
	for(serverCount="0"; serverCount < spoofServers.length; serverCount++){
		
		// CHECK IF SERVER LEFT MATCHES ONE OF MY BLACKLISTED SERVER
		if(guild.id===spoofServers[serverCount].server){
			noobFound=spoofServers[serverCount].name;
		}
	}
	
	
	
// CHECK IF USER IS STILL IN MY SERVER
	stillServer=bot.guilds.get(config.myServer.server).members.get(user.id);
	
	
	
// LOGGING EACH EVENT , DO DISABLE/REMOVE: DELETE EACH LINE, OR ADD COMMENT PARAM: //
	console.info("[L104] User: "+userNoSpace+" has left Server: "+guild.name);
	
	if(noobFound){console.info("[L106] User: "+userNoSpace+" has left Server: "+noobFound+"... it is one of my [BlackListedServers]");}
	
	if(stillServer){console.info("[L108] User: "+userNoSpace+" has left Server: "+noobFound+"... one of my [BlackListedServers]... and they are still in my server");myServerFound="yes";}
	
	
	
//
//				POST DATA TO CHANNEL
//
	if(myServerFound==="yes"){
//
//				SLACK TEMPLATE WITH THUMBNAIL - LEVEL 3 - MULTIPLE SERVERS PLUS MY SERVER
//
		let daColor=config.goodColor; daColor=daColor.slice(1); daColor="0x"+daColor;
		slackmsg={
			'username': config.botName,
			'avatarURL': config.botAvatar,
			'embeds': [{
				'thumbnail': {'url': config.snipeImg },
				'color': parseInt(daColor),
				'description': '✅__**BLACKLISTED SERVER ALERT**__✅\n**'
					+user+'** __has left:__ **'+noobFound+'**\nOn: '+timeStamp+'\nUserID: `'+user+"`"
			}]
		};
		
		// SEND DATA TO CHANNEL AS WEBHOOK IN ORDER TO HIDE BOT'S IDENTITY
		return WHchan.send(slackmsg).catch(console.error);
	}
});



// BOT LOGIN TO DISCORD
bot.login(config.token);

// BOT DISCONNECTED
bot.on('disconnected', function (){
		console.log('Disconnected.');console.log(console.error);
		process.exit(1);
});