'use strict';
const moment=require('moment');
const tz=require('moment-timezone');
const Discord=require('discord.js');
const CONFIG=require('./files/blacklist_config.json');
const EXECUTIONER=new Discord.Client({disabledEvents:[
	'CHANNEL_PINS_UPDATE', 'MESSAGE_REACTION_REMOVE_ALL', 'PRESENCE_UPDATE', 'VOICE_STATE_UPDATE',
	'TYPING_START', 'VOICE_SERVER_UPDATE', 'RELATIONSHIP_ADD', 'RELATIONSHIP_REMOVE'
]});
const USERBOT=new Discord.Client({disabledEvents: [
	'GUILD_CREATE', 'GUILD_DELETE', 'GUILD_UPDATE', 'GUILD_MEMBER_UPDATE',	'GUILD_MEMBERS_CHUNK', 'GUILD_ROLE_CREATE',
	'GUILD_ROLE_DELETE', 'GUILD_ROLE_UPDATE', 'GUILD_BAN_ADD', 'GUILD_BAN_REMOVE', 'CHANNEL_CREATE', 'CHANNEL_DELETE',
	'CHANNEL_UPDATE', 'CHANNEL_PINS_UPDATE', 'MESSAGE_DELETE', 'MESSAGE_UPDATE', 'MESSAGE_DELETE_BULK', 'MESSAGE_REACTION_ADD',
	'MESSAGE_REACTION_REMOVE', 'MESSAGE_REACTION_REMOVE_ALL', 'USER_UPDATE', 'USER_NOTE_UPDATE', 'USER_SETTINGS_UPDATE',
	'PRESENCE_UPDATE', 'VOICE_STATE_UPDATE', 'TYPING_START', 'VOICE_SERVER_UPDATE', 'RELATIONSHIP_ADD', 'RELATIONSHIP_REMOVE'
]});

USERBOT.Snipe_IMG='https://i.imgur.com/dzvklbi.png';
USERBOT.Left_IMG='https://i.imgur.com/HVRacGU.jpg';
USERBOT.Approved_IMG='https://i.imgur.com/LVlq97j.png';

EXECUTIONER.on('ready', () => {
	console.info('Executioner is ready to enact your will.');
});

USERBOT.on('ready', () => {
	console.info('Now Checking '+USERBOT.guilds.size+' Blacklisted Servers.');
	USERBOT.user.setPresence({'status':'invisible'});
});

// TIMESTAMP BASED ON SET TIMEZONE
function postTime(timezone){
	let timeNow=new Date().getTime();
	if(!timezone || timezone=='GMT' || timezone==null){ return moment.tz(timeNow,timezone).format('dddd, MMMM Do, h:mm A')+' GMT'; }
	else{ return moment.tz(timeNow,timezone).format('dddd, MMMM Do, h:mm A'); }
}

// CHECK THE USER FOR SPOOF SERVERS
function checkUser(userID){
	let botInServer='', userInServer='', foundServers='', index='';
	let guilds=USERBOT.guilds.map(g => g);
	guilds.forEach((guild) => {
		if(guild.id!=CONFIG.Home_Server_ID){
			userInServer=guild.members.get(userID);
			if(userInServer){foundServers+='`'+guild.name+'`\n';}
		}
	});
	foundServers=foundServers.replace(',','\n');
	return foundServers;
}

