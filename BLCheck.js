'use strict';
const Discord=require('discord.js');
const bot=new Discord.Client({
	disabledEvents: [
		'GUILD_CREATE',
		'GUILD_DELETE',
		'GUILD_UPDATE',
		'GUILD_MEMBER_UPDATE',
		'GUILD_MEMBERS_CHUNK',
		'GUILD_ROLE_CREATE',
		'GUILD_ROLE_DELETE',
		'GUILD_ROLE_UPDATE',
		'GUILD_BAN_ADD',
		'GUILD_BAN_REMOVE',
		'CHANNEL_CREATE',
		'CHANNEL_DELETE',
		'CHANNEL_UPDATE',
		'CHANNEL_PINS_UPDATE',
		'MESSAGE_DELETE',
		'MESSAGE_UPDATE',
		'MESSAGE_DELETE_BULK',
		'MESSAGE_REACTION_ADD',
		'MESSAGE_REACTION_REMOVE',
		'MESSAGE_REACTION_REMOVE_ALL',
		'USER_UPDATE',
		'USER_NOTE_UPDATE',
		'USER_SETTINGS_UPDATE',
		'PRESENCE_UPDATE',
		'VOICE_STATE_UPDATE',
		'TYPING_START',
		'VOICE_SERVER_UPDATE',
		'RELATIONSHIP_ADD',
		'RELATIONSHIP_REMOVE',
	]
});
const sql=require('sqlite');
const moment=require('moment');
const config=require('./files/blacklist_config.json')
sql.open('./files/dataBase.sqlite');

bot.Pound_Level=config.Pound_Level; bot.Command_Channel=config.Command_Channel
bot.Webhook_ID=config.Webhook_ID; bot.Webhook_Token=config.Webhook_Token;
bot.AdminRoleID=config.AdminRoleID; bot.ModRoleID=config.ModRoleID;
bot.Whitelist=config.Whitelist; bot.PREFIX=config.Prefix;
bot.NAME=config.Bot_Name; bot.TOKEN=config.Bot_Token;
bot.OWNER_ID=config.Owner_ID; bot.HOME_SERVER_ID=config.Home_Server_ID;
bot.HOME_SERVER_NAME=config.Home_Server_Name;
bot.GOODCOLOR='00FF00'; bot.WARNINGCOLOR='FF9900'; bot.DANGERCOLOR='FF0000';
bot.SNIPE_IMG='https://i.imgur.com/dzvklbi.png';
bot.LEFT_IMG='https://i.imgur.com/HVRacGU.jpg';
bot.APPROVED_IMG='https://i.imgur.com/LVlq97j.png';
bot.WHCHAN=new Discord.WebhookClient(config.Webhook_ID, config.Webhook_Token);

bot.time=function(){let timeNow=new Date().getTime(); return moment(timeNow).format('dddd, MMMM Do, h:mm A');}

bot.on('ready', () => {
	console.info('Now Checking '+bot.guilds.size+' Blacklisted Servers.');
	bot.user.setPresence({'status':'invisible'});
});

function checkUser(userID){
	let botInServer='', userInServer='', foundServers='', index='';
	let guilds=bot.guilds.map(g => g);
	guilds.forEach((guild) => {
		if(guild.id!=bot.HOME_SERVER_ID){
			userInServer=guild.members.get(userID);
			if(userInServer){foundServers+='`'+guild.name+'`,';}
		}
	});
	foundServers=foundServers.replace(',','\n');
	return foundServers;
}

