if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
require('./utils/db.js');

const Ban = require('./utils/models/Bans.js');
const Utils = require('./utils/utils.js');

const { Client, Events, GatewayIntentBits, REST, Routes, AttachmentBuilder } = require('discord.js');
var xl = require('excel4node');
var fs = require('fs');
var { join } = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages] });

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //Create a new REST instance
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

    //Create a new slash command called 'monthbans', which will return the number of bans in the current month
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                {
                    body: [
                        {
                            name: 'bans',
                            description: 'Te devuelve el número de bans de el periodo seleccionado',
                            options: [
                                {
                                    name: 'period',
                                    description: 'El periodo en el que quieres los bans',
                                    type: 3,
                                    required: true,
                                    choices: [
                                        {
                                            name: 'Año',
                                            value: 'year'
                                        },
                                        {
                                            name: 'Mes',
                                            value: 'month'
                                        },
                                        {
                                            name: 'Semana',
                                            value: 'week'
                                        },
                                        {
                                            name: 'Día',
                                            value: 'day'
                                        }
                                    ]

                                },
                                {
                                    name: 'type',
                                    description: 'Si deseas del periodo actual o del pasado',
                                    type: 3,
                                    required: true,
                                    choices: [
                                        {
                                            name: 'Actual',
                                            value: 'current'
                                        },
                                        {
                                            name: 'Pasado (Mes anterior, semana anterior, etc...)',
                                            value: 'past'
                                        }
                                    ]
                                }

                            ]
                        },
                        {
                            name: 'download',
                            description: 'Te devuelve el link de descarga de los bans',
                            options: [
                                {
                                    name: 'format',
                                    description: 'El formato en el que quieres los bans',
                                    type: 3,
                                    required: true,
                                    choices: [
                                        {
                                            name: 'JSON',
                                            value: 'json'
                                        },
                                        {
                                            name: 'Excel',
                                            value: 'excel'
                                        }
                                    ]
                                },
                                {
                                    name: 'period',
                                    description: 'El periodo en el que quieres los bans',
                                    type: 3,
                                    required: true,
                                    choices: [
                                        {
                                            name: 'Año',
                                            value: 'year'
                                        },
                                        {
                                            name: 'Mes',
                                            value: 'month'
                                        },
                                        {
                                            name: 'Semana',
                                            value: 'week'
                                        },
                                        {
                                            name: 'Día',
                                            value: 'day'
                                        }
                                    ]
                                },
                                {
                                    name: 'type',
                                    description: 'Si deseas del periodo actual o del pasado',
                                    type: 3,
                                    required: true,
                                    choices: [
                                        {
                                            name: 'Actual',
                                            value: 'current'
                                        },
                                        {
                                            name: 'Pasado (Mes anterior, semana anterior, etc...)',
                                            value: 'past'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
            );


            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();

});

client.on(Events.GuildBanAdd, async (guildBan) => {
    guildBan = await guildBan.fetch();
    const oldBan = await Ban.findOne({ guildID: guildBan.guild.id, userID: guildBan.user.id });
    console.log(oldBan);
    if (oldBan) {
        oldBan.bannedAt = new Date();
        await oldBan.save();
    } else {
        const newBan = new Ban({
            guildID: guildBan.guild.id,
            userID: guildBan.user.id,
            userName: guildBan.user.tag,
            reason: guildBan.reason || 'Razón no especificada',
            bannedAt: new Date()
        });
        await newBan.save();
    }

    console.log(`User ${guildBan.user.tag} was banned from ${guildBan.guild.name} at ${new Date()}`);
});

client.on(Events.GuildBanRemove, async (guildBan) => {
    const ban = Ban.findOne({ guildID: guildBan.guild.id, userID: guildBan.user.id });
    if (ban) {
        await ban.delete();
    }

    console.log(`User ${guildBan.user.tag} was unbanned from ${guildBan.guild.name} at ${new Date()}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    //Check if the interaction is a slash command
    if (!interaction.isCommand()) return;
    await interaction.deferReply();

    //Check if the command is 'bans'
    if (interaction.commandName === 'bans') {
        //Get the period and type from the command options
        const period = interaction.options.getString('period') || 'month';
        const type = interaction.options.getString('type') || 'current';

        //Get the number of bans in the specified period
        const bans = await Ban.find({ guildID: interaction.guild.id, bannedAt: Utils.getPeriod(period, type) });

        //Reply with the number of bans
        await interaction.editReply(`En el ${Utils.periodTranslation(period)} ${Utils.typeTranslation(type)} se han baneado ${bans.length} usuarios.`);
    }

    if (interaction.commandName === 'download') {
        //Get the period and type from the command options
        const period = interaction.options.getString('period') || 'month';
        const type = interaction.options.getString('type') || 'current';
        const format = interaction.options.getString('format') || 'json';

        //Get the number of bans in the specified period
        const bans = await Ban.find({ guildID: interaction.guild.id, bannedAt: Utils.getPeriod(period, type) });


        if (format == "excel") {
            // Create a new instance of a Workbook class
            var wb = new xl.Workbook();

            // Add Worksheets to the workbook
            var ws = wb.addWorksheet('bans')

            // Create a reusable style
            var style = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 12,
                },
                numberFormat: '$#,##0.00; ($#,##0.00); -',
            });

            ws.cell(1, 1).string('User ID').style(style);
            ws.cell(1, 2).string('User Tag').style(style);
            ws.cell(1, 3).string('Razón').style(style);
            ws.cell(1, 4).string('Baneado el').style(style);

            bans.forEach((ban, index) => {
                ws.cell(index + 2, 1).string(ban.userID).style(style);
                ws.cell(index + 2, 2).string(ban.userName).style(style);
                ws.cell(index + 2, 3).string(ban.reason || 'No especificada').style(style);
                const date = ban.bannedAt.getDate() + '/' + (ban.bannedAt.getMonth() + 1) + '/' + ban.bannedAt.getFullYear();
                ws.cell(index + 2, 4).string(date).style(style);
            });

            // Save to file
            wb.write(join(__dirname, 'bans.xlsx'), (err) => {
                if (err) { console.error(err) }

                const attachment = new AttachmentBuilder(join(__dirname, 'bans.xlsx'));
                interaction.editReply({ files: [attachment] });

                //Delete the file
                fs.unlink('bans.xlsx', (err) => {
                    if (err) {
                        console.error(err)
                    }
                });
            }
            );

        } else {
            // const file = fs.createWriteStream(join(__dirname, 'bans.json'));
            // file.write(JSON.stringify(bans));
            // file.end();

            // const attachment = new AttachmentBuilder(join(__dirname, 'bans.json'));
            // interaction.editReply({ files: [attachment] });

            // //Delete the file
            // fs.unlink('bans.json', (err) => {
            //     if (err) {
            //         console.error(err)
            //     }
            // });
            //Make a file async and await the write
            const file = await fs.promises.open(join(__dirname, 'bans.json'), 'w');
            await file.writeFile(JSON.stringify(bans));
            await file.close();

            const attachment = new AttachmentBuilder(join(__dirname, 'bans.json'));
            interaction.editReply({ files: [attachment] });
            
            //Delete the file
            fs.unlink(join(__dirname, 'bans.json'), (err) => {
                if (err) {
                    console.error(err)
                }
            }
            );
        }
    }
});

client.on(Events.GuildCreate, async (guild) => {
    console.log(`Joined guild ${guild.name} with ${guild.memberCount} members`);
});


client.login();