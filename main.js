'use strict';

/*
 * Created with @iobroker/create-adapter v1.26.2
 */

const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
	// Create the adapter and define its methods
	return adapter = utils.adapter(Object.assign({}, options, {
		name: 'cod_warzone_stats',

		// The ready callback is called when databases are connected and adapter received configuration.
		// start here!
		ready: main, // Main method defined below for readability

		// is called when adapter shuts down - callback has to be called under any circumstances!
		unload: (callback) => {
			try {
				// Here you must clear all timeouts or intervals that may still be active
				// clearTimeout(timeout1);
				// clearTimeout(timeout2);
				// ...
				// clearInterval(interval1);

				callback();
			} catch (e) {
				callback();
			}
		},

		// is called if a subscribed state changes
		stateChange: (id, state) => {
			if (state) {
				// The state was changed
				adapter.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			} else {
				// The state was deleted
				adapter.log.info(`state ${id} deleted`);
			}
		},
	}));
}

async function PlayerStats(API){
	adapter.setObjectNotExistsAsync('PlayerStats', {
		type: 'state',
		common: {
			name: 'PlayerStats',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: true,
		},
		native: {},
	});
	API.MWstats(adapter.config.txtPlayerTag).then(data => {
		for (var key in data){
			if(typeof data[key] !== "object"){
				adapter.setObjectNotExistsAsync('PlayerStats.' + String(key), {
					type: 'state',
					common: {
						name: String(key),
						type: 'string',
						role: 'value',
						read: true,
						write: true,
					},
					native: {},
				});
				adapter.setStateAsync('PlayerStats.' + String(key), String(data[key]));
			};
		};
	}).catch(err => {
		adapter.log.error('Die PlayerStats konnten nicht geladen werden.');
		adapter.log.error(String(err))
	});
}

async function WarzoneStats(API){
	adapter.setObjectNotExistsAsync('WarzoneMatches', {
		type: 'state',
		common: {
			name: 'WarzoneMatches',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: true,
		},
		native: {},
	});
	API.MWcombatwz(adapter.config.txtPlayerTag).then(data => {
		for(var key in data.matches){
			var obj = data.matches[key];
			adapter.setObjectNotExistsAsync('WarzoneMatches.' + String(obj.matchID), {
				type: 'state',
				common: {
					name: String(obj.matchID),
					type: 'string',
					role: 'value',
					read: true,
					write: true,
				},
				native: {},
			});
			for(var key in obj){
				if(typeof obj[key] !== "object"){
					adapter.setObjectNotExistsAsync('WarzoneMatches.' + String(obj.matchID) + '.' + String(key), {
						type: 'state',
						common: {
							name: String(key),
							type: 'string',
							role: 'value',
							read: true,
							write: true,
						},
						native: {},
					});
					adapter.setStateAsync('WarzoneMatches.' + String(obj.matchID) + '.' + String(key), String(obj[key]))
				}
			}
		}
	}).catch(err => {
		adapter.log.error('Die WarzoneMatches konnten nicht geladen werden.');
		adapter.log.error(String(err))
	});
}

async function MultiplayerStats(API){
	adapter.setObjectNotExistsAsync('MultiplayerMatches', {
		type: 'state',
		common: {
			name: 'MultiplayerMatches',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: true,
		},
		native: {},
	});
	API.MWcombatmp(adapter.config.txtPlayerTag).then(data => {
		for(var key in data.matches){
			var obj = data.matches[key];
			adapter.setObjectNotExistsAsync('MultiplayerMatches.' + String(obj.matchID), {
				type: 'state',
				common: {
					name: String(obj.matchID),
					type: 'string',
					role: 'value',
					read: true,
					write: true,
				},
				native: {},
			});
			for(var key in obj){
				if(typeof obj[key] !== "object"){
					adapter.setObjectNotExistsAsync('MultiplayerMatches.' + String(obj.matchID) + '.' + String(key), {
						type: 'state',
						common: {
							name: String(key),
							type: 'string',
							role: 'value',
							read: true,
							write: true,
						},
						native: {},
					});
					adapter.setStateAsync('MultiplayerMatches.' + String(obj.matchID) + '.' + String(key), String(obj[key]))
				}
			}
		}
	}).catch(err => {
		adapter.log.error('Die MultiplayerMatches konnten nicht geladen werden.');
		adapter.log.error(String(err))
	});
}

async function main() {
	const API = require('call-of-duty-api')({platform: adapter.config.selPlatform});
    API.login(adapter.config.txtUsername, adapter.config.pwdPassword).then(() =>{
		if(adapter.config.chkPlayerStats == true){
			PlayerStats(API)
		};
		if(adapter.config.chkWZ == true){
			WarzoneStats(API)
		}
		if(adapter.config.chkMP == true){
			MultiplayerStats(API)
		}
	}).catch(err => {
		adapter.log.error('Der CoD Login konnte nicht durchgeführt werden');
		adapter.log.error(String(err));
	})

	setTimeout(function(){
		adapter.stop();
	}, adapter.config.intPoll * 1000)

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export startAdapter in compact mode
	module.exports = startAdapter;
} else {
	// otherwise start the instance directly
	startAdapter();
}