bot.on('guildMemberAdd', member => {
	if(bot.Whitelist.indexOf(member.id)>=0){return;}
	let user=member.guild.members.get(member.id), timeNow=new Date().getTime(), joinTime=moment(timeNow).format('DD/MMM/YY');
	let foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='', spoofLog;

	let userInHomeServer=bot.guilds.get(bot.HOME_SERVER_ID).members.get(member.id);
	if(member.nickname){uName=member.nickname;}
	else{uName=member.user.username}
	if(!userInHomeServer){return;}
	else{
		if(member.guild.id===bot.HOME_SERVER_ID && foundServers){
			richEmbed=new Discord.RichEmbed().setColor('ff0000')
			.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
			.addField('New Member is in Blacklisted Servers.', foundServers, false)
			.setFooter(bot.time());
			bot.WHCHAN.send(richEmbed).catch(console.error).then(m => {
				 // sql.all(`SELECT * FROM user_history WHERE UserID='${member.id}`).then(rows => {
				 // 	for(rowNumber='0'; rowNumber<rows.length && rowNumber<10; rowNumber++){
				 // 		for(let fs=0;fs<foundServers.length;fs++){spoofLog=joinTime+','+member.guild.name+';'; fs++;}
				 // 		if(rows[rowNumber].SpoofHistory==null){
				 // 			sql.run(`INSERT INTO spoofninja (UserID, BadGuildName, Punishment) VALUES (?, ?, ?)`,
				 // 				[member.id, member.guild.id, foundServers, 'JOIN_SPOOF_WARN']);
				 // 		}
				 // 		else{
				 // 		}
				 // 	}
				 // });
				 sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
				 	[member.id, member.guild.id, foundServers, 'JOIN_SPOOF_WARN']);
				 richEmbed=new Discord.RichEmbed().setColor('ff0000')
				 .setDescription(user+' inserted into database to be warned.');
				 return bot.WHCHAN.send(richEmbed).catch(console.error);
				 setTimeout(function() {
				 	foundServers='';
				 	foundServers=checkUser(member.id);
				 	if(foundServers){
				 		sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
				 			[member.id, member.guild.name, bot.Pound_Level]);
				 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
				 		.setDescription(user+' inserted into database to be kicked.');
				 		return bot.WHCHAN.send(richEmbed).catch(console.error);
				 		return;
				 	}
				 	else{
				 		sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
				 			[member.id, member.guild.name, 'LEFT_SPOOF']);
				 		return;
				 	}
				 }, 900000);
			});
		}
		else{
			if(foundServers){
				richEmbed=new Discord.RichEmbed().setColor('ff0000')
				.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
				.setTitle('Member has joined a Blacklisted Server.')
				.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
				.addField('Blacklisted Server(s):', foundServers, false)
				.setFooter(bot.time());
				bot.WHCHAN.send(richEmbed).catch(console.error).then(m => {
					 sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
					 	[member.id, member.guild.name, 'SPOOF_WARN']);
					 richEmbed=new Discord.RichEmbed().setColor('ff0000')
					 .setDescription(user+' inserted into database to be warned.');
					 return bot.WHCHAN.send(richEmbed).catch(console.error);
					 setTimeout(function() {
					 	foundServers='';
					 	foundServers=checkUser(member.id);
					 	if(foundServers){
					 		sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
					 			[member.id, member.guild.name, bot.Pound_Level]);
					 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
					 		.setDescription(user+' inserted into database to be kicked.');
					 		return bot.WHCHAN.send(richEmbed).catch(console.error);
					 		return;
					 	}
					 	else{
					 		sql.run(`INSERT INTO spoofninja (user_id, bad_guild_name, punishment) VALUES (?, ?, ?)`,
					 			[member.id, member.guild.name, 'LEFT_SPOOF']);
					 		return;
					 	}
					 }, 900000);
				});
			}
		}
	}
});

