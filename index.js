var _ = require('lodash');
var bitcore = require('bitcore');
var p2p = require('bitcore-p2p');
var Ma = require('moving-average');

var maBTC = Ma(1 * 60 * 1000);
var maUSD = Ma(1 * 60 * 1000);
var maSatoshis = Ma(1 * 60 * 1000);

var Transaction = bitcore.Transaction;
var Unit = bitcore.Unit;
var Peer = p2p.Peer;
var Messages = new p2p.Messages();

var peer = new Peer({
	host: '192.168.1.10',
	port: 8333,
});

peer.on('ready', function(message) {
	console.log('Starting ', peer.version, peer.subversion, peer.bestHeight);
});

var timeWindow = 5;
var satoshis = 0;
var btc = 0;
var btcAux = 0;
var usd = 0;

peer.on('tx', function(message) {
	var salida = message.transaction.toJSON();
	var output = _.pluck(salida.outputs, 'satoshis');
	var unitPreference = Unit.BTC;

	_.each(output, function(v) {
		satoshis += v;
		btc = Unit.fromSatoshis(v).to(unitPreference);
		btcAux += btc;
		usd += btc * 223.74;

	    return ;
	});
	maBTC.push(Date.now(), btcAux);
   	maUSD.push(Date.now(), usd);
   	maSatoshis.push(Date.now(), satoshis);
});


setInterval(function() {
   	
	if(maBTC.movingAverage()){
	   	console.log('\n\tAverage:');
	    console.log('\t###########################\n\t# ' + maBTC.movingAverage().toFixed(2) + ' BTC/s');
	    console.log('\t# ' + maUSD.movingAverage().toFixed(2) + ' USD/s');
	    console.log('\t# ' + maSatoshis.movingAverage().toFixed(0) + ' Satoshis/s' + '\n\t###########################');
	   	
	   	var btcPerSecond = btcAux / timeWindow;
	    var usdPerSecond = usd / timeWindow;
	    var satoshisPerSecond = satoshis / timeWindow;

	    btcAux = 0;
	    usd = 0;
	    satoshis = 0;
	}
}, timeWindow * 1000);


peer.on('inv', function(message) {
	peer.sendMessage(Messages.GetData(message.inventory));
});


peer.on('disconnect', function() {
	console.log('connection closed');
});


peer.connect();