USERBOT.on('guildMemberAdd', member => {
	// IGNORE IF THEY USER IS ON THE WHITELIST
	if(CONFIG.Whitelist.indexOf(member.id)>=0){ return; }
	// VARIABLES DECLARATION
	let timeNow=new Date().getTime(), joinTime=moment(timeNow).format('DD/MMM/YY'),
	foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='', spoofLog,
	userInHomeServer=USERBOT.guilds.get(CONFIG.Home_Server_ID).members.get(member.id);
	// GET NICKNAME OR USE USERNAME
	if(member.nickname){ uName=member.nickname; }	else{ uName=member.user.username; }
	// IGNORE IF USER IS NOT IN MY SERVER
	if(!userInHomeServer){ return; }
	else{
		// USER JOINED MY SERVER AND IS IN SPOOF SERVERS
		if(member.guild.id==CONFIG.Home_Server_ID && foundServers){
			let newMemberSpoof=new Discord.RichEmbed().setColor('ff0000')
				.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
				.addField('New Member is in Blacklisted Servers.', foundServers, false)
				.setFooter(postTime(CONFIG.Timezone));
			EXECUTIONER.channels.get(CONFIG.Command_Channel).send(newMemberSpoof).catch(console.error).then( m => {
				EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
					let configWarn=CONFIG.Joined_My_Server_While_In_Spoof_Servers_Warning.replace(/%SPOOFSERVER%/g, foundServers);
					let warnMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/fE3yYLz.jpg?1').setDescription(configWarn+'\n**Blacklisted Server(s):**\n'+foundServers);
					TARGET.send(warnMessage).catch(console.error);
					let warnConfirmation=new Discord.RichEmbed().setColor('00ff00')
						.setDescription('Warned '+TARGET+'.');
					EXECUTIONER.channels.get(CONFIG.Command_Channel).send(warnConfirmation).catch(console.error);
				}).catch(console.error);
				// CHECK AGAIN IN AFTER A PERIOD OF TIME DETERMINED IN THE CONFIG
				setTimeout(function(){
					let stillMember=USERBOT.guilds.get(CONFIG.Home_Server_ID).members.get(member.id);
					if(!stillMember){
						let leftMessage=new Discord.RichEmbed().setColor('00ff00')
							.setDescription(uName+' has decided to leave our server.');
						return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(leftMessage).catch(console.error);
					}
					else{
						foundServers=''; foundServers=checkUser(member.id);
						if(foundServers){
							switch(CONFIG.Pound_Level){
								case 'KICK':
									EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
										let configKick=CONFIG.Kicked_Message.replace(/%SPOOFSERVER%/g, foundServers);
										let kickMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/Qa1ik69.jpg?1').setDescription(configKick);
										TARGET.send(kickMessage).catch(console.error).then( m => {
											TARGET.kick('Member of a spoofing server.').catch(console.error);
											let kickConfirmation=new Discord.RichEmbed().setColor('00ff00')
												.setDescription('Kicked '+TARGET+'.');
											return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(kickConfirmation).catch(console.error);
										});
									}).catch(console.error); break;
								case 'BAN':
									EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
										let configBan=CONFIG.Banned_Message.replace(/%SPOOFSERVER%/g, foundServers);
										let banMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/Qa1ik69.jpg?1').setDescription(configBan);
										TARGET.send(banMessage).catch(console.error).then( m => {
											TARGET.ban('Member of a spoofing server.').catch(console.error);
											let banConfirmation=new Discord.RichEmbed().setColor('00ff00')
												.setDescription('Banned '+TARGET+'.');
											return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(banConfirmation).catch(console.error);
										});
									}).catch(console.error);
								default:
									EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
										return;
									}).catch(console.error); break;
							}
						}
						else{
							EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
								let configLeft=CONFIG.Left_Spoof_Message.replace(/%SPOOFSERVER%/g, foundServers);
								let leftMessage=new Discord.RichEmbed().setColor('00ff00').setThumbnail('https://i.imgur.com/UtIms4t.jpg').setDescription(configLeft);
								TARGET.send(leftMessage).catch(console.error);
							}).catch(console.error);
						}
					}
			 	}, 60000 * CONFIG.Minutes_Til_Punish);
			}).catch(console.error);
		}
		else{
			// USER IS A MEMBER OF MY SERVER AND JOINED A SPOOF SERVER
			if(foundServers){
				let memberSpoofing=new Discord.RichEmbed().setColor('ff0000')
					.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
					.setTitle('Member has joined a Blacklisted Server.')
					.addField('Blacklisted Server(s):', foundServers, false)
					.setFooter(postTime(CONFIG.Timezone));
				EXECUTIONER.channels.get(CONFIG.Command_Channel).send(memberSpoofing).catch(console.error).then( m => {
					// GET THE USER AND SEND THEM AN INITIAL WARNING
					EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
						let configWarn=CONFIG.Joined_Spoof_Server_While_In_My_Server_Warning.replace(/%SPOOFSERVER%/g, foundServers);
						let warnMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/gXw71sr.jpg?1').setDescription(configWarn);
						TARGET.send(warnMessage).catch(console.error);
						let warnConfirmation=new Discord.RichEmbed().setColor('00ff00') .setDescription('Warned '+TARGET+'.');
						EXECUTIONER.channels.get(CONFIG.Command_Channel).send(warnConfirmation).catch(console.error);
					}).catch(console.error);
					// CHECK AGAIN IN AFTER A PERIOD OF TIME DETERMINED IN THE CONFIG
					setTimeout(function() {
						// CHECK IF THE USER LEFT MY SERVER
						let stillMember=USERBOT.guilds.get(CONFIG.Home_Server_ID).members.get(member.id);
						if(!stillMember){
							let leftMessage=new Discord.RichEmbed().setColor('00ff00').setDescription(uName+' has decided to leave our server.');
							return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(leftMessage).catch(console.error);
						}
						else{
							foundServers=''; foundServers=checkUser(member.id);
							// KICK OR BAN THEM IF THEY ARE STILL IN A SPOOF SERVER
	 					 	if(foundServers){
								switch(CONFIG.Pound_Level){
									case 'KICK':
										EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
											let configKick=CONFIG.Kicked_Message.replace(/%SPOOFSERVER%/g, foundServers);
											let kickMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/Qa1ik69.jpg?1').setDescription(configKick);
											TARGET.send(kickMessage).catch(console.error).then( m => {
												TARGET.kick('Member of a spoofing server.').catch(console.error);
												let kickConfirmation=new Discord.RichEmbed().setColor('00ff00') .setDescription('Kicked '+TARGET+'.');
												return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(kickConfirmation).catch(console.error);
											});
										}).catch(console.error); break;
									case 'BAN':
										let configBan=CONFIG.Banned_Message.replace(/%SPOOFSERVER%/g, foundServers);
										let banMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/Qa1ik69.jpg?1').setDescription(configBan);
										EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
											TARGET.send(banMessage).catch(console.error).then( m => {
												TARGET.ban('Member of a spoofing server.').catch(console.error);
			 									let banConfirmation=new Discord.RichEmbed().setColor('00ff00').setDescription('Banned '+TARGET+'.');
												return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(banConfirmation).catch(console.error);
											});
										}).catch(console.error); break;
									default:
										EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
											return;
										}).catch(console.error);
								}
	 					 	}
	 					 	else{
								// SEND CONFIRMATION THAT THEY HAVE LEFT THE SPOOF SERVER
	 							EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(member.id).then( TARGET => {
									let configLeft=CONFIG.Left_Spoof_Message.replace(/%SPOOFSERVER%/g, foundServers);
									let leftMessage=new Discord.RichEmbed().setColor('00ff00').setThumbnail('https://i.imgur.com/UtIms4t.jpg').setDescription(configLeft);
									TARGET.send(leftMessage).catch(console.error);
								}).catch(console.error);
	 					 	}
						}
					}, 60000 * CONFIG.Minutes_Til_Punish);
				});
			}
		}
	}
});