bot.on('guildMemberRemove', member => {
	if(bot.Whitelist.indexOf(member.id)>=0){return;}
	let foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='';
	let userInHomeServer=bot.guilds.get(bot.HOME_SERVER_ID).members.get(member.id);
	if(member.nickname){uName=member.nickname;}else{uName=member.user.username}
	if(!userInHomeServer){return;}
	else{
		if(foundServers){
			richEmbed=new Discord.RichEmbed().setColor('ffa100')
			.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
			.setTiele('Member has left '+member.guild.name)
			.addField('Remaining Blacklisted Server(s):', foundServers, false)
			.setFooter(bot.time());
			return bot.WHCHAN.send(richEmbed).catch(console.error);
		}
		else{
			if(!foundServers){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
				.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
				.setTitle('No longer a member of any Blacklisted Servers.')
				.setFooter(bot.time());
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
	}
});

bot.on('message', message => {
	if(message.channel.id!=bot.Command_Channel){return;}
	if(!message.content.startsWith(bot.PREFIX)){return;}
	let richEmbed='', badServer='', guild=message.member.guild, uName='';
	if(message.member.roles.has(bot.AdminRoleID) || message.member.roles.has(bot.ModRoleID) || message.member.id===bot.OWNER_ID){
		let args=message.content.split(' ').slice(1), command=message.content.split(' ')[0].slice(bot.PREFIX.length);
		if(command==='status'){
			richEmbed=new Discord.RichEmbed().setColor('00ff00')
			.setTitle('**'+bot.NAME+', Standing By.**').setThumbnail(bot.LEFT_IMG);
			return bot.WHCHAN.send(richEmbed).catch(console.error);
		}
		if(command=='help' || command=='commands'){
			if(!args[0]){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
				.setTitle('**Available Commands**').setThumbnail(bot.LEFT_IMG)
				.setDescription('`'+bot.PREFIX+'check @mention or userid`\n`'+bot.PREFIX+'check @JohnDoe#1234`\n`'+bot.PREFIX+'check server`\n`'+bot.PREFIX+'check 237597448032354304`\n');
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
		 if(command=='warn'){
		 	let user=bot.guilds.get(message.guild.id).members.get(args[0]);
		 	if(!args[1]){
		 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
		 		.setAuthor('You forgot to add the name of the blacklisted server.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 	if(!args[2]){badServer=args[1];} else{for(let x=1; x<args.length; x++){ badServer+=args[x]+' '; } badServer=badServer.slice(0,-1); }
		 	if(!user){
		 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
		 		.setAuthor('Not a valid User ID. Please try again.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 	else{
		 		sql.run(`INSERT INTO spoofninja (UserID, BadGuildName, Punishment) VALUES (?, ?, ?)`,
		 			[user.id, badServer, 'SPOOF_WARN']);
		 		richEmbed=new Discord.RichEmbed().setColor('00ff00')
		 		.setAuthor(user+' is being warned.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 }
		 if(command=='kick'){
		 	let user=bot.guilds.get(message.guild.id).members.get(args[0]);
		 	if(!args[1]){
		 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
		 		.setAuthor('You forgot to add the name of the blacklisted server.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 	if(!args[2]){badServer=args[1];} else{for(let x=1; x<args.length; x++){ badServer+=args[x]+' '; } badServer=badServer.slice(0,-1); }
		 	if(!user){
		 		richEmbed=new Discord.RichEmbed().setColor('ff0000')
		 		.setAuthor('Not a valid User ID. Please try again.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 	else{
		 		sql.run(`INSERT INTO spoofninja (UserID, BadGuildName, Punishment) VALUES (?, ?, ?)`,
		 			[user.id, badServer, bot.Pound_Level]);
		 		richEmbed=new Discord.RichEmbed().setColor('00ff00')
		 		.setAuthor(user+' is being kicked.');
		 		return bot.WHCHAN.send(richEmbed).catch(console.error);
		 	}
		 }
		if(command=='check'){
			let member=message.guild.members.get(args[0]), badMembers=0;
			if(member){if(member.nickname){uName=member.nickname;}else{uName=member.user.username;}}
			if(args[0]=='server' || args[0]=='all'){
				let members=message.guild.members.map(m => m.id);
				members.forEach(function(id,index){
					if(bot.Whitelist.indexOf(id)<0 || args[1]=='sudo'){
						let foundServers=checkUser(id);
						if(foundServers){
							badMembers++
							member=message.guild.members.get(id); foundServers=foundServers.replace(/,/g,'\n');
							if(member.nickname){uName=member.nickname;}else{uName=member.user.username}
							richEmbed=new Discord.RichEmbed().setColor('ff0000')
							.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
							.setDescription('Tag: <@'+member.id+'>')
							.addField('Blacklisted Server(s):', foundServers, false)
							.setFooter(bot.time());
							bot.WHCHAN.send(richEmbed).catch(console.error);
						}
					}
				});
				if(badMembers==0){
					richEmbed=new Discord.RichEmbed().setColor('00ff00')
					.setAuthor('No Members were found in Blacklisted Servers').setFooter(bot.time());
					return bot.WHCHAN.send(richEmbed).catch(console.error);
				}
				else{
					richEmbed=new Discord.RichEmbed().setColor('ff0000')
					.setAuthor(badMembers+' Members were found in Blacklisted Servers').setFooter(bot.time());
					return bot.WHCHAN.send(richEmbed).catch(console.error);
				}
			}
			else if(isNaN(args[0])==false && args[0].length==18){
				if(bot.Whitelist.indexOf(args[0]) && args[1]!='sudo'){
					richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('That user is whitelisted.');
					return bot.WHCHAN.send(richEmbed).catch(console.error);
				}
				let foundServers=checkUser(args[0]);
				if(member){
					if(foundServers){
						richEmbed=new Discord.RichEmbed().setColor('ff0000')
						.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
						.setDescription('Tag: <@'+member.id+'>')
						.addField('Blacklisted Server(s):', foundServers, false)
						.setFooter(bot.time());
						return bot.WHCHAN.send(richEmbed).catch(console.error);
					}
					else{
						richEmbed=new Discord.RichEmbed().setColor('00ff00').setThumbnail(bot.APPROVED_IMG)
						.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
						.setTitle('Not a member of any Blacklisted Servers.')
						.setFooter(bot.time());
						return bot.WHCHAN.send(richEmbed).catch(console.error);
					}
				}
				else{
					bot.fetchUser(args[0]).then(user => {
						if(foundServers){
							richEmbed=new Discord.RichEmbed().setColor('ff0000')
							.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
							.addField('Blacklisted Server(s):', foundServers, false)
							.setFooter(bot.time());
							return bot.WHCHAN.send(richEmbed).catch(console.error);
						}
						else{
							richEmbed=new Discord.RichEmbed().setColor('00ff00').setThumbnail(bot.APPROVED_IMG)
							.setAuthor(uName+' ('+member.id+')', member.user.displayAvatarURL)
							.setTitle('Not a member of any Blacklisted Servers.')
							.setFooter(bot.time());
							return bot.WHCHAN.send(richEmbed).catch(console.error);
						}
					});
				}
			}
			else{
				richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('That is not a valid check option.');
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
	}
	else{
		richEmbed=new Discord.RichEmbed().setColor('ff0000').setAuthor('You do not have permission to use that command.');
		return bot.WHCHAN.send(richEmbed).catch(console.error);
	}
});
// BOT LOGIN TO DISCORD
bot.login(bot.TOKEN);
