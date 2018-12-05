# BlacklistedServerChecking

Create a user account and join all the servers you want checked for your members.

Fill out `blacklist_config.json.example` in files and rename to `blacklist_config.json`. 
- The user bot token must be the bot you just created. Google "How to get discord user token" for how to get a user token. The bot token must be a bot in your server with rights to kick or ban members based on your config settings. 
- `POUND_LEVEL` in the config can either be `KICK` or `BAN`. 

All Commands must be preceeding by the command prefix in your config file and in the specified channel.
Commands: 
>help -> lists commands you can use
>check all -> Checks all users in your server for membership to blacklisted servers.
>check all sudo -> Checks all users and ignores your whitelist.