USERBOT.on('guildMemberRemove', member => {
	if(CONFIG.Whitelist.indexOf(member.id)>=0){return;}
	let foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='';
	let userInHomeServer=USERBOT.guilds.get(CONFIG.Home_Server_ID).members.get(member.id);
	if(member.nickname){ uName=member.nickname; } else{ uName=member.user.username; }
	if(!userInHomeServer){return;}
	else{
		if(foundServers){
			richEmbed=new Discord.RichEmbed().setColor('ffa100')
				.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
				.setTitle('Member has left '+member.guild.name)
				.addField('Remaining Blacklisted Server(s):', foundServers, false)
				.setFooter(postTime(CONFIG.Timezone));
			return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
		}
		else{
			if(!foundServers){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
					.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
					.setTitle('No longer a member of any Blacklisted Servers.')
					.setFooter(postTime(CONFIG.Timezone));
				return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
			}
		}
	}
});

USERBOT.on('message', message => {
	if(message.channel.id!=CONFIG.Command_Channel){return;}
	if(!message.content.startsWith(CONFIG.Prefix)){return;}
	let richEmbed='', badServer='', guild=message.member.guild, uName='';
	if(message.member.roles.has(CONFIG.AdminRoleID) || message.member.roles.has(CONFIG.ModRoleID) || message.member.id===CONFIG.Owner_ID){
		let args=message.content.split(' ').slice(1), command=message.content.split(' ')[0].slice(CONFIG.Prefix.length);
		if(command==='status'){
			richEmbed=new Discord.RichEmbed().setColor('00ff00')
				.setTitle('**Operational. Standing By.**');
			return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
		}
		if(command=='help' || command=='commands'){
			if(!args[0]){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
					.setTitle('**Available Commands**').setThumbnail(USERBOT.LEFT_IMG)
					.setDescription('`'+CONFIG.Prefix+'check @mention or userid`\n`'+CONFIG.Prefix+'check @JohnDoe#1234`\n`'+CONFIG.Prefix+'check 237597448032354304`\n`'+CONFIG.Prefix+'check all`\n`'+CONFIG.Prefix+'check all sudo`\n');
				return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
			}
		}
		if(command=='check'){
			let member=message.guild.members.get(args[0]), badMembers=0;
			if(member){if(member.nickname){uName=member.nickname;}else{uName=member.user.username;}}
			if(args[0]=='server' || args[0]=='all'){
				let members=message.guild.members.map(m => m.id);
				members.forEach(function(id,index){
					if(CONFIG.Whitelist.indexOf(id)<0 || args[1]=='sudo'){
						let foundServers=checkUser(id);
						if(foundServers){
							let uName=''; badMembers++;
							EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(id).then( TARGET => {
								if(TARGET.nickname){ uName=TARGET.nickname; } else{ uName=TARGET.user.username; }
								let alertMessage=new Discord.RichEmbed().setColor('ff0000')
									.setAuthor(uName+' ('+TARGET.id+')', TARGET.user.displayAvatarURL)
									.setDescription('Tag: '+TARGET)
									.addField('Blacklisted Server(s):', foundServers, false)
									.setFooter(postTime(CONFIG.Timezone));
								return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(alertMessage).catch(console.error);
							}).catch(console.error);
						}
					}
				});
				if(badMembers==0){
					richEmbed=new Discord.RichEmbed().setColor('00ff00')
						.setAuthor('No Members were found in Blacklisted Servers').setFooter(postTime(CONFIG.Timezone));
					return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
				}
				else{
					richEmbed=new Discord.RichEmbed().setColor('ff0000')
						.setAuthor(badMembers+' Members were found in Blacklisted Servers').setFooter(postTime(CONFIG.Timezone));
					return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
				}
			}
			else if(isNaN(args[0])==false && args[0].length==18){
				EXECUTIONER.fetchUser(args[0]).then( user => {
					if(CONFIG.Whitelist.indexOf(user.id)>=0 && args[1]!='sudo'){
						richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('That user is whitelisted.');
						return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
					}
					let foundServers=checkUser(args[0]);
					if(member){
						if(foundServers){
							EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(args[0]).then( TARGET => {
								let badUser=new Discord.RichEmbed().setColor('ff0000')
									.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
									.setDescription('Tag: '+TARGET)
									.addField('Blacklisted Server(s):', foundServers, false)
									.setFooter(postTime(CONFIG.Timezone));
								return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(badUser).catch(console.error);
							}).catch(console.error);
						}
						else{
							let goodUser=new Discord.RichEmbed().setColor('00ff00').setThumbnail(USERBOT.APPROVED_IMG)
								.setAuthor(uName+' ('+member.id+')', user.displayAvatarURL)
								.setTitle('Not a member of any Blacklisted Servers.')
								.setFooter(postTime(CONFIG.Timezone));
							return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(goodUser).catch(console.error);
						}
					}
					else{
							if(foundServers){
								let badUser=new Discord.RichEmbed().setColor('ff0000')
									.setAuthor(user.username+' ('+user.id+')', user.displayAvatarURL)
									.addField('Blacklisted Server(s):', foundServers, false)
									.setFooter(postTime(CONFIG.Timezone));
								return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(badUser).catch(console.error);
							}
							else{
								let goodUser=new Discord.RichEmbed().setColor('00ff00').setThumbnail(USERBOT.APPROVED_IMG)
									.setAuthor(user.username+' ('+user.id+')', user.displayAvatarURL)
									.setTitle('Not a member of any Blacklisted Servers.')
									.setFooter(postTime(CONFIG.Timezone));
								return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(goodUser).catch(console.error);
							}
					}
				}).catch(console.error);
			}
			else{
				richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('That is not a valid check option.');
				return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
			}
		}
		if(command=='warn'){
			let member=USERBOT.guilds.get(CONFIG.Home_Server_ID).members.get(args[0]);
			let warnMessage=new Discord.RichEmbed().setColor('ff0000').setThumbnail('https://i.imgur.com/gXw71sr.jpg?1')
				.setDescription('Good Afternoon. We have recently found **Team Rocket HQ : after hours ™** to be a spoofing app support server and it is now blacklisted. If you wish to stay a member of **'+CONFIG.Home_Server_Name+'**, you will need to leave that server in the next 2 hours. Please contact an Admin if you have any questions. Have a good day!');
			EXECUTIONER.guilds.get(CONFIG.Home_Server_ID).fetchMember(args[0]).then( TARGET => {
 				TARGET.send(warnMessage).catch(console.error);
				EXECUTIONER.channels.get(CONFIG.Command_Channel).send('Warned '+TARGET+'.').catch(console.error);
 			}).catch(console.error);
		}
		else if(command=='restart'){
			process.exit(1).catch(console.error);
		}
	}
	else{
		richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('You do not have permission to use that command.');
		return EXECUTIONER.channels.get(CONFIG.Command_Channel).send(richEmbed).catch(console.error);
	}
});

// BOT LOGIN TO DISCORD
USERBOT.login(CONFIG.User_Token); EXECUTIONER.login(CONFIG.Bot_Token);
